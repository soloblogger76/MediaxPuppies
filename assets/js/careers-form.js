/* Media Puppies — Careers page application form.
   Saves to Supabase + Web3Forms via mpSubmitLead.
   "Apply" buttons pre-select the role they belong to. */
(function () {
  'use strict';
  var WEB3FORMS_KEY = '05a4cb54-228e-4084-acaa-d00149d73c23';

  var form = document.getElementById('careersForm');
  if (!form) return;

  var roleSelect = document.getElementById('c-role');
  var submitBtn = form.querySelector('[data-submit-btn]');
  var submitLabel = form.querySelector('[data-submit-label]');
  var notSubmitted = document.querySelector('[data-if="notSubmitted"]');
  var submitted = document.querySelector('[data-if="submitted"]');

  document.querySelectorAll('[data-role]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!roleSelect) return;
      var wanted = btn.dataset.role;
      Array.prototype.forEach.call(roleSelect.options, function (opt) {
        if (opt.value === wanted || opt.text === wanted) roleSelect.value = opt.value || opt.text;
      });
    });
  });

  var started = false;
  form.addEventListener('focusin', function () {
    if (started) return;
    started = true;
    if (window.mpTrack) window.mpTrack('InitiateCheckout', { content_name: 'careers_form_started' });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    var fd = new FormData(form), fields = {};
    fd.forEach(function (v, k) { fields[k] = v; });

    if (submitBtn) submitBtn.disabled = true;
    if (submitLabel) submitLabel.textContent = 'Sending\u2026';

    window.mpSubmitLead('careers', fields, WEB3FORMS_KEY, 'New Application \u2014 Media Puppies Careers')
      .then(function () {
        if (window.mpTrackCustom) window.mpTrackCustom('Application', { content_category: 'careers' });
        if (notSubmitted) notSubmitted.style.display = 'none';
        if (submitted) {
          submitted.style.display = 'block';
          submitted.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      })
      .catch(function () {
        if (submitBtn) submitBtn.disabled = false;
        if (submitLabel) submitLabel.textContent = 'Send application';
        alert('Something went wrong sending your application. Please try again, or email us directly.');
      });
  });
})();
