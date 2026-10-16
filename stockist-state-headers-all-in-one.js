<!--
  H&H Bagels – Stockist State Headers (ALL-IN-ONE)
  ================================================
  This single block contains BOTH the CSS and the script. Use it INSTEAD of the
  two separate files.

  WHERE TO ADD: on the page where the Stockist locator is embedded — your site's
  global "code injection" / footer, or immediately AFTER the Stockist embed
  <script>. Add it once.

  THEN: you can leave the Stockist > Settings > Appearance > Advanced > Custom CSS
  box EMPTY (this block injects all the styling itself).

  Note: JavaScript cannot live inside Stockist's Custom CSS field (it only parses
  CSS), which is why the all-in-one version lives in the website's code injection
  instead. It reads each store's state from its address, tags the first store of
  each state, renders the blue banner, and re-runs on every search — so the label
  stays correct after a ZIP search re-sorts the list.
-->
<script>
(function () {
  /* ---------- 1. Inject styling (runs immediately) ---------- */
  var CSS = [
    '.stockist-result-list ul > li::before{content:none !important;display:none !important;}',
    '.stockist-result-list ul > li[data-hh-state]::before{',
      'content:attr(data-hh-state) !important;display:block !important;',
      'width:calc(100% + 32px);margin:20px -16px 12px -16px;padding:10px 16px;',
      'font-family:inherit;font-size:16px;font-weight:700;letter-spacing:0.5px;',
      'text-transform:uppercase;color:#ffffff;background-color:#051747;box-sizing:border-box;}',
    '.stockist-result-list ul > li[data-hh-state]:first-child::before{margin-top:0 !important;}',
    '.stockist-result{padding:12px 16px;border-bottom:1px solid #e8e8e8;}',
    '.stockist-result:hover{background-color:#fafafa;}',
    '.stockist-result-name{font-weight:600;color:#051747;}',
    '.stockist-result-address{font-size:13px;color:#666666;line-height:1.4;}',
    '@media (max-width:600px){.stockist-result-list ul > li[data-hh-state]::before{',
      'font-size:14px;padding:8px 12px;margin:14px -12px 8px -12px;width:calc(100% + 24px);}}'
  ].join('');
  var styleEl = document.getElementById('hh-state-headers-css') || document.createElement('style');
  styleEl.id = 'hh-state-headers-css';
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  /* ---------- 2. Label first store of each state ---------- */
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
    var m = text.match(/,\s*([A-Z]{2})\s+\d{5}/);      // "City, ST 33156"
    if (!m) m = text.match(/,\s*([A-Z]{2})\s*$/);       // fallback: "City, ST"
    return m ? (STATE[m[1]] || m[1]) : '';
  }

  function regroup() {
    var lis = document.querySelectorAll('.stockist-result-list ul > li.stockist-result');
    var prev = null;
    lis.forEach(function (li) {
      li.removeAttribute('data-hh-state');
      var el = li.querySelector('.stockist-result-addr-locality');
      var full = stateFromLocality(el ? el.textContent : '');
      if (full && full !== prev) { li.setAttribute('data-hh-state', full); }
      prev = full;
    });
  }

  function attach() {
    var rl = document.querySelector('.stockist-result-list');
    if (!rl) { return setTimeout(attach, 300); }   // wait for widget to render
    regroup();
    var t;
    new MutationObserver(function () {
      clearTimeout(t);
      t = setTimeout(regroup, 60);                 // debounce Stockist re-renders
    }).observe(rl, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }
})();
</script>
