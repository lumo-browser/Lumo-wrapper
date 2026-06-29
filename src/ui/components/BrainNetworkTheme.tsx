import React from 'react';

export function BrainNetworkTheme() {
  const html = `
<div class="graphic-container">
  <div class="circles gsap-scale"></div>

  <svg class="lines-svg" viewBox="0 0 800 450">
    <path class="line-path" d="M 400 225 C 250 225, 200 120, 160 120" />
    <path class="line-path" d="M 400 225 C 250 225, 180 225, 120 225" />
    <path class="line-path" d="M 400 225 C 250 225, 200 330, 160 330" />

    <path class="line-path" d="M 400 225 C 550 225, 600 120, 640 120" />
    <path class="line-path" d="M 400 225 C 550 225, 620 225, 680 225" />
    <path class="line-path" d="M 400 225 C 550 225, 600 330, 640 330" />
  </svg>

  <img class="brain gsap-pop float-slow" src="https://emojicdn.elk.sh/🧠" alt="Brain">

  <!-- YouTube -->
  <div class="icon-node n-l1 float-anim" style="color: #ef4444;">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 7.1C2.5 7.1 2.5 5 4.6 4.6 6.3 4.1 12 4.1 12 4.1s5.7 0 7.4.5c2.1.4 2.1 2.5 2.1 2.5s.4 2.2.4 4.9v1c0 2.7-.4 4.9-.4 4.9s0 2.1-2.1 2.5c-1.7.5-7.4.5-7.4.5s-5.7 0-7.4-.5c-2.1-.4-2.1-2.5-2.1-2.5S2 13.8 2 11v-1c0-2.7.4-4.9.4-4.9z"/><polygon points="9.5 15.5 16.5 11 9.5 6.5"/></svg>
  </div>
  <!-- Facebook -->
  <div class="icon-node n-l2 float-anim-alt" style="color: #3b5998;">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
  </div>
  <!-- Instagram -->
  <div class="icon-node n-l3 float-anim" style="color: #ec4899;">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
  </div>

  <!-- Twitter -->
  <div class="icon-node n-r1 float-anim-alt" style="color: #1da1f2;">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
  </div>
  <!-- Github -->
  <div class="icon-node n-r2 float-anim" style="color: #ffffff;">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
  </div>
  <!-- LinkedIn -->
  <div class="icon-node n-r3 float-anim-alt" style="color: #0077b5;">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
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
      max-width: 800px;
      height: 450px;
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
    .n-l1 { top: 20%; left: 15%; }
    .n-l2 { top: 50%; left: 10%; transform: translateY(-50%); }
    .n-l3 { bottom: 20%; left: 15%; }
    .n-r1 { top: 20%; right: 15%; }
    .n-r2 { top: 50%; right: 10%; transform: translateY(-50%); }
    .n-r3 { bottom: 20%; right: 15%; }
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
