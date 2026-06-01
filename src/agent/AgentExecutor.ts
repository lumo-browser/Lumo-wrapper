/**
 * AgentExecutor — Executes tool calls against the live webview.
 *
 * Each tool maps to a concrete browser interaction: DOM manipulation,
 * JavaScript injection, navigation, scrolling, key presses, or data
 * extraction. Returns structured results for the LLM to consume.
 *
 * The executor is stateless — all state lives in AgentMemory.
 */

import type { TaskMemory, ExtractedProduct } from './AgentMemory';
import { addProductToMemory, addActionToMemory } from './AgentMemory';

// ── Injected Scripts ────────────────────────────────────────────────────────

/**
 * Enhanced DOM extractor: reads all interactable elements, tags them visually,
 * and also captures their bounding rects and element types for richer context.
 */
export const DOM_EXTRACTOR_SCRIPT = `
  (function() {
    var elements = [];
    var idCounter = 1;

    function isVisible(el) {
      var rect = el.getBoundingClientRect();
      var style = window.getComputedStyle(el);
      return rect.width > 0 && rect.height > 0
        && style.visibility !== 'hidden'
        && style.display !== 'none'
        && parseFloat(style.opacity) > 0;
    }

    // Remove old tags
    var oldTags = document.querySelectorAll('.nova-agent-tag');
    for (var i = 0; i < oldTags.length; i++) oldTags[i].remove();

    var selectors = 'a, button, input, textarea, select, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [onclick], label[for], summary, details';
    var interactables = document.querySelectorAll(selectors);

    for (var j = 0; j < interactables.length; j++) {
      var el = interactables[j];
      if (!isVisible(el)) continue;
      var id = idCounter++;

      window.__novaAgentElements = window.__novaAgentElements || {};
      window.__novaAgentElements[id] = el;

      var text = (el.innerText || el.value || el.placeholder || el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('alt') || '').trim().substring(0, 80);
      var tagName = el.tagName.toLowerCase();
      var type = el.getAttribute('type') || '';
      var role = el.getAttribute('role') || '';
      var href = el.getAttribute('href') || '';

      var desc = '[' + id + '] <' + tagName;
      if (type) desc += ' type="' + type + '"';
      if (role) desc += ' role="' + role + '"';
      if (href && href.length < 80) desc += ' href="' + href + '"';
      desc += '> "' + text + '"';

      elements.push(desc);

      // Visual tags
      var tag = document.createElement('div');
      tag.className = 'nova-agent-tag';
      tag.textContent = String(id);
      var rect = el.getBoundingClientRect();
      tag.style.cssText = 'position:absolute;top:' + (rect.top + window.scrollY - 2) + 'px;left:' + (rect.left + window.scrollX - 2) + 'px;background:#ef4444;color:white;font-size:9px;font-weight:bold;padding:0 3px;border-radius:3px;z-index:2147483647;pointer-events:none;line-height:14px;';
      document.body.appendChild(tag);
    }

    return elements.join('\\n');
  })();
`;

/**
 * Script to read page text content (non-interactive).
 * Captures headings, paragraphs, list items, table cells, and spans.
 */
const READ_PAGE_TEXT_SCRIPT = `
  (function() {
    var selectors = 'h1, h2, h3, h4, p, li, td, th, span, label, figcaption, blockquote, .a-price, .a-size-base, [data-testid]';
    var nodes = document.querySelectorAll(selectors);
    var text = [];
    var seen = {};
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

/**
 * Script to extract structured product data from e-commerce pages.
 * Heuristic: scans common patterns used by Amazon, Flipkart, etc.
 */
function buildExtractProductScript(maxProducts: number): string {
  return `
    (function() {
      var products = [];
      // Try Amazon-style product cards
      var cards = document.querySelectorAll('[data-component-type="s-search-result"], .s-result-item, .sg-col-inner, ._1AtVbE, ._13oc-S, .product-tuple-listing, .product-base');
      if (cards.length === 0) {
        cards = document.querySelectorAll('[class*="product"], [class*="item"], [class*="card"], [class*="listing"]');
      }
      for (var i = 0; i < Math.min(cards.length, ${maxProducts}); i++) {
        var card = cards[i];
        var name = '';
        var price = '';
        var rating = '';
        var reviews = '';
        var delivery = '';

        // Name
        var nameEl = card.querySelector('h2, h3, [class*="title"], [class*="name"], .a-text-normal, ._4rR01T, .s1Q9rs');
        if (nameEl) name = nameEl.innerText.trim().substring(0, 120);
        if (!name) continue;

        // Price
        var priceEl = card.querySelector('.a-price .a-offscreen, [class*="price"], ._30jeq3, ._1_WHN1, .a-price-whole');
        if (priceEl) price = priceEl.innerText.trim().substring(0, 30);

        // Rating
        var ratingEl = card.querySelector('[class*="rating"], .a-icon-alt, ._3LWZlK');
        if (ratingEl) rating = ratingEl.innerText.trim().substring(0, 20);

        // Reviews
        var reviewEl = card.querySelector('[class*="review"], .a-size-base.s-underline-text, ._2_R_DZ span');
        if (reviewEl) reviews = reviewEl.innerText.trim().substring(0, 30);

        // Delivery
        var delivEl = card.querySelector('[class*="delivery"], [class*="shipping"], .a-text-bold .a-text-normal');
        if (delivEl) delivery = delivEl.innerText.trim().substring(0, 50);

        if (name && (price || rating)) {
          products.push({
            name: name,
            price: price || 'N/A',
            rating: rating || 'N/A',
            reviews: reviews || 'N/A',
            delivery: delivery || 'N/A'
          });
        }
      }
      return JSON.stringify(products);
    })();
  `;
}

// ── Executor ────────────────────────────────────────────────────────────────

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

      // ── Navigate ──────────────────────────────────────────────
      case 'navigate': {
        let url = args.url;
        if (url && !url.startsWith('http')) url = 'https://' + url;
        webview.loadURL(url);
        await sleep(3000);
        updatedMemory.visitedUrls = [...updatedMemory.visitedUrls, url];
        output = 'Navigated to ' + url;
        break;
      }

      // ── Click ─────────────────────────────────────────────────
      case 'click': {
        const clickId = args.id;
        await webview.executeJavaScript(
          'if(window.__novaAgentElements && window.__novaAgentElements[' + clickId + ']){' +
          'var el=window.__novaAgentElements[' + clickId + '];' +
          'el.scrollIntoView({block:"center"});' +
          'el.focus();' +
          'el.click();' +
          '}'
        );
        await sleep(2000);
        output = 'Clicked element [' + clickId + ']' + (args.description ? ' — ' + args.description : '');
        break;
      }

      // ── Type Text ─────────────────────────────────────────────
      case 'type_text': {
        const typeId = args.id;
        const text = (args.text || '').replace(/'/g, "\\'").replace(/\n/g, '\\n');
        const clearFirst = args.clear_first !== false;
        const pressEnter = args.press_enter === true;

        await webview.executeJavaScript(
          'if(window.__novaAgentElements && window.__novaAgentElements[' + typeId + ']){' +
          'var el=window.__novaAgentElements[' + typeId + '];' +
          'el.scrollIntoView({block:"center"});' +
          'el.focus();' +
          (clearFirst ? 'el.value="";' : '') +
          'el.value=\'' + text + '\';' +
          'el.dispatchEvent(new Event("input",{bubbles:true}));' +
          'el.dispatchEvent(new Event("change",{bubbles:true}));' +
          (pressEnter
            ? 'el.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",code:"Enter",keyCode:13,which:13,bubbles:true}));'
            + 'el.dispatchEvent(new KeyboardEvent("keypress",{key:"Enter",code:"Enter",keyCode:13,which:13,bubbles:true}));'
            + 'el.dispatchEvent(new KeyboardEvent("keyup",{key:"Enter",code:"Enter",keyCode:13,which:13,bubbles:true}));'
            + 'if(el.form)el.form.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));'
            : '') +
          '}'
        );
        await sleep(pressEnter ? 2500 : 500);
        output = 'Typed "' + args.text + '" into element [' + typeId + ']' + (pressEnter ? ' and pressed Enter' : '');
        break;
      }

      // ── Scroll ────────────────────────────────────────────────
      case 'scroll': {
        const amount = args.amount || 500;
        const pixels = args.direction === 'up' ? -amount : amount;
        await webview.executeJavaScript('window.scrollBy(0,' + pixels + ');');
        await sleep(500);
        output = 'Scrolled ' + args.direction + ' by ' + Math.abs(pixels) + 'px';
        break;
      }

      // ── Read Page Text ────────────────────────────────────────
      case 'read_page_text': {
        const maxLen = args.max_length || 3000;
        const rawText = await webview.executeJavaScript(READ_PAGE_TEXT_SCRIPT);
        output = (rawText || '').substring(0, maxLen);
        break;
      }

      // ── Extract Product Data ──────────────────────────────────
      case 'extract_product_data': {
        const maxProducts = args.max_products || 5;
        const vendor = args.vendor || 'Unknown';
        const rawJson = await webview.executeJavaScript(buildExtractProductScript(maxProducts));
        try {
          const products: any[] = JSON.parse(rawJson);
          products.forEach((p) => {
            updatedMemory = addProductToMemory(updatedMemory, {
              name: p.name,
              price: p.price,
              rating: p.rating,
              reviews: p.reviews,
              delivery: p.delivery,
              url: webview.getURL?.() || '',
              vendor,
            });
          });
          output = 'Extracted ' + products.length + ' products from ' + vendor + ':\n' +
            products.map((p: any, i: number) =>
              (i + 1) + '. ' + p.name + ' — ' + p.price + ' (Rating: ' + p.rating + ')'
            ).join('\n');
        } catch {
          output = 'Failed to parse product data. Raw: ' + (rawJson || '').substring(0, 300);
        }
        break;
      }

      // ── Press Key ─────────────────────────────────────────────
      case 'press_key': {
        const key = args.key || 'Enter';
        await webview.executeJavaScript(
          'document.activeElement.dispatchEvent(new KeyboardEvent("keydown",{key:"' + key + '",bubbles:true}));' +
          'document.activeElement.dispatchEvent(new KeyboardEvent("keyup",{key:"' + key + '",bubbles:true}));'
        );
        await sleep(1000);
        output = 'Pressed key: ' + key;
        break;
      }

      // ── Wait ──────────────────────────────────────────────────
      case 'wait': {
        const seconds = Math.min(Math.max(args.seconds || 1, 0.5), 10);
        await sleep(seconds * 1000);
        output = 'Waited ' + seconds + 's' + (args.reason ? ' — ' + args.reason : '');
        break;
      }

      // ── Go Back ───────────────────────────────────────────────
      case 'go_back': {
        webview.goBack();
        await sleep(2000);
        output = 'Navigated back';
        break;
      }

      // ── Request User Confirmation (CRITICAL SAFETY GATE) ─────
      case 'request_user_confirmation': {
        return {
          success: true,
          output: args.action_description,
          updatedMemory: {
            ...updatedMemory,
            requiresConfirmation: true,
            confirmationMessage: args.action_description + (args.details ? '\n\nDetails: ' + args.details : ''),
          },
          requiresConfirmation: true,
          confirmationMessage: args.action_description + (args.details ? '\n\nDetails: ' + args.details : ''),
        };
      }

      // ── Save Product ──────────────────────────────────────────
      case 'save_product': {
        updatedMemory = addProductToMemory(updatedMemory, {
          name: args.name || 'Unknown',
          price: args.price || 'N/A',
          rating: args.rating || 'N/A',
          reviews: args.reviews || 'N/A',
          delivery: args.delivery || 'N/A',
          url: args.url || '',
          vendor: args.vendor || 'Unknown',
        });
        output = 'Saved product: ' + args.name + ' (' + args.price + ') from ' + args.vendor;
        break;
      }

      // ── Present Comparison ────────────────────────────────────
      case 'present_comparison': {
        return {
          success: true,
          output: 'Presenting product comparison to user',
          updatedMemory,
          comparisonData: updatedMemory.extractedProducts,
          comparisonRecommendation: args.recommendation || '',
        };
      }

      // ── Update Plan ───────────────────────────────────────────
      case 'update_plan': {
        const steps: string[] = args.steps || [];
        const currentStep = args.current_step || 0;
        updatedMemory = {
          ...updatedMemory,
          plan: steps.map((desc, i) => ({
            id: i + 1,
            description: desc,
            status: i < currentStep ? 'done' as const : i === currentStep ? 'active' as const : 'pending' as const,
          })),
          currentStepIndex: currentStep,
        };
        output = 'Plan updated with ' + steps.length + ' steps';
        return {
          success: true,
          output,
          updatedMemory,
          planSteps: steps,
        };
      }

      // ── Done ──────────────────────────────────────────────────
      case 'done': {
        output = args.message || 'Task completed.';
        return {
          success: true,
          output,
          updatedMemory,
          isDone: true,
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
