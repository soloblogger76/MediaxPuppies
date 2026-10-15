/* Media Puppies — /get-leads/ ad landing page form.
   ────────────────────────────────────────────────────────────────────
   Two steps. Step 1 qualifies, step 2 collects contact details, in that
   order deliberately: a form that opens by demanding a phone number
   reads as a trap, and asking the easy question first is what gets the
   second answer.

   Under-budget enquiries are NOT thrown away. They are recorded, tagged,
   and shown an honest "not yet" instead of a promise of a call — which
   keeps the data without spending sales time on it. */
(function () {
  'use strict';
  var WEB3FORMS_KEY = '05a4cb54-228e-4084-acaa-d00149d73c23';
  var DISQUALIFY = 'UNDER-50K';

  var form = document.getElementById('adForm');
  if (!form) return;

  var p1 = form.querySelector('[data-panel="1"]');
  var p2 = form.querySelector('[data-panel="2"]');
  var stepNum = form.querySelector('[data-step-num]');
  var err1 = form.querySelector('[data-err]');
  var err2 = form.querySelector('[data-err2]');
  var btn = form.querySelector('[data-submit]');
  var btnLabel = form.querySelector('[data-submit-label]');
  var okBlock = document.querySelector('[data-thanks-ok]');
  var lowBlock = document.querySelector('[data-thanks-low]');

  var biz = document.getElementById('a-biz');
  var budget = document.getElementById('a-budget');
  var status = document.getElementById('a-status');
  var name = document.getElementById('a-name');
  var company = document.getElementById('a-company');
  var phone = document.getElementById('a-phone');

  function show(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.style.display = msg ? 'block' : 'none';
  }

  function step(n) {
    p1.style.display = n === 1 ? 'block' : 'none';
    p2.style.display = n === 2 ? 'block' : 'none';
    if (stepNum) stepNum.textContent = n;
  }

  form.querySelectorAll('select, input').forEach(function (el) {
    el.addEventListener('change', function () { show(err1, ''); show(err2, ''); });
  });

  form.querySelector('[data-next]').addEventListener('click', function () {
    if (!biz.value)    { show(err1, 'Pick what you sell.'); biz.focus(); return; }
    if (!budget.value) { show(err1, 'Pick a monthly ad budget.'); budget.focus(); return; }
    if (!status.value) { show(err1, 'Let us know where you are with ads.'); status.focus(); return; }
    show(err1, '');
    step(2);
    name.focus();
    if (window.mpTrack) window.mpTrack('InitiateCheckout', { content_category: budget.value });
  });

  form.querySelector('[data-back]').addEventListener('click', function () { step(1); });

  /* Indian mobile numbers, typed however people actually type them. */
  function cleanPhone(v) {
    var d = (v || '').replace(/[^\d]/g, '');
    if (d.length === 12 && d.indexOf('91') === 0) d = d.slice(2);
    if (d.length === 11 && d.charAt(0) === '0') d = d.slice(1);
    return d;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!name.value.trim())    { show(err2, 'We need a name to address you by.'); name.focus(); return; }
    if (!company.value.trim()) { show(err2, 'Business name or website, please.'); company.focus(); return; }
    var digits = cleanPhone(phone.value);
    if (digits.length !== 10) {
      show(err2, 'Enter a 10-digit Indian mobile number.');
      phone.focus();
      return;
    }
    show(err2, '');

    var lowBudget = budget.value === DISQUALIFY;
    var fields = {
      business_type: biz.value,
      monthly_budget: budget.value,
      ads_status: status.value,
      name: name.value.trim(),
      business_name_or_website: company.value.trim(),
      whatsapp: '+91' + digits,
      qualified: lowBudget ? 'no - under minimum' : 'yes'
    };

    btn.disabled = true;
    if (btnLabel) btnLabel.textContent = 'Sending…';

    window.mpSubmitLead('client', fields, WEB3FORMS_KEY,
        (lowBudget ? 'Lead (under minimum)' : 'NEW LEAD') + ' — Media Puppies ad page')
      .then(function () {
        /* Only a qualified enquiry counts as a Lead for the pixel. Feeding
           the under-budget ones back would teach Meta to find more of them. */
        if (window.mpTrack) {
          if (lowBudget) {
            if (window.mpTrackCustom) window.mpTrackCustom('LeadUnqualified', { budget: budget.value });
          } else {
            window.mpTrack('Lead', {
              content_category: 'client_enquiry',
              content_name: biz.value,
              predicted_ltv: budget.value
            });
          }
        }
        form.style.display = 'none';
        var out = lowBudget ? lowBlock : okBlock;
        if (out) {
          out.style.display = 'block';
          out.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      })
      .catch(function () {
        btn.disabled = false;
        if (btnLabel) btnLabel.textContent = 'Send me my lead plan';
        show(err2, 'That didn’t send. Try again, or email info@mediapuppies.com.');
      });
  });

  if (window.mpTrack) window.mpTrack('ViewContent', { content_name: 'Ad landing page' });
})();
