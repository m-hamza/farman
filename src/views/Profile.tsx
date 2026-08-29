import React, { useEffect, useState } from "react";
import { useStore, fa } from "../store";
import { GATEWAYS, PROVINCES } from "../data";
import { Avatar, Bar, Btn, Card, Chip, Field, Ic, Modal, Ring, inputCls } from "../components";
import type { NavFn } from "./Dashboard";

export default function Profile({ nav, initTab }: { nav: NavFn; initTab?: string }) {
  const s = useStore();
  const u = s.user!;
  const [tab, setTab] = useState(initTab === "payments" ? "payments" : initTab === "sessions" ? "sessions" : "account");
  const [payOpen, setPayOpen] = useState(initTab === "plans");

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-5 anim-up flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-[32px] leading-tight text-ink">پروفایل</h1>
          <p className="text-[13.5px] text-mut mt-1">حساب، اشتراک یک‌ساله، نشست‌ها و پرداخت‌های شما</p>
        </div>
        {u.role === "superadmin" && (
          <Btn v="ink" onClick={() => nav("admin")}><Ic n="shield" s={17} /> پنل مدیریت</Btn>
        )}
      </div>

      <SubscriptionSection onBuy={() => setPayOpen(true)} />

      <div className="flex gap-2 flex-wrap mb-6 anim-up" style={{ animationDelay: "60ms" }}>
        {[
          { id: "account", label: "حساب کاربری", icon: "user" },
          { id: "payments", label: "پرداخت‌ها", icon: "wallet" },
          { id: "sessions", label: "نشست‌های فعال", icon: "shield" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 rounded-xl text-[13px] font-bold border-2 transition-all flex items-center gap-2 active:scale-95 ${
              tab === t.id ? "bg-asphalt text-white border-asphalt shadow-pop" : "border-line bg-paper text-inksoft hover:border-asphalt3"}`}>
            <Ic n={t.icon} s={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "account" && <AccountTab />}
      {tab === "payments" && <PaymentsTab />}
      {tab === "sessions" && <SessionsTab />}

      <PayModal open={payOpen} onClose={() => setPayOpen(false)} />
    </div>
  );
}

/* ---------------- single annual subscription ---------------- */

function SubscriptionSection({ onBuy }: { onBuy: () => void }) {
  const s = useStore();
  const annual = s.plans.find(p => p.id === "premium") || s.plans[s.plans.length - 1];
  const isPremium = !!s.sub && s.sub.plan_id !== "free";

  if (isPremium) {
    return (
      <Card className="p-5 md:p-6 mb-6 anim-up relative overflow-hidden">
        <div className="absolute -left-10 -top-14 w-40 h-40 rounded-full border-[14px] border-brand/10 pointer-events-none" />
        <div className="flex items-center gap-5 flex-wrap">
          <Ring pct={(s.daysLeft / 365) * 100} size={104} stroke={9} tone="#0f8f5b">
            <div className="text-center">
              <div className="font-display text-[26px] text-ink leading-none">{fa(s.daysLeft)}</div>
              <div className="text-[10.5px] font-bold text-mut mt-1">روز مانده</div>
            </div>
          </Ring>
          <div className="flex-1 min-w-[190px]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display text-[22px] text-ink">اشتراک یک‌ساله فعال است</span>
              <Chip tone="#0f8f5b" soft="#ddf3e7"><Ic n="crown" s={12} /> {annual.name}</Chip>
            </div>
            <p className="text-[12.5px] text-mut font-medium mt-1.5">
              انقضا: <b className="text-ink">{new Date(s.sub!.ends_at).toLocaleDateString("fa-IR")}</b> — پس از انقضا، دسترسی کامل بلافاصله قطع می‌شود (Grace Period: {fa(s.settings.grace_days)} روز).
            </p>
            <div className="mt-3"><Bar pct={(s.daysLeft / 365) * 100} tone="#0f8f5b" /></div>
          </div>
          <Btn v="pass" onClick={onBuy}><Ic n="refresh" s={16} /> تمدید یک‌ساله</Btn>
        </div>
      </Card>
    );
  }

  return (
    <div className="mb-6 anim-up rounded-3xl bg-asphalt text-white p-6 md:p-7 relative overflow-hidden">
      <div className="absolute -left-12 -bottom-16 w-48 h-48 rounded-full border-[16px] border-white/5 pointer-events-none" />
      <div className="absolute left-6 top-6 w-16 h-16 rounded-full border-[10px] border-brand/15 pointer-events-none" />
      <div className="flex items-start justify-between gap-4 flex-wrap relative">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-11 h-11 rounded-2xl bg-brand text-brandink grid place-items-center shadow-[0_6px_18px_-6px_rgba(255,194,28,0.8)]"><Ic n="crown" s={22} /></span>
            <h2 className="font-display text-[27px] leading-tight">اشتراک یک‌ساله فرمان</h2>
          </div>
          <p className="text-[13px] text-white/60 font-medium mt-2 leading-6">یک خرید، ۳۶۵ روز دسترسی کامل — بدون تمدید خودکار.</p>
        </div>
        <div className="text-left">
          <div className="font-display text-[32px] text-brand leading-none">{fa(annual.price)}</div>
          <div className="text-[11.5px] font-bold text-white/55 mt-1">تومان برای یک سال کامل</div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5 mt-5 relative">
        {annual.perks.map(p => (
          <div key={p} className="flex items-center gap-2.5 text-[13px] font-medium text-white/85">
            <span className="w-5 h-5 rounded-full bg-pass/25 text-pass grid place-items-center shrink-0"><Ic n="check" s={12} /></span>
            {p}
          </div>
        ))}
      </div>

      <Btn full className="mt-6 relative" onClick={onBuy}>
        <Ic n="lock" s={17} /> خرید اشتراک یک‌ساله — {fa(annual.price)} تومان
      </Btn>
      <p className="text-[11px] text-white/45 text-center mt-3 font-medium">
        پرداخت امن از طریق زرین‌پال یا کافه‌بازار · تأیید فقط پس از Verify سمت سرور
      </p>
    </div>
  );
}

/* ---------------- account ---------------- */

function AccountTab() {
  const s = useStore();
  const u = s.user!;
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({ first_name: u.first_name || "", last_name: u.last_name || "", province: u.province || "", city: u.city || "" });
  const cities = PROVINCES.find(p => p.name === f.province)?.cities || [];
  const fullName = u.first_name ? `${u.first_name} ${u.last_name || ""}` : "کاربر";

  return (
    <div className="anim-up grid lg:grid-cols-2 gap-5">
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Avatar name={fullName} size={62} />
          <div>
            <div className="font-display text-[23px] text-ink leading-tight">{fullName}</div>
            <div dir="ltr" className="text-[13px] font-bold text-mut text-right mt-0.5">{u.phone}</div>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              <Chip tone="#2e6fae" soft="#e6f0f9">{u.province}، {u.city}</Chip>
              {u.role === "superadmin" && <Chip tone="#d99a00" soft="#fdf0dd">سوپرادمین</Chip>}
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-2.5 text-[13px] font-medium">
          <div className="flex justify-between border-b border-line pb-2.5">
            <span className="text-mut">تاریخ عضویت</span>
            <span className="font-bold text-ink">{new Date(u.created_at).toLocaleDateString("fa-IR")}</span>
          </div>
          {u.readiness && <div className="flex justify-between border-b border-line pb-2.5"><span className="text-mut">سطح آمادگی</span><span className="font-bold text-ink">{u.readiness}</span></div>}
          {u.exam_date && <div className="flex justify-between border-b border-line pb-2.5"><span className="text-mut">تاریخ آزمون</span><span className="font-bold text-ink">{new Date(u.exam_date).toLocaleDateString("fa-IR")}</span></div>}
          <div className="flex justify-between pb-1">
            <span className="text-mut">رضایت بازاریابی</span>
            <span className={`font-bold flex items-center gap-1.5 ${u.marketing_consent ? "text-pass" : "text-mut"}`}>
              <Ic n={u.marketing_consent ? "check" : "ban"} s={14} />
              {u.marketing_consent ? `فعال (${u.marketing_consent_version})` : "ندارد"}
            </span>
          </div>
        </div>

        <Btn v="outline" full className="mt-5" onClick={() => setEdit(true)}><Ic n="edit" s={16} /> ویرایش پروفایل</Btn>
      </Card>

      <Card className="p-6">
        <h3 className="font-display text-[20px] text-ink mb-4">وضعیت دسترسی فعلی</h3>
        <div className="rounded-2xl asphalt-tex text-white p-5 relative overflow-hidden">
          <div className="absolute -left-8 -bottom-10 w-32 h-32 rounded-full border-[12px] border-white/5" />
          <div className="flex items-center justify-between">
            <span className="font-display text-[21px] text-brand">طرح {(s.plan || s.plans[0]).name}</span>
            <Chip tone="#0f8f5b" soft="rgba(15,143,91,0.25)" className="!text-passoft">{fa(s.daysLeft)} روز مانده</Chip>
          </div>
          <div className="text-[12.5px] text-white/65 mt-2 leading-6">
            انقضا: {new Date(s.sub?.ends_at || Date.now()).toLocaleDateString("fa-IR")}
          </div>
        </div>
        <div className="mt-4 space-y-2.5">
          {(s.plan || s.plans[0]).perks.map(p => (
            <div key={p} className="flex items-center gap-2.5 text-[13px] text-inksoft font-medium">
              <Ic n="check" s={15} c="text-pass shrink-0" /> {p}
            </div>
          ))}
        </div>
      </Card>

      <Modal open={edit} onClose={() => setEdit(false)} title="ویرایش پروفایل">
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="نام"><input className={inputCls} value={f.first_name} onChange={e => setF({ ...f, first_name: e.target.value })} /></Field>
          <Field label="نام خانوادگی"><input className={inputCls} value={f.last_name} onChange={e => setF({ ...f, last_name: e.target.value })} /></Field>
          <Field label="استان">
            <select className={inputCls} value={f.province} onChange={e => setF({ ...f, province: e.target.value, city: "" })}>
              {PROVINCES.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="شهر">
            <select className={inputCls} value={f.city} onChange={e => setF({ ...f, city: e.target.value })}>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <Btn full className="mt-5" onClick={() => { s.updateProfile(f); setEdit(false); }}>ذخیره تغییرات</Btn>
      </Modal>
    </div>
  );
}

/* ---------------- payment flow (single annual product) ---------------- */

function PayModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useStore();
  const annual = s.plans.find(p => p.id === "premium") || s.plans[s.plans.length - 1];
  const [step, setStep] = useState<"gateway" | "checkout" | "verify" | "done">("gateway");
  const [gw, setGw] = useState("zarinpal");
  const [payId, setPayId] = useState<string | null>(null);
  const [ref, setRef] = useState("");
  const [count, setCount] = useState(25);
  const [err, setErr] = useState("");
  const isPremium = !!s.sub && s.sub.plan_id !== "free";

  useEffect(() => {
    if (open) {
      setStep("gateway"); setErr(""); setCount(25); setPayId(null);
      setGw(s.gateways.zarinpal ? "zarinpal" : "cafebazaar");
    }
  }, [open]); // eslint-disable-line

  useEffect(() => {
    if (step !== "checkout") return;
    const t = setInterval(() => setCount(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [step]);

  const startPay = async () => {
    setErr("");
    const r = await s.buyPlan(annual.id, gw);
    if (!r.ok) { setErr(r.error!); return; }
    setPayId(r.ref!);
    setRef("A-" + Math.floor(10000000 + Math.random() * 90000000));
    setCount(25);
    setStep("checkout");
  };

  const confirmPay = async () => {
    if (!payId) return;
    setStep("verify");
    const v = await s.verifyPayment(payId);
    if (v.ok) setStep("done");
    else { setErr(v.error!); setStep("gateway"); }
  };

  const cancel = () => {
    if (payId && step === "checkout") s.cancelPayment(payId);
    onClose();
  };

  const gateway = GATEWAYS.find(g => g.id === gw);
  const activeGateways = GATEWAYS.filter(g => s.gateways[g.id]);

  return (
    <Modal open={open} onClose={step === "verify" ? () => undefined : cancel}
      title={step === "done" ? "نتیجه پرداخت" : isPremium ? "تمدید اشتراک یک‌ساله" : "خرید اشتراک یک‌ساله"}>

      {step === "gateway" && (
        <div>
          <div className="rounded-xl bg-mist p-4 flex items-center justify-between mb-4">
            <div>
              <span className="font-bold text-[14px] text-ink block">اشتراک یک‌ساله فرمان</span>
              <span className="text-[11.5px] text-mut font-bold">۳۶۵ روز دسترسی کامل {isPremium ? "— به اعتبار فعلی اضافه می‌شود" : ""}</span>
            </div>
            <span className="font-display text-[22px] text-branddeep">{fa(annual.price)} <span className="text-[12px] text-mut">ت</span></span>
          </div>

          {activeGateways.length === 0 && (
            <div className="rounded-xl bg-failsoft text-fail p-4 text-[13px] font-bold flex items-center gap-2 mb-4">
              <Ic n="alert" s={17} /> در حال حاضر هیچ درگاه پرداختی فعال نیست.
            </div>
          )}

          <div className="grid gap-2.5">
            {GATEWAYS.map(g => {
              const enabled = !!s.gateways[g.id];
              return (
                <button key={g.id} disabled={!enabled} onClick={() => setGw(g.id)}
                  className={`text-right p-4 rounded-xl border-2 flex items-center gap-3.5 transition-all active:scale-[0.98] ${
                    gw === g.id && enabled ? "border-asphalt bg-asphalt text-white" : enabled ? "border-line bg-paper hover:border-asphalt3" : "border-line bg-mist opacity-50"}`}>
                  <span className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${gw === g.id && enabled ? "bg-brand text-brandink" : "bg-mist text-inksoft"}`}>
                    <Ic n="wallet" s={19} />
                  </span>
                  <span className="flex-1">
                    <span className={`font-bold text-[14.5px] block ${gw === g.id && enabled ? "text-white" : "text-ink"}`}>{g.name}</span>
                    <span className={`text-[11.5px] block mt-0.5 ${gw === g.id && enabled ? "text-white/60" : "text-mut"}`}>
                      {enabled ? g.desc : "غیرفعال توسط مدیر"}
                    </span>
                  </span>
                  <span className={`w-5 h-5 rounded-full border-2 grid place-items-center shrink-0 ${gw === g.id && enabled ? "border-brand bg-brand" : "border-line"}`}>
                    {gw === g.id && enabled && <span className="w-2 h-2 rounded-full bg-brandink" />}
                  </span>
                </button>
              );
            })}
          </div>

          {err && <div className="text-[12.5px] text-fail font-bold mt-3 flex items-center gap-1.5 anim-in"><Ic n="alert" s={14} />{err}</div>}

          <Btn full className="mt-5" disabled={activeGateways.length === 0} onClick={startPay}>
            <Ic n="lock" s={17} /> پرداخت {fa(annual.price)} تومان
          </Btn>
          <p className="text-[11px] text-mut text-center mt-3 leading-5">
            وضعیت پرداخت فقط پس از Verify سمت سرور ثبت می‌شود؛ Callback تکراری هم پرداخت را تکرار نمی‌کند (Idempotent).
          </p>
        </div>
      )}

      {step === "checkout" && gateway && (
        <div className="anim-in">
          <div className={`rounded-2xl overflow-hidden border border-line`}>
            <div className={`px-5 py-4 flex items-center justify-between text-white ${gw === "zarinpal" ? "bg-[#1c2333]" : "bg-[#00913f]"}`}>
              <div className="flex items-center gap-2.5 font-display text-[18px]">
                <Ic n="wallet" s={19} /> درگاه پرداخت {gateway.name}
              </div>
              <span className="text-[11px] font-bold bg-white/15 rounded-full px-2.5 py-1">شبیه‌سازی</span>
            </div>
            <div className="p-5 space-y-3 text-[13px]">
              <div className="flex justify-between"><span className="text-mut font-medium">پذیرنده</span><span className="font-bold text-ink">آموزش رانندگی فرمان</span></div>
              <div className="flex justify-between"><span className="text-mut font-medium">شرح</span><span className="font-bold text-ink">اشتراک یک‌ساله</span></div>
              <div className="flex justify-between"><span className="text-mut font-medium">مبلغ قابل پرداخت</span><span className="font-display text-[19px] text-ink">{fa(annual.price)} تومان</span></div>
              <div className="flex justify-between items-center">
                <span className="text-mut font-medium">مهلت باقی‌مانده</span>
                <span className={`font-display text-[21px] tabular-nums ${count <= 5 ? "text-fail" : "text-ink"}`} dir="ltr">{fa(count)} ثانیه</span>
              </div>
              <div className="flex justify-between"><span className="text-mut font-medium">شماره تراکنش</span><span className="font-bold text-inksoft" dir="ltr">{ref}</span></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 mt-4">
            <Btn v="pass" disabled={count === 0} onClick={confirmPay}><Ic n="check" s={16} /> پرداخت موفق</Btn>
            <Btn v="outline" onClick={cancel}><Ic n="x" s={16} /> انصراف از پرداخت</Btn>
          </div>
          <p className="text-[11px] text-mut text-center mt-3 leading-5">
            پس از بازگشت، وضعیت تراکنش فقط با استعلام سرور از درگاه تعیین می‌شود — نه با ادعای مرورگر.
          </p>
        </div>
      )}

      {step === "verify" && (
        <div className="text-center py-9 anim-in">
          <span className="spinner inline-block mb-4" />
          <p className="font-bold text-[15px] text-ink">در حال Verify سمت سرور…</p>
          <p className="text-[12px] text-mut mt-1.5">استعلام مرجع تراکنش از {gateway?.name} و فعال‌سازی اشتراک در Transaction</p>
        </div>
      )}

      {step === "done" && (
        <div className="text-center py-6 anim-pop">
          <span className="inline-grid place-items-center w-16 h-16 rounded-full bg-passoft text-pass mb-4"><Ic n="check" s={30} /></span>
          <p className="font-display text-[24px] text-ink">اشتراک یک‌ساله فعال شد!</p>
          <p className="text-[13px] text-mut mt-1.5 leading-6">
            دسترسی کامل تا <b className="text-ink">{new Date(s.sub?.ends_at || Date.now()).toLocaleDateString("fa-IR")}</b> برقرار است.
          </p>
          <Btn full className="mt-5" onClick={onClose}>عالی بود، شروع کنیم</Btn>
        </div>
      )}
    </Modal>
  );
}

/* ---------------- payments ---------------- */

function PaymentsTab() {
  const s = useStore();
  const mine = s.payments.filter(p => p.user_id === s.user!.id);
  return (
    <Card className="anim-up overflow-hidden">
      <div className="px-5 py-4 border-b border-line flex items-center justify-between">
        <h3 className="font-display text-[20px] text-ink">تاریخچه پرداخت‌ها</h3>
        <Chip tone="#2e6fae" soft="#e6f0f9">{fa(mine.length)} تراکنش</Chip>
      </div>
      {mine.length === 0 ? (
        <div className="p-6 text-center text-[13px] text-mut">تراکنشی ثبت نشده است.</div>
      ) : (
        <div className="divide-y divide-line">
          {mine.map(p => (
            <div key={p.id} className="px-5 py-3.5 flex items-center gap-3.5 flex-wrap">
              <span className={`w-9 h-9 rounded-xl grid place-items-center ${p.status === "verified" ? "bg-passoft text-pass" : p.status === "failed" ? "bg-failsoft text-fail" : "bg-mist2 text-mut"}`}>
                <Ic n={p.status === "verified" ? "check" : p.status === "failed" ? "x" : "clock"} s={17} />
              </span>
              <div className="flex-1 min-w-[140px]">
                <div className="text-[13.5px] font-bold text-ink">اشتراک یک‌ساله — {GATEWAYS.find(g => g.id === p.gateway)?.name}</div>
                <div className="text-[11.5px] text-mut font-medium mt-0.5" dir="ltr">ref: {p.ref}</div>
              </div>
              <span className="font-display text-[18px] text-ink">{fa(p.amount)} <span className="text-[11px] text-mut">تومان</span></span>
              <Chip tone={p.status === "verified" ? "#0f8f5b" : p.status === "failed" ? "#d5453a" : "#5b6472"}
                soft={p.status === "verified" ? "#ddf3e7" : p.status === "failed" ? "#fbe7e5" : "#e9edf1"}>
                {p.status === "verified" ? "تأییدشده" : p.status === "failed" ? "ناموفق" : "در انتظار"}
              </Chip>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ---------------- sessions ---------------- */

function SessionsTab() {
  const s = useStore();
  const mine = s.sessions.filter(x => x.user_id === s.user!.id).sort((a, b) => b.created_at - a.created_at).slice(0, 6);
  return (
    <div className="anim-up">
      <Card className="p-5 mb-4 flex items-start gap-3.5">
        <Ic n="shield" s={19} c="text-pass shrink-0 mt-0.5" />
        <p className="text-[12.5px] leading-7 text-inksoft">
          <b className="text-ink">سیاست تک‌نشستی:</b> هر اشتراک فقط یک نشست فعال دارد. رفتار ورود هم‌زمان توسط مدیر قابل تنظیم است —
          حالت فعلی: <b className="text-ink">{s.settings.session_mode === "kick" ? "خروج نشست قبلی (Kick)" : "مسدودسازی ورود جدید (Block)"}</b>.
          نشست‌های باطل‌شده بلافاصله از همه دستگاه‌ها خارج می‌شوند.
        </p>
      </Card>
      <Card className="divide-y divide-line overflow-hidden">
        {mine.length === 0 && <div className="p-6 text-center text-[13px] text-mut">نشستی ثبت نشده است.</div>}
        {mine.map(sess => {
          const alive = !sess.revoked_at && sess.expires_at > Date.now();
          return (
            <div key={sess.id} className="px-5 py-4 flex items-center gap-3.5 flex-wrap">
              <span className={`w-10 h-10 rounded-xl grid place-items-center ${alive && sess.current ? "bg-passoft text-pass" : "bg-mist2 text-mut"}`}>
                <Ic n={alive && sess.current ? "check" : "ban"} s={18} />
              </span>
              <div className="flex-1 min-w-[160px]">
                <div className="text-[13.5px] font-bold text-ink flex items-center gap-2 flex-wrap">
                  {sess.device}
                  {sess.current && alive && <Chip tone="#0f8f5b" soft="#ddf3e7">همین دستگاه</Chip>}
                  {sess.revoked_at && <Chip tone="#d5453a" soft="#fbe7e5">باطل‌شده</Chip>}
                </div>
                <div className="text-[11.5px] text-mut font-medium mt-1" dir="ltr">
                  {sess.ip} · {new Date(sess.created_at).toLocaleString("fa-IR")}
                </div>
              </div>
              {alive && (
                <Btn v="outline" sm onClick={() => s.revokeSession(sess.id)}>
                  <Ic n="out" s={14} /> ابطال نشست
                </Btn>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
