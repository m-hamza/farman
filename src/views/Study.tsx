import React, { useState } from "react";
import { useStore, fa } from "../store";
import { ARTICLES, CATEGORIES, type Article, type CatId } from "../data";
import { Btn, Card, Chip, Ic, Reveal, TrafficSign } from "../components";
import type { NavFn } from "./Dashboard";

export default function Study({ nav, initCat }: { nav: NavFn; initCat?: string }) {
  const s = useStore();
  const [cat, setCat] = useState<CatId | "all">((initCat as CatId) || "all");
  const list = ARTICLES.filter(a => cat === "all" || a.cat === cat);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 anim-up">
        <h1 className="font-display text-[32px] leading-tight text-ink">مطالعه و آموزش</h1>
        <p className="text-[13.5px] text-mut mt-1">آموزش‌های خلاصه و نکته‌دار؛ هر درس با سوالات همان دسته گره خورده است.</p>
      </div>

      <div className="flex gap-2 flex-wrap mb-6 anim-up" style={{ animationDelay: "60ms" }}>
        <button onClick={() => setCat("all")}
          className={`px-4 py-2 rounded-full text-[13px] font-bold border-2 transition-all ${
            cat === "all" ? "bg-asphalt text-white border-asphalt" : "border-line bg-paper text-inksoft hover:border-asphalt3"}`}>
          همه
        </button>
        {CATEGORIES.map(c => {
          const locked = !s.canCat(c.id);
          return (
            <button key={c.id} onClick={() => setCat(c.id)}
              className={`px-4 py-2 rounded-full text-[13px] font-bold border-2 transition-all flex items-center gap-1.5 ${
                cat === c.id ? "bg-asphalt text-white border-asphalt" : "border-line bg-paper text-inksoft hover:border-asphalt3"}`}>
              {locked && <Ic n="lock" s={13} />}
              {c.name}
            </button>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 stagger">
        {list.map(a => {
          const c = CATEGORIES.find(x => x.id === a.cat)!;
          const open = s.canContent(a.id);
          return (
            <Card key={a.id} className={`p-5 flex gap-4 ${!open ? "relative" : ""}`} onClick={() => open ? nav("article", { id: a.id }) : nav("profile", { tab: "plans" })}>
              <div className="shrink-0 bg-mist rounded-2xl p-2.5 border border-line grid place-items-center self-start">
                {a.sign ? <TrafficSign k={a.sign} size={64} /> : <span style={{ color: c.tone }}><Ic n={c.icon} s={34} /></span>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Chip tone={c.tone} soft={c.soft}>{c.name}</Chip>
                  <span className="text-[11px] font-bold text-mut flex items-center gap-1"><Ic n="clock" s={12} /> {fa(a.minutes)} دقیقه</span>
                </div>
                <h3 className="font-bold text-[15.5px] leading-8 text-ink mt-2">{a.title}</h3>
                <p className="text-[12.5px] text-mut leading-6 line-clamp-2">{a.intro}</p>
                {!open && (
                  <div className="mt-2.5 flex items-center gap-1.5 text-[12px] font-bold text-branddeep">
                    <Ic n="crown" s={14} /> نیازمند طرح استاندارد یا حرفه‌ای
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Reveal className="mt-8">
        <Card className="p-6 flex items-center justify-between flex-wrap gap-4 !bg-asphalt !border-asphalt3 text-white">
          <div className="flex items-center gap-4">
            <span className="w-11 h-11 rounded-xl bg-brand text-brandink grid place-items-center"><Ic n="exam" s={22} /></span>
            <div>
              <div className="font-display text-[20px]">خواندی؟ حالا محک بزن!</div>
              <div className="text-[12.5px] text-white/60">بعد از هر درس، یک آزمون کوتاه همان دسته را بزن.</div>
            </div>
          </div>
          <Btn onClick={() => nav("exam")}>رفتن به آزمون <Ic n="arrowf" s={16} /></Btn>
        </Card>
      </Reveal>
    </div>
  );
}

/* ---------------- Article reader ---------------- */

export function ArticleView({ id, nav }: { id: string; nav: NavFn }) {
  const s = useStore();
  const a: Article | undefined = ARTICLES.find(x => x.id === id);
  if (!a) return <div className="text-center py-20 text-mut">مقاله پیدا نشد.</div>;
  const c = CATEGORIES.find(x => x.id === a.cat)!;

  if (!s.canContent(a.id)) {
    return (
      <Card className="max-w-lg mx-auto p-8 text-center anim-pop">
        <span className="inline-grid place-items-center w-16 h-16 rounded-2xl bg-mist2 text-mut mb-4"><Ic n="lock" s={30} /></span>
        <h2 className="font-display text-[26px] text-ink">محتوای قفل‌شده</h2>
        <p className="text-[13.5px] text-mut leading-7 mt-2">
          این آموزش در طرح فعلی شما ({s.plan?.name}) در دسترس نیست. لایه دسترسی سمت Backend اجازه نمایش نمی‌دهد.
        </p>
        <Btn className="mt-5" onClick={() => nav("profile", { tab: "plans" })}><Ic n="crown" s={17} /> ارتقای اشتراک</Btn>
      </Card>
    );
  }

  const relQs = s.questions.filter(q => q.cat === a.cat && q.status === "active").slice(0, 3);

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => nav("study")} className="flex items-center gap-1.5 text-[13px] font-bold text-mut hover:text-ink mb-4 transition-colors">
        <Ic n="chevR" s={16} /> بازگشت به مطالعه
      </button>

      <Card className="overflow-hidden anim-up">
        <div className="asphalt-tex p-7 text-white relative">
          <div className="absolute -left-8 -bottom-14 opacity-90 anim-float">
            {a.sign && <TrafficSign k={a.sign} size={110} />}
          </div>
          <div className="pl-24">
            <Chip tone="#ffc21c" soft="rgba(255,194,28,0.15)" className="!text-brand">{c.name}</Chip>
            <h1 className="font-display text-[27px] leading-10 mt-3 pr-0">{a.title}</h1>
            <div className="text-[12px] text-white/60 font-medium mt-2 flex items-center gap-3">
              <span className="flex items-center gap-1.5"><Ic n="clock" s={13} /> {fa(a.minutes)} دقیقه</span>
              <span className="flex items-center gap-1.5"><Ic n="doc" s={13} /> آموزش رسمی</span>
            </div>
          </div>
        </div>

        <div className="p-7 space-y-5">
          <p className="text-[15px] leading-9 text-inksoft border-r-4 border-brand pr-4">{a.intro}</p>
          {a.blocks.map((b, i) => {
            if (b.t === "h") return <h2 key={i} className="font-display text-[22px] text-ink pt-3">{b.text}</h2>;
            if (b.t === "p") return <p key={i} className="text-[14.5px] leading-9 text-inksoft">{b.text}</p>;
            if (b.t === "tip") return (
              <div key={i} className="rounded-xl bg-brand/12 border border-branddeep/30 p-4 flex gap-3">
                <Ic n="spark" s={19} c="text-branddeep shrink-0 mt-1" />
                <p className="text-[13.5px] leading-8 text-brandink font-medium">{b.text}</p>
              </div>
            );
            return (
              <ul key={i} className="space-y-2.5">
                {b.items!.map((it, j) => (
                  <li key={j} className="flex gap-3 text-[14px] leading-8 text-inksoft">
                    <span className="w-2 h-2 rounded-full mt-3.5 shrink-0" style={{ background: c.tone }} />
                    {it}
                  </li>
                ))}
              </ul>
            );
          })}

          <div className="pt-4 border-t border-line">
            <h3 className="font-display text-[19px] text-ink mb-3">چند سوال از همین دسته</h3>
            <div className="space-y-2.5">
              {relQs.map(qq => (
                <div key={qq.id} className="rounded-xl bg-mist p-4 text-[13.5px] font-bold text-ink leading-7 flex items-start justify-between gap-3">
                  {qq.text}
                  <Ic n="flag" s={16} c="text-mut shrink-0 mt-1" />
                </div>
              ))}
            </div>
            <Btn v="ink" full className="mt-4" onClick={() => nav("exam")}>
              آزمون دسته «{c.name}» <Ic n="play" s={16} />
            </Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}
