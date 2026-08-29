import React, { useCallback, useEffect, useRef, useState } from "react";
import { StoreProvider, useStore, fa } from "./store";
import { Avatar, Bar, Btn, Chip, Ic, Modal, RoadLine, Toasts } from "./components";
import Auth from "./views/Auth";
import Dashboard from "./views/Dashboard";
import ExamView from "./views/ExamView";
import Study from "./views/Study";
import Progress from "./views/Progress";
import Profile from "./views/Profile";
import Admin from "./views/Admin";

const TABS = [
  { id: "home", label: "خانه", icon: "home" },
  { id: "study", label: "مطالعه", icon: "book" },
  { id: "exam", label: "آزمون", icon: "exam", raised: true },
  { id: "progress", label: "پیشرفت", icon: "chart" },
  { id: "profile", label: "پروفایل", icon: "user" },
];
const ORDER = TABS.map(t => t.id);

type Nav = (r: string, p?: Record<string, string>) => void;

export default function App() {
  return (
    <StoreProvider>
      <Root />
    </StoreProvider>
  );
}

/* ================================ Root Shell ================================ */

function Root() {
  const s = useStore();
  const [route, setRoute] = useState("home");
  const [params, setParams] = useState<Record<string, string>>({});
  const [drawer, setDrawer] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [support, setSupport] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);
  const [booted, setBooted] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 550);
    return () => clearTimeout(t);
  }, []);

  const nav: Nav = useCallback((r, p = {}) => {
    setRoute(r); setParams(p); setDrawer(false);
    window.scrollTo({ top: 0 });
  }, []);

  const inExam = !!s.activeExam;
  const wide = route === "admin";

  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", esc); };
  }, [drawer]);

  if (!s.user) return <><Auth /><Toasts /></>;

  const title = params.article
    ? "جزئیات آموزش"
    : route === "admin" ? "پنل مدیریت" : TABS.find(t => t.id === route)?.label || "فرمان";

  const onTouchStart = (e: React.TouchEvent) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current || inExam || wide) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) < 64 || Math.abs(dy) > 52) return;
    const i = ORDER.indexOf(route);
    if (i < 0) return;
    const next = dx < 0 ? Math.min(i + 1, ORDER.length - 1) : Math.max(i - 1, 0);
    if (next !== i) nav(ORDER[next]);
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {!inExam && <StatusBar />}
      {!inExam && (
        <TopBar
          title={title}
          canBack={route === "admin"}
          onBack={() => nav("home")}
          onMenu={() => setDrawer(true)}
          onBell={() => setNotifOpen(true)}
          onAdmin={() => nav("admin")}
        />
      )}

      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        route={route}
        onNav={nav}
        onSupport={() => { setDrawer(false); setSupport(true); }}
        onLogout={() => { setDrawer(false); setConfirmOut(true); }}
      />

      <main key={route + (params.article || "") + (params.tab || "")}
        className="flex-1 anim-screen" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className={wide ? "mx-auto max-w-6xl px-4 md:px-6 pb-32" : "mx-auto max-w-2xl px-4 md:px-6 pb-32"}>
          {route === "home" && <Dashboard nav={nav} loading={!booted} />}
          {route === "exam" && <ExamView />}
          {route === "study" && <Study nav={nav} initCat={params.cat} />}
          {route === "progress" && <Progress nav={nav} initTab={params.tab} />}
          {route === "profile" && <Profile nav={nav} initTab={params.tab} />}
          {route === "admin" && <Admin />}
        </div>
      </main>

      {!inExam && <BottomNav route={route} onNav={nav} />}

      <NotifSheet open={notifOpen} onClose={() => setNotifOpen(false)} />
      <SupportModal open={support} onClose={() => setSupport(false)} />

      <Modal open={confirmOut} onClose={() => setConfirmOut(false)} title="خروج از حساب">
        <div className="flex items-start gap-3.5">
          <span className="w-11 h-11 rounded-xl bg-failsoft text-fail grid place-items-center shrink-0"><Ic n="out" s={20} /></span>
          <p className="text-[13.5px] leading-7 text-inksoft">
            نشست فعلی شما باطل می‌شود. با توجه به سیاست تک‌نشستی، ورود دوباره نیازمند دریافت کد OTP جدید است.
          </p>
        </div>
        <div className="flex gap-2.5 mt-5">
          <Btn v="danger" full onClick={() => { setConfirmOut(false); s.logout(); }}><Ic n="out" s={17} /> خروج از حساب</Btn>
          <Btn v="outline" full onClick={() => setConfirmOut(false)}>انصراف</Btn>
        </div>
      </Modal>

      <Toasts />
    </div>
  );
}

/* ================================ Status Bar ================================ */

function StatusBar() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 20000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="md:hidden bg-asphalt text-white/85 px-4 py-1.5 flex items-center justify-between text-[11px] font-bold shrink-0">
      <span>{time.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</span>
      <span className="flex items-center gap-2">
        <Ic n="signal" s={13} /><Ic n="wifi" s={13} /><Ic n="batt" s={15} />
      </span>
    </div>
  );
}

/* ================================ Top App Bar ================================ */

function TopBar({ title, canBack, onBack, onMenu, onBell, onAdmin }: {
  title: string; canBack: boolean; onBack: () => void; onMenu: () => void; onBell: () => void; onAdmin: () => void;
}) {
  const s = useStore();
  return (
    <header className="sticky top-0 z-40 bg-paper/85 backdrop-blur-md border-b border-line shrink-0">
      <div className="mx-auto max-w-6xl px-3 md:px-6 h-[58px] flex items-center gap-2">
        {canBack ? (
          <button onClick={onBack} className="w-10 h-10 rounded-xl grid place-items-center text-ink hover:bg-mist active:scale-90 transition-all" title="بازگشت">
            <Ic n="chevR" s={22} />
          </button>
        ) : (
          <button onClick={onMenu} className="w-10 h-10 rounded-xl grid place-items-center text-ink hover:bg-mist active:scale-90 transition-all" title="منو">
            <Ic n="menu" s={22} />
          </button>
        )}
        <h1 key={title} className="font-display text-[22px] text-ink flex-1 anim-up leading-none mt-1">{title}</h1>

        {s.sub && s.sub.plan_id !== "free" && (
          <Chip tone="#0f8f5b" soft="#ddf3e7" className="hidden sm:inline-flex"><Ic n="calendar" s={13} /> {fa(s.daysLeft)} روز</Chip>
        )}
        {s.user?.role === "superadmin" && (
          <button onClick={onAdmin} title="پنل مدیریت"
            className="w-10 h-10 rounded-xl grid place-items-center bg-mist text-branddeep hover:bg-brandsoft active:scale-90 transition-all">
            <Ic n="shield" s={19} />
          </button>
        )}
        <button onClick={onBell} className="relative w-10 h-10 rounded-xl grid place-items-center text-ink hover:bg-mist active:scale-90 transition-all" title="اعلان‌ها">
          <Ic n="bell" s={20} />
          {s.unread > 0 && (
            <span className="absolute top-1.5 left-1.5 min-w-[17px] h-[17px] px-1 rounded-full bg-fail text-white text-[10px] font-bold grid place-items-center anim-pop">
              {fa(s.unread)}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}

/* ================================ Bottom Navigation ================================ */

function BottomNav({ route, onNav }: { route: string; onNav: Nav }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pb-safe">
      <div className="bg-paper/92 backdrop-blur-md border-t border-line shadow-[0_-8px_24px_-16px_rgba(16,27,38,0.25)]">
        <div className="mx-auto max-w-2xl grid grid-cols-5 px-2 pt-1.5">
          {TABS.map(t => {
            const active = route === t.id;
            if (t.raised) {
              return (
                <button key={t.id} onClick={() => onNav(t.id)} className="relative flex flex-col items-center pb-1.5 group">
                  <span className={`-mt-6 w-14 h-14 rounded-full grid place-items-center border-4 border-paper shadow-[0_8px_20px_-6px_rgba(217,154,0,0.65)] transition-all duration-200 group-active:scale-90 ${
                    active ? "bg-asphalt text-brand rotate-6" : "bg-brand text-brandink group-hover:-translate-y-0.5"}`}>
                    <Ic n={t.icon} s={24} />
                  </span>
                  <span className={`text-[10px] font-bold mt-1 ${active ? "text-branddeep" : "text-mut"}`}>{t.label}</span>
                </button>
              );
            }
            return (
              <button key={t.id} onClick={() => onNav(t.id)}
                className={`flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-all duration-200 active:scale-90 ${
                  active ? "text-branddeep" : "text-mut hover:text-ink"}`}>
                <span className={`px-4 py-0.5 rounded-full transition-all duration-200 ${active ? "bg-brandsoft" : ""}`}>
                  <Ic n={t.icon} s={21} />
                </span>
                <span className="text-[10px] font-bold">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

/* ================================ Drawer ================================ */

function Drawer({ open, onClose, route, onNav, onSupport, onLogout }: {
  open: boolean; onClose: () => void; route: string; onNav: Nav; onSupport: () => void; onLogout: () => void;
}) {
  const s = useStore();
  const u = s.user!;
  const isPremium = s.sub && s.sub.plan_id !== "free";
  const fullName = u.first_name ? `${u.first_name} ${u.last_name || ""}` : "کاربر مهمان";

  const Item = ({ icon, label, target, p, badge, danger, action }: {
    icon: string; label: string; target?: string; p?: Record<string, string>; badge?: number; danger?: boolean; action?: () => void;
  }) => (
    <button
      onClick={() => (action ? action() : target ? onNav(target, p) : undefined)}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-bold transition-all active:scale-[0.98] ${
        danger ? "text-fail hover:bg-failsoft"
        : target && route === target && !p?.tab && !p?.article ? "bg-brandsoft text-branddeep"
        : "text-inksoft hover:bg-mist hover:text-ink"}`}>
      <Ic n={icon} s={19} />
      <span className="flex-1 text-right">{label}</span>
      {!!badge && <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-fail text-white text-[10.5px] grid place-items-center">{fa(badge)}</span>}
      {target && <Ic n="chevL" s={15} c="opacity-40" />}
    </button>
  );

  return (
    <>
      <div onClick={onClose}
        className={`fixed inset-0 z-50 bg-asphalt/55 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`} />
      <aside className={`fixed top-0 bottom-0 right-0 z-50 w-[300px] max-w-[86vw] bg-paper shadow-pop flex flex-col transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)] ${
        open ? "translate-x-0" : "translate-x-full"}`}>
        {/* header */}
        <div className="bg-asphalt text-white p-5 relative overflow-hidden shrink-0">
          <RoadLine className="absolute left-0 right-0 bottom-3 opacity-15" />
          <div className="flex items-center gap-3.5 relative">
            <Avatar name={fullName} size={52} />
            <div className="min-w-0">
              <div className="font-display text-[19px] leading-tight truncate">{fullName}</div>
              <div className="text-white/55 text-[12px] font-bold mt-0.5" dir="ltr" style={{ textAlign: "right" }}>{u.phone}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3.5 relative">
            {u.role === "superadmin" && <Chip tone="#ffc21c" soft="#1f3040">سوپرادمین</Chip>}
            {isPremium
              ? <Chip tone="#6fe3ae" soft="#123a29"><Ic n="crown" s={12} /> اشتراک یک‌ساله</Chip>
              : <Chip tone="#c8d6e2" soft="#1f3040">طرح رایگان</Chip>}
          </div>
        </div>

        {/* subscription mini-card */}
        <div className="p-3.5 shrink-0">
          {isPremium ? (
            <div className="rounded-2xl bg-mist border border-line p-3.5">
              <div className="flex items-center justify-between text-[12px] font-bold text-inksoft mb-2">
                <span className="flex items-center gap-1.5"><Ic n="calendar" s={14} /> اعتبار اشتراک</span>
                <span className="text-pass">{fa(s.daysLeft)} روز مانده</span>
              </div>
              <Bar pct={(s.daysLeft / 365) * 100} tone="#0f8f5b" h={7} />
              <button onClick={() => onNav("profile", { tab: "plans" })}
                className="mt-3 w-full text-[12.5px] font-bold text-branddeep bg-brandsoft rounded-lg py-2 hover:bg-brand/30 transition-colors active:scale-[0.98]">
                تمدید اشتراک یک‌ساله
              </button>
            </div>
          ) : (
            <button onClick={() => onNav("profile", { tab: "plans" })}
              className="w-full rounded-2xl bg-brand text-brandink p-3.5 text-right hover:bg-brand2 transition-colors active:scale-[0.98] shadow-[0_8px_20px_-8px_rgba(217,154,0,0.7)]">
              <span className="flex items-center gap-2 font-display text-[16px]"><Ic n="crown" s={18} /> ارتقا به اشتراک یک‌ساله</span>
              <span className="block text-[11.5px] font-bold mt-1 opacity-75">دسترسی کامل به همه دسته‌ها و آموزش‌ها</span>
            </button>
          )}
        </div>

        {/* menu */}
        <div className="flex-1 overflow-y-auto px-3.5 pb-4 space-y-1">
          <div className="text-[10.5px] font-bold text-mut px-2 pt-1 pb-1.5">منوی اصلی</div>
          <Item icon="home" label="خانه" target="home" />
          <Item icon="exam" label="آزمون آیین‌نامه" target="exam" />
          <Item icon="book" label="مطالعه و آموزش" target="study" />
          <Item icon="chart" label="پیشرفت من" target="progress" />
          <Item icon="user" label="پروفایل" target="profile" />

          <div className="text-[10.5px] font-bold text-mut px-2 pt-3.5 pb-1.5">یادگیری</div>
          <Item icon="star" label="نشان‌شده‌ها" target="progress" p={{ tab: "bookmarks" }} badge={s.bookmarks.length} />
          <Item icon="alert" label="سوالات اشتباه" target="progress" p={{ tab: "wrongs" }} badge={s.wrongs.length} />
          <Item icon="crown" label="اشتراک و پرداخت" target="profile" p={{ tab: "plans" }} />

          <div className="text-[10.5px] font-bold text-mut px-2 pt-3.5 pb-1.5">سیستم</div>
          {u.role === "superadmin" && <Item icon="shield" label="پنل مدیریت" target="admin" />}
          <Item icon="headset" label="تماس با پشتیبانی" action={onSupport} />
          <Item icon="out" label="خروج از حساب" danger action={onLogout} />
        </div>

        <div className="border-t border-line px-5 py-3 flex items-center justify-between text-[10.5px] font-bold text-mut shrink-0">
          <span>فرمان · نسخه ۱٫۰</span>
          <span dir="ltr">REST API · v1</span>
        </div>
      </aside>
    </>
  );
}

/* ================================ Notifications Sheet ================================ */

function NotifSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useStore();
  useEffect(() => {
    if (open && s.unread > 0) {
      const t = setTimeout(() => s.markNotifsRead(), 900);
      return () => clearTimeout(t);
    }
  }, [open]); // eslint-disable-line

  const iconOf = (k: string) => (k === "sub" ? "crown" : k === "exam" ? "exam" : "info");
  const toneOf = (k: string) => (k === "sub" ? { c: "#d99a00", b: "#fdf0dd" } : k === "exam" ? { c: "#2e6fae", b: "#e6f0f9" } : { c: "#5b6472", b: "#e9edf1" });

  return (
    <Modal open={open} onClose={onClose} title="اعلان‌ها">
      {s.notifs.length === 0 ? (
        <div className="text-center py-8">
          <span className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-mist2 text-mut mb-3"><Ic n="bell" s={26} /></span>
          <p className="font-bold text-ink">اعلانی ندارید</p>
          <p className="text-[12.5px] text-mut mt-1">نتایج آزمون و وضعیت اشتراک اینجا اطلاع‌رسانی می‌شود.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {s.notifs.map(n => {
            const t = toneOf(n.kind);
            return (
              <div key={n.id} className={`flex items-start gap-3 rounded-xl border p-3.5 transition-colors ${n.read ? "border-line" : "border-line bg-mist"}`}>
                <span className="w-9 h-9 rounded-xl grid place-items-center shrink-0" style={{ background: t.b, color: t.c }}>
                  <Ic n={iconOf(n.kind)} s={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[13.5px] text-ink">{n.title}</span>
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-fail shrink-0" />}
                  </div>
                  <p className="text-[12px] leading-6 text-inksoft mt-0.5">{n.body}</p>
                  <span className="text-[10.5px] font-bold text-mut">{new Date(n.at).toLocaleString("fa-IR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

/* ================================ Support ================================ */

function SupportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useStore();
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <Modal open={open} onClose={() => { onClose(); setSent(false); setMsg(""); }} title="پشتیبانی فرمان">
      {sent ? (
        <div className="text-center py-6 anim-pop">
          <span className="inline-grid place-items-center w-16 h-16 rounded-full bg-passoft text-pass mb-4"><Ic n="check" s={30} /></span>
          <p className="font-display text-[22px] text-ink">پیام شما ثبت شد</p>
          <p className="text-[13px] text-mut mt-1.5 leading-6">تیم پشتیبانی در ساعات کاری پاسخ را برایتان پیامک می‌کند.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-mist p-3.5">
              <div className="flex items-center gap-2 text-[12px] font-bold text-mut"><Ic n="phone" s={14} /> تلفن پشتیبانی</div>
              <div className="font-bold text-[15px] text-ink mt-1" dir="ltr" style={{ textAlign: "right" }}>۰۲۱-۹۱۰۷۷۰۰۰</div>
            </div>
            <div className="rounded-xl bg-mist p-3.5">
              <div className="flex items-center gap-2 text-[12px] font-bold text-mut"><Ic n="clock" s={14} /> ساعات پاسخگویی</div>
              <div className="font-bold text-[15px] text-ink mt-1">هر روز ۸ تا ۲۰</div>
            </div>
          </div>
          <label className="block">
            <span className="text-[13px] font-bold text-inksoft block mb-1.5">پیام شما</span>
            <textarea rows={3} value={msg} onChange={e => setMsg(e.target.value)}
              placeholder="مشکل یا سوال خود را بنویسید…"
              className="w-full bg-mist border border-line rounded-xl px-4 py-3 text-[14px] text-ink placeholder:text-mut/70 focus:border-branddeep focus:bg-paper transition-colors" />
          </label>
          <Btn full disabled={msg.trim().length < 5} onClick={() => { setSent(true); s.toast("پیام به پشتیبانی ارسال شد"); }}>
            <Ic n="send" s={16} /> ارسال پیام
          </Btn>
        </div>
      )}
    </Modal>
  );
}
