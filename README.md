# HH-Locations — H&H Bagels store-locator styling

Custom CSS for the **Stockist** store locator on the H&H Bagels site
(www.hhbagels.com — homepage and `/contact`). This repo is the source of truth
for what's pasted into **Stockist → Settings → Appearance → Advanced → Custom CSS**.

## The bug this fixes

Searching the locator by ZIP returned the right stores but under the **wrong
state banner**. Example: searching `33156` returns the two Florida locations
(Pinecrest and Wynwood/Midtown) but they appeared under a blue **"CALIFORNIA"**
header.

**Cause:** the state banners are drawn by labeling fixed row positions
(`nth-child(1)` = "California", `nth-child(7)` = "Florida", …). That only holds
for the default browse order. A ZIP search re-sorts the list by distance, so
row 1 is no longer a California store — but it still got the "California" label.

## The current fix (live)

`hh-bagels-state-headers.css` keeps the position-based banners for the **browse**
list (no ZIP typed) and hides them **only during a search**. The hook is that
search results contain a distance element (`.stockist-result-distance-text`,
e.g. "1.9 mi") while the browse list does not:

```css
.stockist-result-list ul:has(.stockist-result-distance-text) > li::before {
  content: none !important;
  display: none !important;
}
```

Result:
- **Browse (no ZIP):** state banners show (CALIFORNIA, FLORIDA, …).
- **Search (ZIP typed):** distance-sorted results, **no banner** — no wrong state.

Deployed via the Stockist dashboard; no site code change required. Requires
`:has()` (supported in all current browsers; older browsers simply fall back to
the previous behavior).

## Known limitation / robust upgrade

The browse-mode banners still rely on each location's **priority** being set so
the list stays grouped alphabetically by state (see the priority map in the CSS
header comment). Adding/removing/reordering locations can shift the `nth-child`
positions.

A more robust, data-driven version removes the position dependency entirely: a
small script reads each store's real state from its address and labels the first
store of each state, so banners are correct in **both** browse and search (search
would show e.g. a correct "FLORIDA" header instead of none).

That upgrade requires a first-party script on www.hhbagels.com, which is a
**Shopify Hydrogen** storefront on Oxygen. Notes:
- It can't go through Google Tag Manager — the site's nonce-based
  Content-Security-Policy blocks GTM-injected scripts.
- It must be added in the Hydrogen codebase (e.g. `app/root.tsx`, inline with the
  page nonce or as a `/public` file referenced with the nonce), then deployed via
  Oxygen.

The script and the matching data-driven CSS live with the project handoff notes
(`stockist-state-headers.js`, `stockist-custom-css.css`, `INSTALL-hydrogen.md`).
