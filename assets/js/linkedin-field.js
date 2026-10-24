/* Media Puppies — LinkedIn profile field on the application forms
   (careers, internship, creative strategist internship).
   People paste "linkedin.com/in/…" without the scheme, which type=url rejects,
   so add it; and refuse anything that is not a LinkedIn profile link.
   Loaded before each form script so the value is clean when that script submits. */
(function () {
  'use strict';
  var MSG = 'Please paste your LinkedIn profile link, like https://www.linkedin.com/in/yourname';
  var OK = /^https?:\/\/(([a-z]{2,3}|www)\.)?linkedin\.com\/(in|pub)\/[^\s]+|^https?:\/\/lnkd\.in\/[^\s]+/i;

  function fix(el) {
    var v = el.value.trim();
    if (v && !/^https?:\/\//i.test(v)) v = 'https://' + v.replace(/^\/+/, '');
    el.value = v;
    el.setCustomValidity(!v || OK.test(v) ? '' : MSG);
  }

  document.querySelectorAll('input[name="linkedin"]').forEach(function (el) {
    el.addEventListener('blur', function () { fix(el); });
    el.addEventListener('input', function () { el.setCustomValidity(''); });
    if (el.form) el.form.addEventListener('submit', function () { fix(el); }, true);
  });
})();
