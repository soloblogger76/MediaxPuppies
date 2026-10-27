/* Media Puppies — currency for the calculators.
   ────────────────────────────────────────────────────────────────────
   The calculators are unit-agnostic: margins, ratios and ROAS work in any
   currency as long as inputs and outputs use the SAME one. So this does not
   convert what the visitor types. It changes the symbol, the formatting and
   the example defaults, and leaves the arithmetic alone.

   Country comes from Cloudflare's /cdn-cgi/trace — same origin, no API key.
   Timezone answers first so nothing waits on the network. A visitor's own
   choice always wins and is remembered.

   Two tools are excluded because they are inherently Indian: the lakh/crore
   converter and the GST calculator. They opt out with data-inr-only. */
(function () {
  'use strict';

  /* Rupees per unit — used ONLY to scale the example defaults into something
     plausible for the market, never to convert a visitor's own numbers.
     Reviewed 2026-09-25. */
  var MARKETS = {
    INR: { sym: '₹', rate: 1,   locale: 'en-IN', label: 'India (₹)' },
    USD: { sym: '$',      rate: 88,  locale: 'en-US', label: 'United States ($)' },
    GBP: { sym: '£', rate: 112, locale: 'en-GB', label: 'United Kingdom (£)' },
    EUR: { sym: '€', rate: 96,  locale: 'de-DE', label: 'Europe (€)' },
    CAD: { sym: 'C$',     rate: 63,  locale: 'en-CA', label: 'Canada (C$)' },
    AUD: { sym: 'A$',     rate: 58,  locale: 'en-AU', label: 'Australia (A$)' },
    AED: { sym: 'AED ',   rate: 24,  locale: 'en-AE', label: 'UAE (AED)' },
    SGD: { sym: 'S$',     rate: 66,  locale: 'en-SG', label: 'Singapore (S$)' }
  };
  var EURO = 'IE DE FR NL ES IT BE AT PT FI GR LU EE LV LT SK SI CY MT HR'.split(' ');
  function forCountry(cc) {
    if (!cc) return null;
    if (cc === 'IN') return 'INR';
    if (cc === 'GB') return 'GBP';
    if (cc === 'CA') return 'CAD';
    if (cc === 'AU' || cc === 'NZ') return 'AUD';
    if (cc === 'AE') return 'AED';
    if (cc === 'SG') return 'SGD';
    if (EURO.indexOf(cc) > -1) return 'EUR';
    return 'USD';
  }
  function fromTimezone() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (/Kolkata|Calcutta/.test(tz)) return 'INR';
      if (/^America\//.test(tz)) return /Toronto|Vancouver|Edmonton|Winnipeg|Halifax/.test(tz) ? 'CAD' : 'USD';
      if (/^Europe\/London/.test(tz)) return 'GBP';
      if (/^Europe\//.test(tz)) return 'EUR';
      if (/^Australia\/|^Pacific\/Auckland/.test(tz)) return 'AUD';
      if (/Dubai/.test(tz)) return 'AED';
      if (/Singapore/.test(tz)) return 'SGD';
    } catch (e) {}
    return null;
  }
  function saved() { try { return localStorage.getItem('mp_currency'); } catch (e) { return null; } }
  function remember(c) { try { localStorage.setItem('mp_currency', c); } catch (e) {} }

  var inrOnly = !!document.querySelector('[data-inr-only]');
  var code = 'INR';

  var MP = window.MP = {
    code: 'INR',
    sym: '₹',
    locale: 'en-IN',
    /* Money, rounded the way a person would quote it. */
    fmt: function (n) {
      var v = Math.round(n);
      var s = v < 0 ? '-' : '';
      try { return s + MP.sym + Math.abs(v).toLocaleString(MP.locale); }
      catch (e) { return s + MP.sym + Math.abs(v); }
    },
    /* Small amounts where the paise/cents matter (CPC, cost per engagement). */
    fmt2: function (n) {
      if (Math.abs(n) >= 100) return MP.fmt(n);
      try { return MP.sym + n.toFixed(2); } catch (e) { return MP.sym + n; }
    }
  };

  function nice(n) {
    if (n <= 0) return 0;
    if (n < 10) return Math.round(n);
    if (n < 100) return Math.round(n / 5) * 5;
    if (n < 1000) return Math.round(n / 10) * 10;
    if (n < 10000) return Math.round(n / 100) * 100;
    return Math.round(n / 1000) * 1000;
  }

  /* Tag the money inputs once, BEFORE any label is rewritten — after that the
     rupee sign is gone and there is nothing left to detect them by. */
  function tagMoneyInputs() {
    document.querySelectorAll('input[type="number"]').forEach(function (i) {
      if (i.dataset.moneyInput) return;
      var f = i.closest('.field');
      var l = f && f.querySelector('label');
      if (l && l.textContent.indexOf('\u20B9') > -1) {
        i.dataset.moneyInput = '1';
        i.dataset.baseValue = i.value;
      }
    });
  }

  function apply(c, scaleDefaults) {
    if (!MARKETS[c]) c = 'INR';
    code = MP.code = c;
    MP.sym = MARKETS[c].sym;
    MP.locale = MARKETS[c].locale;

    document.querySelectorAll('label').forEach(function (l) {
      if (!l.dataset.baseLabel) {
        if (l.textContent.indexOf('\u20B9') < 0) return;
        l.dataset.baseLabel = l.textContent;
      }
      l.textContent = l.dataset.baseLabel.replace(/\u20B9/g, MP.sym.trim());
    });
    /* Hints and prose that quote rupee amounts are left alone: they describe
       the Indian market, and relabelling them would make them untrue. */

    if (scaleDefaults) {
      var r = MARKETS[c].rate;
      document.querySelectorAll('input[data-money-input]').forEach(function (i) {
        if (i.dataset.touched) return;
        var base = parseFloat(i.dataset.baseValue);
        if (!isFinite(base) || base <= 0) return;
        i.value = c === 'INR' ? base : nice(base / r);
      });
    }

    var sel = document.querySelector('[data-cur-switch]');
    if (sel) sel.value = c;
    if (typeof window.calc === 'function') window.calc();
  }

  function buildSwitch() {
    var sel = document.querySelector('[data-cur-switch]');
    if (!sel) return;
    Object.keys(MARKETS).forEach(function (k) {
      var o = document.createElement('option');
      o.value = k; o.textContent = MARKETS[k].label;
      sel.appendChild(o);
    });
    sel.addEventListener('change', function () {
      remember(sel.value);
      apply(sel.value, true);
      if (window.mpTrackCustom) window.mpTrackCustom('CurrencyChanged', { currency: sel.value });
    });
  }

  function start() {
    document.querySelectorAll('input,select,textarea').forEach(function (el) {
      el.addEventListener('input', function () { el.dataset.touched = '1'; });
    });
    if (inrOnly) return;            /* GST and lakh/crore stay in rupees */
    tagMoneyInputs();
    buildSwitch();
    var pick = saved();
    if (pick && MARKETS[pick]) { apply(pick, true); return; }
    apply(fromTimezone() || 'INR', true);
    (window.__mpTrace = window.__mpTrace || fetch('/cdn-cgi/trace', { cache: 'no-store' }).then(function (r) { return r.ok ? r.text() : Promise.reject(); }))
            .then(function (t) {
        var m = /(?:^|\n)loc=([A-Z]{2})/.exec(t);
        var c = m && forCountry(m[1]);
        if (c && MARKETS[c] && !saved() && c !== code) apply(c, true);
      })
      .catch(function () {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
