import React, { useState } from "react";
import { useStore, fa } from "../store";
import { CATEGORIES, type CatId } from "../data";
import { Bars, Btn, Card, Chip, Empty, Ic, Reveal, Ring } from "../components";
import type { NavFn } from "./Dashboard";

export default function Progress({ nav, initTab }: { nav: NavFn; initTab?: string }) {
  const s = useStore();
  const u = s.user!;
  const plan = s.plan || s.plans[0];
  const [tab, setTab] = useState(initTab || "stats");

  const my = s.results.filter(r => r.user_id === u.id);
  const avg = my.length ? Math.round(my.reduce((a, b) => a + b.percent, 0) / my.length) : 0;
  const passRate = my.length ? Math.round((my.filter(r => r.passed).length / my.length) * 100) : 0;
  const totalTime = my.reduce((a, b) => a + b.duration, 0);
  const chart = my.slice(0, 12).reverse().map(r => r.percent);

  const wrongQs = s.questions.filter(q => s.wrongs.includes(q.id));
  const markedQs = s.questions.filter(q => s.bookmarks.includes(q.id));
  const wrongLocked = !plan.features.wrong;

  const practiceWrongs = async () => {
    if (wrongLocked) { nav("profile", { tab: "plans" }); return; }
    if (wrongQs.length < 3) { s.toast("برای تمرین، حداقل ۳ سوال اشتباه لازم است.", "info"); return; }
    /* پرتکرارترین دسته میان اشتباه‌ها انتخاب می‌شود */
    const freq: Record<string, number> = {};
    wrongQs.forEach(x => { freq[x.cat] = (freq[x.cat] || 0) + 1; });
    const topCat = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
    const r = await s.startExam(topCat as CatId, "instant");
    if (r.ok) nav("exam");
    else s.toast(r.error!, "err");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 anim-up">
        <h1 className="font-display text-[32px] leading-tight text-ink">پیشرفت شما</h1>
        <p className="text-[13.5px] text-mut mt-1">تحلیل دقیق عملکرد؛ جایی که ضعف داری را پیدا کن و تقویتش کن.</p>
      </div>

      {/* تب‌بندی قطعه‌ای — سه‌ستونه ثابت، هرگز از عرض بیرون نمی‌زند */}
      <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-mist2/70 border border-line mb-6 anim-up" style={{ animationDelay: "60ms" }}>
        {[
          { id: "stats", label: "آمار کلی", icon: "chart" },
          { id: "wrongs", label: `اشتباه‌ها (${fa(s.wrongs.length)})`, icon: "target" },
          { id: "marks", label: `نشان‌شده‌ها (${fa(s.bookmarks.length)})`, icon: "star" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`min-w-0 py-2.5 px-1 rounded-xl text-[11.5px] sm:text-[12.5px] font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === t.id ? "bg-asphalt text-white shadow-pop" : "text-inksoft hover:bg-paper"}`}>
            <Ic n={t.icon} s={14} /> <span className="truncate">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "stats" && (
        <div className="anim-up">
          <div className="grid sm:grid-cols-3 gap-4 stagger">
            <Card className="p-5 flex items-center gap-4">
              <Ring pct={avg} size={86} stroke={9} tone="#2e6fae">
                <span className="font-display text-[20px] text-ink">{my.length ? `${fa(avg)}٪` : "—"}</span>
              </Ring>
              <div>
                <div className="font-display text-[20px] text-ink leading-tight">میانگین نمره</div>
                <div className="text-[12px] text-mut font-bold mt-1">{fa(my.length)} آزمون ثبت‌شده</div>
              </div>
            </Card>
            <Card className="p-5 flex items-center gap-4">
              <Ring pct={passRate} size={86} stroke={9} tone="#0f8f5b">
                <span className="font-display text-[20px] text-ink">{my.length ? `${fa(passRate)}٪` : "—"}</span>
              </Ring>
              <div>
                <div className="font-display text-[20px] text-ink leading-tight">نرخ قبولی</div>
                <div className="text-[12px] text-mut font-bold mt-1">{fa(my.filter(r => r.passed).length)} قبول از {fa(my.length)}</div>
              </div>
            </Card>
            <Card className="p-5 flex items-center gap-4">
              <span className="w-[86px] h-[86px] rounded-full bg-mist grid place-items-center text-info shrink-0"><Ic n="clock" s={34} /></span>
              <div>
                <div className="font-display text-[20px] text-ink leading-tight">زمان آزمون</div>
                <div className="text-[12px] text-mut font-bold mt-1">{fa(Math.round(totalTime / 60))} دقیقه مجموعاً</div>
              </div>
            </Card>
          </div>

          <Reveal>
            <Card className="p-6 mt-5">
              <div className="flex items-center justify-between gap-2 flex-wrap mb-6">
                <h3 className="font-display text-[21px] text-ink">روند ۱۲ آزمون اخیر</h3>
                <span className="text-[11.5px] font-bold text-mut flex items-center gap-1.5">
                  <span className="w-4 border-t-2 border-dashed border-fail shrink-0" /> خط قبولی {fa(s.settings.pass_percent)}٪
                </span>
              </div>
              {chart.length ? (
                <>
                  <Bars data={chart} passLine={s.settings.pass_percent} h={130} />
                  <div className="flex justify-between text-[10.5px] text-mut font-bold mt-2 px-1">
                    <span>قدیمی‌تر</span><span>آخرین آزمون</span>
                  </div>
                </>
              ) : (
                <Empty icon="chart" title="هنوز داده‌ای نیست" sub="بعد از اولین آزمون، نمودار روند شما اینجا شکل می‌گیرد." />
              )}
            </Card>
          </Reveal>

          <Reveal delay={80}>
            <Card className="p-6 mt-5">
              <h3 className="font-display text-[21px] text-ink mb-4">عملکرد تفکیکی دسته‌ها</h3>
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                {CATEGORIES.map(c => {
                  const rel = my.filter(r => r.cat === c.id);
                  const acc = rel.length ? Math.round(rel.reduce((a, b) => a + b.percent, 0) / rel.length) : null;
                  return (
                    <div key={c.id} className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl grid place-items-center shrink-0" style={{ background: c.soft, color: c.tone }}><Ic n={c.icon} s={17} /></span>
                      <div className="flex-1">
                        <div className="flex justify-between text-[12.5px] font-bold mb-1">
                          <span className="text-ink">{c.name}</span>
                          <span className={acc === null ? "text-mut" : acc >= 70 ? "text-pass" : "text-fail"}>
                            {acc === null ? "بدون آزمون" : `${fa(acc)}٪`}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-mist2 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${acc ?? 0}%`, background: c.tone }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </Reveal>
        </div>
      )}

      {tab === "wrongs" && (
        <div className="anim-up">
          <Card className="p-6 mb-4 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3.5">
              <span className={`w-12 h-12 rounded-2xl grid place-items-center ${wrongLocked ? "bg-mist2 text-mut" : "bg-failsoft text-fail"}`}><Ic n={wrongLocked ? "lock" : "target"} s={23} /></span>
              <div>
                <div className="font-display text-[20px] text-ink">تمرین سوالات اشتباه</div>
                <div className="text-[12.5px] text-mut font-medium mt-0.5">
                  {wrongLocked ? "در طرح رایگان قفل است — با ارتقا باز می‌شود" : `${fa(wrongQs.length)} سوال منتظر مرور است؛ هر سوال که درست بزنید از لیست حذف می‌شود`}
                </div>
              </div>
            </div>
            <Btn v={wrongLocked ? "brand" : "danger"} onClick={practiceWrongs}>
              {wrongLocked ? <><Ic n="crown" s={16} /> بازکردن با ارتقا</> : <><Ic n="play" s={16} /> شروع تمرین</>}
            </Btn>
          </Card>

          {wrongQs.length === 0 ? (
            <Card><Empty icon="award" title="لیست اشتباه‌ها خالی است!" sub="وقتی سوالی را اشتباه بزنید، اینجا جمع می‌شود تا مرور کنید." /></Card>
          ) : (
            <div className="grid gap-3">
              {wrongQs.map(q => {
                const c = CATEGORIES.find(x => x.id === q.cat)!;
                const st = (s.qstats[u.id] || {})[q.id];
                return (
                  <Card key={q.id} className="p-4 flex items-center gap-3.5">
                    <Chip tone={c.tone} soft={c.soft} className="shrink-0">{c.name}</Chip>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-bold text-ink leading-7 truncate">{q.text}</p>
                      <p className="text-[11.5px] text-mut font-medium mt-0.5">پاسخ صحیح: {q.options[q.correct]}</p>
                    </div>
                    {st && <Chip tone="#d5453a" soft="#fbe7e5">{fa(st.wrong)}× اشتباه</Chip>}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "marks" && (
        <div className="anim-up">
          {markedQs.length === 0 ? (
            <Card><Empty icon="star" title="نشان‌شده‌ای ندارید" sub="در آزمون‌ها روی ستاره هر سوال بزنید تا اینجا ذخیره شود." /></Card>
          ) : (
            <div className="grid gap-3">
              {markedQs.map(q => {
                const c = CATEGORIES.find(x => x.id === q.cat)!;
                const marked = s.bookmarks.includes(q.id);
                return (
                  <Card key={q.id} className="p-4 flex items-center gap-3.5">
                    <Chip tone={c.tone} soft={c.soft} className="shrink-0">{c.name}</Chip>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-bold text-ink leading-7 truncate">{q.text}</p>
                      <p className="text-[11.5px] text-mut font-medium mt-0.5">پاسخ: {q.options[q.correct]}</p>
                    </div>
                    <button onClick={() => s.toggleBookmark(q.id)}
                      className={`w-9 h-9 rounded-xl grid place-items-center transition-all shrink-0 ${marked ? "bg-brand text-brandink scale-105" : "bg-mist text-mut hover:text-branddeep"}`}>
                      <Ic n="star" s={17} />
                    </button>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
