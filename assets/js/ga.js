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

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
  document.head.appendChild(s);
})();
