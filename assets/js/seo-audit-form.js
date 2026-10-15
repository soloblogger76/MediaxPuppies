/* Media Puppies — /free-seo-audit/ ad landing page form.
   ────────────────────────────────────────────────────────────────────
   Two disqualifying answers, handled differently because they are
   different problems:

   1. "Within a month" — SEO genuinely cannot do this. Sending them to
      the paid ads page is the honest answer and keeps a lead we would
      otherwise waste.
   2. Under the budget minimum — we would be selling documents.

   Both still record the lead and still get the audit. Neither fires the
   standard Lead pixel event: training Meta on people we turn away is
   how a campaign quietly teaches itself to find more of them. */
(function () {
  'use strict';
  var WEB3FORMS_KEY = '05a4cb54-228e-4084-acaa-d00149d73c23';
  var LOW_BUDGET = 'UNDER-25K';
  var URGENT = 'URGENT';

  var form = document.getElementById('seoAuditForm');
  if (!form) return;

  var p1 = form.querySelector('[data-panel="1"]');
  var p2 = form.querySelector('[data-panel="2"]');
  var stepNum = form.querySelector('[data-step-num]');
  var err1 = form.querySelector('[data-err]');
  var err2 = form.querySelector('[data-err2]');
  var btn = form.querySelector('[data-submit]');
  var btnLabel = form.querySelector('[data-submit-label]');

  var site = document.getElementById('s-site');
  var goal = document.getElementById('s-goal');
  var when = document.getElementById('s-when');
  var budget = document.getElementById('s-budget');
  var name = document.getElementById('s-name');
  var email = document.getElementById('s-email');
  var phone = document.getElementById('s-phone');

  var okBlock = document.querySelector('[data-thanks-ok]');
  var urgentBlock = document.querySelector('[data-thanks-urgent]');
  var lowBlock = document.querySelector('[data-thanks-low]');

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

  /* People type "sharmainteriors.in", not a full URL. Accept that. */
  function tidySite(raw) {
    var s = (raw || '').trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, '');
    return s;
  }
  function looksLikeDomain(s) {
    return /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}(\/.*)?$/i.test(s);
  }

  form.querySelector('[data-next]').addEventListener('click', function () {
    var s = tidySite(site.value);
    if (!s)                   { show(err1, 'We need a website to audit.'); site.focus(); return; }
    if (!looksLikeDomain(s))  { show(err1, 'That does not look like a website address.'); site.focus(); return; }
    if (!goal.value)          { show(err1, 'Pick what you want more of.'); goal.focus(); return; }
    if (!when.value)          { show(err1, 'Let us know your timeline.'); when.focus(); return; }
    if (!budget.value)        { show(err1, 'Pick a monthly budget.'); budget.focus(); return; }
    site.value = s;
    show(err1, '');
    step(2);
    name.focus();
    if (window.mpTrack) window.mpTrack('InitiateCheckout', { content_category: budget.value });
  });

  form.querySelector('[data-back]').addEventListener('click', function () { step(1); });

  function cleanPhone(v) {
    var d = (v || '').replace(/[^\d]/g, '');
    if (d.length === 12 && d.indexOf('91') === 0) d = d.slice(2);
    if (d.length === 11 && d.charAt(0) === '0') d = d.slice(1);
    return d;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!name.value.trim()) { show(err2, 'We need a name to address you by.'); name.focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
      show(err2, 'The audit is a document — we need a working email.');
      email.focus(); return;
    }
    var digits = cleanPhone(phone.value);
    if (digits.length !== 10) {
      show(err2, 'Enter a 10-digit Indian mobile number.');
      phone.focus(); return;
    }
    show(err2, '');

    var urgent = when.value === URGENT;
    var low = budget.value === LOW_BUDGET;
    var reason = urgent ? 'no - needs results in under a month'
               : low    ? 'no - under minimum'
               : 'yes';

    var fields = {
      link: site.value,
      goal: goal.value,
      timeline: when.value === URGENT ? 'Within a month' : when.value,
      budget: budget.value,
      name: name.value.trim(),
      email: email.value.trim(),
      whatsapp: '+91' + digits,
      qualified: reason
    };

    btn.disabled = true;
    if (btnLabel) btnLabel.textContent = 'Sending…';

    var subject = urgent ? 'SEO audit (wants ads instead) — Media Puppies'
                : low    ? 'SEO audit (under minimum) — Media Puppies'
                : 'NEW SEO AUDIT REQUEST — Media Puppies';

    window.mpSubmitLead('client', fields, WEB3FORMS_KEY, subject)
      .then(function () {
        if (window.mpTrack) {
          if (urgent || low) {
            if (window.mpTrackCustom) {
              window.mpTrackCustom('LeadUnqualified', { reason: reason, budget: budget.value });
            }
          } else {
            window.mpTrack('Lead', {
              content_category: 'seo_audit',
              content_name: goal.value,
              predicted_ltv: budget.value
            });
          }
        }
        form.style.display = 'none';
        /* Timeline is checked first: someone who needs leads this month is
           better served by the ads page than by a note about our minimum. */
        var out = urgent ? urgentBlock : low ? lowBlock : okBlock;
        if (out) {
          out.style.display = 'block';
          out.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      })
      .catch(function () {
        btn.disabled = false;
        if (btnLabel) btnLabel.textContent = 'Send me the audit';
        show(err2, 'That didn’t send. Try again, or email info@mediapuppies.com.');
      });
  });

  if (window.mpTrack) window.mpTrack('ViewContent', { content_name: 'SEO audit landing page' });
})();
