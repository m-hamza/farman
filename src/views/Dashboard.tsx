import React from "react";
import { useStore, fa } from "../store";
import { ARTICLES, CATEGORIES } from "../data";
import { Btn, Card, Chip, Ic, Reveal, Ring, Skeleton } from "../components";

export type NavFn = (route: string, params?: Record<string, string>) => void;

export default function Dashboard({ nav, loading }: { nav: NavFn; loading: boolean }) {
  const s = useStore();
  const u = s.user!;
  const plan = s.plan || s.plans[0];
  const myResults = s.results.filter(r => r.user_id === u.id);
  const avg = myResults.length ? Math.round(myResults.reduce((a, b) => a + b.percent, 0) / myResults.length) : 0;
  const passCount = myResults.filter(r => r.passed).length;

  if (loading) return <DashSkeleton />;

  const hour = new Date().getHours();
  const greet = hour < 12 ? "صبح بخیر" : hour < 17 ? "ظهر بخیر" : "عصر بخیر";

  /* دقت هر دسته از آمار سوالات */
  const catAcc = CATEGORIES.map(c => {
    const uStats = s.qstats[u.id] || {};
    const stats = s.questions.filter(qq => qq.cat === c.id).map(qq => uStats[qq.id]).filter((x): x is NonNullable<typeof x> => !!x);
    const seen = stats.reduce((a, b) => a + b.seen, 0);
    const wrong = stats.reduce((a, b) => a + b.wrong, 0);
    const acc = seen ? Math.round(((seen - wrong) / seen) * 100) : null;
    return { ...c, seen, acc };
  });

  const suggestions = ARTICLES.filter(a => !s.canContent(a.id)).slice(0, 2);
  const openStudies = ARTICLES.filter(a => s.canContent(a.id));

  return (
    <div className="max-w-5xl mx-auto">
      {/* header */}
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6 anim-up">
        <div>
          <p className="text-[13px] font-bold text-mut">{greet}،</p>
          <h1 className="font-display text-[34px] leading-tight text-ink">{u.first_name} {u.last_name} 👋</h1>
        </div>
        <div className="flex gap-2">
          <Chip tone="#0f8f5b" soft="#ddf3e7"><Ic n="award" s={13} /> {fa(passCount)} قبولی</Chip>
          <Chip tone="#2e6fae" soft="#e6f0f9"><Ic n="flag" s={13} /> {fa(myResults.length)} آزمون</Chip>
        </div>
      </div>

      {/* resume exam banner */}
      {s.activeExam && (
        <Reveal>
          <button onClick={() => nav("exam")}
            className="w-full mb-5 rounded-2xl bg-asphalt text-white p-4 flex items-center gap-4 hover:bg-asphalt2 transition-colors shadow-pop anim-pop">
            <span className="w-11 h-11 rounded-xl bg-brand text-brandink grid place-items-center shrink-0 animate-pulse"><Ic n="play" s={22} /></span>
            <span className="text-right flex-1">
              <span className="font-display text-[19px] block">یک آزمون نیمه‌تمام دارید</span>
              <span className="text-[12.5px] text-white/60">روی ادامه کلیک کنید تا از همان سوال قبلی برگردید</span>
            </span>
            <Btn sm>ادامه آزمون <Ic n="arrowf" s={15} /></Btn>
          </button>
        </Reveal>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* subscription card */}
        <Reveal className="lg:row-span-2">
          <Card className="p-6 h-full flex flex-col asphalt-tex !border-asphalt3 text-white relative overflow-hidden">
            <div className="absolute -left-10 -bottom-10 w-44 h-44 rounded-full border-[16px] border-white/5" />
            <div className="flex items-center justify-between">
              <span className="font-display text-[21px]">اشتراک {plan.name}</span>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${s.sub ? "bg-pass/25 text-passoft" : "bg-fail/25 text-failsoft"}`}>
                {s.sub ? "فعال" : "منقضی"}
              </span>
            </div>

            <div className="flex items-center gap-5 my-6">
              <Ring pct={s.daysLeft > 365 ? 100 : (s.daysLeft / 365) * 100} size={116} stroke={10} tone="#ffc21c">
                <div className="text-center">
                  <div className="font-display text-[34px] leading-none text-brand">{fa(s.daysLeft)}</div>
                  <div className="text-[10.5px] font-bold text-white/60 mt-1">روز مانده</div>
                </div>
              </Ring>
              <div className="text-[12.5px] leading-6 text-white/70 font-medium">
                اشتراک شما تا <b className="text-white">{fa(s.daysLeft)} روز</b> دیگر معتبر است.
                {s.daysLeft < 30 && <span className="block text-brand mt-1 font-bold">زمان تمدید نزدیک است!</span>}
              </div>
            </div>

            <div className="space-y-2.5 mb-6">
              {plan.perks.slice(0, 4).map(p => (
                <div key={p} className="flex items-center gap-2.5 text-[13px] text-white/85">
                  <Ic n="check" s={15} c="text-brand shrink-0" /> {p}
                </div>
              ))}
            </div>

            <div className="mt-auto flex gap-2.5">
              <Btn full onClick={() => nav("profile", { tab: "plans" })}><Ic n="crown" s={17} /> تمدید اشتراک</Btn>
            </div>
          </Card>
        </Reveal>

        {/* stat tiles */}
        <div className="lg:col-span-2 grid sm:grid-cols-3 gap-4 stagger">
          {[
            { icon: "target", label: "میانگین نمره", val: myResults.length ? `${fa(avg)}٪` : "—", tone: "#2e6fae", soft: "#e6f0f9" },
            { icon: "x", label: "سوالات اشتباه", val: fa(s.wrongs.length), tone: "#d5453a", soft: "#fbe7e5", click: () => nav("progress", { tab: "wrongs" }) },
            { icon: "star", label: "نشان‌شده‌ها", val: fa(s.bookmarks.length), tone: "#d99a00", soft: "#fdf0dd", click: () => nav("progress", { tab: "marks" }) },
          ].map(t => (
            <Card key={t.label} className="p-5" onClick={t.click}>
              <span className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: t.soft, color: t.tone }}>
                <Ic n={t.icon} s={19} />
              </span>
              <div className="font-display text-[34px] leading-none mt-3.5 text-ink">{t.val}</div>
              <div className="text-[12.5px] font-bold text-mut mt-1.5">{t.label}</div>
            </Card>
          ))}

          {/* start exam CTA */}
          <Card className="sm:col-span-3 p-5 !bg-brand !border-branddeep/40 flex items-center justify-between gap-4 flex-wrap hover:!bg-brand2">
            <div className="flex items-center gap-4">
              <span className="w-12 h-12 rounded-2xl bg-brandink text-brand grid place-items-center anim-spin-slow"><Ic n="wheel" s={26} /></span>
              <div>
                <div className="font-display text-[22px] text-brandink leading-tight">آماده‌ای یک دور بزنی؟</div>
                <div className="text-[12.5px] font-bold text-brandink/70 mt-0.5">
                  {fa(Math.min(plan.max_questions_per_exam, s.settings.max_questions_per_exam))} سوال تصادفی · {fa(Math.max(0, plan.max_daily_exams - s.todayExams))} آزمون باقی‌مانده امروز
                </div>
              </div>
            </div>
            <Btn v="ink" onClick={() => nav("exam")} className="min-w-[150px]">شروع آزمون <Ic n="play" s={16} /></Btn>
          </Card>
        </div>

        {/* category accuracy */}
        <Reveal className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-[21px] text-ink">مسیر یادگیری شما</h3>
              <button onClick={() => nav("study")} className="text-[12.5px] font-bold text-info hover:underline flex items-center gap-1">
                همه آموزش‌ها <Ic n="chevL" s={14} />
              </button>
            </div>
            <div className="space-y-4">
              {catAcc.map(c => {
                const locked = !s.canCat(c.id);
                return (
                  <div key={c.id} className="flex items-center gap-3.5">
                    <span className="w-9 h-9 rounded-xl grid place-items-center shrink-0" style={{ background: locked ? "#e3e9ee" : c.soft, color: locked ? "#6e8093" : c.tone }}>
                      <Ic n={locked ? "lock" : c.icon} s={18} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-[12.5px] font-bold mb-1.5">
                        <span className="text-ink">{c.name}</span>
                        <span className="text-mut">{locked ? "قفل در طرح شما" : c.acc === null ? "هنوز شروع نشده" : `${fa(c.acc)}٪ دقت`}</span>
                      </div>
                      <div className="h-2 rounded-full bg-mist2 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${locked ? 0 : c.acc ?? 0}%`, background: locked ? "#c4ced7" : c.tone }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Reveal>

        {/* recent results */}
        <Reveal className="lg:col-span-2">
          <Card className="p-6">
            <h3 className="font-display text-[21px] text-ink mb-4">آخرین آزمون‌ها</h3>
            {myResults.length === 0 ? (
              <div className="text-center py-6">
                <div className="font-display text-[40px] text-mist2 leading-none">۰</div>
                <p className="text-[13px] text-mut mt-2">هنوز آزمونی نداده‌اید؛ اولین آزمون را همین حالا شروع کنید.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {myResults.slice(0, 4).map(r => (
                  <div key={r.id} className="flex items-center gap-3.5 p-3 rounded-xl bg-mist hover:bg-mist2 transition-colors">
                    <span className={`w-11 h-11 rounded-xl grid place-items-center font-display text-[19px] shrink-0 ${r.passed ? "bg-passoft text-pass" : "bg-failsoft text-fail"}`}>
                      {fa(r.percent)}٪
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-bold text-ink truncate">
                        {r.cat === "mixed" ? "آزمون ترکیبی" : CATEGORIES.find(c => c.id === r.cat)?.name}
                      </div>
                      <div className="text-[11.5px] text-mut font-medium mt-0.5">
                        {fa(r.score)} صحیح از {fa(r.total)} · {new Date(r.at).toLocaleDateString("fa-IR")}
                      </div>
                    </div>
                    <Chip tone={r.passed ? "#0f8f5b" : "#d5453a"} soft={r.passed ? "#ddf3e7" : "#fbe7e5"}>
                      {r.passed ? "قبول" : "مردود"}
                    </Chip>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Reveal>

        {/* study suggestions */}
        <Reveal className="lg:col-span-3">
          <div className="grid sm:grid-cols-2 gap-4">
            {openStudies.slice(0, 2).map(a => (
              <Card key={a.id} className="p-5 flex items-center gap-4" onClick={() => nav("article", { id: a.id })}>
                <span className="text-[11.5px] font-bold text-mut shrink-0">{fa(a.minutes)} دقیقه مطالعه</span>
                <span className="flex-1 font-bold text-[14.5px] text-ink leading-7">{a.title}</span>
                <Ic n="arrowf" s={17} c="text-mut" />
              </Card>
            ))}
            {suggestions.map(a => (
              <Card key={a.id} className="p-5 flex items-center gap-4 opacity-90" onClick={() => nav("profile", { tab: "plans" })}>
                <span className="w-9 h-9 rounded-xl bg-mist2 text-mut grid place-items-center shrink-0"><Ic n="lock" s={17} /></span>
                <span className="flex-1">
                  <span className="block font-bold text-[14px] text-ink leading-6">{a.title}</span>
                  <span className="text-[11.5px] font-bold text-branddeep">در طرح استاندارد و حرفه‌ای باز می‌شود</span>
                </span>
                <Ic n="crown" s={18} c="text-branddeep" />
              </Card>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
}

function DashSkeleton() {
  return (
    <div className="max-w-5xl mx-auto anim-in">
      <Skeleton className="h-14 w-64 mb-6" />
      <div className="grid lg:grid-cols-3 gap-5">
        <Skeleton className="h-80 rounded-2xl" />
        <div className="lg:col-span-2 grid sm:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-2xl" /><Skeleton className="h-32 rounded-2xl" /><Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="sm:col-span-3 h-24 rounded-2xl" />
        </div>
        <Skeleton className="lg:col-span-3 h-56 rounded-2xl" />
      </div>
    </div>
  );
}
