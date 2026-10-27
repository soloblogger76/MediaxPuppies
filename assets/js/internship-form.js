/* Media Puppies — Internship page application form.
   Saves to Supabase (your record) + Web3Forms (your email) via mpSubmitLead.
   Fires Meta Pixel ViewContent / InitiateCheckout / Lead. */
(function () {
  'use strict';
  var WEB3FORMS_KEY = '05a4cb54-228e-4084-acaa-d00149d73c23';

  var form = document.getElementById('internForm');
  if (!form) return;

  var submitBtn = form.querySelector('[data-submit-btn]');
  var submitLabel = form.querySelector('[data-submit-label]');
  var notSubmitted = document.querySelector('[data-if="notSubmitted"]');
  var submitted = document.querySelector('[data-if="submitted"]');

  if (window.mpTrack) {
    window.mpTrack('ViewContent', { content_name: 'Content Writing Internship', content_category: 'internship' });
  }

  var started = false;
  form.addEventListener('focusin', function () {
    if (started) return;
    started = true;
    if (window.mpTrack) window.mpTrack('InitiateCheckout', { content_name: 'internship_form_started' });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    var fd = new FormData(form), fields = {};
    fd.forEach(function (v, k) { fields[k] = v; });
    fields.role = 'Content Writer Intern (Remote)';

    if (submitBtn) submitBtn.disabled = true;
    if (submitLabel) submitLabel.textContent = 'Sending\u2026';

    window.mpSubmitLead('internship', fields, WEB3FORMS_KEY, 'New Internship Application \u2014 Content Writer')
      .then(function () {
        if (window.mpTrack) {
          if (window.mpTrackCustom) window.mpTrackCustom('Application', { content_name: 'Content Writing Internship', content_category: 'internship' });
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
        alert('Something went wrong. Please try again, or email info@mediapuppies.com.');
      });
  });
})();
