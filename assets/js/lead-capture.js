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

    var jobs = [];

    /* 1. Supabase — the record you can search, filter and report on */
    if (typeof MP_SUPABASE_READY !== 'undefined' && MP_SUPABASE_READY) {
      jobs.push(
        fetch(MP_SUPABASE_URL + '/rest/v1/leads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': MP_SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + MP_SUPABASE_ANON_KEY,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(row)
        }).then(function (r) {
          if (!r.ok) throw new Error('supabase ' + r.status);
          return 'supabase';
        })
      );
    }

    /* 2. Web3Forms — the email notification, so nothing is missed */
    if (web3formsKey) {
      var fd = new FormData();
      Object.keys(merged).forEach(function (k) {
        if (merged[k] !== null && merged[k] !== undefined && merged[k] !== '') fd.append(k, merged[k]);
      });
      fd.append('access_key', web3formsKey);
      fd.append('subject', subject || 'New submission — Media Puppies');
      jobs.push(
        fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd })
          .then(function (r) { return r.json(); })
          .then(function (d) {
            if (!d.success) throw new Error(d.message || 'web3forms failed');
            return 'web3forms';
          })
      );
    }

    if (!jobs.length) return Promise.reject(new Error('no destination configured'));

    /* Succeed if at least one destination accepted it */
    return Promise.allSettled(jobs).then(function (results) {
      var ok = results.filter(function (r) { return r.status === 'fulfilled'; });
      if (!ok.length) throw new Error('all destinations failed');
      /* GA4 gets the same event the pixel gets: generate_lead for client enquiries,
         application_submitted for careers and internship forms. */
      if (typeof window.gtag === 'function') {
        try {
          window.gtag('event', kind === 'client' ? 'generate_lead' : 'application_submitted', {
            lead_kind: kind, source_page: window.location.pathname
          });
        } catch (err) {}
      }
      return ok.map(function (r) { return r.value; });
    });
  };

  window.mpAttribution = attribution;
})();
