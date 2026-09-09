/**
 * OnboardingOverlay.tsx — Lumo Browser First-Launch Welcome Page
 * Renders at lumo://welcome · No emojis · Professional animations
 */
import React, { useState } from 'react';
import {
  GitHub, Sparkles, ChevronRight, ChevronLeft,
  Shield, Search, CheckCircle2, ArrowRight, Zap, Lock,
} from 'lucide-react';

export interface OnboardingPrefs {
  searchEngine: string;
  adBlockEnabled: boolean;
  aiEnabled: boolean;
}

interface Props { onComplete: (p: OnboardingPrefs) => void; }

// ── Inline keyframes injected once ──────────────────────────────────────────
const CSS = `
@keyframes orb-a { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(40px,-30px) scale(1.08)} }
@keyframes orb-b { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-35px,25px) scale(1.06)} }
@keyframes logo-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,0)} 50%{box-shadow:0 0 60px 20px rgba(99,102,241,0.18)} }
@keyframes fade-up { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
@keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
.anim-fade-up { animation: fade-up 0.45s cubic-bezier(.4,0,.2,1) both; }
.anim-fade-up-1 { animation: fade-up 0.45s 0.08s cubic-bezier(.4,0,.2,1) both; }
.anim-fade-up-2 { animation: fade-up 0.45s 0.16s cubic-bezier(.4,0,.2,1) both; }
.anim-fade-up-3 { animation: fade-up 0.45s 0.24s cubic-bezier(.4,0,.2,1) both; }
.shimmer-text {
  background: linear-gradient(90deg,#818cf8,#a78bfa,#60a5fa,#818cf8);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 4s linear infinite;
}
`;

const SEARCH_ENGINES = [
  { id: 'google',     name: 'Google',       desc: 'Most popular'  },
  { id: 'duckduckgo', name: 'DuckDuckGo',   desc: 'Privacy-first' },
  { id: 'bing',       name: 'Bing',         desc: 'Microsoft AI'  },
  { id: 'brave',      name: 'Brave Search', desc: 'Independent'   },
  { id: 'ecosia',     name: 'Ecosia',       desc: 'Plant trees'   },
];

const PILL_BTN = 'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:scale-[1.04]';
const PRIMARY_BTN = 'w-full py-3.5 px-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-xl shadow-indigo-700/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5';
const SKIP_BTN = 'text-xs text-gray-600 hover:text-gray-300 transition-colors mt-1';
const CARD = 'flex items-center justify-between bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-4 hover:border-white/[0.14] transition-colors';

// ── Step 1 ────────────────────────────────────────────────────────────────────
function StepDefault({ onNext }: { onNext: () => void }) {
  const [done, setDone] = useState(false);
  const handle = () => {
    (window as any).electron?.invoke?.('lumo:set-default-browser').catch(() => {});
    setDone(true);
    setTimeout(onNext, 900);
  };
  return (
    <div className="flex flex-col items-center text-center gap-8 max-w-md w-full">
      {/* Animated logo */}
      <div className="relative anim-fade-up">
        <div style={{ animation: 'logo-pulse 3s ease-in-out infinite' }}
          className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-700 flex items-center justify-center shadow-2xl">
          <span className="text-white text-5xl font-black tracking-tighter select-none">N</span>
        </div>
        <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/40">
          <GitHub size={18} className="text-white" />
        </div>
      </div>

      <div className="space-y-3 anim-fade-up-1">
        <h1 className="text-4xl font-black tracking-tight text-white">
          Welcome to <span className="shimmer-text">Lumo Browser</span>
        </h1>
        <p className="text-gray-400 text-base leading-relaxed">
          The AI-native browser engineered for speed, privacy, and intelligence.<br />
          Let's get you set up in three quick steps.
        </p>
      </div>

      {/* Feature tags */}
      <div className="flex flex-wrap justify-center gap-2 anim-fade-up-2">
        {[
          { icon: Shield,   label: 'Ad Blocking',  c: 'text-emerald-400 bg-emerald-400/8 border-emerald-400/20' },
          { icon: Sparkles, label: 'Lumo AI',       c: 'text-blue-400 bg-blue-400/8 border-blue-400/20' },
          { icon: Lock,     label: 'Private',       c: 'text-violet-400 bg-violet-400/8 border-violet-400/20' },
          { icon: Zap,      label: 'Blazing Fast',  c: 'text-amber-400 bg-amber-400/8 border-amber-400/20' },
        ].map(({ icon: I, label, c }) => (
          <span key={label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${c}`}>
            <I size={11} /> {label}
          </span>
        ))}
      </div>

      <div className="flex flex-col items-center gap-2.5 w-full max-w-xs anim-fade-up-3">
        {done
          ? <p className="flex items-center gap-2 text-emerald-400 font-medium text-sm"><CheckCircle2 size={18} /> Lumo is now your default browser</p>
          : <>
              <button onClick={handle} className={PRIMARY_BTN}><Globe size={17} /> Set Lumo as Default Browser</button>
              <button onClick={onNext} className={SKIP_BTN}>Skip for now</button>
            </>
        }
      </div>
    </div>
  );
}


// ── Step 3 ────────────────────────────────────────────────────────────────────
function StepPersonalize({ prefs, setPrefs, onFinish }: {
  prefs: OnboardingPrefs;
  setPrefs: React.Dispatch<React.SetStateAction<OnboardingPrefs>>;
  onFinish: () => void;
}) {
  const toggle = (key: keyof OnboardingPrefs) =>
    setPrefs(p => ({ ...p, [key]: !p[key as 'adBlockEnabled' | 'aiEnabled'] }));

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button onClick={onToggle}
      className={`relative flex-shrink-0 w-11 h-[22px] rounded-full transition-all duration-300 ${on ? 'bg-indigo-500 shadow-md shadow-indigo-500/40' : 'bg-white/10'}`}>
      <span className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] bg-white rounded-full shadow transition-transform duration-300 ${on ? 'translate-x-[22px]' : 'translate-x-0'}`} />
    </button>
  );

  return (
    <div className="flex flex-col items-center text-center gap-6 max-w-lg w-full">
      <div className="space-y-2 anim-fade-up">
        <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-1">
          <Sparkles size={26} className="text-violet-400" />
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight">Configure Your Experience</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          These preferences can be changed anytime in Settings.
        </p>
      </div>

      <div className="flex flex-col gap-2.5 w-full anim-fade-up-1">
        {/* Adblocker */}
        <div className={CARD}>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Shield size={18} className="text-emerald-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Rust Adblocker</p>
              <p className="text-xs text-gray-500 mt-0.5">Native-speed ad and tracker blocking</p>
            </div>
          </div>
          <Toggle on={prefs.adBlockEnabled} onToggle={() => toggle('adBlockEnabled')} />
        </div>

        {/* AI */}
        <div className={CARD}>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Sparkles size={18} className="text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Lumo AI Space</p>
              <p className="text-xs text-gray-500 mt-0.5">Summarize, translate, and ask on any page</p>
            </div>
          </div>
          <Toggle on={prefs.aiEnabled} onToggle={() => toggle('aiEnabled')} />
        </div>

        {/* Search engine */}
        <div className={`${CARD} flex-col items-start gap-3`}>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Search size={18} className="text-amber-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Default Search Engine</p>
              <p className="text-xs text-gray-500 mt-0.5">Used in the address bar</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pl-1">
            {SEARCH_ENGINES.map(se => (
              <button key={se.id} onClick={() => setPrefs(p => ({ ...p, searchEngine: se.id }))}
                className={`${PILL_BTN} ${prefs.searchEngine === se.id
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-white/[0.05] text-gray-400 hover:text-white border border-white/[0.08]'}`}>
                <span className="font-medium">{se.name}</span>
                <span className="text-[10px] opacity-60">{se.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button onClick={onFinish} className={`${PRIMARY_BTN} max-w-xs anim-fade-up-2`}>
        <Zap size={17} /> Launch Lumo Browser <ArrowRight size={15} />
      </button>
    </div>
  );
}

// ── Step meta ─────────────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Default Browser', icon: GitHub     },
  { label: 'Personalize',     icon: Sparkles  },
];

// ── Main ──────────────────────────────────────────────────────────────────────
export function WelcomePage({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [dir, setDir] = useState<'fwd' | 'bk'>('fwd');
  const [prefs, setPrefs] = useState<OnboardingPrefs>({ searchEngine: 'google', adBlockEnabled: true, aiEnabled: true });

  const goTo = (n: number, d: 'fwd' | 'bk') => {
    if (animating) return;
    setAnimating(true); setDir(d);
    setTimeout(() => { setStep(n); setAnimating(false); }, 260);
  };

  const next = () => step < 1 && goTo(step + 1, 'fwd');
  const back = () => step > 0 && goTo(step - 1, 'bk');
  const finish = () => {
    localStorage.setItem('lumo-onboarding', JSON.stringify({ complete: true, v: '1' }));
    onComplete(prefs);
  };

  const slide: React.CSSProperties = {
    opacity: animating ? 0 : 1,
    transform: animating ? (dir === 'fwd' ? 'translateX(32px) scale(0.97)' : 'translateX(-32px) scale(0.97)') : 'translateX(0) scale(1)',
    transition: 'all 0.26s cubic-bezier(.4,0,.2,1)',
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-[#080810] text-white select-none" style={{ fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
      <style>{CSS}</style>

      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div style={{ animation: 'orb-a 12s ease-in-out infinite' }}
          className="absolute -top-40 -left-40 w-[640px] h-[640px] bg-indigo-600/10 rounded-full blur-[130px]" />
        <div style={{ animation: 'orb-b 14s ease-in-out infinite' }}
          className="absolute -bottom-40 -right-40 w-[640px] h-[640px] bg-violet-600/10 rounded-full blur-[130px]" />
        {/* Fine grid */}
        <div className="absolute inset-0" style={{
          opacity: 0.025,
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
        {/* Radial vignette */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 40%, #080810 100%)',
        }} />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-1.5">
          <GitHub size={12} className="text-indigo-400" />
          <span className="text-xs text-gray-500 font-mono tracking-wide">lumo://welcome</span>
          <Lock size={10} className="text-emerald-400 ml-1" />
        </div>

        <div className="flex items-center gap-1.5">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step, active = i === step;
            return (
              <React.Fragment key={i}>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-300 ${
                  active ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                  : done  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-white/[0.04] text-gray-700 border border-transparent'}`}>
                  {done ? <CheckCircle2 size={11} /> : <Icon size={11} />}
                  <span className="hidden md:inline">{s.label}</span>
                </div>
                {i < 2 && <ChevronRight size={12} className={done ? 'text-emerald-600/40' : 'text-white/10'} />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 h-px bg-white/[0.04]">
        <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 ease-out"
          style={{ width: `${((step + 1) / 2) * 100}%` }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-8 py-6 overflow-hidden">
        <div style={slide} className="w-full flex items-center justify-center">
          {step === 0 && <StepDefault onNext={next} />}
          {step === 1 && <StepPersonalize prefs={prefs} setPrefs={setPrefs} onFinish={finish} />}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="relative z-10 flex items-center justify-between px-8 py-4 border-t border-white/[0.05]">
        <button onClick={back} disabled={step === 0}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-200 disabled:opacity-0 disabled:pointer-events-none transition-all duration-150">
          <ChevronLeft size={14} /> Back
        </button>

        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all duration-400 ${
              i === step ? 'w-7 bg-gradient-to-r from-indigo-500 to-violet-500'
              : i < step  ? 'w-2 bg-emerald-500/70'
                          : 'w-2 bg-white/10'}`} />
          ))}
        </div>

        {step < 1
          ? <button onClick={next} className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-200 font-medium transition-colors">
              Next <ChevronRight size={14} />
            </button>
          : <div className="w-12" />}
      </div>

      {/* Version */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-gray-800 font-mono pointer-events-none tracking-widest uppercase">
        Lumo Browser · v0.2.0
      </div>
    </div>
  );
}
