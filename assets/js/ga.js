/* Google Analytics 4 — property "Media Puppies", stream mediapuppies.com.
   Loaded from the head of every public page. Kept in one file so the
   measurement ID lives in a single place rather than in 222 pages. */
(function () {
  var ID = 'G-P9RDJPW4Z2';

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', ID);

  /* gtag.js waits for the page to load (see mpLate in pixel.js); calls above queue in dataLayer. */
  var src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
  if (window.mpLate) { window.mpLate.load(src); return; }
  var s = document.createElement('script');
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
})();
