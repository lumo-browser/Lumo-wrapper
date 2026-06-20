/**
 * AgentPrompts — System prompt engineering for the vision-based autonomous agent.
 *
 * The agent now receives a "Set of Marks" screenshot at each step:
 *   - The screenshot shows the live webpage with red numbered [ID] tags painted
 *     over every interactable element.
 *   - The text portion of the turn contains the element list, plan status,
 *     and recent actions.
 *   - The AI can reason visually ("I can see a search box tagged [3]") and
 *     use coordinates or IDs to interact.
 */

import { type TaskMemory } from './AgentMemory';

export function buildSystemPrompt(): string {
  return `You are Lumo, an elite AI browser agent with FULL VISUAL CONTROL of a real Chromium browser.

## HOW YOU SEE THE BROWSER
Every turn you receive:
1. A SCREENSHOT of the current browser page. Red numbered tags (e.g. [3], [12]) are painted
   directly on the screenshot over every clickable/typeable element.
2. A text element list showing each tag's ID, type, text label, and (x, y) coordinates.

Use BOTH the screenshot AND the element list together to decide your next action.
- Prefer clicking by [ID] when the element list clearly identifies the element.
- Use click_at with x/y coordinates only when elements are not in the tag list.
- Use read_page_text when you need to read paragraph or article content.

## CORE CAPABILITIES
- navigate(url) — load a URL
- click(id) — click tagged element by its [ID] number shown in the screenshot
- click_at(x, y) — click at raw pixel coordinates (for elements not in the tag list)
- type_text(id, text) — type into an input field (uses native keyboard simulation)
- scroll(direction, amount) — scroll the page
- read_page_text() — read paragraph/content text
- extract_product_data(vendor) — scrape product cards from e-commerce pages
- press_key(key) — native key press (Enter, Tab, Escape, ArrowDown, etc.)
- go_back() — browser back button
- click_by_text(text) — fallback text-match click
- quiz_answer(answer) — one-shot quiz answer + Next button
- save_product(...) — save product to compare tab
- present_comparison(recommendation) — show product comparison table
- update_plan(steps) — set/update execution plan
- request_user_confirmation(action) — SAFETY GATE for irreversible actions
- done(message, success) — finish task

## CRITICAL SAFETY RULES (NEVER VIOLATE)
1. NEVER complete a purchase, payment, checkout, or form with personal/financial data
   without calling request_user_confirmation first.
2. NEVER delete accounts, change passwords, or send money without confirmation.
3. When uncertain if an action is reversible, ALWAYS call request_user_confirmation.

## VISION-FIRST STRATEGY
1. Look at the screenshot to understand the page layout and UI state.
2. Find the element you need — the red [ID] tags in the screenshot map directly to the element list.
3. Choose the correct tool and execute exactly one action per turn.
4. After the action, you will receive a new screenshot showing the updated state.

## EXECUTION RULES
- Start every task by calling update_plan with a step-by-step breakdown.
- Execute exactly ONE tool call per response.
- Examine the screenshot after each action before deciding the next step.
- If the same action fails twice, try a different approach:
  • Use click_by_text instead of click
  • Scroll to reveal hidden elements
  • Navigate directly to the target URL
  • Use go_back and try a different path

## SHOPPING / PRODUCT COMPARISON TASKS
1. Search for the product on the first vendor site
2. Use extract_product_data or save_product to record results
3. Repeat for additional vendor sites
4. Call present_comparison with your recommendation
5. Wait for user to select a product
6. Navigate to checkout
7. Call request_user_confirmation BEFORE placing any order

## QUIZ / EXAM TASKS
For EVERY question: call read_page_text → call quiz_answer(correct answer text)
Do NOT use click with raw IDs for quiz answers — always use quiz_answer.

## STOPPING
- Call done(success=true) when the goal is fully achieved.
- Call done(success=false) when all approaches are exhausted.
- Never repeat the same failing action more than 3 times.`;
}

// ── Multimodal Context Builder ─────────────────────────────────────────────

/**
 * buildVisionContextMessages
 *
 * Returns an OpenAI-compatible "user" message with:
 *   - text block: current URL, plan, element list, recent actions, error count, goal
 *   - image_url block: base64-encoded JPEG of the tagged screenshot (if available)
 *
 * This is the message appended to conversationHistory each turn in AgentSidebar.
 */
export function buildVisionContextMessages(
  currentUrl: string,
  elementText: string,
  screenshotBase64: string,
  memory: TaskMemory,
  iteration: number
): any[] {
  const textContent = buildTextContext(currentUrl, elementText, memory, iteration);

  const content: any[] = [
    { type: 'text', text: textContent },
  ];

  // Attach the screenshot if one was captured
  if (screenshotBase64) {
    content.push({
      type: 'image_url',
      image_url: {
        url: 'data:image/jpeg;base64,' + screenshotBase64,
        detail: 'high',
      },
    });
  }

  return [{ role: 'user', content }];
}

/** Builds the text portion of the context prompt */
function buildTextContext(
  currentUrl: string,
  elementText: string,
  memory: TaskMemory,
  iteration: number
): string {
  const parts: string[] = [];

  parts.push('=== BROWSER STATE (Step ' + iteration + ') ===');
  parts.push('URL: ' + currentUrl);
  parts.push('');

  if (memory.plan.length > 0) {
    parts.push('PLAN STATUS:');
    memory.plan.forEach((step) => {
      const marker =
        step.status === 'done'   ? '[DONE]' :
        step.status === 'active' ? '[NOW] ' :
        step.status === 'failed' ? '[FAIL]' :
        '[    ]';
      parts.push('  ' + marker + ' Step ' + step.id + ': ' + step.description);
    });
    parts.push('');
  }

  if (memory.extractedProducts.length > 0) {
    parts.push('SAVED PRODUCTS (' + memory.extractedProducts.length + '):');
    memory.extractedProducts.forEach((p, i) => {
      parts.push(
        '  ' + (i + 1) + '. ' + p.name +
        ' | ' + p.price +
        ' | Rating: ' + p.rating +
        ' | ' + p.vendor
      );
    });
    parts.push('');
  }

  parts.push('TAGGED ELEMENTS ON PAGE (match [ID] numbers visible in the screenshot):');
  parts.push(elementText || '(No interactable elements detected)');
  parts.push('');

  if (memory.actionHistory.length > 0) {
    const recent = memory.actionHistory.slice(-5);
    parts.push('RECENT ACTIONS:');
    recent.forEach((a) => {
      parts.push(
        '  - ' + a.tool +
        '(' + JSON.stringify(a.args).substring(0, 80) + ')' +
        ' → ' + a.result.substring(0, 100)
      );
    });
    parts.push('');
  }

  parts.push('ERRORS: ' + memory.errorCount + ' / ' + memory.maxErrors);
  parts.push('');
  parts.push('Look at the screenshot above. What is your next action to achieve: "' + memory.goal + '"?');

  return parts.join('\n');
}

// ── Legacy text-only context (kept for fallback / non-vision models) ────────

export function buildContextPrompt(
  currentUrl: string,
  domContent: string,
  memory: TaskMemory,
  iteration: number
): string {
  return buildTextContext(currentUrl, domContent, memory, iteration);
}
