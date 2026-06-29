/**
 * AgentExecutor — Vision-based browser control engine.
 *
 * ARCHITECTURE: "Set of Marks" + Native Input Events
 * ─────────────────────────────────────────────────────
 * 1. DOM_EXTRACTOR_SCRIPT tags every interactable element with a red numbered
 *    overlay and records its center (x, y) coordinates in window.__LumoAgentElements.
 * 2. captureTaggedScreenshot() injects the tags, takes a capturePage() screenshot,
 *    then removes the tags. The annotated base64 image is sent to the VLM alongside
 *    a short element list so the model can reason visually.
 * 3. All click actions use Electron's native sendInputEvent (real mouse down/up)
 *    directly on the webview element — bypasses JS-event guards on modern websites.
 * 4. Type actions simulate character-by-character keyboard events for the same reason.
 *
 * The executor is stateless — all state lives in AgentMemory.
 */

import type { TaskMemory, ExtractedProduct } from './AgentMemory';
import { addProductToMemory, addActionToMemory } from './AgentMemory';

// ── DOM Extractor (Vision Mode) ────────────────────────────────────────────

/**
 * Injected into the webview to:
 *  - Find every interactable element
 *  - Record its center (x, y) in window.__LumoAgentElements keyed by numeric ID
 *  - Paint a visible red numbered tag over each element
 *  - Return a compact JSON array of { id, tag, text, x, y, type, role, href }
 *
 * Coordinates are viewport-relative (no scroll offset) to match sendInputEvent.
 * Tags use position:fixed so they appear at the correct viewport position.
 */
export const DOM_EXTRACTOR_SCRIPT = `
  (function() {
    document.querySelectorAll('.Lumo-agent-tag').forEach(function(t){ t.remove(); });

    window.__LumoAgentElements = {};
    var results = [];
    var idCounter = 1;

    function isVisible(el) {
      if (el.type === 'radio' || el.type === 'checkbox') return true;
      var rect = el.getBoundingClientRect();
      var style = window.getComputedStyle(el);
      return rect.width > 0 && rect.height > 0
        && style.visibility !== 'hidden'
        && style.display !== 'none'
        && parseFloat(style.opacity) > 0;
    }

    function getLabel(el) {
      var type = el.getAttribute('type') || '';
      if (type === 'radio' || type === 'checkbox') {
        var labelEl = el.id ? document.querySelector('label[for="' + el.id + '"]') : el.closest('label');
        if (labelEl) return labelEl.innerText.trim().substring(0, 100);
        var p = el.parentElement;
        for (var i = 0; i < 4 && p; i++) {
          var t = p.innerText.trim();
          if (t.length > 1 && t.length < 200) return t.substring(0, 100);
          p = p.parentElement;
        }
      }
      return (
        el.innerText ||
        el.value ||
        el.placeholder ||
        el.getAttribute('aria-label') ||
        el.getAttribute('title') ||
        el.getAttribute('alt') || ''
      ).trim().substring(0, 80);
    }

    var selectors = 'a, button, input, textarea, select, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [onclick], label, summary';
    document.querySelectorAll(selectors).forEach(function(el) {
      if (!isVisible(el)) return;
      var rect = el.getBoundingClientRect();
      var id   = idCounter++;
      var cx   = Math.round(rect.left + rect.width  / 2);
      var cy   = Math.round(rect.top  + rect.height / 2);

      window.__LumoAgentElements[id] = { el: el, x: cx, y: cy };

      var tag = document.createElement('div');
      tag.className  = 'Lumo-agent-tag';
      tag.textContent = String(id);
      tag.style.cssText = [
        'position:fixed',
        'top:'   + (rect.top - 2) + 'px',
        'left:'  + (rect.left - 2) + 'px',
        'background:#ef4444',
        'color:#fff',
        'font-size:9px',
        'font-weight:bold',
        'padding:0 3px',
        'border-radius:3px',
        'z-index:2147483647',
        'pointer-events:none',
        'line-height:14px',
        'font-family:monospace',
      ].join(';');
      document.body.appendChild(tag);

      var tagName = el.tagName.toLowerCase();
      var type    = el.getAttribute('type') || '';
      var role    = el.getAttribute('role') || '';
      var href    = el.getAttribute('href') || '';
      var checked = (type === 'radio' || type === 'checkbox')
        ? (el.checked ? '[CHECKED]' : '[UNCHECKED]') : '';

      results.push({
        id:   id,
        tag:  tagName,
        type: type,
        role: role,
        href: href.length < 80 ? href : '',
        text: getLabel(el),
        checked: checked,
        x:    cx,
        y:    cy,
      });
    });

    return JSON.stringify(results);
  })();
`;

/** Remove visual tags after screenshot is captured */
const REMOVE_TAGS_SCRIPT = `
  document.querySelectorAll('.Lumo-agent-tag').forEach(function(t){ t.remove(); });
`;

/** Extract visible page text for context */
const READ_PAGE_TEXT_SCRIPT = `
  (function() {
    var selectors = 'h1, h2, h3, h4, p, li, td, th, span, label, figcaption, blockquote, .a-price, .a-size-base, [data-testid]';
    var nodes = document.querySelectorAll(selectors);
    var text = [], seen = {};
    for (var i = 0; i < nodes.length; i++) {
      var t = (nodes[i].innerText || '').trim();
      if (t.length > 2 && t.length < 500 && !seen[t]) {
        seen[t] = true;
        text.push(t);
      }
      if (text.length > 200) break;
    }
    return text.join('\\n');
  })();
`;

/** Product extractor for e-commerce pages */
function buildExtractProductScript(maxProducts: number): string {
  return `
    (function() {
      var products = [];
      var cards = document.querySelectorAll(
        '[data-component-type="s-search-result"], .s-result-item, .sg-col-inner,' +
        '._1AtVbE, ._13oc-S, .product-tuple-listing, .product-base'
      );
      if (cards.length === 0) {
        cards = document.querySelectorAll('[class*="product"],[class*="item"],[class*="card"],[class*="listing"]');
      }
      for (var i = 0; i < Math.min(cards.length, ${maxProducts}); i++) {
        var card = cards[i];
        var nameEl  = card.querySelector('h2, h3, [class*="title"], [class*="name"], .a-text-normal, ._4rR01T, .s1Q9rs');
        if (!nameEl) continue;
        var name = nameEl.innerText.trim().substring(0, 120);
        if (!name) continue;
        var priceEl  = card.querySelector('.a-price .a-offscreen, [class*="price"], ._30jeq3, ._1_WHN1, .a-price-whole');
        var ratingEl = card.querySelector('[class*="rating"], .a-icon-alt, ._3LWZlK');
        var reviewEl = card.querySelector('[class*="review"], .a-size-base.s-underline-text, ._2_R_DZ span');
        var delivEl  = card.querySelector('[class*="delivery"], [class*="shipping"], .a-text-bold .a-text-normal');
        var price    = priceEl  ? priceEl.innerText.trim().substring(0,30)  : '';
        var rating   = ratingEl ? ratingEl.innerText.trim().substring(0,20) : '';
        var reviews  = reviewEl ? reviewEl.innerText.trim().substring(0,30) : '';
        var delivery = delivEl  ? delivEl.innerText.trim().substring(0,50)  : '';
        if (name && (price || rating)) {
          products.push({ name, price: price||'N/A', rating: rating||'N/A',
                          reviews: reviews||'N/A', delivery: delivery||'N/A' });
        }
      }
      return JSON.stringify(products);
    })();
  `;
}

// ── Screenshot Helper ──────────────────────────────────────────────────────

/**
 * captureTaggedScreenshot
 *  1. Injects the DOM extractor to paint numbered tags
 *  2. Waits for next animation frame so tags are painted
 *  3. Asks Electron main process to capturePage() for this specific webview
 *  4. Removes the tags
 *  5. Returns { elementList, screenshotBase64 }
 */
export async function captureTaggedScreenshot(
  webview: any
): Promise<{ elementList: ElementInfo[]; screenshotBase64: string }> {
  // Step 1 — inject tags and collect element data
  const raw: string = await webview.executeJavaScript(DOM_EXTRACTOR_SCRIPT);
  let elementList: ElementInfo[] = [];
  try { elementList = JSON.parse(raw); } catch { elementList = []; }

  // Step 2 — wait for tags to be painted before capturing
  await webview.executeJavaScript(
    'new Promise(function(r){requestAnimationFrame(function(){setTimeout(r,50)});})'
  );

  // Step 3 — capture this webview only (via its webContents ID)
  let screenshotBase64 = '';
  try {
    const wcId: number = await webview.getWebContentsId();
    const result = await window.electron?.invoke?.('lumo:capture-webview', { webContentsId: wcId });
    if (result?.base64) screenshotBase64 = result.base64;
  } catch {
    // capturePage unavailable — proceed with text-only mode
  }

  // Step 4 — remove tags so the user sees a clean page
  await webview.executeJavaScript(REMOVE_TAGS_SCRIPT);

  return { elementList, screenshotBase64 };
}

/** Compact text representation of the element list for the text portion of the prompt */
export function buildElementText(elementList: ElementInfo[]): string {
  return elementList
    .map((e) => {
      let line = '[' + e.id + '] <' + e.tag;
      if (e.type) line += ' type="' + e.type + '"';
      if (e.role) line += ' role="' + e.role + '"';
      if (e.href) line += ' href="' + e.href + '"';
      line += '>' + (e.checked ? ' ' + e.checked : '') + ' "' + e.text + '"';
      line += '  @(' + e.x + ',' + e.y + ')';
      return line;
    })
    .join('\n');
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface ElementInfo {
  id: number;
  tag: string;
  type: string;
  role: string;
  href: string;
  text: string;
  checked: string;
  x: number;
  y: number;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  updatedMemory: TaskMemory;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
  isDone?: boolean;
  doneSuccess?: boolean;
  comparisonData?: ExtractedProduct[];
  comparisonRecommendation?: string;
  planSteps?: string[];
}

// ── Native Input Helpers ───────────────────────────────────────────────────

/**
 * Simulate a real mouse click at (x, y) via webview.sendInputEvent.
 * Coordinates are viewport-relative (matching the DOM extractor output).
 * Falls back to element.click() if native events are unavailable.
 */
async function nativeClick(webview: any, x: number, y: number, elementId: number): Promise<void> {
  try {
    webview.sendInputEvent({ type: 'mouseDown', x, y, button: 'left', clickCount: 1 });
    await sleep(50);
    webview.sendInputEvent({ type: 'mouseUp', x, y, button: 'left', clickCount: 1 });
    return;
  } catch { /* fall through */ }

  await webview.executeJavaScript(
    '(function(){' +
    'var e=window.__LumoAgentElements&&window.__LumoAgentElements[' + elementId + '];' +
    'if(e&&e.el){e.el.scrollIntoView({block:"center"});e.el.focus();e.el.click();}' +
    '})()'
  );
}

/**
 * Type text via webview.sendInputEvent char-by-char.
 * Falls back to setting element.value directly + synthetic events.
 */
async function nativeType(webview: any, elementId: number, text: string, clearFirst: boolean, pressEnter: boolean): Promise<void> {
  await webview.executeJavaScript(
    '(function(){' +
    'var e=window.__LumoAgentElements&&window.__LumoAgentElements[' + elementId + '];' +
    'if(e&&e.el){e.el.scrollIntoView({block:"center"});e.el.focus();' +
    (clearFirst ? 'e.el.value="";' : '') +
    'e.el.dispatchEvent(new Event("focus",{bubbles:true}));' +
    '}' +
    '})()'
  );

  try {
    for (const char of text) {
      webview.sendInputEvent({ type: 'keyDown', keyCode: char });
      await sleep(10);
      webview.sendInputEvent({ type: 'char', keyCode: char });
      await sleep(5);
      webview.sendInputEvent({ type: 'keyUp', keyCode: char });
      await sleep(10);
    }
    if (pressEnter) {
      webview.sendInputEvent({ type: 'keyDown', keyCode: 'Enter' });
      await sleep(30);
      webview.sendInputEvent({ type: 'keyUp', keyCode: 'Enter' });
    }
    return;
  } catch { /* fall through */ }

  const escaped = text.replace(/'/g, "\\'").replace(/\n/g, '\\n');
  await webview.executeJavaScript(
    '(function(){' +
    'var e=window.__LumoAgentElements&&window.__LumoAgentElements[' + elementId + '];' +
    'if(e&&e.el){' +
    (clearFirst ? 'e.el.value="";' : '') +
    'e.el.value=\'' + escaped + '\';' +
    'e.el.dispatchEvent(new Event("input",{bubbles:true}));' +
    'e.el.dispatchEvent(new Event("change",{bubbles:true}));' +
    (pressEnter
      ? 'e.el.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",code:"Enter",keyCode:13,which:13,bubbles:true}));' +
        'if(e.el.form)e.el.form.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));'
      : '') +
    '}' +
    '})()'
  );
}

// ── Main Executor ──────────────────────────────────────────────────────────

export async function executeToolCall(
  webview: any,
  toolName: string,
  args: Record<string, any>,
  memory: TaskMemory
): Promise<ExecutionResult> {
  let output = '';
  let updatedMemory = { ...memory };

  try {
    switch (toolName) {

      // ── Navigate ────────────────────────────────────────────────
      case 'navigate': {
        let url = args.url || '';
        if (url && !url.startsWith('http')) url = 'https://' + url;
        webview.loadURL(url);
        await sleep(3000);
        updatedMemory.visitedUrls = [...updatedMemory.visitedUrls, url];
        output = 'Navigated to ' + url;
        break;
      }

      // ── Click (Vision-native) ────────────────────────────────────
      case 'click': {
        const clickId = Number(args.id);
        // Retrieve stored coordinates from the last DOM extraction
        const coordResult: string = await webview.executeJavaScript(
          'JSON.stringify(window.__LumoAgentElements&&window.__LumoAgentElements[' + clickId + ']' +
          '?{x:window.__LumoAgentElements[' + clickId + '].x,y:window.__LumoAgentElements[' + clickId + '].y}:null)'
        );
        let coord: { x: number; y: number } | null = null;
        try { coord = JSON.parse(coordResult); } catch { /* ignore */ }

        if (coord) {
          await nativeClick(webview, coord.x, coord.y, clickId);
        } else {
          // Coordinate not found — fall back to JS click
          await webview.executeJavaScript(
            '(function(){var e=window.__LumoAgentElements&&window.__LumoAgentElements[' + clickId + '];' +
            'if(e&&e.el){e.el.scrollIntoView({block:"center"});e.el.focus();e.el.click();}})()'
          );
        }
        await sleep(2000);
        output = 'Clicked element [' + clickId + ']' +
          (coord ? ' at (' + coord.x + ',' + coord.y + ')' : ' (JS fallback)') +
          (args.description ? ' — ' + args.description : '');
        break;
      }

      // ── Click by coordinate (direct vision output) ──────────────
      case 'click_at': {
        const cx = Number(args.x);
        const cy = Number(args.y);
        try {
          webview.sendInputEvent({ type: 'mouseDown', x: cx, y: cy, button: 'left', clickCount: 1 });
          await sleep(50);
          webview.sendInputEvent({ type: 'mouseUp', x: cx, y: cy, button: 'left', clickCount: 1 });
        } catch {
          await webview.executeJavaScript('document.elementFromPoint(' + cx + ',' + cy + ')?.click();');
        }
        await sleep(1500);
        output = 'Clicked at coordinates (' + cx + ', ' + cy + ')';
        break;
      }

      // ── Type Text (native keyboard) ──────────────────────────────
      case 'type_text': {
        const typeId    = Number(args.id);
        const text      = args.text || '';
        const clearFirst = args.clear_first !== false;
        const pressEnter = args.press_enter === true;

        await nativeType(webview, typeId, text, clearFirst, pressEnter);
        await sleep(pressEnter ? 2500 : 600);
        output = 'Typed "' + text + '" into element [' + typeId + ']' + (pressEnter ? ' and pressed Enter' : '');
        break;
      }

      // ── Scroll ───────────────────────────────────────────────────
      case 'scroll': {
        const amount = args.amount || 500;
        const pixels = args.direction === 'up' ? -amount : amount;
        await webview.executeJavaScript('window.scrollBy(0,' + pixels + ');');
        await sleep(500);
        output = 'Scrolled ' + args.direction + ' by ' + Math.abs(pixels) + 'px';
        break;
      }

      // ── Read Page Text ───────────────────────────────────────────
      case 'read_page_text': {
        const maxLen = args.max_length || 3000;
        const rawText: string = await webview.executeJavaScript(READ_PAGE_TEXT_SCRIPT);
        output = (rawText || '').substring(0, maxLen);
        break;
      }

      // ── Extract Product Data ─────────────────────────────────────
      case 'extract_product_data': {
        const maxProducts = args.max_products || 5;
        const vendor      = args.vendor || 'Unknown';
        const rawJson: string = await webview.executeJavaScript(buildExtractProductScript(maxProducts));
        try {
          const products: any[] = JSON.parse(rawJson);
          products.forEach((p) => {
            updatedMemory = addProductToMemory(updatedMemory, {
              name:     p.name,
              price:    p.price,
              rating:   p.rating,
              reviews:  p.reviews,
              delivery: p.delivery,
              url:      webview.getURL?.() || '',
              vendor,
            });
          });
          output =
            'Extracted ' + products.length + ' products from ' + vendor + ':\n' +
            products
              .map((p: any, i: number) => (i + 1) + '. ' + p.name + ' — ' + p.price + ' (Rating: ' + p.rating + ')')
              .join('\n');
        } catch {
          output = 'Failed to parse product data. Raw: ' + (rawJson || '').substring(0, 300);
        }
        break;
      }

      // ── Press Key ────────────────────────────────────────────────
      case 'press_key': {
        const key = args.key || 'Enter';
        try {
          webview.sendInputEvent({ type: 'keyDown', keyCode: key });
          await sleep(30);
          webview.sendInputEvent({ type: 'keyUp', keyCode: key });
        } catch {
          await webview.executeJavaScript(
            'document.activeElement.dispatchEvent(new KeyboardEvent("keydown",{key:"' + key + '",bubbles:true}));' +
            'document.activeElement.dispatchEvent(new KeyboardEvent("keyup",{key:"' + key + '",bubbles:true}));'
          );
        }
        await sleep(1000);
        output = 'Pressed key: ' + key;
        break;
      }

      // ── Wait ─────────────────────────────────────────────────────
      case 'wait': {
        const seconds = Math.min(Math.max(args.seconds || 1, 0.5), 10);
        await sleep(seconds * 1000);
        output = 'Waited ' + seconds + 's' + (args.reason ? ' — ' + args.reason : '');
        break;
      }

      // ── Go Back ──────────────────────────────────────────────────
      case 'go_back': {
        webview.goBack();
        await sleep(2000);
        output = 'Navigated back';
        break;
      }

      // ── Click By Text (fallback) ──────────────────────────────────
      case 'click_by_text': {
        const searchText = (args.text || '').replace(/'/g, "\\'").toLowerCase().substring(0, 100);
        const clickResult: string = await webview.executeJavaScript(
          '(function(){' +
          'var candidates=document.querySelectorAll("label,[role=\\"radio\\"],[role=\\"option\\"],li,.answer,.option,.choice,td,th,div,span,p,a,button");' +
          'for(var i=0;i<candidates.length;i++){' +
          'var t=(candidates[i].innerText||"").toLowerCase().trim();' +
          'if(t.indexOf("' + searchText + '")!==-1&&t.length<300){candidates[i].click();return "clicked:"+candidates[i].innerText.trim().substring(0,80);}' +
          '}return "not_found";' +
          '})()'
        );
        await sleep(1500);
        output = (clickResult || '').startsWith('not_found')
          ? 'Could not find element with text: ' + args.text
          : 'Clicked by text: ' + (clickResult || '').replace('clicked:', '');
        break;
      }

      // ── Quiz Answer ───────────────────────────────────────────────
      case 'quiz_answer': {
        const answerText = (args.answer || '').toLowerCase().replace(/'/g, "\\'");
        const quizResult: string = await webview.executeJavaScript(
          '(function(){' +
          'var result={selected:false,advanced:false,msg:""};' +
          'var candidates=document.querySelectorAll("label,[role=\'radio\'],[role=\'option\'],li,td,.answer,.option,.choice,.a-label,input[type=\'radio\'],input[type=\'checkbox\'],div,span,p,a,button");' +
          'for(var i=0;i<candidates.length;i++){' +
          'var el=candidates[i];var t=(el.innerText||el.textContent||el.value||"").toLowerCase().trim();' +
          'if(t.indexOf("' + answerText + '")!==-1&&t.length<400){el.click();result.selected=true;result.msg="Selected: "+(el.innerText||el.value||"").trim().substring(0,80);break;}' +
          '}' +
          'if(result.selected){' +
          'var btns=document.querySelectorAll("button,input[type=\'submit\'],input[type=\'button\'],a,[role=\'button\']");' +
          'var kw=["next","submit","continue","ok","proceed","finish","done","save","forward","check"];' +
          'for(var j=0;j<btns.length;j++){var btext=(btns[j].innerText||btns[j].value||btns[j].getAttribute("aria-label")||"").toLowerCase().trim();' +
          'for(var k=0;k<kw.length;k++){if(btext.indexOf(kw[k])!==-1){btns[j].click();result.advanced=true;result.msg+=" | Clicked: "+btext;break;}}if(result.advanced)break;}' +
          '}' +
          'return JSON.stringify(result);' +
          '})()'
        );
        await sleep(2500);
        try {
          const qr = JSON.parse(quizResult);
          output = !qr.selected
            ? 'Could not find answer option matching: "' + args.answer + '". Try shorter text.'
            : !qr.advanced
              ? qr.msg + ' | (No Next button found)'
              : qr.msg;
        } catch {
          output = 'Quiz answer result: ' + quizResult;
        }
        break;
      }

      // ── Request User Confirmation (Safety Gate) ──────────────────
      case 'request_user_confirmation': {
        return {
          success: true,
          output: args.action_description,
          updatedMemory: {
            ...updatedMemory,
            requiresConfirmation: true,
            confirmationMessage:
              args.action_description + (args.details ? '\n\nDetails: ' + args.details : ''),
          },
          requiresConfirmation: true,
          confirmationMessage:
            args.action_description + (args.details ? '\n\nDetails: ' + args.details : ''),
        };
      }

      // ── Save Product ─────────────────────────────────────────────
      case 'save_product': {
        updatedMemory = addProductToMemory(updatedMemory, {
          name:     args.name     || 'Unknown',
          price:    args.price    || 'N/A',
          rating:   args.rating   || 'N/A',
          reviews:  args.reviews  || 'N/A',
          delivery: args.delivery || 'N/A',
          url:      args.url      || '',
          vendor:   args.vendor   || 'Unknown',
        });
        output = 'Saved product: ' + args.name + ' (' + args.price + ') from ' + args.vendor;
        break;
      }

      // ── Present Comparison ────────────────────────────────────────
      case 'present_comparison': {
        return {
          success: true,
          output: 'Presenting product comparison to user',
          updatedMemory,
          comparisonData: updatedMemory.extractedProducts,
          comparisonRecommendation: args.recommendation || '',
        };
      }

      // ── Update Plan ───────────────────────────────────────────────
      case 'update_plan': {
        const steps: string[]  = args.steps       || [];
        const currentStep: number = args.current_step || 0;
        updatedMemory = {
          ...updatedMemory,
          plan: steps.map((desc, i) => ({
            id:          i + 1,
            description: desc,
            status:
              i < currentStep  ? 'done'    as const :
              i === currentStep ? 'active' as const : 'pending' as const,
          })),
          currentStepIndex: currentStep,
        };
        output = 'Plan updated with ' + steps.length + ' steps';
        return { success: true, output, updatedMemory, planSteps: steps };
      }

      // ── Done ──────────────────────────────────────────────────────
      case 'done': {
        output = args.message || 'Task completed.';
        return {
          success:     true,
          output,
          updatedMemory,
          isDone:      true,
          doneSuccess: args.success !== false,
        };
      }

      default: {
        output = 'Unknown tool: ' + toolName;
        break;
      }
    }

    updatedMemory = addActionToMemory(updatedMemory, toolName, args, output);
    return { success: true, output, updatedMemory };
  } catch (err: any) {
    const errMsg = err?.message || 'Unknown execution error';
    updatedMemory = addActionToMemory(updatedMemory, toolName, args, 'ERROR: ' + errMsg);
    updatedMemory.errorCount += 1;
    return { success: false, output: 'Error: ' + errMsg, updatedMemory };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
