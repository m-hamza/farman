import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ARTICLES, CORE_TABLES, PLANS, QUESTIONS, type CatId, type Plan, type Question, type SchemaTable } from "./data";

/* ================================ Types ================================ */

export type Role = "user" | "superadmin";
export interface User {
  id: string; phone: string; first_name?: string; last_name?: string;
  province?: string; city?: string; age_range?: string; exam_date?: string;
  readiness?: string; referral?: string; marketing_consent: boolean;
  marketing_consent_at?: string; marketing_consent_version?: string;
  role: Role; created_at: number; onboarded: boolean;
}
export interface Session {
  id: string; user_id: string; device: string; ip: string;
  created_at: number; last_activity: number; expires_at: number; revoked_at?: number; current?: boolean;
}
export interface Subscription { user_id: string; plan_id: Plan["id"]; starts_at: number; ends_at: number; status: "active" | "expired" }
export interface ExamItem { qid: string; text: string; options: { id: string; text: string }[]; sign?: Question["sign"]; diff: number }
export interface ActiveExam {
  id: string; user_id: string; cat: CatId | "mixed"; mode: "instant" | "end";
  items: ExamItem[]; answers: Record<string, string>; started_at: number; ends_at: number; index: number;
  revealed: Record<string, boolean>;
}
export interface ResultRecord {
  id: string; user_id: string; cat: CatId | "mixed"; score: number; total: number;
  blank: number; percent: number; duration: number; passed: boolean; at: number; mode: "instant" | "end";
}
export interface Payment {
  id: string; ref: string; user_id: string; plan_id: Plan["id"]; gateway: string;
  amount: number; status: "pending" | "verified" | "failed"; at: number;
}
export interface AuditEntry { id: string; actor: string; action: string; target?: string; before?: string; after?: string; ip: string; at: number }
export interface Settings {
  otp_expiry: number; otp_max_attempts: number; otp_resend_limit: number;
  session_mode: "kick" | "block"; max_questions_per_exam: number; exam_minutes: number;
  pass_percent: number; grace_days: number;
}
export interface QStat { seen: number; last_seen: number; wrong: number }

interface PersistShape {
  users: User[]; sessions: Session[]; currentUserId: string | null;
  subs: Subscription[]; results: ResultRecord[]; bookmarks: Record<string, string[]>;
  wrongs: Record<string, string[]>; qstats: Record<string, Record<string, QStat>>;
  settings: Settings; plans: Plan[]; gateways: Record<string, boolean>;
  payments: Payment[]; audit: AuditEntry[]; questions: Question[];
  extraTables: SchemaTable[]; activeExam: ActiveExam | null; seeded: boolean;
}

interface Toast { id: number; msg: string; kind: "ok" | "err" | "info" }

interface StoreApi {
  users: User[]; user: User | null; sessions: Session[]; subs: Subscription[];
  results: ResultRecord[]; payments: Payment[]; audit: AuditEntry[];
  plans: Plan[]; settings: Settings; gateways: Record<string, boolean>;
  questions: Question[]; extraTables: SchemaTable[]; activeExam: ActiveExam | null;
  bookmarks: string[]; wrongs: string[]; toasts: Toast[];
  qstats: Record<string, Record<string, QStat>>;
  plan: Plan | null; sub: Subscription | null; daysLeft: number;
  canCat: (c: CatId) => boolean; canContent: (id: string) => boolean;
  todayExams: number;
  toast: (msg: string, kind?: Toast["kind"]) => void;
  /* ---------- api v1 ---------- */
  requestOtp: (phone: string) => Promise<{ ok: boolean; error?: string; demoCode?: string }>;
  verifyOtp: (phone: string, code: string) => Promise<{ ok: boolean; error?: string; isNew?: boolean }>;
  completeProfile: (d: Partial<User>) => Promise<{ ok: boolean; error?: string }>;
  updateProfile: (d: Partial<User>) => void;
  logout: () => void;
  startExam: (cat: CatId | "mixed", mode: "instant" | "end") => Promise<{ ok: boolean; error?: string }>;
  answer: (qid: string, optId: string) => { correct: boolean; correctId: string; explain: string } | null;
  finishExam: () => ResultRecord | null;
  abandonExam: () => void;
  toggleBookmark: (qid: string) => void;
  buyPlan: (planId: Plan["id"], gateway: string) => Promise<{ ok: boolean; error?: string; ref?: string }>;
  verifyPayment: (paymentId: string) => Promise<{ ok: boolean; error?: string }>;
  /* ---------- admin ---------- */
  saveSettings: (s: Settings) => void;
  setMatrix: (planId: Plan["id"], kind: "cats" | "contents", itemId: string, on: boolean) => void;
  updatePlan: (planId: Plan["id"], patch: Partial<Plan>) => void;
  setGateway: (g: string, on: boolean) => void;
  revokeSession: (sid: string) => void;
  adminGrant: (userId: string, planId: Plan["id"], days: number) => void;
  updateQuestion: (qid: string, patch: Partial<Question>) => void;
  bulkQuestions: (ids: string[], patch: Partial<Question>) => void;
  importQuestions: (json: string) => { ok: boolean; error?: string; preview?: Question[]; errors?: string[] };
  commitImport: (items: Question[]) => void;
  createTable: (t: SchemaTable, execute?: boolean) => { ok: boolean; error?: string; sql?: string };
  dropTable: (name: string) => { ok: boolean; error?: string };
}

const Ctx = createContext<StoreApi | null>(null);
export const useStore = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("store missing");
  return v;
};

/* ================================ Helpers ================================ */

const LS = "farman_state_v3";
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const now = () => Date.now();
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
export const fa = (n: number | string) => Number(n).toLocaleString("fa-IR");
export const faMoney = (n: number) => (n === 0 ? "رایگان" : fa(n) + " تومان");

const deviceOf = () => {
  const ua = navigator.userAgent;
  const os = /Android/i.test(ua) ? "اندروید" : /iPhone|iPad/i.test(ua) ? "iOS" : /Windows/i.test(ua) ? "ویندوز" : /Mac/i.test(ua) ? "مک" : "لینوکس";
  const br = /Firefox/i.test(ua) ? "فایرفاکس" : /Edg/i.test(ua) ? "اج" : /Chrome/i.test(ua) ? "کروم" : "سافاری";
  return `${os} / ${br}`;
};

function defaults(): PersistShape {
  return {
    users: [], sessions: [], currentUserId: null, subs: [], results: [],
    bookmarks: {}, wrongs: {}, qstats: {},
    settings: { otp_expiry: 120, otp_max_attempts: 5, otp_resend_limit: 3, session_mode: "kick", max_questions_per_exam: 10, exam_minutes: 10, pass_percent: 60, grace_days: 0 },
    plans: JSON.parse(JSON.stringify(PLANS)),
    gateways: { zarinpal: true, cafebazaar: true },
    payments: [], audit: [], questions: JSON.parse(JSON.stringify(QUESTIONS)),
    extraTables: [], activeExam: null, seeded: false,
  };
}

function load(): PersistShape {
  try {
    const raw = localStorage.getItem(LS);
    if (raw) {
      const d = defaults();
      const p = JSON.parse(raw) as Partial<PersistShape>;
      return { ...d, ...p, settings: { ...d.settings, ...(p.settings || {}) } };
    }
  } catch { /* ignore */ }
  return defaults();
}

/* weighted random pick — سوالات اخیراً دیده‌شده وزن کمتری می‌گیرند */
function weightedPick(pool: Question[], n: number, stats: Record<string, QStat>): Question[] {
  const scored = pool.map(q => {
    const s = stats[q.id];
    let w = 100;
    if (s) {
      const days = (now() - s.last_seen) / 86400000;
      w = Math.min(95, 15 + days * 12);
      if (days < 0.5) w = 12;
    }
    return { q, w: Math.max(8, w) };
  });
  const out: Question[] = [];
  while (out.length < n && scored.length) {
    const total = scored.reduce((a, b) => a + b.w, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (let i = 0; i < scored.length; i++) { r -= scored[i].w; if (r <= 0) { idx = i; break; } }
    out.push(scored[idx].q);
    scored.splice(idx, 1);
  }
  return out;
}

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

/* ================================ Provider ================================ */

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [S, setS] = useState<PersistShape>(load);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const otpBox = useRef<Record<string, { code: string; exp: number; attempts: number; sends: number[] }>>({});
  const Sref = useRef(S);
  Sref.current = S;

  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(LS, JSON.stringify(S)), 250);
    return () => clearTimeout(t);
  }, [S]);

  const toast = useCallback((msg: string, kind: Toast["kind"] = "ok") => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t.slice(-3), { id, msg, kind }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4200);
  }, []);

  const audit = useCallback((actor: string, action: string, target?: string, before?: string, after?: string) => {
    setS(s => ({ ...s, audit: [{ id: uid(), actor, action, target, before, after, ip: "185.23.110.4", at: now() }, ...s.audit].slice(0, 250) }));
  }, []);

  /* ---------- derived ---------- */
  const user = S.users.find(u => u.id === S.currentUserId) || null;
  const sub = user ? S.subs.find(x => x.user_id === user.id && x.status === "active" && x.ends_at > now()) || null : null;
  const plan = sub ? S.plans.find(p => p.id === sub.plan_id) || S.plans[0] : S.plans[0];
  const daysLeft = sub ? Math.max(0, Math.ceil((sub.ends_at - now()) / 86400000)) : 0;
  const canCat = useCallback((c: CatId) => !!plan?.allowed_categories.includes(c), [plan]);
  const canContent = useCallback((id: string) => !!plan?.allowed_contents.includes(id), [plan]);
  const todayExams = useMemo(() => {
    if (!user) return 0;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return S.results.filter(r => r.user_id === user.id && r.at >= start.getTime()).length;
  }, [S.results, user]);
  const bookmarks = user ? S.bookmarks[user.id] || [] : [];
  const wrongs = user ? S.wrongs[user.id] || [] : [];

  /* ---------- auth api ---------- */

  const requestOtp = useCallback(async (phone: string) => {
    await wait(700);
    if (!/^09\d{9}$/.test(phone)) return { ok: false, error: "شماره موبایل معتبر نیست (مثل 09xxxxxxxxx)" };
    const box = otpBox.current[phone] || { code: "", exp: 0, attempts: 0, sends: [] };
    const recent = box.sends.filter(t => now() - t < 60000);
    const daySends = box.sends.filter(t => now() - t < 86400000);
    if (daySends.length >= Sref.current.settings.otp_resend_limit * 2)
      return { ok: false, error: "سقف ارسال کد برای امروز تکمیل شده است." };
    if (recent.length >= 2) return { ok: false, error: "تعداد درخواست زیاد است؛ لطفاً یک دقیقه صبر کنید." };
    const code = String(Math.floor(10000 + Math.random() * 90000));
    otpBox.current[phone] = { code, exp: now() + Sref.current.settings.otp_expiry * 1000, attempts: 0, sends: [...box.sends, now()] };
    return { ok: true, demoCode: code };
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string) => {
    await wait(650);
    const box = otpBox.current[phone];
    if (!box) return { ok: false, error: "ابتدا درخواست کد ارسال کنید." };
    if (now() > box.exp) return { ok: false, error: "کد منقضی شده است؛ کد جدید دریافت کنید." };
    if (box.attempts >= Sref.current.settings.otp_max_attempts)
      return { ok: false, error: "تلاش بیش از حد مجاز؛ کد جدید دریافت کنید." };
    if (box.code !== code.trim()) { box.attempts++; return { ok: false, error: `کد نادرست است. (${Sref.current.settings.otp_max_attempts - box.attempts} تلاش باقی‌مانده)` }; }
    box.exp = 0; /* single-use */

    const s0 = Sref.current;
    const existing = s0.users.find(x => x.phone === phone);
    const isNew = !existing;
    const u: User = existing || {
      id: uid(), phone, marketing_consent: false, created_at: now(), onboarded: false,
      role: phone === "09999999999" ? "superadmin" : "user",
    };
    const others = s0.sessions.filter(x => x.user_id === u.id && !x.revoked_at && x.expires_at > now());
    if (others.length && s0.settings.session_mode === "block") {
      return { ok: false, error: "این حساب در حال حاضر روی دستگاه دیگری فعال است." };
    }
    /* حالت Kick: نشست‌های قبلی باطل می‌شوند */
    const sessions = s0.sessions.map(x => (x.user_id === u.id && !x.revoked_at ? { ...x, revoked_at: now() } : x));
    const sess: Session = {
      id: uid(), user_id: u.id, device: deviceOf(), ip: "185.23.110.4",
      created_at: now(), last_activity: now(), expires_at: now() + 7 * 86400000, current: true,
    };
    let subs = s0.subs;
    if (isNew) {
      subs = [...subs, { user_id: u.id, plan_id: "free" as const, starts_at: now(), ends_at: now() + 365 * 86400000, status: "active" as const }];
    }
    setS(s => ({
      ...s,
      users: existing ? s.users : [...s.users, u],
      sessions: [...sessions, sess], subs, currentUserId: u.id,
      activeExam: isNew ? null : s.activeExam,
    }));
    audit(phone, "login.otp_verified", "sessions", undefined, "single-session enforced");
    return { ok: true, isNew };
  }, [audit]);

  const completeProfile = useCallback(async (d: Partial<User>) => {
    await wait(500);
    if (!d.first_name?.trim() || !d.last_name?.trim()) return { ok: false, error: "نام و نام خانوادگی الزامی است." };
    if (!d.province || !d.city) return { ok: false, error: "انتخاب استان و شهر الزامی است." };
    setS(s => ({
      ...s,
      users: s.users.map(u => u.id === s.currentUserId ? {
        ...u, ...d, onboarded: true,
        marketing_consent: !!d.marketing_consent,
        marketing_consent_at: d.marketing_consent ? new Date().toISOString() : undefined,
        marketing_consent_version: d.marketing_consent ? "consent-v1" : undefined,
      } : u),
    }));
    return { ok: true };
  }, []);

  const updateProfile = useCallback((d: Partial<User>) => {
    setS(s => ({ ...s, users: s.users.map(u => (u.id === s.currentUserId ? { ...u, ...d } : u)) }));
    toast("پروفایل به‌روزرسانی شد");
  }, [toast]);

  const logout = useCallback(() => {
    setS(s => ({
      ...s,
      sessions: s.sessions.map(x => (x.current ? { ...x, revoked_at: now(), current: false } : x)),
      currentUserId: null,
    }));
    toast("از حساب خارج شدید", "info");
  }, [toast]);

  /* ---------- exam engine ---------- */

  const startExam = useCallback(async (cat: CatId | "mixed", mode: "instant" | "end") => {
    await wait(900);
    const u = Sref.current.users.find(x => x.id === Sref.current.currentUserId);
    if (!u) return { ok: false, error: "نشست نامعتبر است." };
    const s0 = Sref.current;
    const pl = s0.subs.find(x => x.user_id === u.id && x.status === "active" && x.ends_at > now());
    const planObj = s0.plans.find(p => p.id === pl?.plan_id) || s0.plans[0];
    if (!planObj.features.online_exam) return { ok: false, error: "طرح شما دسترسی آزمون آنلاین ندارد." };
    const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
    const today = s0.results.filter(r => r.user_id === u.id && r.at >= dayStart.getTime()).length;
    if (today >= planObj.max_daily_exams) return { ok: false, error: `سقف ${fa(planObj.max_daily_exams)} آزمون روزانه تکمیل شده است.` };
    if (cat !== "mixed" && !planObj.allowed_categories.includes(cat)) return { ok: false, error: "دسترسی به این دسته‌بندی در طرح شما فعال نیست." };

    const pool = s0.questions.filter(q => q.status === "active" && (cat === "mixed" ? planObj.allowed_categories.includes(q.cat) : q.cat === cat));
    const n = Math.min(planObj.max_questions_per_exam, s0.settings.max_questions_per_exam, pool.length);
    if (pool.length < n) return { ok: false, error: "تعداد سوالات فعال این دسته کافی نیست." };
    const stats = s0.qstats[u.id] || {};
    const picked = weightedPick(pool, n, stats);
    /* گزینه‌ها shuffle می‌شوند و پاسخ صحیح با «شناسه گزینه» نگه داشته می‌شود — نه موقعیت.
       کلید _c فقط در گریدینگ سمت «سرور» خوانده می‌شود و به کلاینت ارسال نمی‌شود. */
    const items: (ExamItem & { _c: string })[] = picked.map(pq => {
      const opts = shuffle(pq.options.map((text, i) => ({ id: `o${i + 1}`, text, c: i === pq.correct })));
      return {
        qid: pq.id, text: pq.text, sign: pq.sign, diff: pq.diff,
        options: opts.map(({ id, text }) => ({ id, text })),
        _c: opts.find(o => o.c)!.id,
      };
    });

    const minutes = Math.max(2, Math.round(s0.settings.exam_minutes * (n / s0.settings.max_questions_per_exam)));
    const exam: ActiveExam = {
      id: uid(), user_id: u.id, cat, mode,
      items: items as unknown as ExamItem[],
      answers: {}, started_at: now(), ends_at: now() + minutes * 60000, index: 0, revealed: {},
    };
    setS(s => ({ ...s, activeExam: exam }));
    audit(u.phone, "exam.started", cat, undefined, `${n}q / ${mode}`);
    return { ok: true };
  }, [audit]);

  const answer = useCallback((qid: string, optId: string) => {
    const exam = Sref.current.activeExam;
    if (!exam) return null;
    const it = exam.items.find(i => i.qid === qid) as unknown as ExamItem & { _c: string };
    if (!it) return null;
    const q = Sref.current.questions.find(x => x.id === qid)!;
    const correct = optId === it._c;
    setS(s => s.activeExam ? { ...s, activeExam: { ...s.activeExam, answers: { ...s.activeExam.answers, [qid]: optId } } } : s);
    return { correct, correctId: it._c, explain: q.explain };
  }, []);

  const finishExam = useCallback((): ResultRecord | null => {
    const s0 = Sref.current;
    const exam = s0.activeExam;
    if (!exam) return null;
    let score = 0, blank = 0;
    const wrongIds: string[] = [];
    for (const it of exam.items) {
      const typed = it as ExamItem & { _c: string };
      const a = exam.answers[it.qid];
      if (!a) blank++;
      else if (a === typed._c) score++;
      else wrongIds.push(it.qid);
    }
    const total = exam.items.length;
    const percent = Math.round((score / total) * 100);
    const rec: ResultRecord = {
      id: uid(), user_id: exam.user_id, cat: exam.cat, score, total, blank, percent,
      duration: Math.round((now() - exam.started_at) / 1000),
      passed: percent >= s0.settings.pass_percent, at: now(), mode: exam.mode,
    };
    setS(s => {
      const u = exam.user_id;
      const stats = { ...(s.qstats[u] || {}) };
      for (const it of exam.items) {
        const prev = stats[it.qid];
        stats[it.qid] = {
          seen: (prev?.seen || 0) + 1, last_seen: now(),
          wrong: (prev?.wrong || 0) + (wrongIds.includes(it.qid) ? 1 : 0),
        };
      }
      const prevWrong = s.wrongs[u] || [];
      const newWrong = [...new Set([...prevWrong, ...wrongIds])].filter(id => !exam.answers[id] || wrongIds.includes(id));
      /* سوالاتی که این بار درست پاسخ داده شدند از لیست اشتباه‌ها خارج می‌شوند */
      const stillWrong = newWrong.filter(id => wrongIds.includes(id));
      return {
        ...s, activeExam: null,
        results: [rec, ...s.results],
        qstats: { ...s.qstats, [u]: stats },
        wrongs: { ...s.wrongs, [u]: stillWrong },
      };
    });
    audit("system", "exam.finished", exam.cat, undefined, `${score}/${total}`);
    return rec;
  }, [audit]);

  const abandonExam = useCallback(() => {
    setS(s => ({ ...s, activeExam: null }));
  }, []);

  const toggleBookmark = useCallback((qid: string) => {
    const u = Sref.current.currentUserId;
    if (!u) return;
    setS(s => {
      const cur = s.bookmarks[u] || [];
      const next = cur.includes(qid) ? cur.filter(x => x !== qid) : [qid, ...cur];
      return { ...s, bookmarks: { ...s.bookmarks, [u]: next } };
    });
  }, []);

  /* ---------- payments ---------- */

  const buyPlan = useCallback(async (planId: Plan["id"], gateway: string) => {
    await wait(800);
    const u = Sref.current.currentUserId;
    if (!u) return { ok: false, error: "نشست نامعتبر است." };
    if (!Sref.current.gateways[gateway]) return { ok: false, error: "این درگاه پرداخت غیرفعال است." };
    const pl = Sref.current.plans.find(p => p.id === planId);
    if (!pl) return { ok: false, error: "طرح پیدا نشد." };
    if (pl.price === 0) return { ok: false, error: "طرح رایگان نیازی به پرداخت ندارد." };
    const pay: Payment = { id: uid(), ref: "A-" + Math.floor(10000000 + Math.random() * 90000000), user_id: u, plan_id: planId, gateway, amount: pl.price, status: "pending", at: now() };
    setS(s => ({ ...s, payments: [pay, ...s.payments] }));
    audit(u ? "user" : "guest", "payment.created", gateway, undefined, `${pl.price} / ${pay.ref}`);
    return { ok: true, ref: pay.id };
  }, [audit]);

  const verifyPayment = useCallback(async (paymentId: string) => {
    await wait(1400); /* شبیه‌سازی verify سمت سرور */
    const s0 = Sref.current;
    const pay = s0.payments.find(p => p.id === paymentId);
    if (!pay || pay.status === "verified") return { ok: false, error: "تراکنش یافت نشد یا قبلاً تأیید شده است." };
    const pl = s0.plans.find(p => p.id === pay.plan_id);
    if (!pl) return { ok: false, error: "طرح تراکنش معتبر نیست." };
    const old = s0.subs.find(x => x.user_id === pay.user_id && x.status === "active" && x.ends_at > now());
    const base = old ? Math.max(old.ends_at, now()) : now();
    let subs = s0.subs.map(x => (x === old ? { ...x, status: "active" as const, ends_at: base + pl.days * 86400000, plan_id: pl.id } : x));
    if (!old) subs = [...subs, { user_id: pay.user_id, plan_id: pl.id, starts_at: now(), ends_at: base + pl.days * 86400000, status: "active" as const }];
    setS(s => ({
      ...s, subs,
      payments: s.payments.map(p => (p.id === paymentId ? { ...p, status: "verified" as const } : p)),
    }));
    audit("gateway", "payment.verified", `${pay.ref}`, "pending", "verified");
    toast("پرداخت تأیید شد؛ اشتراک فعال شد 🎉");
    return { ok: true };
  }, [audit, toast]);

  /* ---------- admin ---------- */

  const saveSettings = useCallback((ns: Settings) => {
    setS(s => ({ ...s, settings: ns }));
    audit(Sref.current.users.find(u => u.id === Sref.current.currentUserId)?.phone || "admin", "settings.updated", "security", JSON.stringify(Sref.current.settings).slice(0, 80), JSON.stringify(ns).slice(0, 80));
    toast("تنظیمات امنیتی ذخیره شد");
  }, [audit, toast]);

  const setMatrix = useCallback((planId: Plan["id"], kind: "cats" | "contents", itemId: string, on: boolean) => {
    setS(s => ({
      ...s,
      plans: s.plans.map(p => {
        if (p.id !== planId) return p;
        if (kind === "cats") {
          const list = p.allowed_categories as CatId[];
          return { ...p, allowed_categories: on ? [...new Set([...list, itemId as CatId])] : list.filter(x => x !== itemId) };
        }
        return { ...p, allowed_contents: on ? [...new Set([...p.allowed_contents, itemId])] : p.allowed_contents.filter(x => x !== itemId) };
      }),
    }));
    audit("admin", kind === "cats" ? "matrix.category" : "matrix.content", `${planId}:${itemId}`, undefined, on ? "grant" : "revoke");
  }, [audit]);

  const updatePlan = useCallback((planId: Plan["id"], patch: Partial<Plan>) => {
    setS(s => ({ ...s, plans: s.plans.map(p => (p.id === planId ? { ...p, ...patch, id: p.id } : p)) }));
    audit("admin", "plan.updated", planId);
    toast("طرح به‌روزرسانی شد");
  }, [audit, toast]);

  const setGateway = useCallback((g: string, on: boolean) => {
    setS(s => ({ ...s, gateways: { ...s.gateways, [g]: on } }));
    audit("admin", "gateway.toggled", g, undefined, on ? "on" : "off");
    toast(on ? "درگاه فعال شد" : "درگاه غیرفعال شد", "info");
  }, [audit, toast]);

  const revokeSession = useCallback((sid: string) => {
    const sess = Sref.current.sessions.find(x => x.id === sid);
    setS(s => ({
      ...s,
      sessions: s.sessions.map(x => (x.id === sid ? { ...x, revoked_at: now(), current: false } : x)),
      currentUserId: sess?.current ? null : s.currentUserId,
    }));
    audit("admin", "session.revoked", sid);
    toast("نشست باطل شد", "info");
  }, [audit, toast]);

  const adminGrant = useCallback((userId: string, planId: Plan["id"], days: number) => {
    setS(s => {
      const subs = s.subs.filter(x => !(x.user_id === userId && x.status === "active"));
      return { ...s, subs: [...subs, { user_id: userId, plan_id: planId, starts_at: now(), ends_at: now() + days * 86400000, status: "active" as const }] };
    });
    audit("admin", "subscription.granted", `${userId}→${planId}`, undefined, `${days} روز`);
    toast("اشتراک برای کاربر اعمال شد");
  }, [audit, toast]);

  const updateQuestion = useCallback((qid: string, patch: Partial<Question>) => {
    setS(s => ({ ...s, questions: s.questions.map(x => (x.id === qid ? { ...x, ...patch, id: x.id } : x)) }));
    audit("admin", "question.updated", qid);
    toast("سوال ذخیره شد");
  }, [audit, toast]);

  const bulkQuestions = useCallback((ids: string[], patch: Partial<Question>) => {
    setS(s => ({ ...s, questions: s.questions.map(x => (ids.includes(x.id) ? { ...x, ...patch } : x)) }));
    audit("admin", "question.bulk", `${ids.length} مورد`, undefined, JSON.stringify(patch));
    toast(`${fa(ids.length)} سوال به‌روزرسانی شد`);
  }, [audit, toast]);

  const importQuestions = useCallback((json: string) => {
    let parsed: unknown;
    try { parsed = JSON.parse(json); } catch { return { ok: false, error: "فایل JSON معتبر نیست (خطای parse)." }; }
    if (!Array.isArray(parsed)) return { ok: false, error: "ساختار باید آرایه‌ای از سوالات باشد." };
    const errors: string[] = [];
    const preview: Question[] = [];
    const seenTexts = new Set(Sref.current.questions.map(q => q.text.trim()));
    (parsed as Record<string, unknown>[]).forEach((row, i) => {
      const text = String(row.text || "").trim();
      const options = Array.isArray(row.options) ? row.options.map(o => String(o).trim()) : [];
      const correct = Number(row.correct);
      if (!text) return errors.push(`ردیف ${fa(i + 1)}: متن سوال خالی است.`);
      if (options.length !== 4) return errors.push(`ردیف ${fa(i + 1)}: دقیقاً ۴ گزینه لازم است.`);
      if (!(correct >= 0 && correct <= 3)) return errors.push(`ردیف ${fa(i + 1)}: ایندکس پاسخ صحیح باید ۰ تا ۳ باشد.`);
      if (seenTexts.has(text)) return errors.push(`ردیف ${fa(i + 1)}: سوال تکراری است (Duplicate Detection).`);
      seenTexts.add(text);
      const cat = (["signs", "priority", "rules", "speed", "technical", "safety"].includes(String(row.cat)) ? String(row.cat) : "rules") as CatId;
      preview.push({
        id: "q-imp-" + uid(), cat, text, options, correct,
        explain: String(row.explain || "توضیحی ثبت نشده است."), diff: ([1, 2, 3].includes(Number(row.diff)) ? Number(row.diff) : 1) as 1 | 2 | 3,
        tags: Array.isArray(row.tags) ? row.tags.map(String) : ["import"], status: "active",
      });
    });
    if (!preview.length) return { ok: false, error: "هیچ سوال معتبری پیدا نشد.", errors };
    return { ok: true, preview, errors };
  }, []);

  const commitImport = useCallback((items: Question[]) => {
    setS(s => ({ ...s, questions: [...items, ...s.questions] }));
    audit("admin", "questions.imported", "batch", undefined, `${items.length} سوال`);
    toast(`${fa(items.length)} سوال به بانک اضافه شد`);
  }, [audit, toast]);

  const createTable = useCallback((t: SchemaTable, execute = false) => {
    if (!/^[a-z][a-z0-9_]{2,40}$/.test(t.name)) return { ok: false, error: "نام جدول باید با حروف کوچک انگلیسی شروع شود (مثل exam_categories)." };
    if (CORE_TABLES.some(x => x.name === t.name) || Sref.current.extraTables.some(x => x.name === t.name))
      return { ok: false, error: "جدولی با این نام از قبل وجود دارد." };
    if (!t.cols.length) return { ok: false, error: "حداقل یک ستون تعریف کنید." };
    const bad = t.cols.find(c => !/^[a-z][a-z0-9_]{1,30}$/.test(c.name));
    if (bad) return { ok: false, error: `نام ستون «${bad.name}» معتبر نیست.` };
    const pkCount = t.cols.filter(c => c.pk).length;
    if (pkCount !== 1) return { ok: false, error: "دقیقاً یک ستون باید کلید اصلی (Primary) باشد." };
    const sql = `CREATE TABLE \`${t.name}\` (\n` +
      t.cols.map(c => {
        let line = `  \`${c.name}\` ${c.type}${c.pk ? " NOT NULL AUTO_INCREMENT" : c.nul ? " NULL" : " NOT NULL"}`;
        if (c.def) line += ` DEFAULT '${c.def}'`;
        return line;
      }).join(",\n") +
      `,\n  PRIMARY KEY (\`${t.cols.find(c => c.pk)?.name}\`)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
    if (execute) {
      setS(s => ({ ...s, extraTables: [...s.extraTables, { ...t, rows: 0, deps: [], core: false }] }));
      audit("superadmin", "schema.create_table", t.name, undefined, sql.slice(0, 120));
    }
    return { ok: true, sql };
  }, [audit]);

  const dropTable = useCallback((name: string) => {
    const all = [...CORE_TABLES, ...Sref.current.extraTables];
    const t = all.find(x => x.name === name);
    if (!t) return { ok: false, error: "جدول پیدا نشد." };
    if (t.deps.length) return { ok: false, error: `این جدول ${fa(t.deps.length)} وابستگی دارد (${t.deps.join("، ")}). حذف آن ممکن است باعث از بین رفتن داده شود؛ ابتدا وابستگی‌ها را حل کنید.` };
    if (t.core) return { ok: false, error: "جدول‌های هسته سیستم فقط با مهاجرت رسمی (Migration) قابل حذف‌اند." };
    setS(s => ({ ...s, extraTables: s.extraTables.filter(x => x.name !== name) }));
    audit("superadmin", "schema.drop_table", name, "exists", "dropped");
    return { ok: true };
  }, [audit]);

  /* ---------- value ---------- */

  const api: StoreApi = {
    users: S.users, user, sessions: S.sessions, subs: S.subs, results: S.results,
    payments: S.payments, audit: S.audit, plans: S.plans, settings: S.settings,
    gateways: S.gateways, questions: S.questions, extraTables: S.extraTables,
    activeExam: S.activeExam, bookmarks, wrongs, toasts, qstats: S.qstats,
    plan, sub, daysLeft, canCat, canContent, todayExams, toast,
    requestOtp, verifyOtp, completeProfile, updateProfile, logout,
    startExam, answer, finishExam, abandonExam, toggleBookmark,
    buyPlan, verifyPayment,
    saveSettings, setMatrix, updatePlan, setGateway, revokeSession, adminGrant,
    updateQuestion, bulkQuestions, importQuestions, commitImport, createTable, dropTable,
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export { CORE_TABLES };
