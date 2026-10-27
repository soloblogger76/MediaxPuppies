/* Media Puppies — attribution capture + lead submission.
   ────────────────────────────────────────────────────────────
   Remembers where a visitor came from on their FIRST page, so a lead
   submitted three pages later still carries the ad that produced it.
   Then submits to Supabase (the record you own) and Web3Forms (the
   email you get). If Supabase isn't configured yet, email still works. */
(function () {
  'use strict';

  var STORE_KEY = 'mp_attribution';
  var UTMS = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];

  /* ---- Capture attribution once per session ---- */
  function capture() {
    var saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null'); } catch (e) {}
    if (saved) return saved;

    var params = new URLSearchParams(window.location.search);
    var data = {
      landing_page: window.location.pathname,
      referrer: document.referrer || null,
      fbclid: params.get('fbclid'),
      gclid: params.get('gclid')
    };
    UTMS.forEach(function (k) { data[k] = params.get(k); });

    /* No UTMs but a Facebook click id? Still label the source usefully. */
    if (!data.utm_source && data.fbclid) data.utm_source = 'facebook';
    if (!data.utm_source && data.gclid) data.utm_source = 'google';

    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) {}
    return data;
  }

  /* analytics.js runs first and records a richer version of the same thing
     (it also labels untagged referrals). Reuse it when it is there. */
  var attribution = window.mpAttribution || capture();

  /* ---- Submit a lead ---- */
  /* fields: plain object of form values. kind: 'client'|'internship'|'careers'.
     Returns a promise that resolves when the lead is safely recorded
     somewhere — it rejects only if BOTH destinations fail. */
  /* Form field names don't all match database column names. Map them here,
     then keep only columns that actually exist — an unknown key makes
     PostgREST reject the whole row with a 400. */
  var ALIASES = {
    whatsapp: 'phone',
    monthly_budget: 'budget',
    business_name_or_website: 'company',
    business: 'company'
  };
  var COLUMNS = [
    'kind','name','email','phone','business_type','budget','city','company',
    'role','college','link','linkedin','message','source_page','referrer','landing_page',
    'utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid','gclid'
  ];

  window.mpSubmitLead = function (kind, fields, web3formsKey, subject) {
    /* Honeypot: the hidden website_url field is empty for people and filled by bots.
       A filled one is dropped silently, so the bot still sees a success message. */
    if (fields && fields.website_url) return Promise.resolve(['dropped']);
    var merged = Object.assign({}, fields, attribution, {
      kind: kind,
      source_page: window.location.pathname
    });
    delete merged.website_url;

    /* apply aliases */
    Object.keys(ALIASES).forEach(function (from) {
      if (merged[from] !== undefined) {
        if (!merged[ALIASES[from]]) merged[ALIASES[from]] = merged[from];
        delete merged[from];
      }
    });

    /* anything not a real column is folded into message rather than dropped */
    var row = {}, extras = [];
    Object.keys(merged).forEach(function (k) {
      if (COLUMNS.indexOf(k) > -1) row[k] = merged[k];
      else if (merged[k]) extras.push(k + ': ' + merged[k]);
    });
    if (extras.length) row.message = [row.message, extras.join(' | ')].filter(Boolean).join('\n');

    /* 1. Supabase first — the record you can search, filter and report on.
       It runs before the email so the email can say when the CRM copy failed
       (otherwise a rejected row would vanish behind a success message). */
    function saveToSupabase() {
      if (!(typeof MP_SUPABASE_READY !== 'undefined' && MP_SUPABASE_READY)) return Promise.resolve(null);
      var ctl = typeof AbortController === 'function' ? new AbortController() : null;
      var timer = ctl ? setTimeout(function () { ctl.abort(); }, 5000) : null;
      return fetch(MP_SUPABASE_URL + '/rest/v1/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': MP_SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + MP_SUPABASE_ANON_KEY,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(row),
        signal: ctl ? ctl.signal : undefined
      }).then(function (r) {
        if (timer) clearTimeout(timer);
        return r.ok ? { ok: true } : { ok: false, why: 'supabase ' + r.status };
      }, function (err) {
        if (timer) clearTimeout(timer);
        return { ok: false, why: err && err.name === 'AbortError' ? 'supabase timeout' : 'supabase network' };
      });
    }

    /* 2. Web3Forms — the email notification, so nothing is missed */
    function sendEmail(crm) {
      if (!web3formsKey) return Promise.resolve(null);
      var fd = new FormData();
      Object.keys(merged).forEach(function (k) {
        if (merged[k] !== null && merged[k] !== undefined && merged[k] !== '') fd.append(k, merged[k]);
      });
      if (crm && !crm.ok) fd.append('crm_saved', 'no (' + crm.why + ') - add this lead in /admin/ by hand');
      fd.append('access_key', web3formsKey);
      fd.append('subject', subject || 'New submission — Media Puppies');
      return fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd })
        .then(function (r) { return r.json(); })
        .then(function (d) { return d.success ? { ok: true } : { ok: false, why: d.message || 'web3forms failed' }; },
              function () { return { ok: false, why: 'web3forms network' }; });
    }

    var configured = (typeof MP_SUPABASE_READY !== 'undefined' && MP_SUPABASE_READY) || web3formsKey;
    if (!configured) return Promise.reject(new Error('no destination configured'));

    /* Succeed if at least one destination accepted it */
    return saveToSupabase().then(function (crm) {
      return sendEmail(crm).then(function (mail) {
        var ok = [];
        if (crm && crm.ok) ok.push('supabase');
        if (mail && mail.ok) ok.push('web3forms');
        if (!ok.length) throw new Error('all destinations failed');
        if (crm && !crm.ok && window.console) console.warn('Lead saved by email only:', crm.why);
        /* GA4 gets the same event the pixel gets: generate_lead for client enquiries,
           application_submitted for careers and internship forms. */
        if (typeof window.gtag === 'function') {
          try {
            window.gtag('event', kind === 'client' ? 'generate_lead' : 'application_submitted', {
              lead_kind: kind, source_page: window.location.pathname
            });
          } catch (err) {}
        }
        return ok;
      });
    });
  };

  window.mpAttribution = attribution;
})();
