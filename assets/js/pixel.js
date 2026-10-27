/* Media Puppies — Meta Pixel, one place for the whole site.
   ────────────────────────────────────────────────────────────
   PUT YOUR PIXEL ID ON THE NEXT LINE. That's the only edit needed.
   Until it's filled in, nothing loads and no tracking calls fail. */
var MP_PIXEL_ID = '1062533193322093';

(function () {
  'use strict';

  var ready = MP_PIXEL_ID && MP_PIXEL_ID !== 'YOUR_PIXEL_ID';

  if (ready) {
    /* Standard Meta Pixel base code */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    /* consent.js (loaded first) sets MP_CONSENT. When it is "denied" (UK/EU visitor
       who has not accepted), the pixel queues nothing until fbq('consent','grant'). */
    if (window.MP_CONSENT === 'denied') window.fbq('consent', 'revoke');
    window.fbq('init', MP_PIXEL_ID);
    window.fbq('track', 'PageView');

    /* <noscript> fallback pixel, injected so the ID lives in one file only */
    var ns = document.createElement('noscript');
    ns.innerHTML = '<img height="1" width="1" style="display:none" alt="" ' +
      'src="https://www.facebook.com/tr?id=' + encodeURIComponent(MP_PIXEL_ID) +
      '&ev=PageView&noscript=1">';
    document.head.appendChild(ns);
  }

  /* Safe tracking helpers — these never throw, with or without a pixel.
     window.mpTrack('Lead')                      -> standard event
     window.mpTrack('Lead', {content_name:'x'})  -> standard event + params
     window.mpTrackCustom('ScrolledToForm')      -> custom event */
  window.mpTrack = function (event, params) {
    if (typeof window.fbq === 'function') window.fbq('track', event, params || {});
  };
  window.mpTrackCustom = function (event, params) {
    if (typeof window.fbq === 'function') window.fbq('trackCustom', event, params || {});
  };

  /* Declarative click tracking: <a data-track="Contact"> fires on click.
     Optional: data-track-params='{"content_name":"whatsapp_hero"}' */
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-track]') : null;
    if (!el) return;
    var params = {};
    try { params = JSON.parse(el.getAttribute('data-track-params') || '{}'); } catch (err) {}
    window.mpTrack(el.getAttribute('data-track'), params);
  }, true);
})();
