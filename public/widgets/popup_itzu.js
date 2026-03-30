/**
 * Taloo Inline Application Widget — ITZU
 *
 * Self-contained widget that injects an inline application form
 * into ITZU's Drupal vacancy pages.
 *
 * Copy text and channel configuration are fetched from the Taloo backend
 * via GET /widget/{vacancy_id}/popup (public, cached endpoint).
 * If the vacancy has no published pre-screening, the widget does nothing
 * and the original Drupal form remains visible.
 *
 * Usage:
 *   <script
 *     src="https://app.taloo.nl/widgets/popup_itzu.js"
 *     data-taloo-vacancy-id="d02b4ad2-c6f9-4279-9003-82030860e2e5"
 *     defer
 *   ></script>
 *
 * Attributes:
 *   data-taloo-vacancy-id   — (required) The vacancy UUID
 *   data-taloo-source       — (optional) Source identifier, default "widget"
 */
(function () {
  'use strict';

  // ── Script detection & config ──────────────────────────────────────────

  var currentScript =
    document.currentScript ||
    (function () {
      var scripts = document.querySelectorAll('script[src*="popup_itzu"]');
      return scripts[scripts.length - 1];
    })();

  var scriptSrc = currentScript ? currentScript.getAttribute('src') : '';
  var BASE_URL = scriptSrc
    ? scriptSrc.replace(/\/widgets\/popup_itzu\.js.*$/, '')
    : window.location.origin;

  var VACANCY_ID = currentScript
    ? currentScript.getAttribute('data-taloo-vacancy-id') || ''
    : '';

  // ── Client-specific config (ITZU) ─────────────────────────────────────

  var IMAGE_URL = BASE_URL + '/widgets/assets/popup-image-itzu.png';

  // ── Host page selectors (Drupal / ITZU) ────────────────────────────────

  var SELECTORS = {
    formBlock: '.block--view-mode-job-application-form',
    formLayout: '.layout--mod-job-apply',
    formCols: '.layout__cols',
    formTop: '.layout__top',
    submitActions: '.form-actions, [data-drupal-selector="edit-actions"]',
    applyButtons: 'a[href="#application-form"], [data-taloo-vacancy-id]:not(script)'
  };

  // ── Simple markdown helpers ────────────────────────────────────────────

  function md(text) {
    if (!text) return '';
    // **bold** → <strong>bold</strong>
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // [label](url) → <a href="url" target="_blank">label</a>
    text = text.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>');
    return text;
  }

  // ── CSS ────────────────────────────────────────────────────────────────

  var CSS = '\
    #taloo-inline { font-family: inherit; font-size: inherit; max-width: 1500px; }\
    #taloo-inline *, #taloo-inline *::before, #taloo-inline *::after { box-sizing: border-box; }\
    .taloo-form-wrapper { max-width: 100%; display: flex; background: #f9fafb; border-radius: 6px 6px 66px 6px; border: 1px solid #e5e7eb; overflow: hidden; }\
    .taloo-form-content { flex: 1; padding: 40px; min-width: 0; }\
    .taloo-form-image { width: 380px; flex-shrink: 0; background-size: cover; background-position: center center; background-repeat: no-repeat; }\
    @media (max-width: 900px) { .taloo-form-image { display: none; } }\
    .taloo-subtitle { display: flex; align-items: center; gap: 10px; font-size: 18px; color: #6b7280; margin-bottom: 20px; }\
    .taloo-subtitle-icon { width: 32px; height: 32px; border-radius: 50%; background: #fbbf24; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }\
    .taloo-subtitle-icon svg { width: 16px; height: 16px; fill: white; stroke: white; }\
    .taloo-title { font-size: 28px; font-weight: 600; color: #111827; margin: 0 0 16px; line-height: 1.3; }\
    .taloo-desc { font-size: 22px; color: #4b5563; line-height: 1.6; margin-bottom: 32px; }\
    .taloo-desc strong { color: #111827; font-weight: 600; }\
    .taloo-row { display: flex; gap: 16px; margin-bottom: 24px; }\
    .taloo-field { flex: 1; }\
    .taloo-field.full { flex: unset; width: 100%; margin-bottom: 24px; }\
    .taloo-field.two-thirds { flex: 2; }\
    .taloo-field.one-third { flex: 1; }\
    .taloo-select { width: 100%; height: 52px; padding: 0 16px; border: 1px solid #d1d5db !important; border-radius: 12px !important; font-size: 22px; color: #111827; outline: none; transition: border-color 0.15s; background: #fff; appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%236b7280\' d=\'M6 8L1 3h10z\'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 16px center; cursor: pointer; }\
    .taloo-select:focus { border-color: #111827; }\
    .taloo-label { display: block; font-size: 22px; font-weight: 500; color: #374151; margin-bottom: 6px; }\
    .taloo-input { width: 100%; height: 52px; padding: 0 16px; border: 1px solid #d1d5db !important; border-radius: 12px !important; font-size: 22px; color: #111827; outline: none; transition: border-color 0.15s; background: #fff; }\
    .taloo-input:focus { border-color: #111827; }\
    .taloo-input.error { border-color: #ef4444; }\
    .taloo-error { font-size: 18px; color: #dc2626; margin-top: 4px; }\
    .taloo-channel-toggle { display: flex; background: rgba(255,255,255,0.7); border-radius: 8px; padding: 4px; margin-bottom: 24px; border: 1px solid #e5e7eb; }\
    .taloo-channel-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 16px; border-radius: 8px; border: 2px solid transparent; font-size: 22px; font-weight: 500; cursor: pointer; transition: all 0.2s; background: transparent; color: #6b7280; outline: none !important; }\
    .taloo-channel-btn:hover:not(.active) { color: #6b7280; background: rgba(255,255,255,0.5); }\
    .taloo-channel-btn.active { background: #feae00; color: #3d354a; border-color: #feae00; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }\
    .taloo-channel-btn svg { width: 20px; height: 20px; }\
    .taloo-privacy { display: flex !important; align-items: center !important; gap: 10px !important; cursor: pointer; margin: 28px 0; position: relative !important; }\
    .taloo-privacy * { position: static !important; }\
    .taloo-privacy input[type=checkbox] { -webkit-appearance: checkbox !important; appearance: checkbox !important; margin: 0 !important; padding: 0 !important; width: 18px !important; height: 18px !important; min-width: 18px !important; max-width: 18px !important; accent-color: #111827 !important; cursor: pointer; flex-shrink: 0 !important; float: none !important; display: inline-block !important; }\
    .taloo-privacy span { font-size: 22px; color: #4b5563; }\
    .taloo-privacy a { color: #111827; text-decoration: underline; }\
    .taloo-actions { display: flex; align-items: center; gap: 24px; margin-top: 32px; }\
    .taloo-btn-primary { height: 52px; padding: 0 32px; background: #111827; color: #fff; border: none; border-radius: 6px; font-size: 22px; font-weight: 500; cursor: pointer; transition: background 0.15s; }\
    .taloo-btn-primary:hover { background: #1f2937; }\
    .taloo-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }\
    .taloo-btn-secondary { height: 52px; padding: 0 32px; background: #fff; color: #111827; border: 1px solid #d1d5db; border-radius: 6px; font-size: 22px; font-weight: 500; cursor: pointer; transition: all 0.15s; }\
    .taloo-btn-secondary:hover { background: #f9fafb; }\
    .taloo-switch-link { font-size: 20px; color: #6b7280; cursor: pointer; margin-top: 0; display: inline-flex; align-items: center; gap: 8px; padding: 10px 0; transition: color 0.15s; text-decoration: none; }\
    .taloo-switch-link:hover { color: #111827; }\
    .taloo-switch-link svg { width: 20px; height: 20px; transition: transform 0.15s; }\
    .taloo-switch-link:hover svg { transform: translateX(-3px); }\
    .taloo-call-prep { padding: 40px; max-width: 100%; background: #f9fafb; border-radius: 6px 6px 66px 6px; border: 1px solid #e5e7eb; }\
    .taloo-call-prep-header { display: flex; align-items: center; gap: 20px; margin-bottom: 24px; }\
    .taloo-call-prep-icon { position: relative; width: 40px; height: 40px; flex-shrink: 0; }\
    .taloo-call-prep-icon-inner { width: 40px; height: 40px; border-radius: 50%; background: rgba(251,191,36,0.2); display: flex; align-items: center; justify-content: center; }\
    .taloo-call-prep-icon svg { width: 20px; height: 20px; color: #f59e0b; }\
    @keyframes taloo-ping { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.8); opacity: 0; } }\
    .taloo-ping { position: absolute; top: 0; left: 0; right: 0; bottom: 0; width: 40px; height: 40px; border-radius: 50%; border: 2px solid rgba(251,191,36,0.4); animation: taloo-ping 2s ease-out infinite; }\
    .taloo-ping-2 { animation-delay: 0.5s; border-width: 1px; border-color: rgba(251,191,36,0.2); }\
    .taloo-call-prep-title { font-size: 24px; font-weight: 600; color: #111827; margin: 0; line-height: 1.2; }\
    .taloo-call-prep-subtitle { font-size: 22px; color: #6b7280; margin-top: 4px; }\
    .taloo-tip { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }\
    .taloo-tip-icon { width: 32px; height: 32px; border-radius: 50%; background: #f9fafb; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }\
    .taloo-tip-icon svg { width: 16px; height: 16px; color: #4b5563; }\
    .taloo-tip p { font-size: 22px; color: #4b5563; line-height: 1.5; margin: 0; padding-top: 4px; }\
    .taloo-back-banner { display: flex; align-items: center; justify-content: space-between; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px 24px; margin-bottom: 24px; }\
    .taloo-back-banner-text { font-size: 20px; color: #4b5563; }\
    .taloo-back-banner-link { font-size: 20px; color: #111827; font-weight: 500; cursor: pointer; transition: color 0.15s; }\
    .taloo-back-banner-link:hover { color: #6b7280; }\
    .taloo-back-bottom-link { font-size: 20px; color: #6b7280; cursor: pointer; transition: color 0.15s; white-space: nowrap; }\
    .taloo-back-bottom-link:hover { color: #111827; }\
    .taloo-hidden { display: none !important; }\
    .taloo-contact-label { display: block; font-size: 22px; margin-bottom: 8px; font-weight: 500; color: #374151; margin-bottom: 6px; }\
    .taloo-choice-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }\
    .taloo-choice-card { position: relative; display: flex; flex-direction: column; border-radius: 14px; border: 2px solid #e5e7eb; padding: 28px; cursor: pointer; transition: all 0.2s; background: #fff; }\
    .taloo-choice-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); transform: translateY(-2px); }\
    .taloo-choice-card--primary { border-color: #111827; }\
    .taloo-choice-badge { position: absolute; top: -12px; right: 20px; background: #CDFE00; color: #111827; font-size: 14px; font-weight: 700; padding: 4px 14px; border-radius: 999px; letter-spacing: 0.02em; }\
    .taloo-choice-card-title { font-weight: 600; color: #111827; margin-top: 4px; font-size: 22px; }\
    .taloo-choice-card-desc { font-size: 20px; color: #6b7280; line-height: 1.5; margin-top: 8px; flex: 1; }\
    .taloo-choice-card-btn { margin-top: 20px; width: 100%; height: 52px; font-size: 22px; font-weight: 500; border-radius: 8px; display: flex; align-items: center; justify-content: center; pointer-events: none; border: 1px solid #d1d5db; color: #111827; }\
    .taloo-choice-card-btn--primary { background: #111827; color: #fff; border-color: #111827; }\
    @media (max-width: 640px) {\
      .taloo-form-content { padding: 24px 20px; }\
      .taloo-form-wrapper { border-radius: 6px 6px 32px 6px; }\
      .taloo-call-prep { padding: 24px 20px; border-radius: 6px 6px 32px 6px; }\
      .taloo-title { font-size: 22px; }\
      .taloo-desc { font-size: 16px; margin-bottom: 24px; }\
      .taloo-subtitle { font-size: 14px; gap: 8px; }\
      .taloo-subtitle-icon { width: 28px; height: 28px; }\
      .taloo-subtitle-icon svg { width: 14px; height: 14px; }\
      .taloo-row { flex-direction: column; gap: 16px; }\
      .taloo-field.two-thirds, .taloo-field.one-third { flex: unset; width: 100%; }\
      .taloo-label { font-size: 16px; }\
      .taloo-input, .taloo-select { font-size: 16px; height: 48px; }\
      .taloo-contact-label { font-size: 16px; }\
      .taloo-channel-toggle { flex-direction: column; gap: 4px; }\
      .taloo-channel-btn { font-size: 16px; padding: 12px 16px; }\
      .taloo-privacy span { font-size: 14px; }\
      .taloo-btn-primary { font-size: 16px; width: 100%; }\
      .taloo-actions { flex-direction: column; gap: 12px; align-items: stretch; text-align: center; }\
      .taloo-switch-link { font-size: 14px; justify-content: center; }\
      .taloo-choice-cards { grid-template-columns: 1fr; gap: 20px; }\
      .taloo-choice-card { padding: 20px; }\
      .taloo-choice-card-title { font-size: 18px; }\
      .taloo-choice-card-desc { font-size: 16px; }\
      .taloo-choice-card-btn { font-size: 16px; height: 48px; }\
      .taloo-call-prep-title { font-size: 20px; }\
      .taloo-call-prep-subtitle { font-size: 16px; }\
      .taloo-tip p { font-size: 16px; }\
      .taloo-back-banner { flex-direction: column; gap: 8px; text-align: center; padding: 12px 16px; }\
      .taloo-back-banner-text, .taloo-back-banner-link { font-size: 14px; }\
    }\
  ';

  // ── SVG icons ──────────────────────────────────────────────────────────

  var SVG_LIGHTNING = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
  var SVG_PHONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>';
  var SVG_WHATSAPP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>';

  // ── HTML Templates ─────────────────────────────────────────────────────

  function buildHTML(content, personaName, channels) {
    var cs = content.choice_screen || {};
    var pf = content.apply_with_agent || content.phone_form || {};
    var annaOpt = cs.agent_option || cs.anna_option || {};
    var cvOpt = cs.form_option || cs.cv_option || {};
    var contactOptions = pf.contact_options || ['Bel me nu', 'Stuur me via WhatsApp'];

    // Determine which channels to show in the toggle
    var showVoice = channels.voice;
    var showWhatsapp = channels.whatsapp;
    var oneChannel = (showVoice ? 1 : 0) + (showWhatsapp ? 1 : 0) === 1;
    var cn = content.channel_names || {};
    var channelName = showVoice ? (cn.voice || 'Telefoon') : (cn.whatsapp || 'WhatsApp');
    // Build channel toggle buttons
    var channelToggleHTML = '';
    if (showVoice && showWhatsapp) {
      channelToggleHTML =
        '<div class="taloo-channel-toggle">' +
          '<button type="button" class="taloo-channel-btn active" data-channel="phone">' +
            SVG_PHONE + ' ' + contactOptions[0] +
          '</button>' +
          '<button type="button" class="taloo-channel-btn" data-channel="whatsapp">' +
            SVG_WHATSAPP + ' ' + contactOptions[1] +
          '</button>' +
        '</div>';
    } else if (showVoice) {
      channelToggleHTML = '<input type="hidden" id="taloo-channel-fixed" value="phone">';
    } else if (showWhatsapp) {
      channelToggleHTML = '<input type="hidden" id="taloo-channel-fixed" value="whatsapp">';
    }

    // Classic CV card is always shown — SmartCV (channels.cv) is a separate AI feature
    var cvCardHTML =
      '<div class="taloo-choice-card" id="taloo-choose-classic">' +
        '<span class="taloo-choice-card-title">' + (cvOpt.title || 'Klassiek met cv') + '</span>' +
        '<p class="taloo-choice-card-desc">' + (cvOpt.description || '') + '</p>' +
        '<div class="taloo-choice-card-btn">' + (cvOpt.button || 'Solliciteer met cv') + '</div>' +
      '</div>';

    return '' +
      '<!-- Choice step -->' +
      '<div id="taloo-step-choose" class="taloo-form-wrapper">' +
        '<div class="taloo-form-content">' +
          '<div class="taloo-subtitle">' +
            '<div class="taloo-subtitle-icon">' + SVG_LIGHTNING + '</div>' +
            '<span style="font-weight:500;">' + (cs.subtitle || '') + '</span>' +
          '</div>' +
          '<div class="taloo-title">' + (cs.title || '') + '</div>' +
          '<p class="taloo-desc">' + md(cs.description || '') + '</p>' +
          '<div class="taloo-choice-cards">' +
            '<div class="taloo-choice-card taloo-choice-card--primary" id="taloo-choose-anna">' +
              (annaOpt.badge ? '<span class="taloo-choice-badge">' + annaOpt.badge + '</span>' : '') +
              '<span class="taloo-choice-card-title">' + (annaOpt.title || '') + '</span>' +
              '<p class="taloo-choice-card-desc">' + (annaOpt.description || '') + '</p>' +
              '<div class="taloo-choice-card-btn taloo-choice-card-btn--primary">' + (annaOpt.button || '') + '</div>' +
            '</div>' +
            cvCardHTML +
          '</div>' +
        '</div>' +
        '<div class="taloo-form-image" style="background-image:url(\'' + IMAGE_URL + '\');"></div>' +
      '</div>' +

      '<!-- Phone/WhatsApp form step -->' +
      '<div id="taloo-step-phone" class="taloo-form-wrapper taloo-hidden">' +
        '<div class="taloo-form-content">' +
          '<div class="taloo-subtitle">' +
            '<div class="taloo-subtitle-icon">' + SVG_LIGHTNING + '</div>' +
            '<span style="font-weight:500;">' + (pf.subtitle || '') + '</span>' +
          '</div>' +
          '<div class="taloo-title">' + (pf.title || '') + '</div>' +
          '<div class="taloo-row">' +
            '<div class="taloo-field">' +
              '<label class="taloo-label" for="taloo-firstname">Voornaam</label>' +
              '<input class="taloo-input" id="taloo-firstname" type="text" placeholder="Voornaam">' +
            '</div>' +
            '<div class="taloo-field">' +
              '<label class="taloo-label" for="taloo-lastname">Achternaam</label>' +
              '<input class="taloo-input" id="taloo-lastname" type="text" placeholder="Achternaam">' +
            '</div>' +
          '</div>' +
          '<div class="taloo-row" style="margin-bottom:16px;">' +
            '<div class="taloo-field two-thirds">' +
              '<label class="taloo-label" for="taloo-phone">Gsm-nummer</label>' +
              '<input class="taloo-input" id="taloo-phone" type="tel" placeholder="+32 4xx xx xx xx">' +
              '<div id="taloo-phone-error" class="taloo-error taloo-hidden"></div>' +
            '</div>' +
            '<div class="taloo-field one-third">' +
              '<label class="taloo-label" for="taloo-language">\uD83C\uDF10 Taal gesprek</label>' +
              '<select class="taloo-select" id="taloo-language">' +
                '<option value="nl">Nederlands</option>' +
                '<option value="fr">Fran\u00e7ais</option>' +
                '<option value="en">English</option>' +
                '<option value="ar">\u0627\u0644\u0639\u0631\u0628\u064a\u0629 (Arabisch)</option>' +
                '<option value="bg">Bulgaars</option>' +
                '<option value="hr">Kroatisch</option>' +
                '<option value="de">Duits</option>' +
                '<option value="fi">Fins</option>' +
                '<option value="hi">Hindi</option>' +
                '<option value="hu">Hongaars</option>' +
                '<option value="id">Indonesisch</option>' +
                '<option value="it">Italiaans</option>' +
                '<option value="no">Noors</option>' +
                '<option value="pl">Pools</option>' +
                '<option value="pt">Portugees</option>' +
                '<option value="ro">Roemeens</option>' +
                '<option value="ru">Russisch</option>' +
                '<option value="sk">Slowaaks</option>' +
                '<option value="es">Spaans</option>' +
                '<option value="sv">Zweeds</option>' +
                '<option value="cs">Tsjechisch</option>' +
                '<option value="tr">Turks</option>' +
                '<option value="uk">Oekra\u00efens</option>' +
              '</select>' +
            '</div>' +
          '</div>' +
          (pf.contact_label && showVoice && showWhatsapp ? '<label class="taloo-contact-label">' + pf.contact_label + '</label>' : '') +
          channelToggleHTML +
          '<label class="taloo-privacy">' +
            '<input type="checkbox" id="taloo-privacy">' +
            '<span>' + md(pf.privacy_text || '') + '</span>' +
          '</label>' +
          '<div class="taloo-actions">' +
            '<button type="button" class="taloo-btn-primary" id="taloo-submit" disabled>' + (oneChannel && pf.submit_button_one_channel ? pf.submit_button_one_channel.replace('{channel_name}', channelName) : (pf.submit_button || 'Solliciteer nu')) + '</button>' +
            '<span class="taloo-switch-link" id="taloo-switch-to-classic">' + (pf.secondary_button || 'Terug naar keuze') + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<!-- Call prep step -->' +
      '<div id="taloo-step-callprep" class="taloo-call-prep taloo-hidden">' +
        '<div class="taloo-call-prep-header">' +
          '<div class="taloo-call-prep-icon">' +
            '<div class="taloo-call-prep-icon-inner">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>' +
            '</div>' +
            '<div class="taloo-ping"></div>' +
            '<div class="taloo-ping taloo-ping-2"></div>' +
          '</div>' +
          '<div>' +
            '<h2 class="taloo-call-prep-title">Klaar voor je gesprek?</h2>' +
            '<p class="taloo-call-prep-subtitle">' + personaName + ' belt je zo meteen op</p>' +
          '</div>' +
        '</div>' +
        '<div class="taloo-tip">' +
          '<div class="taloo-tip-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>' +
          '<p>Dankzij ' + personaName + ' kun je direct een afspraak inplannen met de recruiter \u2014 geen formulieren nodig</p>' +
        '</div>' +
        '<div class="taloo-tip">' +
          '<div class="taloo-tip-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg></div>' +
          '<p>Je mag in je eigen taal spreken</p>' +
        '</div>' +
        '<div class="taloo-tip">' +
          '<div class="taloo-tip-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg></div>' +
          '<p>Zorg voor een rustige omgeving en vermijd de speaker</p>' +
        '</div>' +
        '<div class="taloo-tip">' +
          '<div class="taloo-tip-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg></div>' +
          '<p>Spreek rustig en duidelijk \u2014 je kunt altijd vragen om de vraag te herhalen</p>' +
        '</div>' +
        '<div class="taloo-tip">' +
          '<div class="taloo-tip-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>' +
          '<p>Zeg "Ik wil met een mens spreken" om doorverbonden te worden</p>' +
        '</div>' +
        '<p style="font-size:14px;color:#4b5563;font-weight:500;margin-top:20px;">Veel succes! \uD83C\uDF40</p>' +
      '</div>';
  }

  // ── CSS injection ──────────────────────────────────────────────────────

  function injectCSS() {
    var style = document.createElement('style');
    style.id = 'taloo-itzu-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  // ── Init ───────────────────────────────────────────────────────────────

  function init() {
    var formBlock = document.querySelector(SELECTORS.formBlock);
    if (!formBlock) return;

    var formLayout = formBlock.querySelector(SELECTORS.formLayout);
    if (!formLayout) return;

    if (!VACANCY_ID) return;

    // Fetch popup content from backend — if the vacancy has no published
    // pre-screening, the API returns 404 and we leave the original form.
    fetch(BASE_URL + '/widget/' + VACANCY_ID + '/popup')
      .then(function (res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.content) return;
        mount(formLayout, data);
      })
      .catch(function (err) {
        console.error('Taloo popup fetch error:', err);
      });
  }

  function mount(formLayout, data) {
    var content = data.content;
    var channels = data.channels;
    var personaName = data.persona_name || 'Anna';
    var formContent = content.apply_with_form || content.cv_form || {};

    var originalFormCols = formLayout.querySelector(SELECTORS.formCols);
    if (originalFormCols) originalFormCols.style.display = 'none';

    var formTop = formLayout.querySelector(SELECTORS.formTop);

    // Inject CSS
    injectCSS();

    // Build container
    var container = document.createElement('div');
    container.id = 'taloo-inline';
    container.innerHTML = buildHTML(content, personaName, channels);

    // Insert into host page
    if (formTop) {
      formTop.insertAdjacentElement('afterend', container);
    } else {
      formLayout.prepend(container);
    }

    // ── State ────────────────────────────────────────────────────────────

    var channel = channels.voice ? 'phone' : 'whatsapp';
    var stepChoose = document.getElementById('taloo-step-choose');
    var stepPhone = document.getElementById('taloo-step-phone');
    var stepCallPrep = document.getElementById('taloo-step-callprep');

    // ── Step navigation ──────────────────────────────────────────────────

    function showStep(step) {
      stepChoose.classList.add('taloo-hidden');
      stepPhone.classList.add('taloo-hidden');
      stepCallPrep.classList.add('taloo-hidden');
      container.classList.remove('taloo-hidden');
      if (originalFormCols) originalFormCols.style.display = 'none';
      step.classList.remove('taloo-hidden');
    }

    // Choice: Anna → phone form
    document.getElementById('taloo-choose-anna').addEventListener('click', function () {
      showStep(stepPhone);
    });

    // ── Back-to-choice elements for original form ────────────────────────

    var backBanner = document.createElement('div');
    backBanner.className = 'taloo-back-banner taloo-hidden';
    backBanner.innerHTML =
      '<span class="taloo-back-banner-text">' + (formContent.back_banner_text || ('Liever sneller solliciteren met ' + personaName + '?')) + '</span>' +
      '<span class="taloo-back-banner-link" id="taloo-back-top">' + (formContent.back_banner_link || 'Terug naar keuze') + '</span>';

    var backBottomLink = document.createElement('span');
    backBottomLink.className = 'taloo-back-bottom-link taloo-hidden';
    backBottomLink.id = 'taloo-back-bottom';
    backBottomLink.textContent = formContent.back_banner_link || 'Terug naar keuze';

    if (originalFormCols) {
      originalFormCols.parentNode.insertBefore(backBanner, originalFormCols);
      var submitActions = originalFormCols.querySelector(SELECTORS.submitActions);
      if (submitActions) {
        submitActions.style.display = 'flex';
        submitActions.style.alignItems = 'center';
        submitActions.style.gap = '24px';
        submitActions.appendChild(backBottomLink);
      }
    }

    function showClassicForm() {
      container.classList.add('taloo-hidden');
      if (originalFormCols) originalFormCols.style.display = '';
      if (formTop) formTop.style.display = '';
      backBanner.classList.remove('taloo-hidden');
      backBottomLink.classList.remove('taloo-hidden');
      if (formTop) {
        var titleEl = formTop.querySelector('h2');
        if (titleEl) {
          titleEl.innerHTML = '<em>Solliciteer</em> nu<div id="application-form"></div>';
          titleEl.style.minWidth = '';
        }
      }
    }

    function backToChoice() {
      backBanner.classList.add('taloo-hidden');
      backBottomLink.classList.add('taloo-hidden');
      if (originalFormCols) originalFormCols.style.display = 'none';
      showStep(stepChoose);
      if (formTop) {
        var titleEl = formTop.querySelector('h2');
        if (titleEl) {
          titleEl.innerHTML = '<em>Solliciteer</em> met ' + personaName + '<div id="application-form"></div>';
          titleEl.style.minWidth = window.innerWidth > 640 ? '910px' : '';
        }
      }
      var target = formTop || container;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Choice: Classic → show original form (only if cv channel exists)
    var classicBtn = document.getElementById('taloo-choose-classic');
    if (classicBtn) {
      classicBtn.addEventListener('click', function () {
        showClassicForm();
      });
    }

    // Back links (delegated)
    document.addEventListener('click', function (e) {
      if (e.target.id === 'taloo-back-top' || e.target.id === 'taloo-back-bottom') {
        backToChoice();
      }
    });

    // ── Channel toggle ───────────────────────────────────────────────────

    var channelBtns = container.querySelectorAll('.taloo-channel-btn');
    channelBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        channel = btn.getAttribute('data-channel');
        channelBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
      });
    });

    // ── Form validation ──────────────────────────────────────────────────

    var firstNameInput = document.getElementById('taloo-firstname');
    var lastNameInput = document.getElementById('taloo-lastname');
    var phoneInput = document.getElementById('taloo-phone');
    var privacyInput = document.getElementById('taloo-privacy');
    var submitBtn = document.getElementById('taloo-submit');
    var phoneError = document.getElementById('taloo-phone-error');

    function validateForm() {
      var valid =
        firstNameInput.value.trim() &&
        lastNameInput.value.trim() &&
        phoneInput.value.trim() &&
        privacyInput.checked;
      submitBtn.disabled = !valid;
    }

    [firstNameInput, lastNameInput, phoneInput].forEach(function (input) {
      input.addEventListener('input', validateForm);
    });
    privacyInput.addEventListener('change', validateForm);

    // ── Phone helpers ────────────────────────────────────────────────────

    function formatPhone(val) {
      val = val.replace(/[^\d+]/g, '');
      if (!val.startsWith('+')) val = '+' + val;
      return val;
    }

    function isValidPhone(val) {
      return /^\+\d{8,15}$/.test(val.replace(/[\s\-()]/g, ''));
    }

    // ── Submit ───────────────────────────────────────────────────────────

    submitBtn.addEventListener('click', function () {
      var phone = formatPhone(phoneInput.value);
      if (!isValidPhone(phone)) {
        phoneError.textContent = 'Ongeldig telefoonnummer. Gebruik internationaal formaat (bijv. +32471234567).';
        phoneError.classList.remove('taloo-hidden');
        phoneInput.classList.add('error');
        return;
      }
      phoneError.classList.add('taloo-hidden');
      phoneInput.classList.remove('error');

      var apiChannel = channel === 'whatsapp' ? 'whatsapp' : 'voice';

      if (apiChannel === 'voice') {
        stepPhone.classList.add('taloo-hidden');
        stepCallPrep.classList.remove('taloo-hidden');
      } else {
        alert('WhatsApp bericht verzonden!');
      }

      // Fire API in background
      fetch(BASE_URL + '/screening/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vacancy_id: VACANCY_ID,
          channel: apiChannel,
          phone_number: phone,
          first_name: firstNameInput.value.trim(),
          last_name: lastNameInput.value.trim(),
          is_test: false
        })
      }).catch(function (err) {
        console.error('Taloo screening error:', err);
      });
    });

    // Switch back to choice step
    document.getElementById('taloo-switch-to-classic').addEventListener('click', function () {
      showStep(stepChoose);
    });

    // ── Host page manipulation ───────────────────────────────────────────

    // Update the section title
    if (formTop) {
      formTop.style.paddingTop = '20px';
      formTop.style.scrollMarginTop = '20px';
      var titleEl = formTop.querySelector('h2');
      if (titleEl) {
        titleEl.innerHTML = '<em>Solliciteer</em> met ' + personaName + '<div id="application-form"></div>';
        titleEl.style.minWidth = window.innerWidth > 640 ? '910px' : '';
        titleEl.style.marginBottom = '4rem';
      }
    }

    // Intercept apply buttons to scroll to form (not open popup)
    var applyBtns = document.querySelectorAll(SELECTORS.applyButtons);
    applyBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        container.classList.remove('taloo-hidden');
        if (originalFormCols) originalFormCols.style.display = 'none';
        var target = formTop || document.getElementById('application-form') || container;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  // ── DOM ready guard ────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
