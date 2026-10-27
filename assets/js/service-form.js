/* Media Puppies — service page enquiry form (/performance-marketing/, /ai-automation/).
   Saves to Supabase + Web3Forms via mpSubmitLead. Recorded as a client lead. */
(function () {
  'use strict';
  var WEB3FORMS_KEY = '05a4cb54-228e-4084-acaa-d00149d73c23';

  var form = document.getElementById('svcForm');
  if (!form) return;

  var submitBtn = form.querySelector('[data-submit-btn]');
  var submitLabel = form.querySelector('[data-submit-label]');
  var submitLabel0 = submitLabel ? submitLabel.textContent : 'Send';
  var notSubmitted = document.querySelector('[data-if="notSubmitted"]');
  var submitted = document.querySelector('[data-if="submitted"]');

  /* Name the service from the URL so the lead says which page it came from */
  var service = (location.pathname.replace(/\//g, '') || 'service')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, function (ch) { return ch.toUpperCase(); });

  if (window.mpTrack) {
    window.mpTrack('ViewContent', { content_name: service, content_category: 'service' });
  }

  var started = false;
  form.addEventListener('focusin', function () {
    if (started) return;
    started = true;
    if (window.mpTrack) window.mpTrack('InitiateCheckout', { content_name: service + ' form started' });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    var fd = new FormData(form), fields = {};
    fd.forEach(function (v, k) { fields[k] = v; });
    fields.role = service + ' enquiry';

    if (submitBtn) submitBtn.disabled = true;
    if (submitLabel) submitLabel.textContent = 'Sending…';

    window.mpSubmitLead('client', fields, WEB3FORMS_KEY, 'New ' + service + ' Enquiry — Media Puppies')
      .then(function () {
        if (window.mpTrack) window.mpTrack('Lead', { content_name: service, content_category: 'client_enquiry' });
        if (notSubmitted) notSubmitted.style.display = 'none';
        if (submitted) {
          submitted.style.display = 'block';
          submitted.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      })
      .catch(function () {
        if (submitBtn) submitBtn.disabled = false;
        if (submitLabel) submitLabel.textContent = form.dataset.btnLabel || submitLabel0;
        alert('Something went wrong. Please try again, or email info@mediapuppies.com.');
      });
  });
})();
