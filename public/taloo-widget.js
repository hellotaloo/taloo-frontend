/**
 * Taloo Application Widget
 *
 * Embed on any website to let candidates apply for vacancies.
 *
 * Usage:
 *   <script src="https://your-taloo-domain.com/taloo-widget.js" defer></script>
 *   <button data-taloo-vacancy-id="abc-123">Solliciteer nu</button>
 *
 * Attributes:
 *   data-taloo-vacancy-id  — (required) The vacancy UUID
 *   data-taloo-source      — (optional) Source identifier. "test" marks as test, default "widget"
 *
 * Programmatic API:
 *   TalooWidget.open(vacancyId, { source: 'widget' })
 *   TalooWidget.close()
 *   TalooWidget.refresh()    — re-scan DOM for new trigger elements
 *
 * Events:
 *   document.addEventListener('taloo:success', (e) => {
 *     console.log(e.detail.method, e.detail.applicationId);
 *   });
 */
(function () {
  'use strict';

  // Determine base URL from this script's src
  var currentScript =
    document.currentScript ||
    (function () {
      var scripts = document.querySelectorAll('script[src*="taloo-widget"]');
      return scripts[scripts.length - 1];
    })();

  var scriptSrc = currentScript ? currentScript.getAttribute('src') : '';
  var baseUrl = scriptSrc
    ? scriptSrc.replace(/\/taloo-widget\.js.*$/, '')
    : window.location.origin;

  // ── State ──────────────────────────────────────────────────────────────

  var overlay = null;

  // ── Widget open / close ────────────────────────────────────────────────

  function openWidget(vacancyId, options) {
    if (overlay) return; // Already open
    options = options || {};
    var source = options.source || 'widget';

    // Create overlay
    overlay = document.createElement('div');
    overlay.id = 'taloo-widget-overlay';
    overlay.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;' +
      'background:rgba(0,0,0,0.6);z-index:999999;display:flex;' +
      'align-items:center;justify-content:center;opacity:0;' +
      'transition:opacity 0.2s ease;';

    // Container (responsive)
    var isMobile = window.innerWidth < 640;
    var container = document.createElement('div');
    container.style.cssText = isMobile
      ? 'position:fixed;top:0;left:0;width:100%;height:100%;' +
        'background:#fff;'
      : 'position:relative;width:90%;max-width:1080px;max-height:90vh;' +
        'border-radius:16px;overflow:hidden;background:#fff;' +
        'box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);' +
        'transition:height 0.2s ease;';

    // Close button
    var closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&#215;';
    closeBtn.setAttribute('aria-label', 'Sluiten');
    closeBtn.style.cssText =
      'position:absolute;top:12px;right:12px;z-index:10;' +
      'background:rgba(0,0,0,0.05);border:none;border-radius:50%;' +
      'width:36px;height:36px;font-size:20px;cursor:pointer;color:#666;' +
      'display:flex;align-items:center;justify-content:center;' +
      'transition:background 0.15s;line-height:1;';
    closeBtn.onmouseover = function () {
      closeBtn.style.background = 'rgba(0,0,0,0.1)';
    };
    closeBtn.onmouseout = function () {
      closeBtn.style.background = 'rgba(0,0,0,0.05)';
    };
    closeBtn.onclick = closeWidget;

    // Iframe
    var iframe = document.createElement('iframe');
    iframe.src =
      baseUrl +
      '/apply/' +
      encodeURIComponent(vacancyId) +
      '?embed=true&source=' +
      encodeURIComponent(source);
    iframe.style.cssText = isMobile
      ? 'width:100%;height:100%;border:none;display:block;'
      : 'width:100%;border:none;display:block;';
    iframe.setAttribute('allow', 'clipboard-write');

    container.appendChild(closeBtn);
    container.appendChild(iframe);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Fade in
    requestAnimationFrame(function () {
      overlay.style.opacity = '1';
    });

    // Close on overlay background click
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeWidget();
    });

    // Close on Escape
    document.addEventListener('keydown', handleEscape);
  }

  function closeWidget() {
    if (!overlay) return;
    overlay.style.opacity = '0';
    setTimeout(function () {
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      overlay = null;
      document.body.style.overflow = '';
    }, 200);
    document.removeEventListener('keydown', handleEscape);
  }

  function handleEscape(e) {
    if (e.key === 'Escape') closeWidget();
  }

  // ── postMessage listener ───────────────────────────────────────────────

  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || typeof data !== 'object') return;

    if (data.type === 'taloo-close') {
      closeWidget();
    }

    if (data.type === 'taloo-resize' && data.height) {
      var iframe = overlay && overlay.querySelector('iframe');
      var container = iframe && iframe.parentNode;
      if (iframe && container) {
        var maxHeight = window.innerHeight * 0.9;
        var height = Math.min(data.height, maxHeight);
        iframe.style.height = height + 'px';
        container.style.height = height + 'px';
      }
    }

    if (data.type === 'taloo-success') {
      var customEvent;
      try {
        customEvent = new CustomEvent('taloo:success', {
          detail: { method: data.method, applicationId: data.applicationId },
        });
      } catch (_e) {
        // IE11 fallback
        customEvent = document.createEvent('CustomEvent');
        customEvent.initCustomEvent('taloo:success', true, true, {
          method: data.method,
          applicationId: data.applicationId,
        });
      }
      document.dispatchEvent(customEvent);
      setTimeout(closeWidget, 1500);
    }
  });

  // ── DOM trigger initialization ─────────────────────────────────────────

  function initTriggers() {
    var triggers = document.querySelectorAll('[data-taloo-vacancy-id]');
    for (var i = 0; i < triggers.length; i++) {
      var trigger = triggers[i];
      if (trigger.hasAttribute('data-taloo-initialized')) continue;
      trigger.setAttribute('data-taloo-initialized', 'true');

      (function (el) {
        el.addEventListener('click', function (e) {
          e.preventDefault();
          var vacancyId = el.getAttribute('data-taloo-vacancy-id');
          var source = el.getAttribute('data-taloo-source') || 'widget';
          openWidget(vacancyId, { source: source });
        });
      })(trigger);
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTriggers);
  } else {
    initTriggers();
  }

  // ── Public API ─────────────────────────────────────────────────────────

  window.TalooWidget = {
    open: openWidget,
    close: closeWidget,
    refresh: initTriggers,
  };
})();
