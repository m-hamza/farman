import React, { useMemo, useState } from "react";
import { useStore, fa, faMoney } from "../store";
import { ARTICLES, CATEGORIES, CORE_TABLES, type CatId, type Question, type SchemaCol, type SchemaTable } from "../data";
import { Btn, Card, Chip, Field, Ic, Modal, Toggle, inputCls } from "../components";

const TABS = [
  { id: "dash", label: "داشبورد", icon: "chart" },
  { id: "users", label: "کاربران", icon: "users" },
  { id: "questions", label: "بانک سوالات", icon: "list" },
  { id: "plans", label: "طرح‌ها و دسترسی", icon: "crown" },
  { id: "settings", label: "امنیت و پیکربندی", icon: "gear" },
  { id: "db", label: "مدیریت دیتابیس", icon: "db" },
  { id: "audit", label: "گزارش رویدادها", icon: "eye" },
];

export default function Admin() {
  const [tab, setTab] = useState("dash");
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6 anim-up">
        <div>
          <h1 className="font-display text-[32px] leading-tight text-ink flex items-center gap-3">
            پنل مدیریت <Chip tone="#d99a00" soft="#fdf0dd">Super Admin</Chip>
          </h1>
          <p className="text-[13.5px] text-mut mt-1">مدیریت کامل پلتفرم — هر تغییر حساس در گزارش رویدادها ثبت می‌شود.</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-6 anim-up" style={{ animationDelay: "60ms" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3.5 py-2.5 rounded-xl text-[12.5px] font-bold border-2 transition-all flex items-center gap-2 ${
              tab === t.id ? "bg-asphalt text-white border-asphalt shadow-pop" : "border-line bg-paper text-inksoft hover:border-asphalt3"}`}>
            <Ic n={t.icon} s={15} /> {t.label}
          </button>
        ))}
      </div>

      <div key={tab} className="anim-up">
        {tab === "dash" && <DashTab />}
        {tab === "users" && <UsersTab />}
        {tab === "questions" && <QuestionsTab />}
        {tab === "plans" && <PlansTab />}
        {tab === "settings" && <SettingsTab />}
        {tab === "db" && <DbTab />}
        {tab === "audit" && <AuditTab />}
      </div>
    </div>
  );
}

/* ---------------- dashboard ---------------- */

function DashTab() {
  const s = useStore();
  const activeSubs = s.subs.filter(x => x.status === "active" && x.ends_at > Date.now()).length;
  const revenue = s.payments.filter(p => p.status === "verified").reduce((a, b) => a + b.amount, 0);
  const stats = [
    { icon: "users", label: "کاربران", val: fa(s.users.length), tone: "#2e6fae", soft: "#e6f0f9" },
    { icon: "crown", label: "اشتراک فعال", val: fa(activeSubs), tone: "#d99a00", soft: "#fdf0dd" },
    { icon: "wallet", label: "درآمد تأییدشده", val: `${fa(revenue)} ت`, tone: "#0f8f5b", soft: "#ddf3e7" },
    { icon: "list", label: "سوالات بانک", val: fa(s.questions.length), tone: "#a13a63", soft: "#f9e7ef" },
  ];
  return (
    <div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {stats.map(t => (
          <Card key={t.label} className="p-5">
            <span className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: t.soft, color: t.tone }}><Ic n={t.icon} s={19} /></span>
            <div className="font-display text-[30px] text-ink mt-3 leading-none">{t.val}</div>
            <div className="text-[12.5px] font-bold text-mut mt-1.5">{t.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mt-5">
        <Card className="p-6">
          <h3 className="font-display text-[20px] text-ink mb-4">آخرین پرداخت‌ها</h3>
          {s.payments.length === 0 ? <p className="text-[13px] text-mut">پرداختی ثبت نشده.</p> : (
            <div className="space-y-2.5">
              {s.payments.slice(0, 5).map(p => (
                <div key={p.id} className="flex items-center gap-3 text-[12.5px]">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${p.status === "verified" ? "bg-pass" : "bg-fail"}`} />
                  <span className="font-bold text-ink flex-1 truncate">{s.users.find(u => u.id === p.user_id)?.phone || "—"}</span>
                  <span className="text-mut">{s.plans.find(x => x.id === p.plan_id)?.name}</span>
                  <span className="font-bold text-ink">{fa(p.amount)} ت</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-6">
          <h3 className="font-display text-[20px] text-ink mb-4">آخرین رویدادهای امنیتی</h3>
          {s.audit.length === 0 ? <p className="text-[13px] text-mut">رویدادی ثبت نشده.</p> : (
            <div className="space-y-2.5">
              {s.audit.slice(0, 5).map(a => (
                <div key={a.id} className="flex items-center gap-3 text-[12.5px]">
                  <Ic n="shield" s={14} c="text-pass shrink-0" />
                  <span className="font-bold text-ink" dir="ltr">{a.action}</span>
                  <span className="text-mut flex-1 truncate text-left" dir="ltr">{a.target || ""}</span>
                  <span className="text-mut text-[11px]">{new Date(a.at).toLocaleTimeString("fa-IR")}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ---------------- users ---------------- */

function UsersTab() {
  const s = useStore();
  const [grant, setGrant] = useState<string | null>(null);
  const [grantPlan, setGrantPlan] = useState<"free" | "standard" | "premium">("standard");
  const [grantDays, setGrantDays] = useState(365);

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 border-b border-line flex items-center justify-between">
        <h3 className="font-display text-[20px] text-ink">کاربران ({fa(s.users.length)})</h3>
        <Chip tone="#2e6fae" soft="#e6f0f9">تک‌نشستی: {s.settings.session_mode === "kick" ? "Kick" : "Block"}</Chip>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-right text-[11.5px] text-mut font-bold bg-mist">
              <th className="px-5 py-3">کاربر</th><th className="px-3 py-3">نقش</th><th className="px-3 py-3">اشتراک</th>
              <th className="px-3 py-3">نشست</th><th className="px-3 py-3">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {s.users.map(u => {
              const sub = s.subs.find(x => x.user_id === u.id && x.status === "active" && x.ends_at > Date.now());
              const sess = s.sessions.filter(x => x.user_id === u.id && !x.revoked_at && x.expires_at > Date.now()).sort((a, b) => b.created_at - a.created_at)[0];
              return (
                <tr key={u.id} className="hover:bg-mist/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-ink">{u.first_name ? `${u.first_name} ${u.last_name}` : "—"}</div>
                    <div className="text-mut text-[11.5px]" dir="ltr">{u.phone}</div>
                  </td>
                  <td className="px-3 py-3.5">{u.role === "superadmin" ? <Chip tone="#d99a00" soft="#fdf0dd">سوپرادمین</Chip> : <Chip>کاربر</Chip>}</td>
                  <td className="px-3 py-3.5">
                    {sub ? (
                      <span className="flex items-center gap-2">
                        <Chip tone="#0f8f5b" soft="#ddf3e7">{s.plans.find(p => p.id === sub.plan_id)?.name}</Chip>
                        <span className="text-[11.5px] text-mut font-bold">{fa(Math.ceil((sub.ends_at - Date.now()) / 86400000))} روز</span>
                      </span>
                    ) : <Chip tone="#d5453a" soft="#fbe7e5">بدون اشتراک</Chip>}
                  </td>
                  <td className="px-3 py-3.5">
                    {sess ? (
                      <button onClick={() => s.revokeSession(sess.id)} title="ابطال نشست"
                        className="flex items-center gap-1.5 text-[12px] font-bold text-pass hover:text-fail transition-colors">
                        <span className="w-2 h-2 rounded-full bg-pass animate-pulse" /> {sess.device}
                      </button>
                    ) : <span className="text-mut text-[12px]">—</span>}
                  </td>
                  <td className="px-3 py-3.5">
                    <Btn v="outline" sm onClick={() => { setGrant(u.id); setGrantPlan(sub?.plan_id || "standard"); }}>
                      <Ic n="crown" s={14} /> تنظیم اشتراک
                    </Btn>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {s.users.length === 0 && <p className="p-6 text-center text-[13px] text-mut">کاربری ثبت‌نام نکرده است.</p>}
      </div>

      <Modal open={!!grant} onClose={() => setGrant(null)} title="اعمال اشتراک دستی">
        <div className="space-y-4">
          <Field label="طرح">
            <select className={inputCls} value={grantPlan} onChange={e => setGrantPlan(e.target.value as typeof grantPlan)}>
              {s.plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="مدت (روز)">
            <input type="number" className={inputCls} value={grantDays} min={1} max={730}
              onChange={e => setGrantDays(Math.max(1, Number(e.target.value)))} />
          </Field>
          <Btn full onClick={() => { s.adminGrant(grant!, grantPlan, grantDays); setGrant(null); }}>
            <Ic n="check" s={17} /> اعمال اشتراک
          </Btn>
        </div>
      </Modal>
    </Card>
  );
}

/* ---------------- questions ---------------- */

function QuestionsTab() {
  const s = useStore();
  const [q, setQ] = useState("");
  const [fCat, setFCat] = useState("all");
  const [fDiff, setFDiff] = useState(0);
  const [fStatus, setFStatus] = useState("all");
  const [sel, setSel] = useState<string[]>([]);
  const [editQ, setEditQ] = useState<Question | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const list = useMemo(() => s.questions.filter(x =>
    (fCat === "all" || x.cat === fCat) &&
    (!fDiff || x.diff === fDiff) &&
    (fStatus === "all" || x.status === fStatus) &&
    (!q || x.text.includes(q) || x.tags.some(t => t.includes(q)))
  ), [s.questions, q, fCat, fDiff, fStatus]);

  const toggleSel = (id: string) => setSel(v => v.includes(id) ? v.filter(x => x !== id) : [...v, id]);

  return (
    <div>
      <Card className="p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-mut"><Ic n="search" s={17} /></span>
            <input className={`${inputCls} pr-10`} placeholder="جست‌وجوی متن یا برچسب…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <select className={`${inputCls} !w-auto`} value={fCat} onChange={e => setFCat(e.target.value)}>
            <option value="all">همه دسته‌ها</option>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className={`${inputCls} !w-auto`} value={fDiff} onChange={e => setFDiff(Number(e.target.value))}>
            <option value={0}>هر سختی</option><option value={1}>آسان</option><option value={2}>متوسط</option><option value={3}>سخت</option>
          </select>
          <select className={`${inputCls} !w-auto`} value={fStatus} onChange={e => setFStatus(e.target.value)}>
            <option value="all">هر وضعیت</option><option value="active">فعال</option><option value="draft">پیش‌نویس</option><option value="archived">آرشیو</option>
          </select>
          <Btn v="ink" sm onClick={() => setImportOpen(true)}><Ic n="upload" s={15} /> Import JSON</Btn>
        </div>

        {sel.length > 0 && (
          <div className="flex items-center gap-2.5 mt-3.5 pt-3.5 border-t border-line anim-in flex-wrap">
            <Chip tone="#2e6fae" soft="#e6f0f9">{fa(sel.length)} انتخاب‌شده</Chip>
            <Btn v="outline" sm onClick={() => { s.bulkQuestions(sel, { status: "active" }); setSel([]); }}>فعال</Btn>
            <Btn v="outline" sm onClick={() => { s.bulkQuestions(sel, { status: "draft" }); setSel([]); }}>پیش‌نویس</Btn>
            <Btn v="outline" sm onClick={() => { s.bulkQuestions(sel, { status: "archived" }); setSel([]); }}>آرشیو</Btn>
            <Btn v="ghost" sm onClick={() => setSel([])}>لغو انتخاب</Btn>
          </div>
        )}
      </Card>

      <div className="grid gap-2.5">
        {list.slice(0, 30).map(x => {
          const c = CATEGORIES.find(cc => cc.id === x.cat)!;
          return (
            <Card key={x.id} className="px-4 py-3 flex items-center gap-3.5">
              <input type="checkbox" checked={sel.includes(x.id)} onChange={() => toggleSel(x.id)}
                className="w-4 h-4 accent-[#2e6fae] shrink-0" />
              <Chip tone={c.tone} soft={c.soft} className="shrink-0">{c.name}</Chip>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-ink truncate">{x.text}</p>
                <p className="text-[11px] text-mut font-medium mt-0.5">
                  سختی {fa(x.diff)} · {x.tags.map(t => `#${t}`).join(" ")} · {x.options[x.correct]}
                </p>
              </div>
              <Chip tone={x.status === "active" ? "#0f8f5b" : x.status === "draft" ? "#b45309" : "#5b6472"}
                soft={x.status === "active" ? "#ddf3e7" : x.status === "draft" ? "#fdf0dd" : "#e9edf1"}>
                {x.status === "active" ? "فعال" : x.status === "draft" ? "پیش‌نویس" : "آرشیو"}
              </Chip>
              <Btn v="outline" sm onClick={() => setEditQ(x)}><Ic n="edit" s={14} /></Btn>
            </Card>
          );
        })}
        {list.length === 0 && <Card><p className="p-8 text-center text-[13px] text-mut">سوالی با این فیلترها پیدا نشد.</p></Card>}
      </div>
      {list.length > 30 && <p className="text-center text-[12px] text-mut mt-4">نمایش ۳۰ مورد از {fa(list.length)} — Pagination سمت API</p>}

      {editQ && <EditQuestion q={editQ} onClose={() => setEditQ(null)} />}
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}

function EditQuestion({ q, onClose }: { q: Question; onClose: () => void }) {
  const s = useStore();
  const [f, setF] = useState({ text: q.text, explain: q.explain, cat: q.cat, diff: q.diff, status: q.status, correct: q.correct });
  const [opts, setOpts] = useState(q.options);
  return (
    <Modal open onClose={onClose} title="ویرایش سوال" w="max-w-2xl">
      <div className="space-y-4">
        <Field label="متن سوال"><textarea rows={2} className={inputCls} value={f.text} onChange={e => setF({ ...f, text: e.target.value })} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="دسته">
            <select className={inputCls} value={f.cat} onChange={e => setF({ ...f, cat: e.target.value as CatId })}>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="سختی">
            <select className={inputCls} value={f.diff} onChange={e => setF({ ...f, diff: Number(e.target.value) as 1 | 2 | 3 })}>
              <option value={1}>آسان</option><option value={2}>متوسط</option><option value={3}>سخت</option>
            </select>
          </Field>
          <Field label="وضعیت">
            <select className={inputCls} value={f.status} onChange={e => setF({ ...f, status: e.target.value as Question["status"] })}>
              <option value="active">فعال</option><option value="draft">پیش‌نویس</option><option value="archived">آرشیو</option>
            </select>
          </Field>
        </div>
        <div>
          <div className="text-[13px] font-bold text-inksoft mb-1.5">گزینه‌ها (گزینه صحیح را علامت بزنید)</div>
          <div className="space-y-2">
            {opts.map((o, i) => (
              <div key={i} className="flex gap-2 items-center">
                <button onClick={() => setF({ ...f, correct: i })}
                  className={`w-9 h-9 rounded-lg grid place-items-center shrink-0 border-2 transition-all ${f.correct === i ? "bg-pass border-pass text-white" : "border-line bg-paper text-mut hover:border-pass"}`}>
                  <Ic n="check" s={15} />
                </button>
                <input className={inputCls} value={o} onChange={e => setOpts(opts.map((x, j) => j === i ? e.target.value : x))} />
              </div>
            ))}
          </div>
        </div>
        <Field label="توضیح پاسخ"><textarea rows={2} className={inputCls} value={f.explain} onChange={e => setF({ ...f, explain: e.target.value })} /></Field>
        <Btn full onClick={() => { s.updateQuestion(q.id, { ...f, options: opts }); onClose(); }}><Ic n="check" s={17} /> ذخیره سوال</Btn>
      </div>
    </Modal>
  );
}

const SAMPLE_JSON = `[
  {"cat":"signs","text":"تابلوی مربع آبی با فلش سفید رو به بالا نشانه چیست؟","options":["مسیر یک‌طرفه","مسیر مستقیم الزامی","پایان محدودیت","احتیاط"],"correct":0,"diff":1,"explain":"این تابلو مسیر یک‌طرفه را اعلام می‌کند.","tags":["تابلو"]},
  {"cat":"rules","text":"حداکثر تعداد مجاز سرنشین خودروی سواری چند نفر است؟","options":["ظرفیت مندرج در کارت خودرو","۴ نفر","۵ نفر","محدودیتی ندارد"],"correct":0,"diff":1,"explain":"ظرفیت قانونی همان عدد مندرج در کارت خودرو است.","tags":["قوانین"]}
]`;

function ImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useStore();
  const [raw, setRaw] = useState("");
  const [preview, setPreview] = useState<Question[] | null>(null);
  const [errs, setErrs] = useState<string[]>([]);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<number | null>(null);

  const run = () => {
    setErr(""); setErrs([]); setPreview(null);
    const r = s.importQuestions(raw);
    if (!r.ok) { setErr(r.error!); setErrs(r.errors || []); return; }
    setPreview(r.preview!);
    setErrs(r.errors || []);
  };

  const commit = () => {
    if (!preview) return;
    s.commitImport(preview);
    setDone(preview.length);
    setPreview(null); setRaw("");
  };

  return (
    <Modal open={open} onClose={() => { onClose(); setDone(null); setPreview(null); setRaw(""); }} title="Import JSON — افزودن گروهی سوال" w="max-w-2xl">
      {done !== null ? (
        <div className="text-center py-6 anim-pop">
          <span className="inline-grid place-items-center w-16 h-16 rounded-full bg-passoft text-pass mb-4"><Ic n="check" s={30} /></span>
          <p className="font-display text-[24px] text-ink">گزارش Batch Import</p>
          <p className="text-[13.5px] text-mut mt-2">{fa(done)} سوال با موفقیت به بانک اضافه شد.</p>
          <div className="mt-4 text-[12px] text-inksoft bg-mist rounded-xl p-3.5 text-right leading-7">
            Upload ✓ → File Validation ✓ → JSON Parse ✓ → Schema Validation ✓ → Duplicate Detection ✓ → Preview ✓ → Confirm ✓ → Batch Import ✓ → Report ✓
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[12.5px] text-mut leading-6">
              آرایه‌ای از سوالات با کلیدهای <b dir="ltr" className="text-ink">text, options[4], correct(0-3), cat, diff, explain, tags</b>
            </p>
            <Btn v="ghost" sm onClick={() => setRaw(SAMPLE_JSON)}>درج نمونه</Btn>
          </div>
          <textarea dir="ltr" rows={7} className={`${inputCls} !text-[12px] font-mono`} placeholder='[{"text":"...","options":[...],"correct":0,...}]' value={raw} onChange={e => setRaw(e.target.value)} />
          {err && <div className="text-[12.5px] text-fail font-bold flex items-center gap-1.5"><Ic n="alert" s={14} />{err}</div>}
          {errs.length > 0 && (
            <div className="rounded-xl bg-failsoft p-3.5 space-y-1.5">
              {errs.map((e, i) => <div key={i} className="text-[12px] font-bold text-fail flex items-center gap-1.5"><Ic n="alert" s={13} />{e}</div>)}
            </div>
          )}
          {preview && (
            <div className="rounded-xl border border-pass/40 bg-passoft/60 p-3.5 anim-in">
              <div className="text-[12.5px] font-bold text-pass mb-2">{fa(preview.length)} سوال معتبر آماده import — پیش‌نمایش:</div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {preview.map(p => <div key={p.id} className="text-[12px] text-inksoft truncate">• {p.text}</div>)}
              </div>
            </div>
          )}
          {!preview ? (
            <Btn full v="ink" onClick={run} disabled={!raw.trim()}><Ic n="eye" s={16} /> Validate و پیش‌نمایش</Btn>
          ) : (
            <Btn full onClick={commit}><Ic n="check" s={17} /> تأیید و Import نهایی ({fa(preview.length)} سوال)</Btn>
          )}
        </div>
      )}
    </Modal>
  );
}

/* ---------------- plans & matrix ---------------- */

function PlansTab() {
  const s = useStore();
  return (
    <div className="space-y-5">
      <div className="grid lg:grid-cols-3 gap-4">
        {s.plans.map(p => (
          <Card key={p.id} className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-[21px] text-ink">{p.name}</h3>
              <span className="font-bold text-[13px] text-branddeep">{faMoney(p.price)}</span>
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between text-[12.5px] font-bold text-inksoft">
                سوال در هر آزمون (سقف ۱۰)
                <input type="number" min={1} max={10} value={p.max_questions_per_exam}
                  onChange={e => s.updatePlan(p.id, { max_questions_per_exam: Math.min(10, Math.max(1, Number(e.target.value))) })}
                  className="w-20 bg-mist border border-line rounded-lg px-2.5 py-1.5 text-center" />
              </label>
              <label className="flex items-center justify-between text-[12.5px] font-bold text-inksoft">
                آزمون مجاز روزانه
                <input type="number" min={1} max={50} value={p.max_daily_exams}
                  onChange={e => s.updatePlan(p.id, { max_daily_exams: Math.min(50, Math.max(1, Number(e.target.value))) })}
                  className="w-20 bg-mist border border-line rounded-lg px-2.5 py-1.5 text-center" />
              </label>
              <label className="flex items-center justify-between text-[12.5px] font-bold text-inksoft">
                قیمت سالانه (تومان)
                <input type="number" min={0} step={1000} value={p.price}
                  onChange={e => s.updatePlan(p.id, { price: Math.max(0, Number(e.target.value)) })}
                  className="w-24 bg-mist border border-line rounded-lg px-2.5 py-1.5 text-center" />
              </label>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 overflow-x-auto">
        <h3 className="font-display text-[21px] text-ink mb-1">ماتریس دسترسی دسته‌بندی‌ها</h3>
        <p className="text-[12px] text-mut mb-5">Category Access Matrix — تغییر بلافاصله در API Access Layer اعمال می‌شود.</p>
        <table className="w-full text-[13px] min-w-[420px]">
          <thead>
            <tr className="text-right text-[11.5px] text-mut font-bold">
              <th className="pb-3">دسته‌بندی</th>
              {s.plans.map(p => <th key={p.id} className="pb-3 text-center">{p.name}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {CATEGORIES.map(c => (
              <tr key={c.id}>
                <td className="py-3 font-bold text-ink flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: c.tone }} />{c.name}</td>
                {s.plans.map(p => (
                  <td key={p.id} className="py-3 text-center">
                    <MatrixCell on={p.allowed_categories.includes(c.id)} onChange={v => s.setMatrix(p.id, "cats", c.id, v)} disabled={p.id === "free" && c.id === "signs"} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="p-6 overflow-x-auto">
        <h3 className="font-display text-[21px] text-ink mb-1">ماتریس دسترسی محتوا</h3>
        <p className="text-[12px] text-mut mb-5">Content Access Matrix</p>
        <table className="w-full text-[13px] min-w-[420px]">
          <thead>
            <tr className="text-right text-[11.5px] text-mut font-bold">
              <th className="pb-3">محتوا</th>
              {s.plans.map(p => <th key={p.id} className="pb-3 text-center">{p.name}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {ARTICLES.map(a => (
              <tr key={a.id}>
                <td className="py-3 font-bold text-ink max-w-[260px] truncate">{a.title}</td>
                {s.plans.map(p => (
                  <td key={p.id} className="py-3 text-center">
                    <MatrixCell on={p.allowed_contents.includes(a.id)} onChange={v => s.setMatrix(p.id, "contents", a.id, v)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="p-6">
        <h3 className="font-display text-[21px] text-ink mb-1">درگاه‌های پرداخت</h3>
        <p className="text-[12px] text-mut mb-5">Payment Gateway Adapter — حداقل یک درگاه باید فعال بماند.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {(["zarinpal", "cafebazaar"] as const).map(g => (
            <div key={g} className="flex items-center justify-between rounded-xl border border-line p-4">
              <div className="flex items-center gap-3">
                <span className={`w-10 h-10 rounded-xl grid place-items-center ${s.gateways[g] ? "bg-passoft text-pass" : "bg-mist2 text-mut"}`}><Ic n="wallet" s={19} /></span>
                <div>
                  <div className="font-bold text-[14px] text-ink">{g === "zarinpal" ? "زرین‌پال" : "کافه‌بازار"}</div>
                  <div className="text-[11.5px] text-mut font-medium">{s.gateways[g] ? "فعال" : "غیرفعال"}</div>
                </div>
              </div>
              <Toggle on={!!s.gateways[g]} onChange={v => s.setGateway(g, v)} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function MatrixCell({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button disabled={disabled} onClick={() => onChange(!on)}
      className={`w-8 h-8 rounded-lg grid place-items-center transition-all ${disabled ? "opacity-40" : "hover:scale-110"} ${on ? "bg-pass text-white" : "bg-mist2 text-mut hover:bg-line"}`}>
      <Ic n={on ? "check" : "x"} s={15} />
    </button>
  );
}

/* ---------------- settings ---------------- */

function SettingsTab() {
  const s = useStore();
  const [f, setF] = useState({ ...s.settings });
  const num = (v: string) => Math.max(0, Number(v) || 0);
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <Card className="p-6">
        <h3 className="font-display text-[21px] text-ink mb-5 flex items-center gap-2.5"><Ic n="key" s={20} c="text-branddeep" /> پیکربندی OTP</h3>
        <div className="grid grid-cols-3 gap-3.5">
          <Field label="انقضا (ثانیه)"><input type="number" className={inputCls} value={f.otp_expiry} onChange={e => setF({ ...f, otp_expiry: num(e.target.value) })} /></Field>
          <Field label="حداکثر تلاش"><input type="number" className={inputCls} value={f.otp_max_attempts} onChange={e => setF({ ...f, otp_max_attempts: num(e.target.value) })} /></Field>
          <Field label="سقف ارسال مجدد"><input type="number" className={inputCls} value={f.otp_resend_limit} onChange={e => setF({ ...f, otp_resend_limit: num(e.target.value) })} /></Field>
        </div>
        <div className="mt-4 rounded-xl bg-mist p-3.5 text-[12px] leading-6 text-inksoft flex gap-2.5">
          <Ic n="shield" s={16} c="text-pass shrink-0 mt-0.5" />
          OTP هش‌شده (bcrypt) ذخیره می‌شود، Single-use است و هرگز در Log نوشته نمی‌شود. Rate Limit بر اساس IP + شماره.
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-display text-[21px] text-ink mb-5 flex items-center gap-2.5"><Ic n="shield" s={20} c="text-info" /> سیاست نشست (یک کاربر / یک دستگاه)</h3>
        <div className="space-y-2.5">
          {([
            { id: "kick", t: "حالت A — Kick Previous", d: "ورود جدید مجاز است؛ نشست قبلی بلافاصله باطل می‌شود." },
            { id: "block", t: "حالت B — Block New Login", d: "ورود جدید مسدود می‌شود: «این حساب روی دستگاه دیگری فعال است.»" },
          ] as const).map(m => (
            <button key={m.id} onClick={() => setF({ ...f, session_mode: m.id })}
              className={`w-full text-right p-4 rounded-xl border-2 transition-all ${f.session_mode === m.id ? "border-asphalt bg-asphalt text-white" : "border-line bg-paper hover:border-asphalt3"}`}>
              <div className={`font-bold text-[14px] ${f.session_mode === m.id ? "text-white" : "text-ink"}`}>{m.t}</div>
              <div className={`text-[12px] mt-1 ${f.session_mode === m.id ? "text-white/60" : "text-mut"}`}>{m.d}</div>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-display text-[21px] text-ink mb-5 flex items-center gap-2.5"><Ic n="exam" s={20} c="text-pass" /> محدودیت‌های آزمون</h3>
        <div className="grid grid-cols-3 gap-3.5">
          <Field label="سقف سوال آزمون" hint="فنی: ۱۰">
            <input type="number" min={1} max={10} className={inputCls} value={f.max_questions_per_exam}
              onChange={e => setF({ ...f, max_questions_per_exam: Math.min(10, Math.max(1, num(e.target.value))) })} />
          </Field>
          <Field label="مدت آزمون (دقیقه)"><input type="number" className={inputCls} value={f.exam_minutes} onChange={e => setF({ ...f, exam_minutes: num(e.target.value) })} /></Field>
          <Field label="درصد قبولی"><input type="number" min={1} max={100} className={inputCls} value={f.pass_percent} onChange={e => setF({ ...f, pass_percent: Math.min(100, Math.max(1, num(e.target.value))) })} /></Field>
        </div>
        <Field label="دوره ارفاق پس از انقضا (روز) — پیش‌فرض صفر">
          <input type="number" min={0} className={`${inputCls} mt-3.5`} value={f.grace_days} onChange={e => setF({ ...f, grace_days: num(e.target.value) })} />
        </Field>
      </Card>

      <Card className="p-6 flex flex-col">
        <h3 className="font-display text-[21px] text-ink mb-4 flex items-center gap-2.5"><Ic n="alert" s={20} c="text-fail" /> ثبت تغییرات</h3>
        <p className="text-[12.5px] leading-7 text-inksoft flex-1">
          تغییر تنظیمات امنیتی حساس است و با <b>Before/After</b> کامل در گزارش رویدادها ثبت (Audit) می‌شود.
          Rate Limit های API (ورود، آزمون، پرداخت) به‌صورت جداگانه در لایه Middleware اعمال می‌شوند.
        </p>
        <Btn full className="mt-4" onClick={() => s.saveSettings(f)}><Ic n="check" s={17} /> ذخیره تنظیمات و ثبت در Audit</Btn>
      </Card>
    </div>
  );
}

/* ---------------- database manager ---------------- */

function DbTab() {
  const s = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const [create, setCreate] = useState(false);
  const all = [...CORE_TABLES, ...s.extraTables];

  return (
    <div>
      <Card className="p-5 mb-5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3.5">
          <span className="w-11 h-11 rounded-xl bg-asphalt text-brand grid place-items-center"><Ic n="db" s={22} /></span>
          <div>
            <div className="font-display text-[20px] text-ink">Schema Builder</div>
            <div className="text-[12px] text-mut font-medium">بدون Raw SQL Console — فقط عملیات ساختاری کنترل‌شده با Audit</div>
          </div>
        </div>
        <Btn v="ink" onClick={() => setCreate(true)}><Ic n="plus" s={16} /> ایجاد جدول</Btn>
      </Card>

      <div className="grid gap-3">
        {all.map(t => (
          <Card key={t.name} className="p-4">
            <button className="w-full flex items-center gap-3.5 text-right" onClick={() => setOpen(open === t.name ? null : t.name)}>
              <span className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${t.core ? "bg-infosoft text-info" : "bg-passoft text-pass"}`}><Ic n="db" s={18} /></span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[14px] text-ink flex items-center gap-2 flex-wrap">
                  <span dir="ltr" className="font-mono">{t.name}</span>
                  {t.core && <Chip tone="#2e6fae" soft="#e6f0f9">هسته</Chip>}
                </div>
                <div className="text-[11.5px] text-mut font-medium mt-0.5">{t.title} · {fa(t.rows)} ردیف · {fa(t.cols.length)} ستون · {t.deps.length ? `${fa(t.deps.length)} وابستگی` : "بدون وابستگی"}</div>
              </div>
              <Ic n={open === t.name ? "chevL" : "chevR"} s={17} c="text-mut shrink-0" />
            </button>
            {open === t.name && (
              <div className="anim-in mt-4 pr-2">
                <div className="rounded-xl bg-mist p-3.5 overflow-x-auto">
                  <table className="w-full text-[12px]" dir="ltr">
                    <thead><tr className="text-left text-mut font-bold"><th className="pb-2">Column</th><th className="pb-2">Type</th><th className="pb-2">Flags</th></tr></thead>
                    <tbody>
                      {t.cols.map(c => (
                        <tr key={c.name} className="border-t border-line/70">
                          <td className="py-1.5 font-mono font-bold text-ink">{c.name}</td>
                          <td className="py-1.5 font-mono text-inksoft">{c.type}</td>
                          <td className="py-1.5 text-mut">{[c.pk && "PK", c.ai && "AI", c.nul && "NULL", c.def && `default ${c.def}`].filter(Boolean).join(" · ") || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!t.core && (
                  <Btn v="danger" sm className="mt-3" onClick={() => {
                    const r = s.dropTable(t.name);
                    if (!r.ok) s.toast(r.error!, "err");
                  }}><Ic n="trash" s={14} /> حذف جدول (با بررسی وابستگی)</Btn>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      <CreateTableModal open={create} onClose={() => setCreate(false)} />
    </div>
  );
}

function CreateTableModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useStore();
  const [name, setName] = useState("");
  const [cols, setCols] = useState<SchemaCol[]>([
    { name: "id", type: "BIGINT", pk: true, ai: true },
    { name: "name", type: "VARCHAR(150)" },
  ]);
  const [sql, setSql] = useState("");
  const [err, setErr] = useState("");
  const types = ["BIGINT", "INT", "TINYINT", "VARCHAR(150)", "VARCHAR(255)", "TEXT", "DATETIME", "TIMESTAMP", "DECIMAL(10,2)", "CHAR(64)"];

  const setCol = (i: number, patch: Partial<SchemaCol>) => setCols(cols.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  const build = (): SchemaTable => ({ name: name.trim().toLowerCase(), title: name.trim(), rows: 0, deps: [], cols });

  const generate = () => {
    setErr("");
    const r = s.createTable(build(), false); /* فقط Validation + تولید SQL */
    if (!r.ok) { setErr(r.error!); return; }
    setSql(r.sql!);
  };

  const execute = () => {
    const r = s.createTable(build(), true); /* اجرا + Audit */
    if (!r.ok) { setErr(r.error!); setSql(""); return; }
    s.toast("جدول ایجاد و در Schema History ثبت شد");
    onClose(); setSql("");
  };

  return (
    <Modal open={open} onClose={() => { onClose(); setSql(""); setErr(""); }} title="Schema Builder — ایجاد جدول جدید" w="max-w-2xl">
      <div className="space-y-4">
        <Field label="نام جدول" hint="فقط حروف کوچک و آندرلاین">
          <input dir="ltr" className={`${inputCls} font-mono`} placeholder="exam_categories" value={name} onChange={e => setName(e.target.value)} />
        </Field>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-bold text-inksoft">ستون‌ها</span>
            <Btn v="ghost" sm onClick={() => setCols([...cols, { name: "", type: "VARCHAR(150)", nul: true }])}><Ic n="plus" s={14} /> افزودن ستون</Btn>
          </div>
          <div className="space-y-2">
            {cols.map((c, i) => (
              <div key={i} className="flex gap-2 items-center flex-wrap rounded-xl bg-mist p-2.5">
                <input dir="ltr" className="flex-1 min-w-[110px] bg-paper border border-line rounded-lg px-3 py-2 text-[12.5px] font-mono" placeholder="column_name" value={c.name} onChange={e => setCol(i, { name: e.target.value })} />
                <select className="bg-paper border border-line rounded-lg px-2.5 py-2 text-[12.5px] font-mono" value={c.type} onChange={e => setCol(i, { type: e.target.value })}>
                  {types.map(t => <option key={t}>{t}</option>)}
                </select>
                <label className="flex items-center gap-1.5 text-[11.5px] font-bold text-inksoft">
                  <input type="checkbox" className="accent-[#2e6fae]" checked={!!c.pk} onChange={e => setCol(i, { pk: e.target.checked, ai: e.target.checked })} /> PK
                </label>
                <label className="flex items-center gap-1.5 text-[11.5px] font-bold text-inksoft">
                  <input type="checkbox" className="accent-[#2e6fae]" checked={!!c.nul} onChange={e => setCol(i, { nul: e.target.checked })} /> NULL
                </label>
                <button onClick={() => setCols(cols.filter((_, j) => j !== i))} disabled={cols.length <= 2} className="w-8 h-8 rounded-lg grid place-items-center text-fail hover:bg-failsoft disabled:opacity-30"><Ic n="trash" s={15} /></button>
              </div>
            ))}
          </div>
        </div>

        {err && <div className="text-[12.5px] text-fail font-bold flex items-center gap-1.5 anim-in"><Ic n="alert" s={14} />{err}</div>}

        {sql ? (
          <div className="anim-in">
            <div className="rounded-xl bg-asphalt text-brand p-4 overflow-x-auto">
              <pre dir="ltr" className="text-[12px] font-mono leading-6 whitespace-pre">{sql}</pre>
            </div>
            <p className="text-[11.5px] text-mut mt-2.5 leading-6">
              SQL تولیدشده توسط SQL Generator امن — Permission ✓ · Validation ✓ · Dependency Check ✓ · آماده اجرا در Transaction + Audit Log
            </p>
            <Btn full v="pass" className="mt-3" onClick={execute}>
              <Ic n="check" s={17} /> تأیید نهایی و اجرا
            </Btn>
          </div>
        ) : (
          <Btn full v="ink" onClick={generate}><Ic n="eye" s={16} /> Validation و پیش‌نمایش SQL</Btn>
        )}
      </div>
    </Modal>
  );
}

/* ---------------- audit ---------------- */

function AuditTab() {
  const s = useStore();
  const [q, setQ] = useState("");
  const list = s.audit.filter(a => !q || a.action.includes(q) || (a.target || "").includes(q) || a.actor.includes(q));
  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 border-b border-line flex items-center gap-3 flex-wrap">
        <h3 className="font-display text-[20px] text-ink flex-1">گزارش رویدادها ({fa(list.length)})</h3>
        <div className="relative w-64 max-w-full">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-mut"><Ic n="search" s={15} /></span>
          <input className={`${inputCls} !py-2 pr-9 text-[12.5px]`} placeholder="فیلتر رویداد…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>
      <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
        <table className="w-full text-[12.5px]">
          <thead className="sticky top-0 bg-mist z-10">
            <tr className="text-right text-[11px] text-mut font-bold">
              <th className="px-5 py-3">زمان</th><th className="px-3 py-3">بازیگر</th><th className="px-3 py-3">Action</th>
              <th className="px-3 py-3">Target</th><th className="px-3 py-3">Before → After</th><th className="px-3 py-3">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map(a => (
              <tr key={a.id} className="hover:bg-mist/60">
                <td className="px-5 py-3 text-mut whitespace-nowrap">{new Date(a.at).toLocaleString("fa-IR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}</td>
                <td className="px-3 py-3 font-bold text-ink" dir="ltr">{a.actor}</td>
                <td className="px-3 py-3"><Chip tone="#2e6fae" soft="#e6f0f9"><span dir="ltr">{a.action}</span></Chip></td>
                <td className="px-3 py-3 text-inksoft" dir="ltr">{a.target || "—"}</td>
                <td className="px-3 py-3 text-mut max-w-[200px] truncate" dir="ltr">{a.before || a.after ? `${a.before ? a.before.slice(0, 30) : "—"} → ${a.after ? a.after.slice(0, 30) : "—"}` : "—"}</td>
                <td className="px-3 py-3 text-mut" dir="ltr">{a.ip}</td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-mut">رویدادی ثبت نشده است.</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
