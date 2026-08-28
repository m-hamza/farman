import React, { useEffect, useMemo, useState } from "react";
import { useStore, fa } from "../store";
import { CATEGORIES, type CatId } from "../data";
import { Btn, Card, Chip, DiffDots, Ic, Modal, Reveal, Ring, TrafficSign } from "../components";

const LETTERS = ["الف", "ب", "ج", "د"];
type Phase = "setup" | "run" | "result";

interface ResultInfo {
  score: number; total: number; blank: number; percent: number;
  duration: number; passed: boolean; cat: CatId | "mixed";
}

export default function ExamView() {
  const store = useStore();
  const [phase, setPhase] = useState<Phase>(store.activeExam ? "run" : "setup");
  const [result, setResult] = useState<ResultInfo | null>(null);

  const finish = () => {
    const exam = store.activeExam;
    if (exam) {
      const snap = exam.items.map(it => {
        const t = it as typeof it & { _c: string };
        const a = exam.answers[it.qid];
        return { qid: it.qid, picked: it.options.find(o => o.id === a)?.text, ok: a ? a === t._c : null };
      });
      sessionStorage.setItem("farman_last_exam", JSON.stringify(snap));
    }
    const r = store.finishExam();
    if (r) {
      setResult({ score: r.score, total: r.total, blank: r.blank, percent: r.percent, duration: r.duration, passed: r.passed, cat: r.cat });
      setPhase("result");
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {phase === "setup" && <Setup onStart={() => setPhase("run")} />}
      {phase === "run" && store.activeExam && <Runner onDone={finish} onQuit={() => setPhase("setup")} />}
      {phase === "result" && result && <Result r={result} onAgain={() => setPhase("setup")} />}
      {phase === "result" && !result && <Setup onStart={() => setPhase("run")} />}
    </div>
  );
}

/* ================================ Setup ================================ */

function Setup({ onStart }: { onStart: () => void }) {
  const s = useStore();
  const { canCat, settings, startExam, toast, todayExams, questions } = s;
  const plan = s.plan || s.plans[0];
  const [cat, setCat] = useState<CatId | "mixed">("signs");
  const [mode, setMode] = useState<"instant" | "end">("instant");
  const [busy, setBusy] = useState(false);

  const nQ = Math.min(plan.max_questions_per_exam, settings.max_questions_per_exam);
  const remaining = Math.max(0, plan.max_daily_exams - todayExams);

  const start = async () => {
    if (!canCat(cat as CatId) && cat !== "mixed") { toast("این دسته‌بندی در طرح شما قفل است.", "err"); return; }
    if (cat === "mixed" && plan.allowed_categories.length < CATEGORIES.length) {
      toast("آزمون ترکیبی فقط در طرح حرفه‌ای فعال است.", "err"); return;
    }
    setBusy(true);
    const r = await startExam(cat, mode);
    setBusy(false);
    if (!r.ok) { toast(r.error!, "err"); return; }
    onStart();
  };

  const mixedUnlocked = plan.allowed_categories.length >= CATEGORIES.length;

  return (
    <div>
      <Reveal>
        <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
          <div>
            <h1 className="font-display text-[32px] leading-tight text-ink">آزمون آیین‌نامه</h1>
            <p className="text-[13.5px] text-mut mt-1">
              سوالات هر بار <b className="text-ink">تصادفی</b> و با ترتیب گزینه متفاوت چیده می‌شوند؛ سوالاتی که اخیراً دیده‌اید کمتر تکرار می‌شوند.
            </p>
          </div>
          <Chip tone={remaining > 0 ? "#0f8f5b" : "#d5453a"} soft={remaining > 0 ? "#ddf3e7" : "#fbe7e5"}>
            <Ic n="clock" s={13} /> {fa(remaining)} آزمون باقی‌مانده امروز
          </Chip>
        </div>
      </Reveal>

      <Reveal delay={60}>
        <h3 className="text-[13px] font-extrabold text-mut mb-3">دسته‌بندی آزمون</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CATEGORIES.map(c => {
            const open = canCat(c.id);
            const count = questions.filter(x => x.cat === c.id && x.status === "active").length;
            return (
              <button key={c.id} onClick={() => open && setCat(c.id)}
                className={`relative text-right p-4 rounded-2xl border-2 transition-all duration-200 ${
                  cat === c.id && open ? "border-asphalt bg-asphalt text-white shadow-pop -translate-y-0.5" :
                  open ? "border-line bg-paper hover:border-asphalt3 hover:-translate-y-0.5" : "border-line bg-mist opacity-70"}`}>
                <div className="flex items-start justify-between">
                  <span className="w-9 h-9 rounded-xl grid place-items-center" style={{ background: open ? c.soft : "#e3e9ee", color: open ? c.tone : "#6e8093" }}>
                    <Ic n={open ? c.icon : "lock"} s={19} />
                  </span>
                  {open ? <DiffDots d={0} /> : <Chip tone="#8a5a00" soft="#fdf0dd">اشتراک</Chip>}
                </div>
                <div className={`font-display text-[19px] mt-2.5 ${cat === c.id && open ? "text-white" : "text-ink"}`}>{c.name}</div>
                <div className={`text-[11.5px] mt-0.5 ${cat === c.id && open ? "text-white/60" : "text-mut"}`}>{fa(count)} سوال فعال</div>
              </button>
            );
          })}
          <button onClick={() => mixedUnlocked && setCat("mixed")}
            className={`relative text-right p-4 rounded-2xl border-2 transition-all duration-200 ${
              cat === "mixed" && mixedUnlocked ? "border-brand bg-brand text-brandink shadow-pop -translate-y-0.5" :
              mixedUnlocked ? "border-branddeep/40 bg-brand/10 hover:-translate-y-0.5" : "border-line bg-mist opacity-70"}`}>
            <div className="flex items-start justify-between">
              <span className={`w-9 h-9 rounded-xl grid place-items-center ${mixedUnlocked ? "bg-brand text-brandink" : "bg-mist2 text-mut"}`}>
                <Ic n={mixedUnlocked ? "spark" : "lock"} s={19} />
              </span>
              {!mixedUnlocked && <Chip tone="#8a5a00" soft="#fdf0dd">حرفه‌ای</Chip>}
            </div>
            <div className="font-display text-[19px] mt-2.5">آزمون ترکیبی</div>
            <div className={`text-[11.5px] mt-0.5 ${mixedUnlocked ? "opacity-70" : "text-mut"}`}>از همه دسته‌های شما</div>
          </button>
        </div>
      </Reveal>

      <Reveal delay={120}>
        <h3 className="text-[13px] font-extrabold text-mut mb-3 mt-7">نمایش پاسخ‌ها</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {([
            { id: "instant", icon: "zap", title: "مشاهده پاسخ فوری", desc: "بعد از هر پاسخ، درست/نادرست و توضیح را همان لحظه ببین — برای یادگیری" },
            { id: "end", icon: "flag", title: "نتیجه در پایان", desc: "شبیه آزمون واقعی؛ همه پاسخ‌ها یکجا در پایان تصحیح می‌شود" },
          ] as const).map(m => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={`text-right p-4 rounded-2xl border-2 flex gap-3.5 transition-all duration-200 ${
                mode === m.id ? "border-asphalt bg-asphalt text-white shadow-pop" : "border-line bg-paper hover:border-asphalt3"}`}>
              <span className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${mode === m.id ? "bg-brand text-brandink" : "bg-mist text-inksoft"}`}>
                <Ic n={m.icon} s={20} />
              </span>
              <span>
                <span className={`font-display text-[18px] block ${mode === m.id ? "text-white" : "text-ink"}`}>{m.title}</span>
                <span className={`text-[12px] leading-5 block mt-0.5 ${mode === m.id ? "text-white/60" : "text-mut"}`}>{m.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </Reveal>

      <Reveal delay={180}>
        <Card className="mt-7 p-5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-5 text-[13px] font-bold text-inksoft">
            <span className="flex items-center gap-2"><Ic n="list" s={17} c="text-info" /> {fa(nQ)} سوال</span>
            <span className="flex items-center gap-2"><Ic n="clock" s={17} c="text-info" /> {fa(Math.max(2, Math.round(settings.exam_minutes * (nQ / settings.max_questions_per_exam))))} دقیقه</span>
            <span className="flex items-center gap-2"><Ic n="award" s={17} c="text-info" /> قبولی ≥ {fa(settings.pass_percent)}٪</span>
          </div>
          <Btn onClick={start} disabled={busy || remaining <= 0} className="min-w-[170px]">
            {busy ? <span className="w-5 h-5 border-2 border-brandink/30 border-t-brandink rounded-full animate-spin" /> : <Ic n="play" s={17} />}
            شروع آزمون
          </Btn>
        </Card>
      </Reveal>
    </div>
  );
}

/* ================================ Runner ================================ */

function Runner({ onDone, onQuit }: { onDone: () => void; onQuit: () => void }) {
  const { activeExam: exam, answer, questions, abandonExam, toggleBookmark, bookmarks } = useStore();
  const [idx, setIdx] = useState(exam?.index || 0);
  const [nowT, setNowT] = useState(Date.now());
  const [revealed, setRevealed] = useState<Record<string, boolean>>(exam?.revealed || {});
  const [feedback, setFeedback] = useState<{ correct: boolean; explain: string } | null>(null);
  const [quitAsk, setQuitAsk] = useState(false);
  const [finishAsk, setFinishAsk] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNowT(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remain = exam ? Math.max(0, Math.round((exam.ends_at - nowT) / 1000)) : 0;
  useEffect(() => { if (exam && remain <= 0) onDone(); }, [remain, exam, onDone]);

  const it = exam?.items[idx];
  const q = useMemo(() => questions.find(x => x.id === it?.qid), [questions, it]);
  if (!exam || !it || !q) return null;

  const picked = exam.answers[it.qid];
  const isRevealed = !!revealed[it.qid];
  const typed = it as typeof it & { _c: string };
  const answeredCount = Object.keys(exam.answers).length;
  const mm = String(Math.floor(remain / 60)).padStart(2, "0");
  const ss = String(remain % 60).padStart(2, "0");
  const lowTime = remain < 60;

  const pick = (optId: string) => {
    if (isRevealed && exam.mode === "instant") return;
    if (picked && exam.mode === "instant") return;
    const r = answer(it.qid, optId);
    if (!r) return;
    if (exam.mode === "instant") {
      setRevealed(rv => ({ ...rv, [it.qid]: true }));
      setFeedback({ correct: r.correct, explain: r.explain });
    }
  };

  const next = () => {
    setFeedback(null);
    if (idx < exam.items.length - 1) setIdx(idx + 1);
    else if (answeredCount < exam.items.length) setFinishAsk(true);
    else onDone();
  };

  const optClass = (optId: string) => {
    const base = "w-full text-right p-3.5 pr-3 rounded-xl border-2 flex items-center gap-3 transition-all duration-200 active:scale-[0.985]";
    if (exam.mode === "instant" && isRevealed) {
      if (optId === typed._c) return `${base} border-pass bg-passoft`;
      if (optId === picked) return `${base} border-fail bg-failsoft`;
      return `${base} border-line bg-paper opacity-60`;
    }
    if (picked === optId) return `${base} border-asphalt bg-asphalt text-white shadow-pop`;
    return `${base} border-line bg-paper hover:border-asphalt3 hover:-translate-y-px`;
  };

  return (
    <div className="anim-up">
      {/* top bar */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <button onClick={() => setQuitAsk(true)} className="text-[12.5px] font-bold text-mut hover:text-fail flex items-center gap-1.5 transition-colors">
          <Ic n="x" s={15} /> خروج از آزمون
        </button>
        <div className="flex items-center gap-2.5">
          <span className={`flex items-center gap-2 font-display text-[22px] px-3.5 py-1 rounded-xl border-2 ${
            lowTime ? "text-fail border-fail bg-failsoft animate-pulse" : "text-ink border-line bg-paper"}`}>
            <Ic n="clock" s={18} />
            <span dir="ltr">{mm}:{ss}</span>
          </span>
        </div>
      </div>

      {/* progress */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-2.5 rounded-full bg-mist2 overflow-hidden">
          <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${((idx + (picked ? 1 : 0)) / exam.items.length) * 100}%` }} />
        </div>
        <span className="text-[12.5px] font-extrabold text-inksoft whitespace-nowrap">سوال {fa(idx + 1)} از {fa(exam.items.length)}</span>
      </div>

      {/* question card */}
      <Card className="p-6 overflow-hidden" key={it.qid}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <Chip tone="#2e6fae" soft="#e6f0f9">{CATEGORIES.find(c => c.id === q.cat)?.name}</Chip>
            <Chip tone="#5b6472" soft="#e9edf1"><DiffDots d={q.diff} /></Chip>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => toggleBookmark(it.qid)} title="نشان‌کردن سوال"
              className={`w-9 h-9 rounded-xl grid place-items-center border-2 transition-all ${
                bookmarks.includes(it.qid) ? "bg-brand border-brand text-brandink scale-105" : "border-line bg-mist text-mut hover:text-branddeep"}`}>
              <Ic n="star" s={17} />
            </button>
            <span className="opt-letter w-9 h-9 rounded-xl bg-mist text-inksoft grid place-items-center text-[19px]">{fa(idx + 1)}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-5 items-start">
          {q.sign && (
            <div className="shrink-0 mx-auto sm:mx-0 bg-mist rounded-2xl p-3 border border-line anim-pop">
              <TrafficSign k={q.sign} size={104} />
            </div>
          )}
          <h2 className="font-bold text-[18.5px] leading-9 text-ink flex-1">{q.text}</h2>
        </div>

        <div className="grid gap-2.5 mt-5">
          {it.options.map((o, i) => (
            <button key={o.id} onClick={() => pick(o.id)} className={optClass(o.id)}>
              <span className={`opt-letter w-9 h-9 rounded-lg grid place-items-center text-[17px] shrink-0 ${
                exam.mode === "instant" && isRevealed
                  ? o.id === typed._c ? "bg-pass text-white" : o.id === picked ? "bg-fail text-white" : "bg-mist2 text-mut"
                  : picked === o.id ? "bg-brand text-brandink" : "bg-mist2 text-inksoft"}`}>
                {exam.mode === "instant" && isRevealed && o.id === typed._c ? <Ic n="check" s={17} />
                  : exam.mode === "instant" && isRevealed && o.id === picked ? <Ic n="x" s={17} />
                  : LETTERS[i]}
              </span>
              <span className="font-medium text-[14.5px] leading-7">{o.text}</span>
            </button>
          ))}
        </div>

        {/* instant feedback */}
        {exam.mode === "instant" && feedback && (
          <div className={`mt-4 rounded-xl p-4 anim-pop border ${feedback.correct ? "bg-passoft border-pass/30" : "bg-failsoft border-fail/30"}`}>
            <div className={`flex items-center gap-2 font-display text-[19px] ${feedback.correct ? "text-pass" : "text-fail"}`}>
              <Ic n={feedback.correct ? "check" : "x"} s={19} />
              {feedback.correct ? "آفرین! پاسخ صحیح است" : "پاسخ نادرست بود"}
            </div>
            <p className="text-[13.5px] leading-7 text-inksoft mt-1.5">{feedback.explain}</p>
            <Btn v={feedback.correct ? "pass" : "danger"} sm className="mt-3" onClick={next}>
              {idx < exam.items.length - 1 ? <>سوال بعدی <Ic n="arrowf" s={15} /></> : <>پایان و مشاهده نتیجه <Ic n="flag" s={15} /></>}
            </Btn>
          </div>
        )}
      </Card>

      {/* end-mode nav */}
      {exam.mode === "end" && (
        <div className="flex items-center justify-between mt-5">
          <Btn v="outline" sm disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
            <Ic n="chevR" s={15} /> قبلی
          </Btn>
          {idx < exam.items.length - 1 ? (
            <Btn v="ink" sm onClick={next}>بعدی <Ic n="arrowf" s={15} /></Btn>
          ) : (
            <Btn sm onClick={() => (answeredCount < exam.items.length ? setFinishAsk(true) : onDone())}>
              <Ic n="flag" s={15} /> پایان آزمون
            </Btn>
          )}
        </div>
      )}

      {/* question map */}
      <div className="flex flex-wrap gap-2 mt-6 justify-center">
        {exam.items.map((item, i) => {
          const a = exam.answers[item.qid];
          const t = item as typeof item & { _c: string };
          const state = exam.mode === "instant" && revealed[item.qid]
            ? (a === t._c ? "ok" : "bad")
            : a ? "done" : "none";
          return (
            <button key={item.qid} onClick={() => { setIdx(i); setFeedback(null); }}
              className={`w-9 h-9 rounded-lg grid place-items-center text-[12.5px] font-bold border-2 transition-all ${
                i === idx ? "scale-110 border-asphalt shadow-pop" : "border-transparent"} ${
                state === "ok" ? "bg-pass text-white" : state === "bad" ? "bg-fail text-white" :
                state === "done" ? "bg-asphalt text-white" : "bg-mist2 text-mut hover:bg-line"}`}>
              {fa(i + 1)}
            </button>
          );
        })}
      </div>

      {/* modals */}
      <Modal open={quitAsk} onClose={() => setQuitAsk(false)} title="خروج از آزمون؟">
        <p className="text-[13.5px] text-inksoft leading-7">پیشرفت این آزمون ذخیره نمی‌شود و از سهمیه امروز کم شده است. مطمئن هستید؟</p>
        <div className="flex gap-2.5 mt-5">
          <Btn v="danger" full onClick={() => { abandonExam(); setQuitAsk(false); onQuit(); }}>بله، خارج شو</Btn>
          <Btn v="outline" full onClick={() => setQuitAsk(false)}>ادامه آزمون</Btn>
        </div>
      </Modal>

      <Modal open={finishAsk} onClose={() => setFinishAsk(false)} title="سوالات بی‌پاسخ">
        <div className="text-center py-2">
          <span className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-brand/15 text-branddeep mb-3"><Ic n="alert" s={26} /></span>
          <p className="text-[14px] font-bold text-ink">
            {fa(exam.items.length - answeredCount)} سوال بی‌پاسخ دارید
          </p>
          <p className="text-[13px] text-mut mt-1.5 leading-6">سوالات بی‌پاسخ نمره منفی ندارند اما در درصد قبولی اثر می‌گذارند.</p>
        </div>
        <div className="flex gap-2.5 mt-4">
          <Btn full onClick={() => { setFinishAsk(false); onDone(); }}><Ic n="flag" s={16} /> ثبت نهایی</Btn>
          <Btn v="outline" full onClick={() => setFinishAsk(false)}>برگردم و پاسخ بدهم</Btn>
        </div>
      </Modal>
    </div>
  );
}

/* ================================ Result ================================ */

function Result({ r, onAgain }: { r: ResultInfo; onAgain: () => void }) {
  const { results, wrongs, questions, plan } = useStore();
  const latest = results[0];
  const catName = r.cat === "mixed" ? "ترکیبی" : CATEGORIES.find(c => c.id === r.cat)?.name || "—";
  const wrongCount = r.total - r.score - r.blank;

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-7 text-center overflow-hidden relative">
        <div className={`absolute inset-x-0 top-0 h-1.5 ${r.passed ? "bg-pass" : "bg-fail"}`} />
        <div className={`inline-flex items-center gap-2 font-display text-[22px] px-5 py-1.5 rounded-full ${
          r.passed ? "bg-passoft text-pass" : "bg-failsoft text-fail"}`}>
          <Ic n={r.passed ? "award" : "refresh"} s={21} />
          {r.passed ? "قبول شدید!" : "قبول نشدید"}
        </div>

        <div className="flex items-center justify-center gap-8 mt-6 flex-wrap">
          <Ring pct={r.percent} size={150} stroke={13} tone={r.passed ? "#0f8f5b" : "#d5453a"}>
            <div className="text-center">
              <div className="font-display text-[42px] leading-none text-ink">{fa(r.percent)}٪</div>
              <div className="text-[11.5px] font-bold text-mut mt-1">درصد صحیح</div>
            </div>
          </Ring>
          <div className="text-right">
            <div className="font-display text-[52px] leading-none text-ink">
              {fa(r.score)} <span className="text-[26px] text-mut">از {fa(r.total)}</span>
            </div>
            <div className="text-[13px] text-mut font-medium mt-2">دسته: {catName} · زمان: {fa(Math.floor(r.duration / 60))}:{String(r.duration % 60).padStart(2, "0")} دقیقه</div>
            <div className="flex gap-2 mt-3.5 flex-wrap">
              <Chip tone="#0f8f5b" soft="#ddf3e7"><Ic n="check" s={13} /> {fa(r.score)} صحیح</Chip>
              <Chip tone="#d5453a" soft="#fbe7e5"><Ic n="x" s={13} /> {fa(wrongCount)} غلط</Chip>
              <Chip tone="#5b6472" soft="#e9edf1"><Ic n="minus" s={13} /> {fa(r.blank)} بی‌پاسخ</Chip>
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 justify-center mt-7 flex-wrap">
          <Btn v="ink" onClick={onAgain}><Ic n="refresh" s={17} /> آزمون دوباره</Btn>
          {latest && (
            <a href="#review" className="inline-flex items-center gap-2 font-bold text-[15px] px-5 py-3 rounded-xl bg-brand text-brandink hover:bg-brand2 transition-colors">
              <Ic n="eye" s={17} /> مرور پاسخ‌ها
            </a>
          )}
        </div>
      </Card>

      <div id="review" className="mt-8">
        <h3 className="font-display text-[24px] text-ink mb-4">مرور پاسخ‌ها</h3>
        {wrongs.length > 0 && (
          <div className="rounded-xl bg-brand/12 border border-branddeep/30 px-4 py-3 mb-4 flex items-center gap-2.5 text-[13px] font-bold text-brandink">
            <Ic n="target" s={17} c="text-branddeep" />
            {fa(wrongs.length)} سوال به لیست اشتباه‌های شما اضافه شد — از صفحه «پیشرفت» تمرین‌شان کنید.
          </div>
        )}
        <div className="grid gap-3">
          {results.length > 0 && <ReviewList resultId={latest.id} />}
        </div>
      </div>
    </div>
  );
}

function ReviewList(_: { resultId: string }) {
  const { questions } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const snapshot = useMemo(() => {
    try {
      const raw = sessionStorage.getItem("farman_last_exam");
      return raw ? (JSON.parse(raw) as { qid: string; picked?: string; ok: boolean | null }[]) : null;
    } catch { return null; }
  }, []);
  if (!snapshot || !snapshot.length) return <p className="text-[13px] text-mut">جزئیات این آزمون در دسترس نیست.</p>;
  return (
    <>
      {snapshot.map((sn, i) => {
        const q = questions.find(x => x.id === sn.qid);
        if (!q) return null;
        return (
          <Card key={sn.qid} className="p-4">
            <button className="w-full flex items-center gap-3 text-right" onClick={() => setOpen(open === sn.qid ? null : sn.qid)}>
              <span className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 ${
                sn.ok === null ? "bg-mist2 text-mut" : sn.ok ? "bg-pass text-white" : "bg-fail text-white"}`}>
                <Ic n={sn.ok === null ? "minus" : sn.ok ? "check" : "x"} s={16} />
              </span>
              <span className="flex-1 font-bold text-[14px] leading-7 text-ink">{fa(i + 1)}. {q.text}</span>
              <Ic n={open === sn.qid ? "chevL" : "chevR"} s={17} c="text-mut shrink-0" />
            </button>
            {open === sn.qid && (
              <div className="anim-in mt-3 pr-11 space-y-2">
                {sn.picked && !sn.ok && (
                  <div className="text-[13px] leading-7 text-fail font-bold flex items-center gap-1.5">
                    <Ic n="x" s={14} /> پاسخ شما: {sn.picked}
                  </div>
                )}
                <div className="text-[13px] leading-7 text-pass font-bold flex items-center gap-1.5">
                  <Ic n="check" s={14} /> پاسخ صحیح: {q.options[q.correct]}
                </div>
                <p className="text-[13px] leading-7 text-inksoft bg-mist rounded-lg p-3">{q.explain}</p>
              </div>
            )}
          </Card>
        );
      })}
    </>
  );
}
