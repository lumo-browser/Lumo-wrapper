(function() {
  if (window._lumoTranslated) {
    const w = document.getElementById('lumo-translate-widget');
    if (w) w.style.display = 'block';
    return;
  }
  window._lumoTranslated = true;
  
  window.lumoTranslateInit = function() {
    try {
      new window.google.translate.TranslateElement({
        pageLanguage: 'auto'
      }, 'lumo-translate-widget');
    } catch (e) {
      console.error(e);
    }
  };

  const s = document.createElement('script');
  s.src = "https://translate.google.com/translate_a/element.js?cb=lumoTranslateInit";
  s.onerror = function() {
    alert("Could not load Google Translate. The website's security policy might be blocking it.");
  };
  document.head.appendChild(s);

  const widgetDiv = document.createElement('div');
  widgetDiv.id = 'lumo-translate-widget';
  widgetDiv.style.position = 'fixed';
  widgetDiv.style.top = '20px';
  widgetDiv.style.right = '20px';
  widgetDiv.style.zIndex = '2147483647';
  widgetDiv.style.backgroundColor = 'white';
  widgetDiv.style.padding = '8px';
  widgetDiv.style.borderRadius = '12px';
  widgetDiv.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
  widgetDiv.style.border = '1px solid rgba(0,0,0,0.05)';
  document.body.appendChild(widgetDiv);

  const style = document.createElement('style');
  style.textContent = `
    #lumo-translate-widget {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    }
    /* Hide Google text */
    #lumo-translate-widget .goog-te-gadget {
      color: transparent !important;
      font-size: 0px !important;
    }
    #lumo-translate-widget .goog-te-combo {
      -webkit-appearance: none;
      appearance: none;
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 8px 36px 8px 14px;
      font-size: 14px;
      font-weight: 500;
      color: #111827;
      outline: none;
      cursor: pointer;
      margin: 0 !important;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      background-size: 16px;
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
      transition: all 0.2s ease;
    }
    #lumo-translate-widget .goog-te-combo:hover {
      border-color: #d1d5db;
      background-color: #ffffff;
    }
    #lumo-translate-widget .goog-te-combo:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
      background-color: #ffffff;
    }
    .goog-logo-link { display: none !important; }
    .goog-te-gadget img { display: none !important; }
    /* Force hide top banner */
    .goog-te-banner-frame { display: none !important; }
    body { top: 0px !important; }
  `;
  document.head.appendChild(style);
})();
