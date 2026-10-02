// IqraSpace marketing site — mobile nav, accordion, contact form, copy link.
// Vanilla JS, no dependencies. Progressive enhancement only: every control
// this touches has a working non-JS fallback (real links, a real <form>).
(function () {
  'use strict';

  // ---------- Mobile nav sheet ----------
  var sheet = document.getElementById('sheet');
  var openBtn = document.querySelector('[data-menu-open]');
  var closeBtn = document.querySelector('[data-menu-close]');
  var lastFocused = null;

  function trapFocus(e) {
    if (!sheet.classList.contains('open') || e.key !== 'Tab') return;
    var focusable = sheet.querySelectorAll('a[href], button:not([disabled])');
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function openSheet() {
    if (!sheet) return;
    lastFocused = document.activeElement;
    sheet.classList.add('open');
    openBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    var firstLink = sheet.querySelector('a[href]');
    if (firstLink) firstLink.focus();
  }

  function closeSheet() {
    if (!sheet) return;
    sheet.classList.remove('open');
    openBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  if (sheet && openBtn && closeBtn) {
    openBtn.addEventListener('click', openSheet);
    closeBtn.addEventListener('click', closeSheet);
    sheet.querySelectorAll('nav a').forEach(function (a) {
      a.addEventListener('click', closeSheet);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sheet.classList.contains('open')) closeSheet();
      trapFocus(e);
    });
  }

  // ---------- Accordion (FAQ) ----------
  document.querySelectorAll('.acc-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (panel) panel.hidden = expanded;
    });
  });

  // ---------- FAQ topic nav active state on scroll ----------
  var faqNav = document.querySelector('.faq-nav');
  if (faqNav) {
    var groups = Array.prototype.slice.call(document.querySelectorAll('.acc-group'));
    var links = Array.prototype.slice.call(faqNav.querySelectorAll('a'));
    if (groups.length && 'IntersectionObserver' in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            links.forEach(function (l) { l.classList.remove('on'); });
            var link = faqNav.querySelector('a[href="#' + entry.target.id + '"]');
            if (link) link.classList.add('on');
          });
        },
        { rootMargin: '-40% 0px -55% 0px' }
      );
      groups.forEach(function (g) { observer.observe(g); });
    }
  }

  // ---------- Duas category grid/list view toggle ----------
  var viewToggle = document.querySelector('.dua-view-toggle');
  if (viewToggle) {
    var tiles = document.querySelector('.dua-tiles');
    var list = document.querySelector('.dua-list');
    var viewBtns = Array.prototype.slice.call(viewToggle.querySelectorAll('[data-view-btn]'));
    viewBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var view = btn.getAttribute('data-view-btn');
        viewBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        if (tiles) tiles.classList.toggle('is-hidden', view !== 'grid');
        if (list) list.classList.toggle('is-active', view === 'list');
      });
    });
  }

  // ---------- Duas transliteration script switch ----------
  var scriptSwitch = document.getElementById('script-switch');
  if (scriptSwitch) {
    var scriptBtns = Array.prototype.slice.call(scriptSwitch.querySelectorAll('[data-script-btn]'));
    scriptBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var script = btn.getAttribute('data-script-btn');
        scriptBtns.forEach(function (b) { b.setAttribute('aria-checked', String(b === btn)); });
        document.querySelectorAll('.translit').forEach(function (p) {
          p.hidden = p.getAttribute('data-script') !== script;
        });
      });
    });
  }

  // ---------- Legal page TOC active state on scroll ----------
  var toc = document.querySelector('.toc');
  if (toc) {
    var sections = Array.prototype.slice.call(document.querySelectorAll('.prose h2[id]'));
    var tocLinks = Array.prototype.slice.call(toc.querySelectorAll('a'));
    if (sections.length && 'IntersectionObserver' in window) {
      var tocObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            tocLinks.forEach(function (l) { l.classList.remove('on'); });
            var link = toc.querySelector('a[href="#' + entry.target.id + '"]');
            if (link) link.classList.add('on');
          });
        },
        { rootMargin: '-20% 0px -70% 0px' }
      );
      sections.forEach(function (s) { tocObserver.observe(s); });
    }
  }

  // ---------- Contact form ----------
  // Posts to /api/contact (a Vercel serverless function — see
  // apps/site/api/contact.js) which stores the message in Supabase and
  // emails an alert. Client-side validation runs first either way.
  var form = document.getElementById('contact-form');
  if (form) {
    var startedAt = Date.now();
    var params = new URLSearchParams(window.location.search);
    var subjectMap = {
      feedback: 'Feedback',
      issue: 'A problem I ran into',
      suggestion: 'A suggestion',
      contribute: 'Volunteering / contributing'
    };
    var presetSubject = subjectMap[params.get('subject')];
    if (presetSubject) {
      var subjectField = document.getElementById('s');
      if (subjectField) subjectField.value = presetSubject;
    }

    var fieldErrorMessages = {
      name: 'Please enter your name.',
      email: 'Enter a valid email address.',
      subject: 'Please add a subject.',
      message: 'Please write a message.'
    };
    var fieldIds = { name: 'n', email: 'e', subject: 's', message: 'm' };

    function setFieldError(key, bad) {
      var input = document.getElementById(fieldIds[key]);
      if (!input) return;
      var field = input.closest('.field');
      field.classList.toggle('has-error', bad);
      input.setAttribute('aria-invalid', String(bad));
    }

    var captchaField = document.getElementById('captcha-e') ? document.getElementById('captcha-e').closest('.field') : null;
    var turnstileEl = form.querySelector('.cf-turnstile');
    // The widget can only ever produce a token once a real Cloudflare
    // Turnstile site key replaces this placeholder (see ADMIN.md §4) —
    // until then it can't render a checkbox at all, so don't block
    // submitting on something that's physically impossible to complete.
    var turnstileConfigured = Boolean(turnstileEl) && turnstileEl.getAttribute('data-sitekey') !== 'YOUR_TURNSTILE_SITE_KEY';
    if (turnstileEl && !turnstileConfigured) {
      // Cloudflare's widget can't render anything useful with a
      // placeholder site key (it shows its own "Troubleshooting" error
      // UI) — hide the whole row rather than show a visibly broken
      // widget while ADMIN.md's setup is still pending.
      var turnstileWrapper = turnstileEl.closest('.field');
      if (turnstileWrapper) turnstileWrapper.hidden = true;
    }

    function getTurnstileToken() {
      var input = form.querySelector('[name="cf-turnstile-response"]');
      return input ? input.value : '';
    }

    function setCaptchaError(bad) {
      if (captchaField) captchaField.classList.toggle('has-error', bad);
    }

    function resetCaptcha() {
      if (window.turnstile && typeof window.turnstile.reset === 'function') {
        window.turnstile.reset();
      }
    }

    var errorDetailEl = document.getElementById('form-error-detail');
    var errorDetailDefault = errorDetailEl ? errorDetailEl.innerHTML : '';

    function setErrorDetail(message) {
      if (!errorDetailEl) return;
      errorDetailEl.innerHTML = message ? '' : errorDetailDefault;
      if (message) errorDetailEl.textContent = message;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var successEl = document.getElementById('form-success');
      var errorEl = document.getElementById('form-error');
      successEl.hidden = true;
      errorEl.hidden = true;
      setErrorDetail(null);

      var ok = true;
      var firstInvalid = null;
      var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      form.querySelectorAll('.input, .textarea').forEach(function (input) {
        var field = input.closest('.field');
        var bad = !input.value.trim() || (input.type === 'email' && !emailRe.test(input.value));
        field.classList.toggle('has-error', bad);
        input.setAttribute('aria-invalid', String(bad));
        if (bad) {
          ok = false;
          firstInvalid = firstInvalid || input;
        }
      });

      var consent = document.getElementById('p');
      if (consent && !consent.checked) {
        ok = false;
        firstInvalid = firstInvalid || consent;
      }

      var turnstileToken = getTurnstileToken();
      var captchaBad = turnstileConfigured && !turnstileToken;
      setCaptchaError(captchaBad);
      if (captchaBad) {
        ok = false;
        firstInvalid = firstInvalid || turnstileEl;
      }

      if (!ok) {
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      var originalLabel = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
      }

      var payload = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        subject: form.subject.value.trim(),
        message: form.message.value.trim(),
        company: form.company ? form.company.value : '',
        startedAt: startedAt,
        turnstileToken: turnstileToken
      };

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { status: res.status, data: data };
          });
        })
        .then(function (result) {
          if (result.data && result.data.ok) {
            successEl.hidden = false;
            form.reset();
            startedAt = Date.now();
          } else if (result.status === 400 && result.data && result.data.errors) {
            Object.keys(fieldErrorMessages).forEach(function (key) {
              setFieldError(key, Boolean(result.data.errors[key]));
            });
            setCaptchaError(Boolean(result.data.errors.captcha));
            if (result.data.errors.captcha) setErrorDetail(result.data.errors.captcha);
            errorEl.hidden = false;
          } else {
            if (result.data && typeof result.data.error === 'string') {
              setErrorDetail(result.data.error);
            }
            errorEl.hidden = false;
          }
        })
        .catch(function () {
          errorEl.hidden = false;
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalLabel;
          }
          resetCaptcha();
          form.closest('.form-card').scrollIntoView({ block: 'start', behavior: 'smooth' });
        });
    });
  }

  // ---------- Copy link (Get Involved) ----------
  document.querySelectorAll('[data-copy-link]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var url = 'https://iqraspace.org';
      var status = document.getElementById(btn.getAttribute('aria-describedby'));
      function announce(text) {
        if (status) status.textContent = text;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(
          function () { announce('Link copied.'); },
          function () { announce('Could not copy the link. ' + url); }
        );
      } else if (navigator.share) {
        navigator.share({ title: 'IqraSpace', url: url }).catch(function () {});
      } else {
        announce(url);
      }
    });
  });
})();
