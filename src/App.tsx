import React, { useEffect, useState } from "react";
import { StoreProvider, useStore, fa } from "./store";
import { Ic, Logo, Toasts } from "./components";
import Auth from "./views/Auth";
import Dashboard from "./views/Dashboard";
import ExamView from "./views/ExamView";
import Study, { ArticleView } from "./views/Study";
import Progress from "./views/Progress";
import Profile from "./views/Profile";
import Admin from "./views/Admin";

interface Route { name: string; params: Record<string, string> }

const NAV = [
  { id: "home", label: "خانه", icon: "home" },
  { id: "exam", label: "آزمون", icon: "exam" },
  { id: "study", label: "مطالعه", icon: "book" },
  { id: "progress", label: "پیشرفت", icon: "chart" },
  { id: "profile", label: "پروفایل", icon: "user" },
];

function Shell() {
  const s = useStore();
  const [route, setRoute] = useState<Route>({ name: "home", params: {} });
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 750);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [route]);

  const nav = (name: string, params: Record<string, string> = {}) => setRoute({ name, params });

  if (!s.user || !s.user.onboarded) {
    return (
      <>
        <Auth />
        <Toasts />
      </>
    );
  }

  const u = s.user;
  const plan = s.plan || s.plans[0];
  const activeNav = ["article"].includes(route.name) ? "study" : route.name;

  return (
    <div className="app-bg min-h-screen">
      {/* ---------- desktop sidebar ---------- */}
      <aside className="hidden md:flex fixed inset-y-0 right-0 w-[248px] asphalt-tex text-white flex-col z-40 border-l border-asphalt3">
        <div className="p-6 pb-4"><Logo size={42} light /></div>
        <div className="mx-6 mb-5"><div className="road-line" /></div>

        <nav className="flex-1 px-4 space-y-1.5">
          {NAV.map(n => (
            <button key={n.id} onClick={() => nav(n.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-[14px] font-bold transition-all duration-200 ${
                activeNav === n.id ? "bg-brand text-brandink shadow-pop" : "text-white/65 hover:bg-white/8 hover:text-white hover:pr-5"}`}>
              <Ic n={n.icon} s={20} />
              {n.label}
              {activeNav === n.id && <span className="mr-auto w-1.5 h-1.5 rounded-full bg-brandink" />}
            </button>
          ))}
          {u.role === "superadmin" && (
            <button onClick={() => nav("admin")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-[14px] font-bold transition-all duration-200 border border-dashed ${
                route.name === "admin" ? "bg-white/12 text-brand border-transparent" : "text-brand/80 border-brand/30 hover:bg-white/8 hover:text-brand"}`}>
              <Ic n="shield" s={20} />
              پنل مدیریت
            </button>
          )}
        </nav>

        <div className="p-4">
          <div className="rounded-2xl bg-white/6 border border-white/10 p-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-brand text-brandink grid place-items-center font-display text-[19px] shrink-0">
                {(u.first_name || "؟")[0]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold truncate">{u.first_name} {u.last_name}</div>
                <div className="text-[11px] text-white/50 font-medium">طرح {plan.name} · {fa(s.daysLeft)} روز</div>
              </div>
              <button onClick={s.logout} title="خروج" className="w-8 h-8 rounded-lg grid place-items-center text-white/50 hover:text-fail hover:bg-white/8 transition-colors">
                <Ic n="out" s={17} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ---------- mobile top bar ---------- */}
      <header className="md:hidden sticky top-0 z-40 asphalt-tex text-white px-5 py-3.5 flex items-center justify-between border-b border-asphalt3">
        <Logo size={34} light />
        <div className="flex items-center gap-2">
          <button onClick={() => nav("profile", { tab: "plans" })} className="flex items-center gap-1.5 bg-white/8 border border-white/10 rounded-full px-3 py-1.5 text-[11.5px] font-bold">
            <Ic n="crown" s={13} c="text-brand" /> {fa(s.daysLeft)} روز
          </button>
          {u.role === "superadmin" && (
            <button onClick={() => nav("admin")} className="w-9 h-9 rounded-full bg-white/8 border border-white/10 grid place-items-center text-brand">
              <Ic n="shield" s={17} />
            </button>
          )}
        </div>
      </header>

      {/* ---------- content ---------- */}
      <main className="md:mr-[248px] px-4 sm:px-7 py-6 md:py-9 pb-28 md:pb-10 max-w-[1200px]">
        <div key={route.name + JSON.stringify(route.params)} className="anim-up">
          {route.name === "home" && <Dashboard nav={nav} loading={booting} />}
          {route.name === "exam" && <ExamView />}
          {route.name === "study" && <Study nav={nav} initCat={route.params.cat} />}
          {route.name === "article" && <ArticleView id={route.params.id} nav={nav} />}
          {route.name === "progress" && <Progress nav={nav} initTab={route.params.tab} />}
          {route.name === "profile" && <Profile nav={nav} initTab={route.params.tab} />}
          {route.name === "admin" && (u.role === "superadmin" ? <Admin /> : <NoAccess />)}
        </div>
      </main>

      {/* ---------- mobile bottom nav ---------- */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-paper/95 backdrop-blur border-t border-line px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2">
        <div className="flex items-center justify-around">
          {NAV.map(n => (
            <button key={n.id} onClick={() => nav(n.id)}
              className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                activeNav === n.id ? "text-ink" : "text-mut"}`}>
              <span className={`grid place-items-center w-11 h-7 rounded-full transition-all duration-300 ${activeNav === n.id ? "bg-brand text-brandink" : ""}`}>
                <Ic n={n.icon} s={20} />
              </span>
              <span className={`text-[10.5px] font-bold ${activeNav === n.id ? "text-ink" : ""}`}>{n.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <Toasts />
    </div>
  );
}

function NoAccess() {
  return (
    <div className="max-w-md mx-auto text-center py-16 anim-pop">
      <span className="inline-grid place-items-center w-16 h-16 rounded-2xl bg-failsoft text-fail mb-4"><Ic n="ban" s={30} /></span>
      <h2 className="font-display text-[26px] text-ink">دسترسی غیرمجاز — 403</h2>
      <p className="text-[13.5px] text-mut mt-2 leading-7">این بخش فقط برای سوپرادمین است. لایه Authorization اجازه عبور نداد.</p>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
