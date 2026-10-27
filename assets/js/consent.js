/* Media Puppies — cookie consent for UK and EU visitors (Google Consent Mode v2 + Meta pixel consent).
   ────────────────────────────────────────────────────────────────────────────
   Loaded (defer) before pixel.js and ga.js on every public page, so it runs first.
   - Visitors in a Europe/* time zone (a proxy for the UK and EU, where PECR and
     the ePrivacy rules apply) start with every consent signal denied and see a
     small banner. Accepting grants all four Google signals and the pixel.
   - Everyone else keeps today's behaviour: consent granted, no banner.
   - The choice is stored in localStorage as mp_consent ("granted" | "denied").
   - ?mp_region=eu or ?mp_region=other forces the region, for testing.
   pixel.js reads window.MP_CONSENT before it calls fbq('init'). */
(function () {
  'use strict';

  var KEY = 'mp_consent';
  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) {}

  var forced = (location.search.match(/[?&]mp_region=(eu|other)/) || [])[1];
  var tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
  var regulated = forced ? forced === 'eu' : /^Europe\//.test(tz);

  /* Decision for this page load: a stored choice wins; otherwise denied in the
     regulated region until the visitor accepts, granted everywhere else. */
  var state = stored === 'granted' || stored === 'denied' ? stored : (regulated ? 'denied' : 'granted');
  window.MP_CONSENT = state;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  function signals(v) {
    return { ad_storage: v, analytics_storage: v, ad_user_data: v, ad_personalization: v };
  }
  var def = signals(state);
  if (state === 'denied') def.wait_for_update = 500;
  gtag('consent', 'default', def);

  function apply(choice) {
    window.MP_CONSENT = choice;
    try { localStorage.setItem(KEY, choice); } catch (e) {}
    gtag('consent', 'update', signals(choice));
    if (typeof window.fbq === 'function') window.fbq('consent', choice === 'granted' ? 'grant' : 'revoke');
    var bar = document.getElementById('mp-consent');
    if (bar) bar.parentNode.removeChild(bar);
  }
  window.mpConsentSet = apply;

  /* Banner: only for the regulated region, only until a choice is stored. */
  if (!(regulated && !stored)) return;

  function render() {
    if (document.getElementById('mp-consent')) return;
    var bar = document.createElement('div');
    bar.id = 'mp-consent';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Cookie choices');
    bar.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:200;max-width:560px;margin:0 auto;background:#181C4F;color:#F6F5EF;border-radius:18px;padding:16px 18px;box-shadow:0 20px 50px rgba(24,28,79,.35);font-family:Satoshi,system-ui,sans-serif;font-size:.92rem;line-height:1.5;display:flex;gap:14px;align-items:center;flex-wrap:wrap';
    bar.innerHTML =
      '<p style="margin:0;flex:1 1 260px">We use cookies to measure which pages and ads bring enquiries. Analytics and ad cookies stay off until you accept. ' +
      '<a href="/privacy-policy/" style="color:#FFAC1C;text-decoration:underline">Privacy policy</a></p>' +
      '<span style="display:flex;gap:8px;flex:none">' +
      '<button type="button" data-consent="denied" style="cursor:pointer;font-family:inherit;font-weight:700;font-size:.9rem;background:transparent;color:#F6F5EF;border:1.5px solid rgba(246,245,239,.5);padding:10px 16px;border-radius:999px">Decline</button>' +
      '<button type="button" data-consent="granted" style="cursor:pointer;font-family:inherit;font-weight:700;font-size:.9rem;background:#FFAC1C;color:#181C4F;border:none;padding:10px 18px;border-radius:999px">Accept</button>' +
      '</span>';
    bar.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-consent]') : null;
      if (b) apply(b.getAttribute('data-consent'));
    });
    document.body.appendChild(bar);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();
