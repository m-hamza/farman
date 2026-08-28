import React, { useState } from "react";
import { useStore, fa, faMoney } from "../store";
import { GATEWAYS, PROVINCES, type Plan } from "../data";
import { Btn, Card, Chip, Field, Ic, Modal, Toggle, inputCls } from "../components";
import type { NavFn } from "./Dashboard";

export default function Profile({ nav, initTab }: { nav: NavFn; initTab?: string }) {
  const s = useStore();
  const u = s.user!;
  const plan = s.plan || s.plans[0];
  const [tab, setTab] = useState(initTab || "account");
  const [payPlan, setPayPlan] = useState<Plan | null>(null);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 anim-up flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-[32px] leading-tight text-ink">پروفایل</h1>
          <p className="text-[13.5px] text-mut mt-1">حساب، اشتراک، نشست‌ها و پرداخت‌های شما</p>
        </div>
        {u.role === "superadmin" && (
          <Btn v="ink" onClick={() => nav("admin")}><Ic n="shield" s={17} /> پنل مدیریت</Btn>
        )}
      </div>

      <div className="flex gap-2 flex-wrap mb-6 anim-up" style={{ animationDelay: "60ms" }}>
        {[
          { id: "account", label: "حساب کاربری", icon: "user" },
          { id: "plans", label: "اشتراک و طرح‌ها", icon: "crown" },
          { id: "payments", label: "پرداخت‌ها", icon: "wallet" },
          { id: "sessions", label: "نشست‌های فعال", icon: "shield" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 rounded-xl text-[13px] font-bold border-2 transition-all flex items-center gap-2 ${
              tab === t.id ? "bg-asphalt text-white border-asphalt shadow-pop" : "border-line bg-paper text-inksoft hover:border-asphalt3"}`}>
            <Ic n={t.icon} s={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "account" && <AccountTab />}
      {tab === "plans" && <PlansTab onPick={setPayPlan} currentPlan={plan.id} />}
      {tab === "payments" && <PaymentsTab />}
      {tab === "sessions" && <SessionsTab />}

      <PaymentModal plan={payPlan} onClose={() => setPayPlan(null)} />
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

  return (
    <div className="anim-up grid lg:grid-cols-2 gap-5">
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <span className="w-16 h-16 rounded-2xl bg-asphalt text-brand grid place-items-center font-display text-[30px]">
            {(u.first_name || "؟")[0]}
          </span>
          <div>
            <div className="font-display text-[23px] text-ink leading-tight">{u.first_name} {u.last_name}</div>
            <div dir="ltr" className="text-[13px] font-bold text-mut text-right mt-0.5">{u.phone}</div>
            <div className="flex gap-1.5 mt-1.5">
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

        <div className="flex gap-2.5 mt-5">
          <Btn v="outline" full onClick={() => setEdit(true)}><Ic n="edit" s={16} /> ویرایش پروفایل</Btn>
          <Btn v="danger" full onClick={s.logout}><Ic n="out" s={16} /> خروج از حساب</Btn>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-display text-[20px] text-ink mb-4">وضعیت اشتراک</h3>
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

/* ---------------- plans ---------------- */

function PlansTab({ onPick, currentPlan }: { onPick: (p: Plan) => void; currentPlan: string }) {
  const s = useStore();
  return (
    <div className="anim-up">
      <div className="grid md:grid-cols-3 gap-4 items-stretch">
        {s.plans.map(p => {
          const current = p.id === currentPlan && !!s.sub;
          const popular = p.tag === "پرطرفدار";
          return (
            <Card key={p.id} className={`p-6 flex flex-col relative ${popular ? "!border-branddeep/60 shadow-pop" : ""} ${current ? "!border-pass" : ""}`}>
              {p.tag && (
                <span className={`absolute -top-3 right-5 text-[11px] font-extrabold px-3 py-1 rounded-full ${popular ? "bg-brand text-brandink" : "bg-asphalt text-brand"}`}>
                  {p.tag}
                </span>
              )}
              <div className="flex items-center justify-between">
                <h3 className="font-display text-[24px] text-ink">{p.name}</h3>
                {current && <Chip tone="#0f8f5b" soft="#ddf3e7">فعال</Chip>}
              </div>
              <div className="font-display text-[30px] text-ink mt-2">
                {p.price === 0 ? "رایگان" : <>{fa(p.price)} <span className="text-[15px] text-mut">تومان / سال</span></>}
              </div>
              <div className="h-px bg-line my-4" />
              <div className="space-y-2.5 flex-1">
                {p.perks.map(perk => (
                  <div key={perk} className="flex items-center gap-2.5 text-[13px] font-medium text-inksoft">
                    <Ic n="check" s={15} c="text-pass shrink-0" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
              <Btn v={popular ? "brand" : "ink"} full className="mt-5" onClick={() => onPick(p)}>
                {p.price === 0 ? "طرح پایه" : current ? "تمدید این طرح" : "خرید این طرح"}
              </Btn>
            </Card>
          );
        })}
      </div>

      <Card className="p-5 mt-5 flex items-start gap-3.5">
        <Ic n="info" s={19} c="text-info shrink-0 mt-0.5" />
        <p className="text-[12.5px] leading-7 text-inksoft">
          <b className="text-ink">معماری دسترسی:</b> اشتراک شما مجموعه‌ای از قابلیت‌هاست (Feature-based) — تعداد آزمون روزانه، طول آزمون،
          دسته‌های مجاز و محتواها مستقل از نام طرح کنترل می‌شوند و بررسی نهایی همیشه سمت Backend انجام می‌شود.
          انقضا: پایان ۳۶۵ روز، بدون دوره ارفاق (Grace Period = {fa(s.settings.grace_days)} روز).
        </p>
      </Card>
    </div>
  );
}

/* ---------------- payment modal ---------------- */

function PaymentModal({ plan, onClose }: { plan: Plan | null; onClose: () => void }) {
  const s = useStore();
  const [step, setStep] = useState<"gateway" | "redirect" | "verify" | "done">("gateway");
  const [gw, setGw] = useState("zarinpal");
  const [err, setErr] = useState("");

  React.useEffect(() => { if (plan) { setStep("gateway"); setErr(""); setGw(s.gateways.zarinpal ? "zarinpal" : "cafebazaar"); } }, [plan]); // eslint-disable-line

  const pay = async () => {
    if (!plan) return;
    if (plan.price === 0) { s.toast("طرح رایگان به‌صورت خودکار برای همه فعال است.", "info"); onClose(); return; }
    setStep("redirect");
    const r = await s.buyPlan(plan.id, gw);
    if (!r.ok) { setErr(r.error!); setStep("gateway"); return; }
    setTimeout(() => {
      setStep("verify");
      setTimeout(async () => {
        const v = await s.verifyPayment(r.ref!);
        if (v.ok) setStep("done");
        else { setErr(v.error!); setStep("gateway"); }
      }, 600);
    }, 1400);
  };

  const activeGateways = GATEWAYS.filter(g => s.gateways[g.id]);

  return (
    <Modal open={!!plan} onClose={onClose} title={plan?.price === 0 ? "طرح رایگان" : "پرداخت امن"}>
      {!plan ? null : step === "gateway" ? (
        <div>
          <div className="rounded-xl bg-mist p-4 flex items-center justify-between mb-4">
            <span className="font-bold text-[14px] text-ink">اشتراک یک‌ساله «{plan.name}»</span>
            <span className="font-display text-[22px] text-branddeep">{faMoney(plan.price)}</span>
          </div>

          {activeGateways.length === 0 && (
            <div className="rounded-xl bg-failsoft text-fail p-4 text-[13px] font-bold flex items-center gap-2 mb-4">
              <Ic n="alert" s={17} /> در حال حاضر هیچ درگاه پرداختی فعال نیست.
            </div>
          )}

          <div className="grid gap-2.5">
            {GATEWAYS.map(g => {
              const enabled = s.gateways[g.id];
              return (
                <button key={g.id} disabled={!enabled} onClick={() => setGw(g.id)}
                  className={`text-right p-4 rounded-xl border-2 flex items-center gap-3.5 transition-all ${
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

          {err && <div className="text-[12.5px] text-fail font-bold mt-3 flex items-center gap-1.5"><Ic n="alert" s={14} />{err}</div>}

          <Btn full className="mt-5" disabled={activeGateways.length === 0} onClick={pay}>
            <Ic n="lock" s={17} /> پرداخت {faMoney(plan.price)}
          </Btn>
          <p className="text-[11px] text-mut text-center mt-3 leading-5">
            وضعیت پرداخت فقط پس از Verify سمت سرور ثبت می‌شود؛ Callback تکراری هم پرداخت را تکرار نمی‌کند (Idempotent).
          </p>
        </div>
      ) : step === "redirect" ? (
        <div className="text-center py-8 anim-in">
          <span className="inline-block w-14 h-14 border-4 border-mist2 border-t-branddeep rounded-full animate-spin mb-4" />
          <p className="font-bold text-[15px] text-ink">در حال انتقال به درگاه {GATEWAYS.find(g => g.id === gw)?.name}…</p>
          <p className="text-[12px] text-mut mt-1.5">شبیه‌سازی Redirect کاربر به صفحه بانک</p>
        </div>
      ) : step === "verify" ? (
        <div className="text-center py-8 anim-in">
          <span className="inline-block w-14 h-14 border-4 border-mist2 border-t-pass rounded-full animate-spin mb-4" />
          <p className="font-bold text-[15px] text-ink">بازگشت از درگاه — در حال Verify سمت سرور</p>
          <p className="text-[12px] text-mut mt-1.5">استعلام مرجع تراکنش از {GATEWAYS.find(g => g.id === gw)?.name} (هرگز به کلاینت اعتماد نمی‌شود)</p>
        </div>
      ) : (
        <div className="text-center py-6 anim-pop">
          <span className="inline-grid place-items-center w-16 h-16 rounded-full bg-passoft text-pass mb-4"><Ic n="check" s={30} /></span>
          <p className="font-display text-[24px] text-ink">پرداخت موفق بود!</p>
          <p className="text-[13px] text-mut mt-1.5 leading-6">اشتراک «{plan.name}» تا ۳۶۵ روز آینده فعال شد.</p>
          <Btn full className="mt-5" onClick={onClose}>بازگشت به پروفایل</Btn>
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
                <Ic n={p.status === "verified" ? "check" : "clock"} s={17} />
              </span>
              <div className="flex-1 min-w-[140px]">
                <div className="text-[13.5px] font-bold text-ink">{s.plans.find(x => x.id === p.plan_id)?.name} — {GATEWAYS.find(g => g.id === p.gateway)?.name}</div>
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
                <div className="text-[13.5px] font-bold text-ink flex items-center gap-2">
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
