/* Media Puppies — Lead page: 2-step qualification form
   Step 1 (business type + budget) -> Step 2 (name/business/city/phone) -> Web3Forms.
   Pixel events: InitiateCheckout on step 2, Lead on success (fires only if fbq exists). */
(function () {
  'use strict';
  var WEB3FORMS_KEY = '05a4cb54-228e-4084-acaa-d00149d73c23';

  var form = document.getElementById('leadForm');
  if (!form) return;

  var panels1 = document.querySelectorAll('[data-step-panel="1"]');
  var panels2 = document.querySelectorAll('[data-step-panel="2"]');
  var stepNum = document.querySelector('[data-step-num]');
  var submitBtn = form.querySelector('[data-submit-btn]');
  var submitLabel = form.querySelector('[data-submit-label]');
  var blockNotSubmitted = document.querySelector('[data-if="notSubmitted"]');
  var blockSubmitted = document.querySelector('[data-if="submitted"]');

  function showStep(n) {
    panels1.forEach(function (p) { p.style.display = n === 1 ? 'block' : 'none'; });
    panels2.forEach(function (p) { p.style.display = n === 2 ? 'block' : 'none'; });
    if (stepNum) stepNum.textContent = n;
  }

  /* The service chips are visually-hidden radios, so the native required
     bubble can't anchor to them. Validate and message them by hand. */
  var optError = document.querySelector('[data-opt-error]');
  function chosenService() {
    var picked = form.querySelector('input[name="service_interest"]:checked');
    return picked ? picked.value : '';
  }
  form.querySelectorAll('input[name="service_interest"]').forEach(function (r) {
    r.addEventListener('change', function () {
      if (optError) optError.style.display = 'none';
    });
  });

  document.querySelectorAll('[data-action="go-step2"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var biz = document.getElementById('f-biz');
      var budget = document.getElementById('f-budget');
      if (!chosenService()) {
        if (optError) {
          optError.style.display = 'block';
          optError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
      if (biz && !biz.checkValidity()) { biz.reportValidity(); return; }
      if (budget && !budget.checkValidity()) { budget.reportValidity(); return; }
      showStep(2);
      if (window.mpTrack) {
        window.mpTrack('InitiateCheckout');
        if (window.mpTrackCustom) {
          window.mpTrackCustom('ServiceSelected', { service: chosenService() });
        }
      }
    });
  });

  document.querySelectorAll('[data-action="go-step1"]').forEach(function (btn) {
    btn.addEventListener('click', function () { showStep(1); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var fd = new FormData(form), fields = {};
    fd.forEach(function (v, k) { fields[k] = v; });

    if (submitBtn) submitBtn.disabled = true;
    if (submitLabel) submitLabel.textContent = 'Sending\u2026';

    window.mpSubmitLead('client', fields, WEB3FORMS_KEY, 'New Lead \u2014 Media Puppies Website')
      .then(function () {
        var lowBudget = /not qualified/i.test(fields.monthly_budget || '');
        if (lowBudget) {
          if (window.mpTrackCustom) window.mpTrackCustom('LeadUnqualified', { budget: fields.monthly_budget || '' });
        } else if (window.mpTrack) window.mpTrack('Lead', {
          content_category: 'client_enquiry',
          content_name: fields.service_interest || '',
          predicted_ltv: fields.monthly_budget || ''
        });
        if (blockNotSubmitted) blockNotSubmitted.style.display = 'none';
        if (blockSubmitted) {
          blockSubmitted.style.display = 'block';
          blockSubmitted.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      })
      .catch(function () {
        if (submitBtn) submitBtn.disabled = false;
        if (submitLabel) submitLabel.textContent = 'Send me my lead plan';
        alert('Something went wrong sending the form. Please try again, or email info@mediapuppies.com.');
      });
  });
})();
