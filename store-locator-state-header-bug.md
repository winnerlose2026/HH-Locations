# Store Locator Bug — Wrong State Header on ZIP Search

**Site:** https://www.hhbagels.com/ (locator also at `/contact#locations`)
**Widget:** Stockist (`stockist.co/embed/v1/widget.min.js`) + Google Maps
**Reported by:** JD · **Diagnosed:** June 2, 2026

## Symptom
Searching a ZIP code returns the correct nearby stores, but they appear under the wrong state header. Example: searching **33156** (Pinecrest/Miami, FL) lists **Pinecrest, FL** and **Wynwood/Midtown, FL** correctly — but under a blue **"CALIFORNIA"** banner. So the locations look like they're in California.

## Root cause
The state banners ("CALIFORNIA", "FLORIDA", etc.) are **not generated from each store's actual state**. They are faked with hardcoded CSS that targets fixed positions in the result list, injected inside `#stockist-widget`:

```css
.stockist-result-list ul > li::before { display: none; }
.stockist-result-list ul > li:nth-child(1)::before  { content: "California"; }
.stockist-result-list ul > li:nth-child(6)::before  { content: "District of Columbia"; }
.stockist-result-list ul > li:nth-child(7)::before  { content: "Florida"; }
.stockist-result-list ul > li:nth-child(17)::before { content: "Illinois"; }
.stockist-result-list ul > li:nth-child(18)::before { content: "New York"; }
.stockist-result-list ul > li:nth-child(25)::before { content: "North Carolina"; }
.stockist-result-list ul > li:nth-child(27)::before { content: "Tennessee"; }
.stockist-result-list ul > li:nth-child(28)::before { content: "Texas"; }
```

Those positions (1, 6, 7, 17, 18, 25, 27, 28) match the **default, unfiltered, alphabetical-by-state** list:
positions 1–5 = California, 6 = DC, 7–16 = Florida, 17 = Illinois, 18–24 = New York, 25–26 = NC, 27 = TN, 28+ = TX.

The scheme only holds for that exact default ordering. **Every ZIP search re-sorts the list by distance**, so item #1 becomes the closest store regardless of its real state — but the CSS still stamps `"California"` on position #1. Result: the wrong state banner on every search.

Two additional consequences of the positional approach:
- It also breaks any time a location is added, removed, or reordered (the nth-child numbers shift), so it needs manual re-counting on every location change.
- The banners carry no real data — they're literal strings glued to row numbers.

## Recommended fix (robust — correct in both browse and search)

> **Superseded — don't copy the snippets below.** They are the June 2 first drafts, kept for the record. The current versions are `stockist-custom-css.css` and `stockist-state-headers.js` (install notes in `INSTALL-hydrogen.md`). The draft script below stops updating after a Hydrogen page change because it only watches the list element; the current script watches the whole page. The interim fix that actually shipped is the search-mode `:has()` rule in `hh-bagels-state-headers.css`, not the one-liner under "Quick interim fix".

Drive the headers from each store's real state instead of row position. Each result already exposes its state in the address line (`.stockist-result-addr-locality`, e.g. "Pinecrest, FL 33156"), so it can be parsed reliably.

**1. Remove** all the `nth-child(N)::before { content: "State" }` rules above (and the shared `::before` banner-styling rule and the `nth-child(1)::before { margin-top: 0 }` rule that go with them).

**2. Add** this CSS:

```css
.stockist-result-list ul > li::before { content: none !important; display: none !important; }

li.hh-state-start { position: relative; padding-top: 46px !important; }
li.hh-state-start::after {
  content: attr(data-hh-state);
  display: block; position: absolute; top: 0; left: 0; right: 0;
  background: #0d1b46; color: #fff; font-weight: 700;
  letter-spacing: .04em; text-transform: uppercase;
  padding: 8px 14px; font-size: 13px;
}
```

**3. Add** this script after the Stockist embed loads (e.g. in the same code-injection/theme block that mounts the widget):

```html
<script>
(function () {
  var STATE = {AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',
  CO:'Colorado',CT:'Connecticut',DE:'Delaware',DC:'District of Columbia',FL:'Florida',
  GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',
  KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',
  MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',
  NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',
  ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',
  SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',
  VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming'};

  function regroup() {
    var lis = document.querySelectorAll('.stockist-result-list ul > li.stockist-result');
    var prev = null;
    lis.forEach(function (li) {
      li.classList.remove('hh-state-start');
      li.removeAttribute('data-hh-state');
      var locEl = li.querySelector('.stockist-result-addr-locality');
      var loc = locEl ? locEl.textContent : '';
      var m = loc.match(/,\s*([A-Z]{2})\s+\d{5}/);
      var full = m ? (STATE[m[1]] || m[1]) : '';
      if (full && full !== prev) {
        li.classList.add('hh-state-start');
        li.setAttribute('data-hh-state', full);
      }
      prev = full;
    });
  }

  // Re-run whenever Stockist re-renders the list (initial load, search, etc.)
  function attach() {
    var rl = document.querySelector('.stockist-result-list');
    if (!rl) { return setTimeout(attach, 300); }
    regroup();
    new MutationObserver(function () {
      clearTimeout(window.__hhT);
      window.__hhT = setTimeout(regroup, 50);
    }).observe(rl, { childList: true, subtree: true });
  }
  attach();
})();
</script>
```

This inserts a banner whenever the state changes between consecutive rows. In browse mode (alphabetical) you get one banner per state, exactly as today; in search mode the banner reflects the actual state of the results — so 33156 now reads **FLORIDA**. It also never needs manual maintenance when locations are added or removed.

> Verified live in-browser on June 2, 2026: with this approach the 33156 search renders a correct **FLORIDA** header.

## Quick interim fix (one line, if you need it fixed today)
If you can only touch the CSS right now, suppress the fake banners so no search ever shows a wrong state. Add to the Stockist Custom CSS:

```css
.stockist-result-list ul > li::before { content: none !important; display: none !important; }
```

Trade-off: this removes the state banners everywhere, including the default browse view. It stops the misinformation immediately but loses the grouping until the robust fix above is in place.

## Where to make the change
The offending `<style>` block lives inside the `#stockist-widget` container — i.e. it's coming through **Stockist's Custom CSS** setting (Stockist dashboard) or the site code that wraps the widget. Search that block for `content: "California"` to find it. The script in the robust fix goes wherever the Stockist embed is loaded on the page.
