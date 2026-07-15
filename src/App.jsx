import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  LayoutDashboard, BookOpen, Tags as TagIcon, ListChecks, BarChart3, Sun, Moon,
  Plus, X, Trash2, Pencil, Upload, ChevronDown, ChevronRight, Check, Download,
  Search, TrendingUp, TrendingDown, Target, Percent, Activity, ArrowUpRight,
  ArrowDownRight, LogOut, AlertTriangle, Save,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, BarChart, Bar, Cell, PieChart, Pie, Legend,
} from "recharts";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc, getDoc, setDoc, deleteDoc, collection, onSnapshot,
} from "firebase/firestore";
import { auth, db, signInWithGoogle, signOutUser } from "./firebase.js";

/* ============================== THEME ============================== */

const THEMES = {
  dark: {
    bg: "#0B0E13", bgSoft: "#0F131B", panel: "#12161F", panel2: "#1A1F2B",
    border: "#252B38", borderSoft: "#1D2330", textPrimary: "#EDEFF3",
    textSecondary: "#8B93A7", textFaint: "#5B6376", accent: "#E8A33D",
    accentSoft: "rgba(232,163,61,0.14)", accentBorder: "rgba(232,163,61,0.35)",
    profit: "#3FD1A0", profitSoft: "rgba(63,209,160,0.14)", loss: "#F0616D",
    lossSoft: "rgba(240,97,109,0.14)", neutral: "#8B93A7", shadow: "0 8px 30px rgba(0,0,0,0.35)",
  },
  light: {
    bg: "#F3F4F7", bgSoft: "#EAEBEF", panel: "#FFFFFF", panel2: "#F6F7F9",
    border: "#E2E5EB", borderSoft: "#EAECF0", textPrimary: "#12141C",
    textSecondary: "#5B6474", textFaint: "#8A93A3", accent: "#B9791F",
    accentSoft: "rgba(185,121,31,0.10)", accentBorder: "rgba(185,121,31,0.30)",
    profit: "#1F9D74", profitSoft: "rgba(31,157,116,0.10)", loss: "#D63A4B",
    lossSoft: "rgba(214,58,75,0.10)", neutral: "#5B6474", shadow: "0 8px 30px rgba(20,20,30,0.08)",
  },
};

const TAG_COLORS = [
  "#E8A33D", "#3FD1A0", "#5B9BD5", "#B285E0", "#E07BA6",
  "#E0913D", "#F0616D", "#4FC3D9", "#8FCB4A", "#9AA3B2",
];

const uid = () => Math.random().toString(36).slice(2, 10);

/* ============================== DEFAULT SEED DATA ============================== */

function defaultPlaybooks() {
  return [
    {
      id: uid(),
      title: "M15 Pro Trend Intraday Model",
      sections: [
        { id: uid(), title: "BIAS", items: [{ id: uid(), text: "M15 Pro Trend" }] },
        { id: uid(), title: "AREA OF INTEREST", items: [{ id: uid(), text: "Strong POI or session liquidity sweep" }] },
        { id: uid(), title: "ENTRY CRITERIA", items: [
          { id: uid(), text: "M1 ChoCh or BOS aligned with M15" },
          { id: uid(), text: "M1–M5 OB/FVG" },
        ]},
        { id: uid(), title: "ADDITIONAL CONFLUENCES", items: [
          { id: uid(), text: "Supply/demand OB sits inside premium/discount zone of HTF swing structure (50%+ retracement)" },
          { id: uid(), text: "Reaction at significant fibonacci level (0.5, 0.618, 0.786)" },
          { id: uid(), text: "Price bounces from 20 or 50 EMA (Pro trend aligned with 200 EMA)" },
        ]},
        { id: uid(), title: "MANAGEMENT", items: [
          { id: uid(), text: "TP must be at least 1:3 for trade to be valid" },
          { id: uid(), text: "Move stop to breakeven after break of structural swing high/low I entered from" },
          { id: uid(), text: "Close 50% of trade at 50% TP" },
        ]},
        { id: uid(), title: "NEWS", items: [
          { id: uid(), text: "No trading on session with CPI/NFP/FOMC" },
          { id: uid(), text: "Don't enter before: retail sales / core PCE" },
        ]},
      ],
    },
  ];
}

function defaultTagGroups() {
  const c = TAG_COLORS;
  return [
    { id: uid(), name: "Setups", items: [
      { id: uid(), name: "NY continuation from LDN POI", color: c[0] },
      { id: uid(), name: "NY sweep LDN", color: c[1] },
      { id: uid(), name: "NY sweep Asia", color: c[2] },
      { id: uid(), name: "Lull sweep LDN, NY continuation", color: c[3] },
      { id: uid(), name: "Lull sweep LDN, NY reversal", color: c[4] },
      { id: uid(), name: "LDN sweep Asia", color: c[5] },
      { id: uid(), name: "Frank sweep LDN continuation", color: c[6] },
      { id: uid(), name: "Frank sweep Asia, LDN continuation", color: c[7] },
    ]},
    { id: uid(), name: "Area of Interest", items: [
      { id: uid(), name: "Weak (OB without BOS)", color: c[6] },
      { id: uid(), name: "Strong (OB / S&D zone with BOS + impulse)", color: c[1] },
      { id: uid(), name: "No POI", color: c[9] },
      { id: uid(), name: "Broad (candle cluster)", color: c[5] },
    ]},
    { id: uid(), name: "Trend Phase", items: [
      { id: uid(), name: "Change of Character", color: c[2] },
      { id: uid(), name: "Trend Confirmation", color: c[0] },
      { id: uid(), name: "Trending", color: c[1] },
    ]},
    { id: uid(), name: "Structure Flow", items: [
      { id: uid(), name: "Pro Trend Only", color: c[1] },
      { id: uid(), name: "Pro Trend Internal", color: c[3] },
      { id: uid(), name: "Counter Internal", color: c[6] },
    ]},
    { id: uid(), name: "Execution Window", items: [
      "0200–0300","0300–0400","0400–0500","0500–0600","0600–0700","0700–0800","0800–0900","0900–1000",
    ].map((t, i) => ({ id: uid(), name: t, color: c[i % c.length] })) },
    { id: uid(), name: "Instrument", items: [
      { id: uid(), name: "NAS100", color: c[2] },
      { id: uid(), name: "US30", color: c[5] },
      { id: uid(), name: "EURUSD", color: c[1] },
      { id: uid(), name: "GBPUSD", color: c[0] },
      { id: uid(), name: "XAUUSD", color: c[6] },
    ]},
  ];
}

function defaultSettings(user) {
  return {
    displayName: user?.displayName || "Trader",
    theme: "dark",
    accountBalance: 10000,
    playbooks: defaultPlaybooks(),
    tagGroups: defaultTagGroups(),
  };
}

/* ============================== FIRESTORE DATA HOOK ============================== */
// data shape kept identical to the local-storage version so every view
// component below works unchanged: { displayName, theme, accountBalance,
// playbooks, tagGroups, trades }

function useCloudData(user) {
  const [settings, setSettings] = useState(null);
  const [trades, setTrades] = useState(null);
  const prevTradesRef = useRef([]);

  useEffect(() => {
    if (!user) { setSettings(null); setTrades(null); return; }

    const userDocRef = doc(db, "users", user.uid);
    const tradesColRef = collection(db, "users", user.uid, "trades");

    // Ensure the settings doc exists on first-ever login
    (async () => {
      const snap = await getDoc(userDocRef);
      if (!snap.exists()) {
        await setDoc(userDocRef, defaultSettings(user));
      }
    })();

    const unsubSettings = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) setSettings(snap.data());
    });

    const unsubTrades = onSnapshot(tradesColRef, (snap) => {
      const list = snap.docs.map((d) => d.data());
      prevTradesRef.current = list;
      setTrades(list);
    });

    return () => { unsubSettings(); unsubTrades(); };
  }, [user]);

  const loaded = settings !== null && trades !== null;
  const data = loaded ? { ...settings, trades } : null;

  // update() takes an updater fn (prevData) => nextData, exactly like the
  // local-storage version, then figures out the minimal Firestore writes.
  const update = useCallback((updater) => {
    if (!user || !data) return;
    const next = typeof updater === "function" ? updater(data) : updater;
    const { trades: nextTrades, ...nextSettings } = next;

    const userDocRef = doc(db, "users", user.uid);
    setDoc(userDocRef, nextSettings, { merge: true }).catch((e) => console.error("settings save failed", e));

    const prevTrades = prevTradesRef.current || [];
    const prevMap = new Map(prevTrades.map((t) => [t.id, t]));
    const nextIds = new Set(nextTrades.map((t) => t.id));

    nextTrades.forEach((t) => {
      const p = prevMap.get(t.id);
      if (!p || JSON.stringify(p) !== JSON.stringify(t)) {
        setDoc(doc(db, "users", user.uid, "trades", t.id), t).catch((e) => console.error("trade save failed", e));
      }
    });
    prevTrades.forEach((t) => {
      if (!nextIds.has(t.id)) {
        deleteDoc(doc(db, "users", user.uid, "trades", t.id)).catch((e) => console.error("trade delete failed", e));
      }
    });

    // Optimistic local update so the UI feels instant while Firestore syncs.
    prevTradesRef.current = nextTrades;
    setSettings(nextSettings);
    setTrades(nextTrades);
  }, [user, data]);

  return { data, update, loaded };
}

/* ============================== SMALL UI PRIMITIVES ============================== */

function Btn({ children, onClick, variant = "default", theme, style, disabled, type = "button", title }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "center",
    padding: "9px 16px", borderRadius: 10, fontSize: 13.5, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer", border: "1px solid transparent",
    fontFamily: "Inter, sans-serif", transition: "all .15s ease", opacity: disabled ? 0.5 : 1,
    whiteSpace: "nowrap",
  };
  const variants = {
    default: { background: theme.accent, color: "#12161F", border: `1px solid ${theme.accent}` },
    ghost: { background: "transparent", color: theme.textPrimary, border: `1px solid ${theme.border}` },
    subtle: { background: theme.panel2, color: theme.textPrimary, border: `1px solid ${theme.border}` },
    danger: { background: "transparent", color: theme.loss, border: `1px solid ${theme.loss}55` },
    plain: { background: "transparent", color: theme.textSecondary, border: "1px solid transparent", padding: "6px 8px" },
  };
  return (
    <button type={type} title={title} disabled={disabled} onClick={onClick}
      style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

function Field({ label, children, theme, hint }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: theme.textSecondary, fontWeight: 600 }}>
      {label}
      {children}
      {hint && <span style={{ fontSize: 11, color: theme.textFaint, fontWeight: 400 }}>{hint}</span>}
    </label>
  );
}

function inputStyle(theme) {
  return {
    background: theme.panel2, border: `1px solid ${theme.border}`, borderRadius: 8,
    padding: "9px 11px", color: theme.textPrimary, fontSize: 13.5, fontFamily: "Inter, sans-serif",
    outline: "none", width: "100%", boxSizing: "border-box",
  };
}

function Panel({ theme, children, style, padding = 20 }) {
  return (
    <div style={{ background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 16, padding, boxShadow: theme.shadow, ...style }}>
      {children}
    </div>
  );
}

function Modal({ theme, onClose, title, children, width = 560 }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(5,7,10,0.55)", backdropFilter: "blur(3px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 18,
        width: "100%", maxWidth: width, maxHeight: "88vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 22px", borderBottom: `1px solid ${theme.border}`, position: "sticky", top: 0,
          background: theme.panel, borderRadius: "18px 18px 0 0",
        }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 600, color: theme.textPrimary }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: theme.textSecondary, padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

function TagChip({ tag, theme, onRemove, small }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: tag.color + "22", color: tag.color, border: `1px solid ${tag.color}55`,
      padding: small ? "3px 8px" : "5px 10px", borderRadius: 999, fontSize: small ? 11 : 12, fontWeight: 600,
    }}>
      {tag.name}
      {onRemove && <X size={12} style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); onRemove(); }} />}
    </span>
  );
}

/* ============================== APP ROOT ============================== */

export default function App() {
  const [authUser, setAuthUser] = useState(undefined); // undefined = checking, null = signed out
  const [authError, setAuthError] = useState("");

  useEffect(() => onAuthStateChanged(auth, (u) => setAuthUser(u)), []);

  const { data, update, loaded } = useCloudData(authUser || null);
  const [view, setView] = useState("dashboard");

  const fontImport = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
      * { box-sizing: border-box; }
      body { margin: 0; }
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: transparent; }
      @media print { .no-print { display: none !important; } }
    `}</style>
  );

  // ---- checking auth state ----
  if (authUser === undefined) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0B0E13", color: "#8B93A7", fontFamily: "Inter, sans-serif", fontSize: 14 }}>
        Loading T58 Edge Analytics…
      </div>
    );
  }

  // ---- signed out: Google login screen ----
  if (!authUser) {
    const theme = THEMES.dark;
    return (
      <div style={{ minHeight: "100vh", background: theme.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif", padding: 20 }}>
        {fontImport}
        <div style={{ width: "100%", maxWidth: 420, background: theme.panel, border: `1px solid ${theme.border}`, borderRadius: 20, padding: 36, boxShadow: theme.shadow, textAlign: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: theme.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", border: `1px solid ${theme.accentBorder}` }}>
            <Activity color={theme.accent} size={26} />
          </div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: theme.textPrimary, letterSpacing: -0.5 }}>T58 Edge Analytics</div>
          <div style={{ color: theme.textSecondary, fontSize: 13.5, marginTop: 8, marginBottom: 26, lineHeight: 1.5 }}>
            Backtest smarter. Log every trade against your playbook, tag your edge, and see exactly what's working — synced to your account.
          </div>
          <Btn theme={theme} style={{ width: "100%", padding: "12px 16px" }}
            onClick={async () => { setAuthError(""); try { await signInWithGoogle(); } catch (e) { setAuthError(e.message); } }}>
            <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#12161F" d="M44.5 20H24v8.5h11.8C34.7 33.9 30 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.3 0 6.3 1.2 8.6 3.2l6-6C34.9 4.1 29.7 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.1-2.7-.5-4z"/></svg>
            Continue with Google
          </Btn>
          {authError && <div style={{ color: theme.loss, fontSize: 12, marginTop: 12 }}>{authError}</div>}
          <div style={{ fontSize: 11, color: theme.textFaint, marginTop: 16, lineHeight: 1.5 }}>
            Your data syncs to your Google account across every device you sign into.
          </div>
        </div>
      </div>
    );
  }

  // ---- signed in, waiting on first Firestore snapshot ----
  if (!loaded || !data) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0B0E13", color: "#8B93A7", fontFamily: "Inter, sans-serif", fontSize: 14 }}>
        Syncing your data…
      </div>
    );
  }

  const theme = THEMES[data.theme] || THEMES.dark;
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "log", label: "Trade Log", icon: ListChecks },
    { id: "playbooks", label: "Playbooks", icon: BookOpen },
    { id: "tags", label: "Tags", icon: TagIcon },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, fontFamily: "Inter, sans-serif", color: theme.textPrimary }}>
      {fontImport}
      <div style={{ display: "flex" }}>
        <div className="no-print" style={{
          width: 232, minHeight: "100vh", borderRight: `1px solid ${theme.border}`, background: theme.bgSoft,
          position: "sticky", top: 0, alignSelf: "flex-start", display: "flex", flexDirection: "column", padding: "22px 14px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 22px" }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: theme.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${theme.accentBorder}` }}>
              <Activity color={theme.accent} size={18} />
            </div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14.5, letterSpacing: -0.3 }}>T58 Edge</div>
              <div style={{ fontSize: 10, color: theme.textFaint, letterSpacing: 1, fontWeight: 600 }}>ANALYTICS</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button key={item.id} onClick={() => setView(item.id)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10,
                  border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 600, textAlign: "left",
                  background: active ? theme.accentSoft : "transparent", color: active ? theme.accent : theme.textSecondary,
                }}>
                  <Icon size={16} /> {item.label}
                </button>
              );
            })}
          </div>

          <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => update((d) => ({ ...d, theme: d.theme === "dark" ? "light" : "dark" }))} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10,
              border: `1px solid ${theme.border}`, background: theme.panel2, cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: theme.textSecondary,
            }}>
              {data.theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
              {data.theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px" }}>
              {authUser.photoURL ? (
                <img src={authUser.photoURL} alt="" style={{ width: 26, height: 26, borderRadius: 999 }} />
              ) : (
                <div style={{ width: 26, height: 26, borderRadius: 999, background: theme.accent, color: "#12161F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                  {(authUser.displayName || "T").slice(0, 1).toUpperCase()}
                </div>
              )}
              <div style={{ fontSize: 12.5, fontWeight: 600, color: theme.textPrimary, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {authUser.displayName || authUser.email}
              </div>
              <button title="Sign out" onClick={() => signOutUser()} style={{ background: "none", border: "none", cursor: "pointer", color: theme.textFaint }}>
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {view === "dashboard" && <Dashboard theme={theme} data={data} update={update} setView={setView} />}
          {view === "log" && <TradeLog theme={theme} data={data} update={update} />}
          {view === "playbooks" && <Playbooks theme={theme} data={data} update={update} />}
          {view === "tags" && <TagsView theme={theme} data={data} update={update} />}
          {view === "analytics" && <Analytics theme={theme} data={data} />}
        </div>
      </div>
    </div>
  );
}

/* ============================== METRICS ============================== */

function computeMetrics(trades) {
  const closed = trades.filter((t) => typeof t.pnl === "number" && !isNaN(t.pnl));
  const wins = closed.filter((t) => t.pnl > 0);
  const losses = closed.filter((t) => t.pnl < 0);
  const breakeven = closed.filter((t) => t.pnl === 0);
  const totalPnl = closed.reduce((s, t) => s + t.pnl, 0);
  const winRate = closed.length ? (wins.length / closed.length) * 100 : 0;
  const avgWin = wins.length ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : 0;
  const rrTrades = closed.filter((t) => typeof t.riskAmount === "number" && t.riskAmount > 0);
  const avgR = rrTrades.length ? rrTrades.reduce((s, t) => s + t.pnl / t.riskAmount, 0) / rrTrades.length : 0;

  const sorted = [...closed].sort((a, b) => new Date(a.date) - new Date(b.date));
  let cum = 0, peak = 0, maxDD = 0, maxDDPct = 0;
  const curve = sorted.map((t) => {
    cum += t.pnl;
    peak = Math.max(peak, cum);
    const dd = peak - cum;
    if (dd > maxDD) maxDD = dd;
    if (peak > 0 && dd / peak > maxDDPct) maxDDPct = dd / peak;
    return { date: t.date, equity: Number(cum.toFixed(2)) };
  });

  const profitFactor = losses.length ? Math.abs(wins.reduce((s, t) => s + t.pnl, 0) / losses.reduce((s, t) => s + t.pnl, 0)) : (wins.length ? Infinity : 0);

  return { total: closed.length, wins: wins.length, losses: losses.length, breakeven: breakeven.length, totalPnl, winRate, avgWin, avgLoss, avgR, maxDD, maxDDPct, curve, profitFactor };
}

function tagPnlBreakdown(trades, tagGroups) {
  const allTags = {};
  tagGroups.forEach((g) => g.items.forEach((t) => { allTags[t.id] = { name: t.name, color: t.color, group: g.name }; }));
  const map = {};
  trades.forEach((t) => {
    if (typeof t.pnl !== "number") return;
    (t.tags || []).forEach((tagId) => {
      if (!allTags[tagId]) return;
      if (!map[tagId]) map[tagId] = { ...allTags[tagId], pnl: 0, count: 0, wins: 0 };
      map[tagId].pnl += t.pnl;
      map[tagId].count += 1;
      if (t.pnl > 0) map[tagId].wins += 1;
    });
  });
  return Object.values(map).sort((a, b) => b.pnl - a.pnl);
}

function fmtMoney(n) {
  if (n === undefined || n === null || isNaN(n)) return "—";
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

/* ============================== DASHBOARD ============================== */

function Dashboard({ theme, data, update, setView }) {
  const metrics = useMemo(() => computeMetrics(data.trades), [data.trades]);
  const recent = [...data.trades].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  const tagBreakdown = useMemo(() => tagPnlBreakdown(data.trades, data.tagGroups), [data.trades, data.tagGroups]);

  return (
    <div style={{ padding: "26px 32px 60px" }}>
      <PageHeader theme={theme} eyebrow={`Welcome back, ${(data.displayName || "Trader").split(" ")[0]}`} title="Dashboard" subtitle="Your edge, quantified." />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
        <StatCard theme={theme} label="Total P&L" value={fmtMoney(metrics.totalPnl)} positive={metrics.totalPnl >= 0} icon={metrics.totalPnl >= 0 ? TrendingUp : TrendingDown} />
        <StatCard theme={theme} label="Win Rate" value={`${metrics.winRate.toFixed(1)}%`} icon={Target} sub={`${metrics.wins}W / ${metrics.losses}L / ${metrics.breakeven}BE`} />
        <StatCard theme={theme} label="Avg Realized R" value={metrics.avgR ? `${metrics.avgR.toFixed(2)}R` : "—"} icon={Percent} />
        <StatCard theme={theme} label="Max Drawdown" value={fmtMoney(-metrics.maxDD)} icon={AlertTriangle} sub={metrics.maxDDPct ? `${(metrics.maxDDPct * 100).toFixed(1)}% of peak` : undefined} negative />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 20 }}>
        <Panel theme={theme}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15 }}>Equity Curve</div>
            <div style={{ fontSize: 11.5, color: theme.textFaint }}>Cumulative realized P&L</div>
          </div>
          {metrics.curve.length > 1 ? (
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={metrics.curve} margin={{ left: -10 }}>
                <defs>
                  <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={theme.accent} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={theme.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={theme.border} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: theme.textFaint, fontSize: 10.5 }} axisLine={{ stroke: theme.border }} tickLine={false} minTickGap={30} />
                <YAxis tick={{ fill: theme.textFaint, fontSize: 10.5 }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ background: theme.panel2, border: `1px solid ${theme.border}`, borderRadius: 10, fontSize: 12 }} formatter={(v) => [fmtMoney(v), "Equity"]} />
                <Area type="monotone" dataKey="equity" stroke={theme.accent} strokeWidth={2} fill="url(#eqGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyState theme={theme} text="Log a few trades to see your equity curve take shape." />}
        </Panel>

        <Panel theme={theme}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15, marginBottom: 14 }}>Top Tags by P&L</div>
          {tagBreakdown.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tagBreakdown.slice(0, 6).map((t) => (
                <div key={t.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: t.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: theme.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: t.pnl >= 0 ? theme.profit : theme.loss, fontFamily: "'JetBrains Mono', monospace" }}>{fmtMoney(t.pnl)}</span>
                </div>
              ))}
            </div>
          ) : <EmptyState theme={theme} text="Tag your trades to see which setups actually pay." small />}
        </Panel>
      </div>

      <Panel theme={theme}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15 }}>Recent Trades</div>
          <Btn theme={theme} variant="ghost" onClick={() => setView("log")}>View all</Btn>
        </div>
        {recent.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recent.map((t) => <TradeRow key={t.id} t={t} theme={theme} data={data} compact />)}
          </div>
        ) : <EmptyState theme={theme} text="No trades logged yet. Head to Trade Log to add your first entry." />}
      </Panel>
    </div>
  );
}

function PageHeader({ theme, eyebrow, title, subtitle, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22, gap: 16, flexWrap: "wrap" }}>
      <div>
        {eyebrow && <div style={{ fontSize: 11.5, fontWeight: 700, color: theme.accent, letterSpacing: 0.6, marginBottom: 6, textTransform: "uppercase" }}>{eyebrow}</div>}
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, letterSpacing: -0.6, color: theme.textPrimary }}>{title}</div>
        {subtitle && <div style={{ color: theme.textSecondary, fontSize: 13.5, marginTop: 4 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

function StatCard({ theme, label, value, sub, icon: Icon, positive, negative }) {
  const color = positive ? theme.profit : negative ? theme.loss : theme.textPrimary;
  return (
    <Panel theme={theme} padding={18}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 11.5, color: theme.textSecondary, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
        {Icon && <Icon size={15} color={theme.textFaint} />}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700, color, marginTop: 10 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: theme.textFaint, marginTop: 4 }}>{sub}</div>}
    </Panel>
  );
}

function EmptyState({ theme, text, small }) {
  return <div style={{ textAlign: "center", padding: small ? "18px 10px" : "40px 20px", color: theme.textFaint, fontSize: 12.5, border: `1px dashed ${theme.border}`, borderRadius: 12 }}>{text}</div>;
}

/* ============================== TRADE ROW ============================== */

function TradeRow({ t, theme, data, onClick, compact }) {
  const pnl = typeof t.pnl === "number" ? t.pnl : null;
  const tagObjs = (t.tags || []).map((id) => {
    for (const g of data.tagGroups) { const f = g.items.find((i) => i.id === id); if (f) return f; }
    return null;
  }).filter(Boolean);

  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 12, border: `1px solid ${theme.borderSoft}`, background: theme.panel2, cursor: onClick ? "pointer" : "default" }}>
      <div style={{ width: 78, fontSize: 11.5, color: theme.textFaint, flexShrink: 0 }}>{t.date}</div>
      <div style={{ width: 76, flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: t.direction === "Long" ? theme.profitSoft : theme.lossSoft, color: t.direction === "Long" ? theme.profit : theme.loss }}>{t.direction === "Long" ? "LONG" : "SHORT"}</span>
      </div>
      <div style={{ width: 90, fontSize: 12.5, fontWeight: 600, flexShrink: 0 }}>{t.instrument || "—"}</div>
      {!compact && (
        <div style={{ flex: 1, display: "flex", gap: 6, flexWrap: "wrap", minWidth: 0 }}>
          {tagObjs.slice(0, 4).map((tag) => <TagChip key={tag.id} tag={tag} theme={theme} small />)}
        </div>
      )}
      {compact && <div style={{ flex: 1 }} />}
      <div style={{ width: 90, textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13, flexShrink: 0, color: pnl === null ? theme.textFaint : pnl >= 0 ? theme.profit : theme.loss }}>
        {pnl === null ? "Open" : fmtMoney(pnl)}
      </div>
    </div>
  );
}

/* ============================== TRADE LOG ============================== */

function TradeLog({ theme, data, update }) {
  const [modalTrade, setModalTrade] = useState(null);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState("");

  const filtered = data.trades
    .filter((t) => !search || (t.instrument || "").toLowerCase().includes(search.toLowerCase()) || (t.notes || "").toLowerCase().includes(search.toLowerCase()))
    .filter((t) => !filterTag || (t.tags || []).includes(filterTag))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const deleteTrade = (id) => update((d) => ({ ...d, trades: d.trades.filter((t) => t.id !== id) }));

  return (
    <div style={{ padding: "26px 32px 60px" }}>
      <PageHeader theme={theme} eyebrow="Journal" title="Trade Log" subtitle="Log every trade, check it against your playbook, tag it for later."
        right={<Btn theme={theme} onClick={() => setModalTrade({})}><Plus size={15} /> Log trade</Btn>} />

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
          <Search size={14} style={{ position: "absolute", left: 11, top: 11, color: theme.textFaint }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search instrument or notes…" style={{ ...inputStyle(theme), paddingLeft: 32 }} />
        </div>
        <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} style={{ ...inputStyle(theme), maxWidth: 220 }}>
          <option value="">All tags</option>
          {data.tagGroups.map((g) => (
            <optgroup key={g.id} label={g.name}>
              {g.items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </optgroup>
          ))}
        </select>
      </div>

      {filtered.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((t) => <TradeRow key={t.id} t={t} theme={theme} data={data} onClick={() => setModalTrade(t)} />)}
        </div>
      ) : <EmptyState theme={theme} text="No trades match. Log your first trade to start building your edge data." />}

      {modalTrade !== null && <TradeModal theme={theme} data={data} update={update} trade={modalTrade} onClose={() => setModalTrade(null)} onDelete={deleteTrade} />}
    </div>
  );
}

function resizeImage(file, maxWidth = 700, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function TradeModal({ theme, data, update, trade, onClose, onDelete }) {
  const isNew = !trade.id;
  const [form, setForm] = useState(() => ({
    date: trade.date || new Date().toISOString().slice(0, 10),
    instrument: trade.instrument || "",
    direction: trade.direction || "Long",
    playbookId: trade.playbookId || (data.playbooks[0]?.id || ""),
    checklist: trade.checklist || {},
    tags: trade.tags || [],
    entry: trade.entry ?? "",
    stop: trade.stop ?? "",
    tp: trade.tp ?? "",
    riskAmount: trade.riskAmount ?? "",
    pnl: trade.pnl ?? "",
    notes: trade.notes || "",
    screenshot: trade.screenshot || null,
  }));
  const [uploading, setUploading] = useState(false);
  const [sizeWarning, setSizeWarning] = useState("");

  const playbook = data.playbooks.find((p) => p.id === form.playbookId);
  const allChecklistItems = playbook ? playbook.sections.flatMap((s) => s.items) : [];
  const checkedCount = allChecklistItems.filter((i) => form.checklist[i.id]).length;
  const compliance = allChecklistItems.length ? Math.round((checkedCount / allChecklistItems.length) * 100) : null;

  const toggleTag = (id) => setForm((f) => ({ ...f, tags: f.tags.includes(id) ? f.tags.filter((x) => x !== id) : [...f.tags, id] }));
  const toggleCheck = (id) => setForm((f) => ({ ...f, checklist: { ...f.checklist, [id]: !f.checklist[id] } }));

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setSizeWarning("");
    try {
      const dataUrl = await resizeImage(file);
      if (dataUrl.length > 900000) setSizeWarning("Image is large — consider a tighter crop for faster syncing.");
      setForm((f) => ({ ...f, screenshot: dataUrl }));
    } catch (err) { console.error(err); }
    setUploading(false);
  };

  const save = () => {
    const pnlNum = form.pnl === "" ? undefined : Number(form.pnl);
    const riskNum = form.riskAmount === "" ? undefined : Number(form.riskAmount);
    const record = {
      id: trade.id || uid(),
      date: form.date, instrument: form.instrument.trim(), direction: form.direction,
      playbookId: form.playbookId, checklist: form.checklist, tags: form.tags,
      entry: form.entry === "" ? undefined : Number(form.entry),
      stop: form.stop === "" ? undefined : Number(form.stop),
      tp: form.tp === "" ? undefined : Number(form.tp),
      riskAmount: riskNum, pnl: pnlNum, notes: form.notes, screenshot: form.screenshot,
      compliancePct: compliance,
    };
    update((d) => ({ ...d, trades: isNew ? [...d.trades, record] : d.trades.map((t) => (t.id === record.id ? record : t)) }));
    onClose();
  };

  return (
    <Modal theme={theme} onClose={onClose} title={isNew ? "Log a trade" : "Edit trade"} width={680}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
        <Field theme={theme} label="Date">
          <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} style={inputStyle(theme)} />
        </Field>
        <Field theme={theme} label="Instrument">
          <input list="instrument-list" value={form.instrument} onChange={(e) => setForm((f) => ({ ...f, instrument: e.target.value }))} placeholder="e.g. NAS100" style={inputStyle(theme)} />
          <datalist id="instrument-list">
            {(data.tagGroups.find((g) => g.name === "Instrument")?.items || []).map((i) => <option key={i.id} value={i.name} />)}
          </datalist>
        </Field>
        <Field theme={theme} label="Direction">
          <div style={{ display: "flex", gap: 8 }}>
            {["Long", "Short"].map((d) => (
              <button key={d} onClick={() => setForm((f) => ({ ...f, direction: d }))} style={{
                flex: 1, padding: "8px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700,
                border: `1px solid ${form.direction === d ? (d === "Long" ? theme.profit : theme.loss) : theme.border}`,
                background: form.direction === d ? (d === "Long" ? theme.profitSoft : theme.lossSoft) : theme.panel2,
                color: form.direction === d ? (d === "Long" ? theme.profit : theme.loss) : theme.textSecondary,
              }}>{d}</button>
            ))}
          </div>
        </Field>
        <Field theme={theme} label="Playbook used">
          <select value={form.playbookId} onChange={(e) => setForm((f) => ({ ...f, playbookId: e.target.value, checklist: {} }))} style={inputStyle(theme)}>
            <option value="">— none —</option>
            {data.playbooks.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </Field>
      </div>

      {playbook && (
        <div style={{ marginBottom: 18, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 14, background: theme.panel2 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.textPrimary }}>Playbook checklist</div>
            {compliance !== null && (
              <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 9px", borderRadius: 999,
                color: compliance === 100 ? theme.profit : compliance >= 60 ? theme.accent : theme.loss,
                background: (compliance === 100 ? theme.profit : compliance >= 60 ? theme.accent : theme.loss) + "1A" }}>{compliance}% compliant</span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 260, overflowY: "auto" }}>
            {playbook.sections.map((s) => (
              <div key={s.id}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: theme.textFaint, letterSpacing: 0.5, marginBottom: 5 }}>{s.title}</div>
                {s.items.map((i) => (
                  <label key={i.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "4px 0", cursor: "pointer" }}>
                    <input type="checkbox" checked={!!form.checklist[i.id]} onChange={() => toggleCheck(i.id)} style={{ marginTop: 2, accentColor: theme.accent }} />
                    <span style={{ fontSize: 12.5, color: theme.textPrimary, lineHeight: 1.4 }}>{i.text}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.textPrimary, marginBottom: 8 }}>Tags</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 200, overflowY: "auto", border: `1px solid ${theme.border}`, borderRadius: 12, padding: 12 }}>
          {data.tagGroups.map((g) => (
            <div key={g.id}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: theme.textFaint, marginBottom: 5, letterSpacing: 0.5 }}>{g.name.toUpperCase()}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {g.items.map((i) => {
                  const active = form.tags.includes(i.id);
                  return (
                    <span key={i.id} onClick={() => toggleTag(i.id)} style={{
                      cursor: "pointer", fontSize: 11.5, fontWeight: 600, padding: "5px 10px", borderRadius: 999,
                      border: `1px solid ${active ? i.color : theme.border}`, background: active ? i.color + "26" : "transparent",
                      color: active ? i.color : theme.textSecondary,
                    }}>{i.name}</span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
        <Field theme={theme} label="Entry price"><input type="number" step="any" value={form.entry} onChange={(e) => setForm((f) => ({ ...f, entry: e.target.value }))} style={inputStyle(theme)} /></Field>
        <Field theme={theme} label="Stop loss"><input type="number" step="any" value={form.stop} onChange={(e) => setForm((f) => ({ ...f, stop: e.target.value }))} style={inputStyle(theme)} /></Field>
        <Field theme={theme} label="Take profit"><input type="number" step="any" value={form.tp} onChange={(e) => setForm((f) => ({ ...f, tp: e.target.value }))} style={inputStyle(theme)} /></Field>
        <Field theme={theme} label="Risk amount ($)" hint="Used to calc realized R"><input type="number" step="any" value={form.riskAmount} onChange={(e) => setForm((f) => ({ ...f, riskAmount: e.target.value }))} style={inputStyle(theme)} /></Field>
        <Field theme={theme} label="Net P&L ($)" hint="Leave blank if still open"><input type="number" step="any" value={form.pnl} onChange={(e) => setForm((f) => ({ ...f, pnl: e.target.value }))} style={inputStyle(theme)} /></Field>
        <Field theme={theme} label="Realized R">
          <div style={{ ...inputStyle(theme), display: "flex", alignItems: "center", color: theme.textFaint, fontFamily: "'JetBrains Mono', monospace" }}>
            {form.pnl !== "" && form.riskAmount ? `${(Number(form.pnl) / Number(form.riskAmount)).toFixed(2)}R` : "—"}
          </div>
        </Field>
      </div>

      <Field theme={theme} label="Notes">
        <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} placeholder="What did you see? What would you do differently?" style={{ ...inputStyle(theme), resize: "vertical" }} />
      </Field>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.textPrimary, marginBottom: 8 }}>Screenshot</div>
        {form.screenshot ? (
          <div style={{ position: "relative", display: "inline-block" }}>
            <img src={form.screenshot} alt="trade screenshot" style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 10, border: `1px solid ${theme.border}` }} />
            <button onClick={() => setForm((f) => ({ ...f, screenshot: null }))} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", padding: 5 }}><Trash2 size={14} /></button>
          </div>
        ) : (
          <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: `1px dashed ${theme.border}`, borderRadius: 12, padding: "22px 12px", cursor: "pointer", color: theme.textSecondary, fontSize: 12.5 }}>
            <Upload size={15} /> {uploading ? "Processing…" : "Upload chart screenshot"}
            <input type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
          </label>
        )}
        {sizeWarning && <div style={{ fontSize: 11, color: theme.accent, marginTop: 6 }}>{sizeWarning}</div>}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22 }}>
        {!isNew ? <Btn theme={theme} variant="danger" onClick={() => { onDelete(trade.id); onClose(); }}><Trash2 size={14} /> Delete</Btn> : <div />}
        <div style={{ display: "flex", gap: 10 }}>
          <Btn theme={theme} variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn theme={theme} onClick={save}><Save size={14} /> Save trade</Btn>
        </div>
      </div>
    </Modal>
  );
}

/* ============================== PLAYBOOKS ============================== */

function Playbooks({ theme, data, update }) {
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState({});

  const addPlaybook = () => {
    const pb = { id: uid(), title: "New Playbook", sections: [{ id: uid(), title: "BIAS", items: [{ id: uid(), text: "" }] }] };
    update((d) => ({ ...d, playbooks: [...d.playbooks, pb] }));
    setEditing(pb.id);
  };
  const deletePlaybook = (id) => update((d) => ({ ...d, playbooks: d.playbooks.filter((p) => p.id !== id) }));

  return (
    <div style={{ padding: "26px 32px 60px" }}>
      <PageHeader theme={theme} eyebrow="Rulebook" title="Playbooks" subtitle="Define the exact criteria for a valid setup. These become your trade-log checklists."
        right={<Btn theme={theme} onClick={addPlaybook}><Plus size={15} /> New playbook</Btn>} />

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {data.playbooks.map((pb) => (
          <Panel key={pb.id} theme={theme}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div onClick={() => setExpanded((e) => ({ ...e, [pb.id]: !e[pb.id] }))} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                {expanded[pb.id] ? <ChevronDown size={16} color={theme.textFaint} /> : <ChevronRight size={16} color={theme.textFaint} />}
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 16 }}>{pb.title}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn theme={theme} variant="plain" onClick={() => setEditing(editing === pb.id ? null : pb.id)}><Pencil size={14} /></Btn>
                <Btn theme={theme} variant="plain" onClick={() => deletePlaybook(pb.id)}><Trash2 size={14} color={theme.loss} /></Btn>
              </div>
            </div>
            {expanded[pb.id] && editing !== pb.id && (
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                {pb.sections.map((s) => (
                  <div key={s.id}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: theme.accent, letterSpacing: 0.6, marginBottom: 6 }}>{s.title}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {s.items.map((i) => (
                        <div key={i.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: theme.textSecondary }}>
                          <Check size={14} color={theme.textFaint} style={{ marginTop: 2, flexShrink: 0 }} />{i.text}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {editing === pb.id && <PlaybookEditor theme={theme} playbook={pb} update={update} onDone={() => setEditing(null)} />}
          </Panel>
        ))}
        {!data.playbooks.length && <EmptyState theme={theme} text="No playbooks yet. Create one to define your rules." />}
      </div>
    </div>
  );
}

function PlaybookEditor({ theme, playbook, update, onDone }) {
  const [pb, setPb] = useState(playbook);
  const commit = (next) => { setPb(next); update((d) => ({ ...d, playbooks: d.playbooks.map((p) => (p.id === next.id ? next : p)) })); };

  const updateTitle = (title) => commit({ ...pb, title });
  const addSection = () => commit({ ...pb, sections: [...pb.sections, { id: uid(), title: "NEW SECTION", items: [{ id: uid(), text: "" }] }] });
  const updateSectionTitle = (sid, title) => commit({ ...pb, sections: pb.sections.map((s) => (s.id === sid ? { ...s, title } : s)) });
  const deleteSection = (sid) => commit({ ...pb, sections: pb.sections.filter((s) => s.id !== sid) });
  const addItem = (sid) => commit({ ...pb, sections: pb.sections.map((s) => (s.id === sid ? { ...s, items: [...s.items, { id: uid(), text: "" }] } : s)) });
  const updateItem = (sid, iid, text) => commit({ ...pb, sections: pb.sections.map((s) => (s.id === sid ? { ...s, items: s.items.map((i) => (i.id === iid ? { ...i, text } : i)) } : s)) });
  const deleteItem = (sid, iid) => commit({ ...pb, sections: pb.sections.map((s) => (s.id === sid ? { ...s, items: s.items.filter((i) => i.id !== iid) } : s)) });

  return (
    <div style={{ marginTop: 16, borderTop: `1px solid ${theme.border}`, paddingTop: 16 }}>
      <Field theme={theme} label="Playbook title">
        <input value={pb.title} onChange={(e) => updateTitle(e.target.value)} style={{ ...inputStyle(theme), fontWeight: 600 }} />
      </Field>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
        {pb.sections.map((s) => (
          <div key={s.id} style={{ border: `1px solid ${theme.border}`, borderRadius: 10, padding: 12, background: theme.panel2 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input value={s.title} onChange={(e) => updateSectionTitle(s.id, e.target.value)} style={{ ...inputStyle(theme), fontWeight: 700, fontSize: 11.5, letterSpacing: 0.5, flex: 1, textTransform: "uppercase" }} />
              <Btn theme={theme} variant="plain" onClick={() => deleteSection(s.id)}><Trash2 size={14} color={theme.loss} /></Btn>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {s.items.map((i) => (
                <div key={i.id} style={{ display: "flex", gap: 8 }}>
                  <input value={i.text} onChange={(e) => updateItem(s.id, i.id, e.target.value)} placeholder="Rule text…" style={inputStyle(theme)} />
                  <Btn theme={theme} variant="plain" onClick={() => deleteItem(s.id, i.id)}><X size={14} /></Btn>
                </div>
              ))}
            </div>
            <Btn theme={theme} variant="ghost" style={{ marginTop: 8, padding: "6px 12px" }} onClick={() => addItem(s.id)}><Plus size={13} /> Add rule</Btn>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
        <Btn theme={theme} variant="ghost" onClick={addSection}><Plus size={14} /> Add section</Btn>
        <Btn theme={theme} onClick={onDone}><Check size={14} /> Done editing</Btn>
      </div>
    </div>
  );
}

/* ============================== TAGS ============================== */

function TagsView({ theme, data, update }) {
  const addGroup = () => update((d) => ({ ...d, tagGroups: [...d.tagGroups, { id: uid(), name: "New Group", items: [] }] }));
  const deleteGroup = (gid) => update((d) => ({ ...d, tagGroups: d.tagGroups.filter((g) => g.id !== gid) }));
  const renameGroup = (gid, name) => update((d) => ({ ...d, tagGroups: d.tagGroups.map((g) => (g.id === gid ? { ...g, name } : g)) }));
  const addTag = (gid) => update((d) => ({ ...d, tagGroups: d.tagGroups.map((g) => (g.id === gid ? { ...g, items: [...g.items, { id: uid(), name: "New tag", color: TAG_COLORS[g.items.length % TAG_COLORS.length] }] } : g)) }));
  const updateTag = (gid, tid, patch) => update((d) => ({ ...d, tagGroups: d.tagGroups.map((g) => (g.id === gid ? { ...g, items: g.items.map((i) => (i.id === tid ? { ...i, ...patch } : i)) } : g)) }));
  const deleteTag = (gid, tid) => update((d) => ({ ...d, tagGroups: d.tagGroups.map((g) => (g.id === gid ? { ...g, items: g.items.filter((i) => i.id !== tid) } : g)) }));

  return (
    <div style={{ padding: "26px 32px 60px" }}>
      <PageHeader theme={theme} eyebrow="Taxonomy" title="Tags" subtitle="Custom, color-coded tags to slice your trade data any way you want."
        right={<Btn theme={theme} onClick={addGroup}><Plus size={15} /> New group</Btn>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {data.tagGroups.map((g) => (
          <Panel key={g.id} theme={theme}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <input value={g.name} onChange={(e) => renameGroup(g.id, e.target.value)} style={{ ...inputStyle(theme), fontWeight: 700, fontSize: 14, border: "none", background: "transparent", padding: "2px 0", width: "auto" }} />
              <Btn theme={theme} variant="plain" onClick={() => deleteGroup(g.id)}><Trash2 size={14} color={theme.loss} /></Btn>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {g.items.map((tag) => (
                <div key={tag.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="color" value={tag.color} onChange={(e) => updateTag(g.id, tag.id, { color: e.target.value })} style={{ width: 28, height: 28, border: "none", borderRadius: 6, cursor: "pointer", background: "transparent", padding: 0 }} />
                  <input value={tag.name} onChange={(e) => updateTag(g.id, tag.id, { name: e.target.value })} style={inputStyle(theme)} />
                  <Btn theme={theme} variant="plain" onClick={() => deleteTag(g.id, tag.id)}><X size={14} /></Btn>
                </div>
              ))}
            </div>
            <Btn theme={theme} variant="ghost" style={{ marginTop: 10, padding: "6px 12px" }} onClick={() => addTag(g.id)}><Plus size={13} /> Add tag</Btn>
          </Panel>
        ))}
      </div>
    </div>
  );
}

/* ============================== ANALYTICS ============================== */

function Analytics({ theme, data }) {
  const metrics = useMemo(() => computeMetrics(data.trades), [data.trades]);
  const tagBreakdown = useMemo(() => tagPnlBreakdown(data.trades, data.tagGroups), [data.trades, data.tagGroups]);

  const winLossPie = [
    { name: "Wins", value: metrics.wins, color: theme.profit },
    { name: "Losses", value: metrics.losses, color: theme.loss },
    { name: "Breakeven", value: metrics.breakeven, color: theme.neutral },
  ].filter((d) => d.value > 0);

  const exportPdf = () => window.print();

  return (
    <div style={{ padding: "26px 32px 60px" }}>
      <div className="no-print">
        <PageHeader theme={theme} eyebrow="Performance" title="Analytics" subtitle="Every number here is computed directly from your trade log."
          right={<Btn theme={theme} onClick={exportPdf}><Download size={15} /> Export report (PDF)</Btn>} />
      </div>

      <div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
          <StatCard theme={theme} label="Total P&L" value={fmtMoney(metrics.totalPnl)} positive={metrics.totalPnl >= 0} icon={TrendingUp} />
          <StatCard theme={theme} label="Win Rate" value={`${metrics.winRate.toFixed(1)}%`} icon={Target} sub={`${metrics.total} trades logged`} />
          <StatCard theme={theme} label="Profit Factor" value={isFinite(metrics.profitFactor) ? metrics.profitFactor.toFixed(2) : "∞"} icon={Percent} />
          <StatCard theme={theme} label="Avg Realized R" value={metrics.avgR ? `${metrics.avgR.toFixed(2)}R` : "—"} icon={Activity} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16 }}>
          <StatCard theme={theme} label="Avg Win" value={fmtMoney(metrics.avgWin)} icon={ArrowUpRight} positive />
          <StatCard theme={theme} label="Avg Loss" value={fmtMoney(metrics.avgLoss)} icon={ArrowDownRight} negative />
          <StatCard theme={theme} label="Max Drawdown" value={fmtMoney(-metrics.maxDD)} sub={metrics.maxDDPct ? `${(metrics.maxDDPct * 100).toFixed(1)}% of peak equity` : undefined} icon={AlertTriangle} negative />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
          <Panel theme={theme}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15, marginBottom: 14 }}>Profitability Over Time</div>
            {metrics.curve.length > 1 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={metrics.curve} margin={{ left: -10 }}>
                  <CartesianGrid stroke={theme.border} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: theme.textFaint, fontSize: 10.5 }} axisLine={{ stroke: theme.border }} tickLine={false} minTickGap={30} />
                  <YAxis tick={{ fill: theme.textFaint, fontSize: 10.5 }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={{ background: theme.panel2, border: `1px solid ${theme.border}`, borderRadius: 10, fontSize: 12 }} formatter={(v) => [fmtMoney(v), "Equity"]} />
                  <Line type="monotone" dataKey="equity" stroke={theme.accent} strokeWidth={2.2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyState theme={theme} text="Not enough closed trades yet." />}
          </Panel>
          <Panel theme={theme}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15, marginBottom: 14 }}>Win / Loss Split</div>
            {winLossPie.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={winLossPie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {winLossPie.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: theme.panel2, border: `1px solid ${theme.border}`, borderRadius: 10, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11.5, color: theme.textSecondary }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyState theme={theme} text="No closed trades yet." small />}
          </Panel>
        </div>

        <Panel theme={theme}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15, marginBottom: 14 }}>P&L by Tag</div>
          {tagBreakdown.length ? (
            <ResponsiveContainer width="100%" height={Math.max(200, tagBreakdown.length * 34)}>
              <BarChart data={tagBreakdown} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid stroke={theme.border} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fill: theme.textFaint, fontSize: 10.5 }} tickFormatter={(v) => `$${v}`} axisLine={{ stroke: theme.border }} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: theme.textSecondary, fontSize: 11 }} width={180} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: theme.panel2, border: `1px solid ${theme.border}`, borderRadius: 10, fontSize: 12 }} formatter={(v) => [fmtMoney(v), "P&L"]} />
                <Bar dataKey="pnl" radius={[0, 6, 6, 0]}>
                  {tagBreakdown.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? theme.profit : theme.loss} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState theme={theme} text="Tag your trades to break down performance by setup." />}
        </Panel>
      </div>
    </div>
  );
}
