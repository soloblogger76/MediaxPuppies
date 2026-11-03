/* Media Puppies — Meta Pixel, one place for the whole site.
   ────────────────────────────────────────────────────────────
   PUT YOUR PIXEL ID ON THE NEXT LINE. That's the only edit needed.
   Until it's filled in, nothing loads and no tracking calls fail. */
var MP_PIXEL_ID = '1062533193322093';

(function () {
  'use strict';

  var ready = MP_PIXEL_ID && MP_PIXEL_ID !== 'YOUR_PIXEL_ID';

  /* Late loader, shared with ga.js (owner, 3 Nov 2026: keep the site light).
     The Meta and Google libraries (~400 KB) download after the page's load event,
     or 2 s after this runs if load is slow, so they no longer compete with the
     page itself. The fbq and gtag stubs queue every call until then, so PageView,
     page_view and Lead still fire. Visits from an ad click load them at once. */
  var late = window.mpLate = window.mpLate || (function () {
    var queue = [], fired = false;
    function add(src) {
      var t = document.createElement('script'); t.async = true; t.src = src;
      document.head.appendChild(t);
    }
    function fire() {
      if (fired) return; fired = true;
      for (var i = 0; i < queue.length; i++) add(queue[i]);
      queue = [];
    }
    if (document.readyState === 'complete' ||
        /[?&](fbclid|gclid|gbraid|wbraid|msclkid|ttclid|li_fat_id|gad_[a-z]+|utm_[a-z_]+)=/i.test(location.search)) {
      fired = true;
    } else {
      window.addEventListener('load', fire);
      setTimeout(fire, 2000);
    }
    return { load: function (src) { if (fired) add(src); else queue.push(src); } };
  })();

  if (ready) {
    /* Standard Meta Pixel base code */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      late.load(v);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    /* consent.js (loaded first) sets MP_CONSENT. When it is "denied" (UK/EU visitor
       who has not accepted), the pixel queues nothing until fbq('consent','grant'). */
    if (window.MP_CONSENT === 'denied') window.fbq('consent', 'revoke');
    window.fbq('init', MP_PIXEL_ID);
    window.fbq('track', 'PageView');

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
