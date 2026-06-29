import React from 'react';

interface BrainNetworkThemeProps {
  shortcuts?: Array<{ id: string; label: string; url: string; color: string }>;
}

export function BrainNetworkTheme({ shortcuts = [] }: BrainNetworkThemeProps) {
  // Use up to 6 shortcuts for the network nodes
  const displayShortcuts = shortcuts.slice(0, 6);
  const nodeClasses = ['n-l1 float-anim', 'n-l2 float-anim-alt', 'n-l3 float-anim', 'n-r1 float-anim-alt', 'n-r2 float-anim', 'n-r3 float-anim-alt'];
  
  const nodesHtml = displayShortcuts.map((s, i) => {
    const domain = new URL(s.url).hostname;
    return `
      <div class="icon-node ${nodeClasses[i]}" style="color: ${s.color}; cursor: pointer;" data-url="${s.url}" title="${s.label}">
        <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=64" alt="${s.label}" style="width: 32px; height: 32px; border-radius: 6px; object-fit: contain;">
      </div>
    `;
  }).join('\\n');

  const html = `
<div class="graphic-container">
  <div class="circles gsap-scale"></div>

  <svg class="lines-svg" viewBox="0 0 800 500">
    <path class="line-path" d="M 400 250 C 250 250, 200 120, 160 120" />
    <path class="line-path" d="M 400 250 C 250 250, 180 250, 120 250" />
    <path class="line-path" d="M 400 250 C 250 250, 200 380, 160 380" />

    <path class="line-path" d="M 400 250 C 550 250, 600 120, 640 120" />
    <path class="line-path" d="M 400 250 C 550 250, 620 250, 680 250" />
    <path class="line-path" d="M 400 250 C 550 250, 600 380, 640 380" />
    
    <path class="line-path" d="M 400 250 C 400 350, 400 450, 400 450" />
  </svg>

  <img class="brain gsap-pop float-slow" src="https://emojicdn.elk.sh/🧠" alt="Brain">

  <!-- Dynamic Shortcut Nodes -->
  ${nodesHtml}
  
  <!-- Add Node -->
  <div class="icon-node n-add float-anim" style="color: #10b981; cursor: pointer;" data-action="add" title="Add Shortcut">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
  </div>
</div>
  `;

  const css = `
    :root {
      --clay-dark-bg: #2a2a2a;
      --clay-shadow-out: 10px 15px 25px rgba(0, 0, 0, 0.15), -5px -5px 15px rgba(255, 255, 255, 0.8);
      --clay-shadow-in: inset 2px 2px 5px rgba(255, 255, 255, 0.15), inset -2px -2px 5px rgba(0, 0, 0, 0.5);
      --brain-glow: drop-shadow(0 10px 15px rgba(255, 100, 100, 0.2));
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: transparent;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    }
    .graphic-container {
      position: absolute;
      width: 100%;
      max-width: 900px;
      height: 500px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1;
    }
    .circles {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 300px; height: 300px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.02);
      box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.05);
      display: flex; justify-content: center; align-items: center;
      z-index: 1;
    }
    .circles::before {
      content: ""; width: 200px; height: 200px;
      border-radius: 50%; background: rgba(0, 0, 0, 0.03);
      box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.05); position: absolute;
    }
    .circles::after {
      content: ""; width: 100px; height: 100px;
      border-radius: 50%; background: rgba(0, 0, 0, 0.04);
      box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.05); position: absolute;
    }
    .brain {
      position: relative; z-index: 10;
      width: 60px; height: 60px;
      filter: var(--brain-glow);
      transform: translateX(2px);
    }
    .lines-svg {
      position: absolute; top: 0; left: 0;
      width: 100%; height: 100%;
      z-index: 2; pointer-events: none;
    }
    .line-path {
      fill: none; stroke: #333;
      stroke-width: 1.5; stroke-linecap: round; opacity: 0.6;
    }
    .icon-node {
      position: absolute; width: 64px; height: 64px;
      background: var(--clay-dark-bg);
      border-radius: 16px;
      display: flex; justify-content: center; align-items: center;
      box-shadow: var(--clay-shadow-out), var(--clay-shadow-in);
      z-index: 5;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .icon-node svg { width: 32px; height: 32px; }
    .n-l1 { top: 88px; left: 15%; }
    .n-l2 { top: 250px; left: 10%; transform: translateY(-50%); }
    .n-l3 { top: 348px; left: 15%; }
    .n-r1 { top: 88px; right: 15%; }
    .n-r2 { top: 250px; right: 10%; transform: translateY(-50%); }
    .n-r3 { top: 348px; right: 15%; }
    .n-add { top: 418px; left: 50%; transform: translateX(-50%); }
  `;

  const js = `
    document.addEventListener("DOMContentLoaded", () => {
      const tl = gsap.timeline();
      const paths = document.querySelectorAll(".line-path");
      paths.forEach((path) => {
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
      });

      tl.from(".gsap-scale", { scale: 0, opacity: 0, duration: 1.2, ease: "back.out(1.2)" })
        .from(".gsap-pop", { scale: 0, rotation: -30, opacity: 0, duration: 0.8, ease: "back.out(2)" }, "-=0.6")
        .to(".line-path", { strokeDashoffset: 0, duration: 1.5, ease: "power2.inOut", stagger: { amount: 0.5, from: "center" } }, "-=0.4")
        .from(".icon-node", { scale: 0, opacity: 0, duration: 0.6, stagger: 0.1, ease: "back.out(1.5)" }, "-=1.2");

      gsap.utils.toArray(".float-anim").forEach((node, i) => {
        gsap.to(node, { y: "-=8", rotation: "2", duration: 2.5 + i * 0.2, repeat: -1, yoyo: true, ease: "sine.inOut", delay: i * 0.1 });
      });

      gsap.utils.toArray(".float-anim-alt").forEach((node, i) => {
        gsap.to(node, { y: "+=8", rotation: "-2", duration: 2.8 + i * 0.2, repeat: -1, yoyo: true, ease: "sine.inOut", delay: i * 0.15 });
      });

      gsap.to(".float-slow", { y: "-=5", duration: 2, repeat: -1, yoyo: true, ease: "sine.inOut" });

      // Click handling
      document.querySelectorAll('.icon-node').forEach(node => {
        node.addEventListener('click', (e) => {
          const url = e.currentTarget.getAttribute('data-url');
          const action = e.currentTarget.getAttribute('data-action');
          if (url) {
            window.parent.postMessage({ type: 'lumo-navigate', url }, '*');
          } else if (action === 'add') {
            window.parent.postMessage({ type: 'lumo-open-settings' }, '*');
          }
        });
      });
    });
  `;

  return (
    <iframe
      title="Brain Network Wallpaper"
      srcDoc={`
        <!DOCTYPE html>
        <html>
          <head>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
            <style>${css}</style>
          </head>
          <body>
            ${html}
            <script>${js}</script>
          </body>
        </html>
      `}
      className="absolute inset-0 w-full h-full border-none z-0 pointer-events-none"
      sandbox="allow-scripts allow-same-origin"
      style={{ backgroundColor: '#f0f4f8' }}
    />
  );
}
