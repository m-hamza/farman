import React, { useEffect, useRef, useState } from "react";
import { useStore, fa } from "../store";
import { AGE_RANGES, PROVINCES, READINESS, REFERRALS } from "../data";
import { Btn, Card, Field, Ic, Logo, Reveal, RoadLine, TrafficSign, inputCls } from "../components";

type Step = "phone" | "otp" | "profile";

export default function Auth() {
  const { requestOtp, verifyOtp, completeProfile, toast, user } = useStore();
  const [step, setStep] = useState<Step>(user && !user.onboarded ? "profile" : "phone");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", ""]);
  const [resendIn, setResendIn] = useState(0);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn(x => x - 1), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const sendCode = async () => {
    setErr(""); setBusy(true);
    const r = await requestOtp(phone.trim());
    setBusy(false);
    if (!r.ok) { setErr(r.error!); toast(r.error!, "err"); return; }
    setDemoCode(r.demoCode!);
    setResendIn(30);
    setDigits(["", "", "", "", ""]);
    setStep("otp");
    setTimeout(() => refs.current[0]?.focus(), 80);
  };

  const setDigit = (i: number, v: string) => {
    const val = v.replace(/\D/g, "").slice(-1);
    const fa2en = (s: string) => s.replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
    const d = fa2en(val);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < 4) refs.current[i + 1]?.focus();
    if (next.every(x => x)) void submitOtp(next.join(""));
  };

  const submitOtp = async (code: string) => {
    setBusy(true); setErr("");
    const r = await verifyOtp(phone.trim(), code);
    setBusy(false);
    if (!r.ok) {
      setErr(r.error!);
      setDigits(["", "", "", "", ""]);
      refs.current[0]?.focus();
      return;
    }
    if (r.isNew) setStep("profile");
    else toast("خوش آمدید! نشست قبلی شما طبق سیاست تک‌نشستی جایگزین شد.");
  };

  return (
    <div className="min-h-screen md:grid md:grid-cols-[1fr_480px]">
      {/* -------- brand side -------- */}
      <aside className="hidden md:flex asphalt-tex text-white flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute -left-24 -top-24 w-96 h-96 rounded-full border-[26px] border-white/5" />
        <div className="absolute -right-16 bottom-40 w-72 h-72 rounded-full border-[20px] border-white/5" />
        <div className="relative">
          <Logo size={48} light />
          <p className="text-white/55 mt-3 text-sm font-medium">آزمون و آموزش آیین‌نامه رانندگی</p>
        </div>

        <div className="relative max-w-md">
          <h1 className="font-display text-[44px] leading-[1.35] text-white">
            با <span className="text-brand">فرمان</span>،<br />آیین‌نامه رو جدی بگیر!
          </h1>
          <p className="text-white/65 mt-4 leading-8 text-[15px]">
            بانک سوال به‌روز، آزمون‌های شبیه‌ساز با سوالات تصادفی، مرور هوشمند اشتباه‌ها و اشتراک سالانه — همه در یک اپ.
          </p>
          <div className="flex items-center gap-5 mt-8">
            <div className="anim-float"><TrafficSign k="stop" size={74} /></div>
            <div className="anim-float" style={{ animationDelay: "0.8s" }}><TrafficSign k="yield" size={68} /></div>
            <div className="anim-float" style={{ animationDelay: "1.6s" }}><TrafficSign k="speedlimit" size={70} /></div>
            <div className="anim-float" style={{ animationDelay: "2.4s" }}><TrafficSign k="roundabout" size={66} /></div>
          </div>
        </div>

        <div className="relative">
          <RoadLine className="mb-6" />
          <div className="flex gap-8 text-[13px] text-white/60 font-medium">
            <span className="flex items-center gap-2"><Ic n="shield" s={16} c="text-brand" /> ورود امن با کد یکبارمصرف</span>
            <span className="flex items-center gap-2"><Ic n="target" s={16} c="text-brand" /> انتخاب هوشمند سوالات</span>
            <span className="flex items-center gap-2"><Ic n="lock" s={16} c="text-brand" /> تک‌نشستی روی دستگاه‌ها</span>
          </div>
        </div>
      </aside>

      {/* -------- form side -------- */}
      <main className="app-bg min-h-screen flex flex-col items-center justify-center p-6">
        <div className="md:hidden mb-8"><Logo /></div>

        <Card className="w-full max-w-[420px] p-7">
          {/* stepper */}
          <div className="flex items-center gap-2 mb-7">
            {(["phone", "otp", "profile"] as Step[]).map((s, i) => (
              <React.Fragment key={s}>
                <span className={`w-7 h-7 rounded-full grid place-items-center text-[12px] font-bold transition-colors ${
                  step === s ? "bg-brand text-brandink" :
                  (step === "profile" && i < 2) || (step === "otp" && i === 0) ? "bg-pass text-white" : "bg-mist2 text-mut"}`}>
                  {(step === "profile" && i < 2) || (step === "otp" && i === 0) ? <Ic n="check" s={14} /> : fa(i + 1)}
                </span>
                {i < 2 && <span className={`h-0.5 flex-1 rounded ${
                  (step === "otp" && i === 0) || step === "profile" ? "bg-pass" : "bg-mist2"}`} />}
              </React.Fragment>
            ))}
          </div>

          {step === "phone" && (
            <div className="anim-up">
              <h2 className="font-display text-[26px] text-ink">ورود / ثبت‌نام</h2>
              <p className="text-[13.5px] text-mut mt-1 mb-6 leading-6">
                شماره موبایل خود را وارد کنید؛ کد تأیید برایتان پیامک می‌شود. ورود و ثبت‌نام یک مرحله‌ای است.
              </p>
              <Field label="شماره موبایل" error={err}>
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-mut"><Ic n="phone" s={18} /></span>
                  <input dir="ltr" inputMode="numeric" value={phone} autoFocus maxLength={11}
                    onChange={e => setPhone(e.target.value.replace(/[^0-9۰-۹]/g, "").replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))))}
                    onKeyDown={e => e.key === "Enter" && !busy && sendCode()}
                    placeholder="09xxxxxxxxx"
                    className={`${inputCls} pl-4 pr-11 text-left font-bold tracking-wider`} />
                </div>
              </Field>
              <Btn full className="mt-5" disabled={busy || phone.length !== 11} onClick={sendCode}>
                {busy ? <span className="w-5 h-5 border-2 border-brandink/30 border-t-brandink rounded-full animate-spin" /> : <Ic n="send" s={17} />}
                ارسال کد تأیید
              </Btn>
              <div className="mt-5 flex items-start gap-2 text-[12px] text-mut leading-5">
                <Ic n="shield" s={15} c="mt-0.5 shrink-0 text-pass" />
                کد به‌صورت هش‌شده ذخیره، منقضی و تک‌بارمصرف است. ورود شما روی یک نشست فعال محدود می‌شود.
              </div>
            </div>
          )}

          {step === "otp" && (
            <div className="anim-up">
              <button onClick={() => setStep("phone")} className="text-[12.5px] font-bold text-mut hover:text-ink flex items-center gap-1 mb-4">
                <Ic n="chevR" s={15} /> تغییر شماره
              </button>
              <h2 className="font-display text-[26px] text-ink">کد تأیید</h2>
              <p className="text-[13.5px] text-mut mt-1 mb-1 leading-6">
                کد ۵ رقمی ارسال‌شده به <b dir="ltr" className="text-ink">{phone}</b> را وارد کنید.
              </p>

              <div className="my-4 rounded-xl border border-dashed border-branddeep/50 bg-brand/10 px-4 py-2.5 flex items-center justify-between">
                <span className="text-[12px] font-bold text-brandink/70">نسخه دمو — کد شما:</span>
                <span dir="ltr" className="font-display text-[22px] text-branddeep tracking-[0.3em]">{demoCode}</span>
              </div>

              <div dir="ltr" className="flex gap-2.5 justify-center my-5">
                {digits.map((d, i) => (
                  <input key={i} ref={el => { refs.current[i] = el; }} value={d} inputMode="numeric" maxLength={1}
                    onChange={e => setDigit(i, e.target.value)}
                    onKeyDown={e => { if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus(); }}
                    className="w-12 h-14 text-center text-[22px] font-display rounded-xl border border-line bg-mist focus:bg-paper focus:border-branddeep transition-colors" />
                ))}
              </div>

              {err && <div className="text-[12.5px] text-fail font-bold flex items-center gap-1.5 justify-center"><Ic n="alert" s={14} />{err}</div>}

              <Btn full className="mt-4" disabled={busy || digits.some(d => !d)}
                onClick={() => submitOtp(digits.join(""))}>
                {busy && <span className="w-5 h-5 border-2 border-brandink/30 border-t-brandink rounded-full animate-spin" />}
                تأیید کد
              </Btn>

              <div className="text-center mt-4 text-[13px] text-mut font-medium">
                {resendIn > 0 ? (
                  <span>ارسال مجدد کد تا <b className="text-ink">{fa(resendIn)}</b> ثانیه دیگر</span>
                ) : (
                  <button onClick={sendCode} className="font-bold text-info hover:underline flex items-center gap-1.5 mx-auto">
                    <Ic n="refresh" s={15} /> ارسال مجدد کد
                  </button>
                )}
              </div>
            </div>
          )}

          {step === "profile" && <ProfileForm onDone={completeProfile} />}
        </Card>

        <Reveal delay={120} className="w-full max-w-[420px] mt-5">
          <div className="flex items-center justify-between text-[11.5px] text-mut font-medium px-2">
            <span>نسخه دمو — API v1</span>
            <span className="flex items-center gap-1.5"><Ic n="db" s={13} /> SQLite-like / Local Persist</span>
            <span>سوپرادمین: <b dir="ltr">09999999999</b></span>
          </div>
        </Reveal>
      </main>
    </div>
  );
}

/* ---------------- profile completion ---------------- */

function ProfileForm({ onDone }: { onDone: (d: Record<string, unknown>) => Promise<{ ok: boolean; error?: string }> }) {
  const { toast } = useStore();
  const [f, setF] = useState({
    first_name: "", last_name: "", province: "", city: "",
    age_range: "", readiness: "", referral: "", exam_date: "", marketing_consent: false,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const cities = PROVINCES.find(p => p.name === f.province)?.cities || [];

  const submit = async () => {
    setBusy(true); setErr("");
    const r = await onDone(f);
    setBusy(false);
    if (!r.ok) { setErr(r.error!); toast(r.error!, "err"); }
  };

  return (
    <div className="anim-up">
      <h2 className="font-display text-[26px] text-ink">تکمیل پروفایل</h2>
      <p className="text-[13.5px] text-mut mt-1 mb-5 leading-6">
        خوش آمدید! چند اطلاعات پایه برای شخصی‌سازی تجربه لازم است.
      </p>

      <div className="grid grid-cols-2 gap-3.5">
        <Field label="نام *"><input className={inputCls} value={f.first_name} onChange={e => setF({ ...f, first_name: e.target.value })} placeholder="علی" /></Field>
        <Field label="نام خانوادگی *"><input className={inputCls} value={f.last_name} onChange={e => setF({ ...f, last_name: e.target.value })} placeholder="محمدی" /></Field>
        <Field label="استان *">
          <select className={inputCls} value={f.province} onChange={e => setF({ ...f, province: e.target.value, city: "" })}>
            <option value="">انتخاب کنید</option>
            {PROVINCES.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="شهر *">
          <select className={inputCls} value={f.city} disabled={!f.province} onChange={e => setF({ ...f, city: e.target.value })}>
            <option value="">انتخاب کنید</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
      </div>

      <div className="my-4 flex items-center gap-3 text-[12px] font-bold text-mut">
        <span className="h-px flex-1 bg-line" /> اطلاعات اختیاری <span className="h-px flex-1 bg-line" />
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <Field label="بازه سنی" hint="اختیاری">
          <select className={inputCls} value={f.age_range} onChange={e => setF({ ...f, age_range: e.target.value })}>
            <option value="">—</option>{AGE_RANGES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>
        <Field label="تاریخ تقریبی آزمون" hint="اختیاری">
          <input type="date" className={inputCls} value={f.exam_date} onChange={e => setF({ ...f, exam_date: e.target.value })} />
        </Field>
        <Field label="سطح آمادگی" hint="اختیاری">
          <select className={inputCls} value={f.readiness} onChange={e => setF({ ...f, readiness: e.target.value })}>
            <option value="">—</option>{READINESS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>
        <Field label="چطور با ما آشنا شدید؟" hint="اختیاری">
          <select className={inputCls} value={f.referral} onChange={e => setF({ ...f, referral: e.target.value })}>
            <option value="">—</option>{REFERRALS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>
      </div>

      <label className="flex items-start gap-3 mt-5 p-3.5 rounded-xl bg-mist border border-line cursor-pointer hover:border-branddeep/40 transition-colors">
        <input type="checkbox" checked={f.marketing_consent}
          onChange={e => setF({ ...f, marketing_consent: e.target.checked })}
          className="mt-1 w-4.5 h-4.5 accent-[#0f8f5b]" style={{ width: 18, height: 18 }} />
        <span className="text-[12.5px] leading-6 text-inksoft">
          <b className="text-ink">رضایت بازاریابی (اختیاری):</b> مایل‌ام اخبار تخفیف‌ها و یادآوری آزمون را دریافت کنم.
          بدون این رضایت هم از همه امکانات سرویس استفاده می‌کنم. <span className="text-mut">(consent-v1)</span>
        </span>
      </label>

      {err && <div className="text-[12.5px] text-fail font-bold mt-3 flex items-center gap-1.5"><Ic n="alert" s={14} />{err}</div>}

      <Btn full className="mt-5" disabled={busy} onClick={submit}>
        {busy ? <span className="w-5 h-5 border-2 border-brandink/30 border-t-brandink rounded-full animate-spin" /> : <Ic n="check" s={18} />}
        شروع مسیر یادگیری
      </Btn>
    </div>
  );
}
