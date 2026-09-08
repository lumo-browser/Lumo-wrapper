(function () {
  if (!window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);

  // ─── INITIAL STATES ───
  gsap.set(".header > *", {
    y: -20,
    opacity: 0
  });
  gsap.set(".eyebrow", {
    y: 12,
    opacity: 0
  });
  gsap.set(".title .word", {
    yPercent: 110,
    opacity: 0
  });
  gsap.set(".title-desc", {
    opacity: 0,
    x: -10
  });
  gsap.set(".paren-group .paren", {
    scale: 0,
    opacity: 0
  });
  gsap.set(".avatar-group", {
    scale: 0,
    opacity: 0
  });
  gsap.set(".dna-icon", {
    scale: 0,
    rotation: -45,
    opacity: 0
  });
  gsap.set(".future-tag", {
    opacity: 0,
    x: -10
  });
  gsap.set(".badge", {
    scale: 0,
    rotation: -90,
    opacity: 0
  });
  gsap.set(".res-item", {
    y: 16,
    opacity: 0
  });
  gsap.set(".wave-wrap", {
    x: 120,
    opacity: 0
  });
  gsap.set(".wave-glow", {
    opacity: 0
  });
  gsap.set(".bg-text", {
    opacity: 0,
    scale: 1.1
  });
  // ─── PAGE LOAD TIMELINE ───
  const tl = gsap.timeline({
    defaults: {
      ease: "power3.out"
    },
    delay: 0.15
  });
  tl.to(".header > *", {
    y: 0,
    opacity: 1,
    duration: 0.7,
    stagger: 0.07
  })
    .to(
      ".wave-glow",
      {
        opacity: 1,
        duration: 1.2
      },
      "-=.5"
    )
    .to(
      ".wave-wrap",
      {
        x: 0,
        opacity: 1,
        duration: 1.4,
        ease: "power3.out"
      },
      "-=1.2"
    )
    .to(
      ".bg-text",
      {
        opacity: 1,
        scale: 1,
        duration: 1.4,
        ease: "power3.out"
      },
      "-=1.2"
    )
    .to(
      ".eyebrow",
      {
        y: 0,
        opacity: 1,
        duration: 0.5
      },
      "-=1"
    )
    .to(
      ".title .word",
      {
        yPercent: 0,
        opacity: 1,
        duration: 0.9,
        stagger: 0.05,
        ease: "power4.out"
      },
      "-=.8"
    )
    .to(
      ".title-desc",
      {
        x: 0,
        opacity: 1,
        duration: 0.6
      },
      "-=.5"
    )
    .to(
      ".paren-group .paren",
      {
        scale: 1,
        opacity: 1,
        duration: 0.5,
        stagger: 0.1,
        ease: "back.out(2)"
      },
      "-=.45"
    )
    .to(
      ".avatar-group",
      {
        scale: 1,
        opacity: 1,
        duration: 0.6,
        ease: "back.out(1.7)"
      },
      "-=.3"
    )
    .to(
      ".dna-icon",
      {
        scale: 1,
        rotation: 0,
        opacity: 1,
        duration: 0.6,
        ease: "back.out(1.7)"
      },
      "-=.4"
    )
    .to(
      ".future-tag",
      {
        x: 0,
        opacity: 1,
        duration: 0.5
      },
      "-=.3"
    )
    .to(
      ".badge",
      {
        scale: 1,
        rotation: 0,
        opacity: 1,
        duration: 0.8,
        ease: "back.out(1.7)"
      },
      "-=.5"
    )
    .to(
      ".res-item",
      {
        y: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.08
      },
      "-=.4"
    );
  // ─── WAVE FLOAT (gentle continuous) ───
  gsap.to(".wave-wrap", {
    y: -18,
    rotation: -1.2,
    duration: 5.5,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut"
  });
  gsap.to(".wave-glow", {
    y: 12,
    scale: 1.05,
    duration: 6,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut"
  });
  gsap.to(".wave-glow.b", {
    y: -16,
    x: -10,
    duration: 7,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut"
  });
  // Badge slow drift
  gsap.to(".badge", {
    y: "+=8",
    duration: 3.5,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut"
  });
  // DNA icon gentle rotate cycle
  gsap.to(".dna-icon svg", {
    rotation: 12,
    duration: 4,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
    transformOrigin: "50% 50%"
  });
  // People image breathing
  gsap.to(".avatar-group", {
    rotation: 3,
    duration: 3,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut"
  });
  // ─── SCROLL PARALLAX ───
  gsap.to(".wave-wrap", {
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: "+=1200",
      scrub: 1.2
    },
    y: -240,
    rotation: 6,
    scale: 1.08
  });
  gsap.to(".bg-text", {
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: "+=1000",
      scrub: 1.2
    },
    xPercent: -8,
    opacity: 0.5
  });
  gsap.to(".badge", {
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: "+=800",
      scrub: 1.5
    },
    y: 80,
    rotation: 30
  });
  // ─── SCROLL REVEALS ───
  gsap.utils.toArray(".reveal").forEach((el) => {
    gsap.fromTo(
      el,
      {
        y: 50,
        opacity: 0
      },
      {
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          once: true
        },
        y: 0,
        opacity: 1,
        duration: 0.9,
        ease: "power3.out"
      }
    );
  });
  // ─── INTERACTIVE: WAVE MOUSE PARALLAX ───
  if (!window.matchMedia("(pointer: coarse)").matches) {
    document.addEventListener("mousemove", (e) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      gsap.to(".wave-wrap", {
        x: x * 30,
        duration: 1.2,
        ease: "power3.out",
        overwrite: "auto"
      });
      gsap.to(".wave-glow", {
        x: x * 60,
        y: y * 40,
        duration: 1.4,
        ease: "power3.out",
        overwrite: "auto"
      });
      gsap.to(".badge", {
        x: x * -16,
        y: y * -10,
        duration: 1.2,
        ease: "power3.out",
        overwrite: "auto"
      });
      gsap.to(".bg-text", {
        x: x * -20,
        duration: 1.4,
        ease: "power3.out",
        overwrite: "auto"
      });
    });
  }
  // ─── CARD HOVER MICRO ───
  document.querySelectorAll(".clay-card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(card, {
        rotateY: x * 4,
        rotateX: -y * 4,
        duration: 0.5,
        ease: "power2.out",
        transformPerspective: 900
      });
    });
    card.addEventListener("mouseleave", () => {
      gsap.to(card, {
        rotateY: 0,
        rotateX: 0,
        duration: 0.7,
        ease: "elastic.out(1,.6)"
      });
    });
  });
  // ─── HEADER NAV PILL: animated indicator ───
  const pills = document.querySelectorAll(".nav-pill");
  pills.forEach((p) => {
    p.addEventListener("click", (e) => {
      e.preventDefault();
      pills.forEach((x) => x.classList.remove("active"));
      p.classList.add("active");
      const targetId = p.getAttribute("href");
      if (targetId && targetId !== "#") {
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
          window.scrollTo({
            top: targetSection.offsetTop - 80,
            behavior: "smooth"
          });
        }
      }
    });
  });
  // Magnetic effect on header CTA
  const cta = document.querySelector(".header-cta");
  if (cta && !window.matchMedia("(pointer: coarse)").matches) {
    cta.addEventListener("mousemove", (e) => {
      const r = cta.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) / r.width;
      const y = (e.clientY - r.top - r.height / 2) / r.height;
      gsap.to(cta, {
        x: x * 6,
        y: y * 6,
        duration: 0.4,
        ease: "power2.out"
      });
    });
    cta.addEventListener("mouseleave", () => {
      gsap.to(cta, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: "elastic.out(1,.5)"
      });
    });
  }
  // Resource list: change active on click
  const resItems = document.querySelectorAll(".res-item");
  resItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      resItems.forEach((r) => r.classList.remove("active"));
      item.classList.add("active");
    });
  });
})();

// ─── THEME TOGGLE ───
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.querySelector(".theme-toggle");
  const toggleIcon = toggleBtn.querySelector("i");
  
  const currentTheme = localStorage.getItem("theme");
  if (currentTheme) {
    document.documentElement.setAttribute("data-theme", currentTheme);
    if (currentTheme === "dark") {
      toggleIcon.classList.replace("ph-moon", "ph-sun");
    }
  }

  toggleBtn.addEventListener("click", () => {
    let theme = "light";
    if (document.documentElement.getAttribute("data-theme") !== "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      theme = "dark";
      toggleIcon.classList.replace("ph-moon", "ph-sun");
    } else {
      document.documentElement.removeAttribute("data-theme");
      toggleIcon.classList.replace("ph-sun", "ph-moon");
    }
    localStorage.setItem("theme", theme);
  });
});

// ─── INTERACTIVE COMPARISON SLIDER ───
function initSlider() {
  try {
    const range = document.getElementById("comp-range");
    const topLayer = document.getElementById("comp-layer-top");
    const handle = document.getElementById("comp-handle");
    const tabs = document.querySelectorAll(".comp-tab");
    const desc = document.getElementById("comp-desc");
    const descText = desc ? desc.querySelector("p") : null;

    const tabData = {
      chrome: {
        text: "When it comes to privacy and performance, Chrome lags far behind Lumo.",
        compName: "Chrome / Competitor",
        adColor: "#ea4335",
        trackers: "42",
        load: "4.2s"
      },
      firefox: {
        text: "Once widely used, Firefox has slipped to the middle of the pack as a Big Tech alternative.",
        compName: "Firefox",
        adColor: "#ff9500",
        trackers: "18",
        load: "2.8s"
      },
      google: {
        text: "The world's most popular search sucks up user data, prioritizing ads over answers.",
        compName: "Google Search",
        adColor: "#4285f4",
        trackers: "30",
        load: "3.5s"
      },
      ddg: {
        text: "An \"alternative\" search engine that's actually powered by Microsoft Bing.",
        compName: "DuckDuckGo",
        adColor: "#de5833",
        trackers: "8",
        load: "1.9s"
      }
    };

    // Slider Logic
    if (range && topLayer && handle) {
      range.addEventListener("input", (e) => {
        const val = e.target.value;
        topLayer.style.clipPath = `inset(0 ${100 - val}% 0 0)`;
        handle.style.left = `${val}%`;
      });
    }

    // Tab Logic
    if (tabs.length > 0) {
      tabs.forEach(tab => {
        tab.addEventListener("click", () => {
          tabs.forEach(t => t.classList.remove("active"));
          tab.classList.add("active");
          
          const target = tab.getAttribute("data-target");
          const data = tabData[target];
          if (data && descText) {
            descText.innerText = data.text;
            const compBody = document.querySelector(".chrome-ui .fake-browser-body");
            if (compBody) {
              const h2 = compBody.querySelector("h2");
              if (h2) h2.innerText = data.compName;
              
              const adBlocks = compBody.querySelectorAll(".ad-block");
              adBlocks.forEach(ad => {
                ad.style.borderColor = data.adColor;
                ad.style.color = data.adColor;
                ad.style.backgroundColor = `rgba(0,0,0,0.02)`;
              });
              
              const p1 = compBody.querySelector("p:nth-of-type(1) b");
              if(p1) p1.innerText = data.trackers;
              const p2 = compBody.querySelector("p:nth-of-type(2) b");
              if(p2) p2.innerText = data.load;
            }
            
            if (range) {
              range.value = 50;
              range.dispatchEvent(new Event('input'));
            }
          }
        });
      });
    }
  } catch (err) {
    console.error("Slider Init Error: ", err);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSlider);
} else {
  initSlider();
}
