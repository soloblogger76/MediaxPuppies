/* Media Puppies — Creative Strategist internship application form.
   Same pipeline as internship-form.js (Supabase record + Web3Forms email via
   mpSubmitLead), kept separate so the content-writing page is never touched.
   The role string is what /admin/ shows and filters on. */
(function () {
  'use strict';
  var WEB3FORMS_KEY = '05a4cb54-228e-4084-acaa-d00149d73c23';
  var ROLE = 'Creative Strategist Intern (Remote)';

  var form = document.getElementById('creativeInternForm');
  if (!form) return;

  var submitBtn = form.querySelector('[data-submit-btn]');
  var submitLabel = form.querySelector('[data-submit-label]');
  var errorLine = form.querySelector('[data-form-error]');
  var notSubmitted = document.querySelector('[data-if="notSubmitted"]');
  var submitted = document.querySelector('[data-if="submitted"]');

  if (window.mpTrack) {
    window.mpTrack('ViewContent', { content_name: 'Creative Strategist Internship', content_category: 'internship' });
  }

  var started = false;
  form.addEventListener('focusin', function () {
    if (started) return;
    started = true;
    if (window.mpTrack) window.mpTrack('InitiateCheckout', { content_name: 'creative_internship_form_started' });
  });

  /* People paste "drive.google.com/…" without the scheme; type=url would reject it. */
  var link = form.querySelector('[name="link"]');
  if (link) {
    link.addEventListener('blur', function () {
      var v = link.value.trim();
      if (v && !/^https?:\/\//i.test(v) && /\.[a-z]{2,}/i.test(v)) link.value = 'https://' + v;
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (link) link.dispatchEvent(new Event('blur'));
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if (errorLine) errorLine.style.display = 'none';

    var fd = new FormData(form), fields = {};
    fd.forEach(function (v, k) { fields[k] = v; });
    fields.role = ROLE;

    if (submitBtn) submitBtn.disabled = true;
    if (submitLabel) submitLabel.textContent = 'Sending…';

    window.mpSubmitLead('internship', fields, WEB3FORMS_KEY, 'New Internship Application — Creative Strategist')
      .then(function () {
        if (window.mpTrack) {
          window.mpTrack('Lead', { content_name: 'Creative Strategist Internship', content_category: 'internship' });
        }
        if (notSubmitted) notSubmitted.style.display = 'none';
        if (submitted) {
          submitted.style.display = 'block';
          submitted.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      })
      .catch(function () {
        if (submitBtn) submitBtn.disabled = false;
        if (submitLabel) submitLabel.textContent = 'Submit application';
        if (errorLine) errorLine.style.display = 'block';
      });
  });
})();
