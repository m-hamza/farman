import React, { useEffect, useRef, useState } from "react";
import { useStore } from "./store";
import type { SignKey } from "./data";

/* ================================ Icons ================================ */

const P: Record<string, React.ReactNode> = {
  home: <><path d="M3 10.8 12 3l9 7.8" /><path d="M5.5 9.5V21h13V9.5" /><path d="M9.5 21v-6h5v6" /></>,
  exam: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V2.5h6V4" /><path d="m9 13.5 2.2 2.2L15.5 11" /></>,
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></>,
  chart: <><path d="M4 20v-7" /><path d="M10 20V4" /><path d="M16 20v-10" /><path d="M2.5 20h19" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 21c1.3-3.8 4.4-5.5 7.5-5.5s6.2 1.7 7.5 5.5" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7.5a4 4 0 0 1 8 0V11" /></>,
  check: <path d="m4.5 12.5 5 5L20 6.5" />,
  x: <><path d="M5 5l14 14" /><path d="M19 5 5 19" /></>,
  star: <path d="m12 3 2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 16.9 6.4 20l1.3-6.2L3 9.5l6.3-.7Z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.2 2" /></>,
  shield: <path d="M12 3l7 3v6c0 4.6-3 7.6-7 9-4-1.4-7-4.4-7-9V6Z" />,
  gear: <><circle cx="12" cy="12" r="3.2" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5 5l2.1 2.1M16.9 16.9 19 19M19 5l-2.1 2.1M7.1 16.9 5 19" /></>,
  out: <><path d="M14 4h5v16h-5" /><path d="m10 8-4 4 4 4" /><path d="M6 12h9" /></>,
  chevL: <path d="m14 6-6 6 6 6" />,
  chevR: <path d="m10 6 6 6-6 6" />,
  phone: <path d="M5 3h4l1.5 5L8 10a13 13 0 0 0 6 6l2-2.5 5 1.5v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2Z" />,
  key: <><circle cx="8" cy="15.5" r="4" /><path d="M11.5 12.5 20 4" /><path d="m15.5 8.5 2.5 2.5" /><path d="M18 6l2 2" /></>,
  alert: <><path d="M12 3 22 21H2Z" /><path d="M12 10v4.5" /><path d="M12 18h.01" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 7.5h.01" /></>,
  crown: <path d="m3 8 4.5 4L12 5l4.5 7L21 8l-1.5 11.5h-15Z" />,
  flag: <><path d="M5 21V4" /><path d="M5 4c4-2.2 7 2.2 14 0v10c-7 2.2-10-2.2-14 0" /></>,
  wrench: <path d="M14.7 6.3a4.2 4.2 0 0 0-5.5 5.5L3 18l3 3 6.2-6.2a4.2 4.2 0 0 0 5.5-5.5L15 12l-3-3Z" />,
  heart: <path d="M12 21C7 16.6 3 13.4 3 9.1a4.6 4.6 0 0 1 9-1 4.6 4.6 0 0 1 9 1c0 4.3-4 7.5-9 11.9Z" />,
  sign: <path d="M8 3h8l5 5v8l-5 5H8l-5-5V8Z" />,
  zap: <path d="M13 2 4 14h6l-1 8 9-12h-6Z" />,
  db: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" /><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></>,
  upload: <><path d="M12 16V4" /><path d="m6 10 6-6 6 6" /><path d="M4 20h16" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
  trash: <><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="m6 7 1 14h10l1-14" /><path d="M10 11v6M14 11v6" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  edit: <path d="m4 20 1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19Z" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.5-4.5" /></>,
  wallet: <><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18" /><path d="M15.5 15h2.5" /></>,
  refresh: <><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" /><path d="M3 21v-5h5" /></>,
  users: <><circle cx="9" cy="8.5" r="3.5" /><path d="M2 20c1-3.5 4-5 7-5s6 1.5 7 5" /><path d="M16.5 5.5a3.5 3.5 0 0 1 0 6.5" /><path d="M18 15.5c2 .7 3.4 2.2 4 4.5" /></>,
  wheel: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2.6" /><path d="M12 14.6V21" /><path d="m3.4 10.4 6.2 2" /><path d="m20.6 10.4-6.2 2" /></>,
  arrowf: <><path d="M19 12H5" /><path d="m11 6-6 6 6 6" /></>,
  doc: <><path d="M6 3h8l4 4v14H6Z" /><path d="M14 3v5h4" /><path d="M9 13h6M9 17h4" /></>,
  play: <path d="m7 4 13 8-13 8Z" />,
  minus: <path d="M5 12h14" />,
  ban: <><circle cx="12" cy="12" r="9" /><path d="m5.5 5.5 13 13" /></>,
  spark: <path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8Z" />,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" /></>,
  award: <><circle cx="12" cy="9" r="5" /><path d="m8.7 13.3-1.7 8.2 5-3 5 3-1.7-8.2" /></>,
  list: <><path d="M8.5 6h12M8.5 12h12M8.5 18h12" /><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></>,
  filter: <path d="M3 5h18l-7 8v6l-4 2v-8Z" />,
  send: <><path d="M22 2 11 13" /><path d="M22 2l-7 20-4-9-9-4Z" /></>,
  menu: <><path d="M4 7h16" /><path d="M4 12h10" /><path d="M4 17h16" /></>,
  bell: <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 19a2.2 2.2 0 0 0 4 0" /></>,
  wifi: <><path d="M3 9.5a13 13 0 0 1 18 0" /><path d="M6.5 13a8 8 0 0 1 11 0" /><path d="M10 16.5a3.5 3.5 0 0 1 4 0" /><path d="M12 20h.01" /></>,
  batt: <><rect x="3" y="8" width="16" height="9" rx="2" /><path d="M21 11v3" /><path d="M6 11v3M9 11v3M12 11v3" /></>,
  signal: <><path d="M4 18v-2" /><path d="M9 18v-5" /><path d="M14 18V9" /><path d="M19 18V4" /></>,
  headset: <><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /><path d="M20 20a3 3 0 0 1-3 2h-3" /></>,
  calendar: <><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M8 3v4M16 3v4" /><path d="M4 10h16" /></>,
  arrowd: <path d="m6 9 6 6 6-6" />,
};

export function Ic({ n, s = 20, c = "" }: { n: string; s?: number; c?: string }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={c} aria-hidden>
      {P[n]}
    </svg>
  );
}

/* ================================ Traffic Signs ================================ */

export function TrafficSign({ k, size = 88 }: { k: SignKey; size?: number }) {
  const s = size;
  const common = { width: s, height: s, viewBox: "0 0 100 100" } as const;
  switch (k) {
    case "stop":
      return (
        <svg {...common}>
          <polygon points="30,6 70,6 94,30 94,70 70,94 30,94 6,70 6,30" fill="#c8102e" stroke="#fff" strokeWidth="5" />
          <text x="50" y="60" textAnchor="middle" fontSize="30" fontWeight="800" fill="#fff" fontFamily="Vazirmatn">ایست</text>
        </svg>
      );
    case "yield":
      return (
        <svg {...common}>
          <polygon points="50,92 6,14 94,14" fill="#fff" stroke="#c8102e" strokeWidth="10" strokeLinejoin="round" />
        </svg>
      );
    case "noentry":
      return (
        <svg {...common}>
          <circle cx="50" cy="50" r="44" fill="#c8102e" stroke="#fff" strokeWidth="4" />
          <rect x="22" y="44" width="56" height="12" rx="3" fill="#fff" />
        </svg>
      );
    case "speedlimit":
      return (
        <svg {...common}>
          <circle cx="50" cy="50" r="44" fill="#fff" stroke="#c8102e" strokeWidth="9" />
          <text x="50" y="64" textAnchor="middle" fontSize="38" fontWeight="800" fill="#1a2734" fontFamily="Vazirmatn">۶۰</text>
        </svg>
      );
    case "parking":
      return (
        <svg {...common}>
          <rect x="10" y="10" width="80" height="80" rx="10" fill="#2563a0" stroke="#fff" strokeWidth="4" />
          <text x="50" y="70" textAnchor="middle" fontSize="52" fontWeight="800" fill="#fff" fontFamily="Vazirmatn">P</text>
        </svg>
      );
    case "noovertake":
      return (
        <svg {...common}>
          <circle cx="50" cy="50" r="44" fill="#fff" stroke="#c8102e" strokeWidth="9" />
          <rect x="22" y="38" width="24" height="24" rx="7" fill="#c8102e" />
          <rect x="54" y="38" width="24" height="24" rx="7" fill="#1a2734" />
        </svg>
      );
    case "roundabout":
      return (
        <svg {...common}>
          <circle cx="50" cy="50" r="44" fill="#2563a0" stroke="#fff" strokeWidth="4" />
          <circle cx="50" cy="50" r="20" fill="none" stroke="#fff" strokeWidth="7" />
          <polygon points="50,22 42,34 58,34" fill="#fff" />
          <polygon points="22,56 34,48 34,64" fill="#fff" transform="rotate(120 50 50)" />
          <polygon points="22,56 34,48 34,64" fill="#fff" transform="rotate(240 50 50)" />
        </svg>
      );
    case "school":
      return (
        <svg {...common}>
          <polygon points="50,8 96,88 4,88" fill="#fff" stroke="#c8102e" strokeWidth="8" strokeLinejoin="round" />
          <circle cx="41" cy="46" r="5" fill="#1a2734" /><circle cx="59" cy="46" r="5" fill="#1a2734" />
          <path d="M41 54 v14 m0 -8 h-6 m6 8 v10 m0 -10 h6 v-6" stroke="#1a2734" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M59 54 v14 m0 -8 h6 m-6 8 v10 m0 -10 h-6 v-6" stroke="#1a2734" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      );
    case "pedestrian":
      return (
        <svg {...common}>
          <rect x="10" y="10" width="80" height="80" rx="10" fill="#2563a0" stroke="#fff" strokeWidth="4" />
          <polygon points="50,22 82,78 18,78" fill="#fff" />
          <circle cx="50" cy="42" r="4.5" fill="#1a2734" />
          <path d="M50 48 v12 m0 -7 h-5 m5 7 l-6 12 m6 -12 l6 12" stroke="#1a2734" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      );
    case "oneway":
      return (
        <svg {...common}>
          <rect x="14" y="30" width="72" height="40" rx="6" fill="#2563a0" stroke="#fff" strokeWidth="3" />
          <polygon points="26,50 56,38 56,45 76,45 76,55 56,55 56,62" fill="#fff" transform="rotate(180 51 50)" />
        </svg>
      );
    case "rail":
      return (
        <svg {...common}>
          <polygon points="50,8 96,88 4,88" fill="#fff" stroke="#c8102e" strokeWidth="8" strokeLinejoin="round" />
          <rect x="34" y="44" width="32" height="26" rx="5" fill="#1a2734" />
          <rect x="39" y="49" width="9" height="8" rx="2" fill="#fff" /><rect x="52" y="49" width="9" height="8" rx="2" fill="#fff" />
          <circle cx="42" cy="64" r="2.5" fill="#ffc21c" /><circle cx="58" cy="64" r="2.5" fill="#ffc21c" />
          <path d="M30 76h40" stroke="#1a2734" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case "nostop":
      return (
        <svg {...common}>
          <circle cx="50" cy="50" r="44" fill="#2563a0" stroke="#c8102e" strokeWidth="9" />
          <path d="M22 22 78 78 M78 22 22 78" stroke="#c8102e" strokeWidth="9" strokeLinecap="round" />
        </svg>
      );
    case "horn":
      return (
        <svg {...common}>
          <circle cx="50" cy="50" r="44" fill="#2563a0" stroke="#fff" strokeWidth="4" />
          <polygon points="30,44 52,32 52,68 30,56" fill="#fff" />
          <rect x="22" y="44" width="8" height="12" rx="2" fill="#fff" />
          <path d="M62 38a14 14 0 0 1 0 24 M70 30a24 24 0 0 1 0 40" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" />
        </svg>
      );
  }
}

/* ================================ UI Primitives ================================ */

export function Btn({ v = "brand", sm, full, className = "", children, ...rest }:
  React.ButtonHTMLAttributes<HTMLButtonElement> & { v?: "brand" | "ink" | "ghost" | "danger" | "outline" | "pass"; sm?: boolean; full?: boolean }) {
  const base = "inline-flex items-center justify-center gap-2 font-bold transition-all duration-200 active:scale-[0.97] disabled:opacity-45 disabled:pointer-events-none select-none";
  const size = sm ? "text-[13px] px-3.5 py-2 rounded-lg" : "text-[15px] px-5 py-3 rounded-xl";
  const variants: Record<string, string> = {
    brand: "bg-brand text-brandink hover:bg-brand2 shadow-[0_6px_18px_-6px_rgba(217,154,0,0.55)]",
    ink: "bg-asphalt text-white hover:bg-asphalt2 shadow-[0_6px_18px_-8px_rgba(16,27,38,0.6)]",
    ghost: "text-inksoft hover:bg-mist2 bg-transparent",
    outline: "border border-line bg-paper text-ink hover:border-asphalt3 hover:bg-mist",
    danger: "bg-failsoft text-fail hover:bg-fail hover:text-white",
    pass: "bg-pass text-white hover:brightness-110 shadow-[0_6px_18px_-8px_rgba(15,143,91,0.6)]",
  };
  return (
    <button className={`${base} ${size} ${variants[v]} ${full ? "w-full" : ""} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Card({ className = "", children, onClick }: { className?: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`bg-paper border border-line rounded-2xl shadow-card ${onClick ? "cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pop" : ""} ${className}`}>
      {children}
    </div>
  );
}

export function Chip({ tone = "#5b6472", soft = "#e9edf1", children, className = "" }: { tone?: string; soft?: string; children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-full ${className}`}
      style={{ color: tone, background: soft }}>
      {children}
    </span>
  );
}

export function Modal({ open, onClose, title, children, w = "max-w-lg" }:
  { open: boolean; onClose: () => void; title?: React.ReactNode; children: React.ReactNode; w?: string }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-asphalt/60 backdrop-blur-[3px] anim-in" onClick={onClose} />
      <div className={`relative ${w} w-full bg-paper rounded-t-3xl sm:rounded-2xl shadow-pop anim-pop max-h-[92vh] overflow-y-auto`}>
        <div className="sticky top-0 bg-paper/95 backdrop-blur border-b border-line px-5 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl z-10">
          <div className="font-display text-xl text-ink">{title}</div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-mist hover:bg-mist2 text-inksoft grid place-items-center transition-colors">
            <Ic n="x" s={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button disabled={disabled} onClick={() => onChange(!on)} aria-pressed={on}
      className={`relative w-11 h-6.5 rounded-full transition-colors duration-200 shrink-0 ${on ? "bg-pass" : "bg-mist2 border border-line"} ${disabled ? "opacity-40" : ""}`}
      style={{ height: 26 }}>
      <span className={`absolute top-[3px] w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${on ? "right-[24px]" : "right-[3px]"}`} />
    </button>
  );
}

export function Ring({ pct, size = 110, stroke = 10, tone = "#ffc21c", children }:
  { pct: number; size?: number; stroke?: number; tone?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(100, Math.max(0, pct)) / 100) * c;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e3e9ee" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          className="ring-draw" style={{ ["--ring-c" as string]: c, transition: "stroke-dashoffset .8s cubic-bezier(.16,1,.3,1)" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

export function Bars({ data, tone = "#2e6fae", h = 74, passLine }:
  { data: number[]; tone?: string; h?: number; passLine?: number }) {
  const max = Math.max(...data, 100);
  return (
    <div className="flex items-end gap-1.5 w-full relative" style={{ height: h }}>
      {passLine !== undefined && (
        <div className="absolute inset-x-0 border-t border-dashed border-fail/60 z-0" style={{ bottom: `${(passLine / max) * 100}%` }} />
      )}
      {data.map((v, i) => (
        <div key={i} className="flex-1 rounded-t-md bar-grow relative z-10 group"
          style={{ height: `${Math.max(5, (v / max) * 100)}%`, background: v >= (passLine ?? 0) ? tone : "#d5453a", animationDelay: `${i * 60}ms` }}>
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-inksoft opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {v.toLocaleString("fa-IR")}٪
          </span>
        </div>
      ))}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function Empty({ icon = "info", title, sub }: { icon?: string; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-mist2 text-mut grid place-items-center mb-3"><Ic n={icon} s={26} /></div>
      <div className="font-bold text-ink">{title}</div>
      {sub && <div className="text-[13px] text-mut mt-1 max-w-[260px]">{sub}</div>}
    </div>
  );
}

export function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${inView ? "in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export function Field({ label, error, children, hint }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[13px] font-bold text-inksoft">{label}</span>
        {hint && <span className="text-[11px] text-mut">{hint}</span>}
      </div>
      {children}
      {error && <div className="text-[12px] text-fail font-bold mt-1 flex items-center gap-1"><Ic n="alert" s={13} />{error}</div>}
    </label>
  );
}

export const inputCls =
  "w-full bg-mist border border-line rounded-xl px-4 py-3 text-[15px] text-ink placeholder:text-mut/70 focus:border-branddeep focus:bg-paper transition-colors";

/* ================================ Toasts ================================ */

export function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[70] flex flex-col gap-2 items-center w-full max-w-sm px-4 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id}
          className={`anim-pop pointer-events-auto w-full rounded-xl px-4 py-3 text-[13.5px] font-bold shadow-pop border flex items-center gap-2.5 ${
            t.kind === "err" ? "bg-fail text-white border-fail" : t.kind === "info" ? "bg-asphalt text-white border-asphalt3" : "bg-pass text-white border-pass"
          }`}>
          <Ic n={t.kind === "err" ? "alert" : t.kind === "info" ? "info" : "check"} s={17} />
          <span className="leading-5">{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

/* ================================ Brand ================================ */

export function Logo({ size = 40, light }: { size?: number; light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid place-items-center rounded-xl bg-brand text-brandink shadow-[0_4px_14px_-4px_rgba(217,154,0,0.7)]" style={{ width: size, height: size }}>
        <Ic n="wheel" s={size * 0.62} />
      </span>
      <span className={`font-display text-[26px] leading-none ${light ? "text-white" : "text-ink"}`}>فرمان</span>
    </div>
  );
}

export function RoadLine({ className = "" }: { className?: string }) {
  return <div className={`road-line ${className}`} />;
}

export function Bar({ pct, tone = "#ffc21c", h = 8, className = "" }: { pct: number; tone?: string; h?: number; className?: string }) {
  return (
    <div className={`w-full rounded-full bg-mist2 overflow-hidden ${className}`} style={{ height: h }}>
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: tone }} />
    </div>
  );
}

export function Avatar({ name, size = 44, tone = "#ffc21c", ink = "#14202c" }:
  { name?: string; size?: number; tone?: string; ink?: string }) {
  const parts = (name || "?").trim().split(/\s+/);
  const initials = (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
  return (
    <span className="rounded-full grid place-items-center font-display shrink-0 shadow-[inset_0_-2px_0_rgba(0,0,0,0.15)]"
      style={{ width: size, height: size, background: tone, color: ink, fontSize: size * 0.42 }}>
      {initials || "؟"}
    </span>
  );
}

export function DiffDots({ d }: { d: number }) {
  return (
    <span className="inline-flex gap-0.5 items-center" title={`سختی ${d.toLocaleString("fa-IR")} از ۳`}>
      {[1, 2, 3].map(i => (
        <span key={i} className={`w-1.5 h-1.5 rounded-full ${i <= d ? (d === 3 ? "bg-fail" : d === 2 ? "bg-branddeep" : "bg-pass") : "bg-mist2"}`} />
      ))}
    </span>
  );
}
