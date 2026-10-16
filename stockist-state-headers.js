/*
 * H&H Bagels - Stockist State Headers (companion script)
 * ======================================================
 * Pairs with "stockist-custom-css.css" (pasted into Stockist > Settings >
 * Appearance > Advanced > Custom CSS).
 *
 * WHERE THIS GOES: the Hydrogen storefront codebase that serves www.hhbagels.com
 * (Shopify Oxygen). It will NOT work via Google Tag Manager - the site's
 * Content-Security-Policy (nonce-based, no 'unsafe-inline', no 'strict-dynamic')
 * blocks scripts injected by GTM. Added as a first-party script in the app, it is
 * served with the page nonce and complies with the CSP. See INSTALL-hydrogen.md.
 *
 * WHAT IT DOES: reads each store's state from its address (e.g. "Pinecrest, FL
 * 33156" -> FL -> "Florida"), tags the first store of each state run with
 * data-hh-state="<State>", and the CSS renders that as the blue banner. A
 * document-level observer keeps it correct across Stockist re-renders AND across
 * Hydrogen client-side route changes (it re-runs whenever the locator mounts).
 */
(function () {
  var STATE = {
    AL:'Alabama', AK:'Alaska', AZ:'Arizona', AR:'Arkansas', CA:'California',
    CO:'Colorado', CT:'Connecticut', DE:'Delaware', DC:'District of Columbia',
    FL:'Florida', GA:'Georgia', HI:'Hawaii', ID:'Idaho', IL:'Illinois',
    IN:'Indiana', IA:'Iowa', KS:'Kansas', KY:'Kentucky', LA:'Louisiana',
    ME:'Maine', MD:'Maryland', MA:'Massachusetts', MI:'Michigan', MN:'Minnesota',
    MS:'Mississippi', MO:'Missouri', MT:'Montana', NE:'Nebraska', NV:'Nevada',
    NH:'New Hampshire', NJ:'New Jersey', NM:'New Mexico', NY:'New York',
    NC:'North Carolina', ND:'North Dakota', OH:'Ohio', OK:'Oklahoma', OR:'Oregon',
    PA:'Pennsylvania', RI:'Rhode Island', SC:'South Carolina', SD:'South Dakota',
    TN:'Tennessee', TX:'Texas', UT:'Utah', VT:'Vermont', VA:'Virginia',
    WA:'Washington', WV:'West Virginia', WI:'Wisconsin', WY:'Wyoming'
  };

  function stateFromLocality(text) {
    if (!text) return '';
    var m = text.match(/,\s*([A-Z]{2})\s+\d{5}/);   // "City, ST 33156"
    if (!m) m = text.match(/,\s*([A-Z]{2})\s*$/);     // fallback: "City, ST"
    return m ? (STATE[m[1]] || m[1]) : '';
  }

  function regroup() {
    var lis = document.querySelectorAll('.stockist-result-list ul > li.stockist-result');
    if (!lis.length) return;
    var prev = null;
    lis.forEach(function (li) {
      li.removeAttribute('data-hh-state');
      var el = li.querySelector('.stockist-result-addr-locality');
      var full = stateFromLocality(el ? el.textContent : '');
      if (full && full !== prev) { li.setAttribute('data-hh-state', full); }
      prev = full;
    });
  }

  var t;
  function schedule() { clearTimeout(t); t = setTimeout(regroup, 60); }

  function start() {
    schedule(); // initial pass
    // Watch the whole document so it survives Stockist re-renders (search) and
    // Hydrogen route changes that re-mount the widget. Debounced; cheap.
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
