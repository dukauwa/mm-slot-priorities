import { useState, useMemo, useCallback } from "react";
import gripLogo from "./assets/0cd0e8be5eebbb0fd15be4cdbbc90cb59d5ed0de.png";

/* ── Design Tokens (from Figma) ─────────────────────────────── */
const colors = {
  white: "#FFFFFF",
  grey5: "#F4F4F4",
  grey20: "#D4D5D6",
  grey30: "#BEC0C0",
  grey40: "#A9ABAC",
  grey60: "#7E8183",
  grey80: "#535759",
  grey100: "#282D30",
  purple: "#522DA6",
  purple10: "#EDE8FA",
};

const font = {
  family: "'Lato', sans-serif",
  bold: { fontFamily: "'Lato', sans-serif", fontWeight: 700 },
  regular: { fontFamily: "'Lato', sans-serif", fontWeight: 400 },
  semibold: { fontFamily: "'Lato', sans-serif", fontWeight: 600 },
};

/* ── Data ─────────────────────────────────────────────────── */
const DAYS = [
  { label: "Monday 20 Jan", short: "Mon 20 Jan", date: "2028-01-20" },
  { label: "Tuesday 21 Jan", short: "Tue 21 Jan", date: "2028-01-21" },
  { label: "Wednesday 22 Jan", short: "Wed 22 Jan", date: "2028-01-22" },
];
const LOCATIONS = ["Booth A1", "Booth A2", "Booth B1", "Table 1", "Table 2", "Meeting Room 1", "Public Lounge"];

function generateSlots() {
  const slots = [];
  const configs = [
    { loc: "Booth A1", startH: 9, startM: 0, duration: 12, gap: 3, count: 8 },
    { loc: "Booth A2", startH: 9, startM: 0, duration: 12, gap: 3, count: 8 },
    { loc: "Booth B1", startH: 9, startM: 30, duration: 15, gap: 5, count: 6 },
    { loc: "Table 1", startH: 10, startM: 0, duration: 20, gap: 5, count: 4 },
    { loc: "Table 2", startH: 10, startM: 0, duration: 20, gap: 5, count: 4 },
    { loc: "Meeting Room 1", startH: 9, startM: 0, duration: 30, gap: 10, count: 3 },
    { loc: "Public Lounge", startH: 13, startM: 0, duration: 15, gap: 5, count: 4 },
  ];
  DAYS.forEach((day) => {
    configs.forEach((cfg) => {
      for (let i = 0; i < cfg.count; i++) {
        const totalMin = cfg.startH * 60 + cfg.startM + i * (cfg.duration + cfg.gap);
        const endMin = totalMin + cfg.duration;
        slots.push({
          id: slots.length,
          day: day.label,
          dayShort: day.short,
          startTime: `${String(Math.floor(totalMin / 60)).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`,
          endTime: `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`,
          location: cfg.loc,
          duration: cfg.duration,
        });
      }
    });
  });
  return slots;
}

const SLOTS = generateSlots();

/* ── Helpers ─────────────────────────────────────────────── */
function getPriorityColor(p) {
  const n = parseInt(p);
  if (n >= 80) return { bg: colors.purple10, fg: colors.purple, badge: colors.purple, border: colors.purple };
  if (n >= 50) return { bg: "#eee8f6", fg: "#6b45b8", badge: "#6b45b8", border: "#6b45b8" };
  if (n >= 30) return { bg: "#fdf3ec", fg: "#c47a2d", badge: "#c47a2d", border: "#c47a2d" };
  if (n >= 10) return { bg: "#fdf8ec", fg: "#8b6914", badge: "#8b6914", border: "#8b6914" };
  if (n >= 2) return { bg: "#eef2f6", fg: "#4a6a8a", badge: "#4a6a8a", border: "#4a6a8a" };
  return { bg: colors.grey5, fg: colors.grey40, badge: colors.grey30, border: colors.grey60 };
}

function slotMatchesRule(slot, rule) {
  switch (rule.type) {
    case "day": return slot.day === rule.day;
    case "time_exact": return slot.startTime === rule.time;
    case "time_range": return slot.startTime >= rule.timeFrom && slot.startTime <= rule.timeTo;
    case "location": return slot.location === rule.location;
    case "day_time": return slot.day === rule.day && slot.startTime === rule.time;
    default: return false;
  }
}

function getRuleDescription(rule) {
  const V = ({ children }) => (
    <span style={{ background: colors.purple10, padding: "1px 6px", borderRadius: 4, ...font.bold, fontSize: 12, color: colors.purple, letterSpacing: 0.25 }}>{children}</span>
  );
  switch (rule.type) {
    case "day": return <span>All slots on <V>{rule.day}</V> → Priority <V>{rule.priority}</V></span>;
    case "time_exact": return <span>Slots starting at <V>{rule.time}</V> any day → Priority <V>{rule.priority}</V></span>;
    case "time_range": return <span>Slots starting <V>{rule.timeFrom}</V> – <V>{rule.timeTo}</V> any day → Priority <V>{rule.priority}</V></span>;
    case "location": return <span>Slots at <V>{rule.location}</V> → Priority <V>{rule.priority}</V></span>;
    case "day_time": return <span>Slots on <V>{rule.day}</V> at <V>{rule.time}</V> → Priority <V>{rule.priority}</V></span>;
    default: return null;
  }
}

/* ── Icons (Figma design system) ──────────────────────────── */
const BackArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.83333 13.1667L2.66667 8.00001M2.66667 8.00001L7.83333 2.83334M2.66667 8.00001H13.1667" stroke={colors.purple} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.04167 8.04167H8.04167M12.0417 8.04167H8.04167M8.04167 8.04167V12.0417M8.04167 8.04167V4.04167" stroke={colors.purple} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FlagIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.75 15.75C4.75 15.75 5.75 14.75 8.75 14.75C11.75 14.75 13.75 16.75 16.75 16.75C19.1507 16.75 20.2706 16.1096 20.6223 15.8538C20.75 15.75 20.75 15.4881 20.75 15.25V12.25V6.25V3.75C20.75 3.75 20.643 3.85702 20.3939 4.00103C19.8817 4.29725 18.7686 4.75 16.75 4.75C13.75 4.75 11.75 2.75 8.75 2.75C5.75 2.75 4.75 3.75 4.75 3.75V22.75" stroke={colors.purple} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MinusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.83333 8H12.1667" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronUp = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6" /></svg>;
const ChevronDown = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>;
const XIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>;
const GripIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" /><circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" /><circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" /></svg>;

/* ── Main Component ──────────────────────────────────────── */
export default function SlotPriorities() {
  const [rules, setRules] = useState([]);
  const [idCounter, setIdCounter] = useState(0);
  const [showBuilder, setShowBuilder] = useState(false);
  const [toast, setToast] = useState(null);

  // Builder state
  const [condType, setCondType] = useState("day");
  const [condDay, setCondDay] = useState(DAYS[0].label);
  const [condTimeExact, setCondTimeExact] = useState("09:00");
  const [condTimeFrom, setCondTimeFrom] = useState("10:00");
  const [condTimeTo, setCondTimeTo] = useState("11:00");
  const [condLocation, setCondLocation] = useState("Booth A1");
  const [condDayTime, setCondDayTime] = useState(DAYS[0].label);
  const [condDayTimeTime, setCondDayTimeTime] = useState("09:00");
  const [condPriority, setCondPriority] = useState("50");

  const showToastMsg = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const addRule = () => {
    const priority = Math.max(1, Math.min(100, parseInt(condPriority) || 1));
    const rule = { id: idCounter, type: condType, priority };
    switch (condType) {
      case "day": rule.day = condDay; break;
      case "time_exact": rule.time = condTimeExact; break;
      case "time_range": rule.timeFrom = condTimeFrom; rule.timeTo = condTimeTo; break;
      case "location": rule.location = condLocation; break;
      case "day_time": rule.day = condDayTime; rule.time = condDayTimeTime; break;
    }
    setRules([...rules, rule]);
    setIdCounter(idCounter + 1);
    setShowBuilder(false);
    showToastMsg("Rule added");
  };

  const removeRule = (id) => {
    setRules(rules.filter((r) => r.id !== id));
    showToastMsg("Rule removed");
  };

  const moveRule = (id, dir) => {
    const idx = rules.findIndex((r) => r.id === id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= rules.length) return;
    const next = [...rules];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    setRules(next);
  };

  const getSlotPriority = (slot) => {
    for (const rule of rules) {
      if (slotMatchesRule(slot, rule)) return rule.priority;
    }
    return null; // unset
  };

  const sortedSlots = useMemo(() =>
    [...SLOTS].sort((a, b) => {
      if (a.day !== b.day) return a.day.localeCompare(b.day);
      if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime);
      return a.location.localeCompare(b.location);
    }), []);

  const { stats, slotPriorities } = useMemo(() => {
    const s = {};
    const sp = {};
    sortedSlots.forEach((slot) => {
      const p = getSlotPriority(slot);
      const key = p === null ? "unset" : p;
      s[key] = (s[key] || 0) + 1;
      sp[slot.id] = p;
    });
    return { stats: s, slotPriorities: sp };
  }, [rules, sortedSlots]);

  const nlPreview = useMemo(() => {
    const p = condPriority;
    const h = (v) => <strong style={{ color: colors.purple }}>{v}</strong>;
    switch (condType) {
      case "day": return <span>All slots on {h(condDay)} → priority {h(p)}</span>;
      case "time_exact": return <span>Slots starting at {h(condTimeExact)} on any day → priority {h(p)}</span>;
      case "time_range": return <span>Slots starting between {h(condTimeFrom)} and {h(condTimeTo)} on any day → priority {h(p)}</span>;
      case "location": return <span>Slots at {h(condLocation)} → priority {h(p)}</span>;
      case "day_time": return <span>Slots on {h(condDayTime)} at {h(condDayTimeTime)} → priority {h(p)}</span>;
      default: return null;
    }
  }, [condType, condDay, condTimeExact, condTimeFrom, condTimeTo, condLocation, condDayTime, condDayTimeTime, condPriority]);

  /* ── Styles ──────────────────────────────────────────── */
  const s = {
    /* Page wrapper */
    page: {
      minHeight: "100vh",
      background: colors.white,
      ...font.regular,
      color: colors.grey100,
      WebkitFontSmoothing: "antialiased",
    },

    /* Top header bar */
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 24px",
      borderBottom: `1px solid ${colors.grey20}`,
      borderLeft: `5px solid ${colors.purple}`,
      background: colors.white,
    },
    headerLeft: {
      display: "flex",
      alignItems: "center",
      gap: 36,
    },
    logo: {
      height: 27,
      display: "block",
    },
    headerTitle: {
      ...font.bold,
      fontSize: 18,
      color: colors.grey100,
      letterSpacing: -0.1,
    },
    goBackBtn: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 24px 8px 16px",
      border: `1px solid ${colors.purple}`,
      borderRadius: 4,
      background: colors.white,
      cursor: "pointer",
      ...font.bold,
      fontSize: 12,
      color: colors.purple,
      letterSpacing: 0.25,
    },

    /* Content area */
    content: {
      padding: "32px 80px 80px",
      maxWidth: 1440,
    },
    h1: {
      ...font.semibold,
      fontSize: 20,
      color: colors.grey100,
      letterSpacing: -0.14,
      marginBottom: 4,
    },
    subtitle: {
      ...font.regular,
      fontSize: 12,
      color: colors.grey100,
      letterSpacing: 0.25,
      lineHeight: 1.4,
      maxWidth: 1280,
    },

    /* Two-column layout */
    layout: {
      display: "flex",
      gap: 16,
      alignItems: "flex-start",
      marginTop: 16,
    },
    leftCol: {
      flex: 1,
      minWidth: 0,
    },
    rightCol: {
      width: 474,
      flexShrink: 0,
      position: "sticky",
      top: 20,
    },

    /* Card chrome */
    card: {
      background: colors.white,
      borderRadius: 8,
      overflow: "hidden",
    },
    cardHeaderRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
      height: 64,
      boxSizing: "border-box",
      borderTop: `1px solid ${colors.grey20}`,
      borderLeft: `1px solid ${colors.grey20}`,
      borderRight: `1px solid ${colors.grey20}`,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
    },
    cardBody: {
      border: `1px solid ${colors.grey20}`,
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
      padding: 16,
      background: colors.white,
    },
    cardH2: {
      ...font.bold,
      fontSize: 16,
      color: colors.grey100,
      letterSpacing: 0.25,
    },

    /* Add Rule button (outlined) */
    addRuleBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      height: 32,
      padding: "4px 16px 4px 8px",
      border: `1px solid ${colors.purple}`,
      borderRadius: 4,
      background: colors.white,
      cursor: "pointer",
      ...font.bold,
      fontSize: 14,
      color: colors.purple,
      letterSpacing: 0.25,
    },

    /* Empty state */
    emptyState: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 24,
      padding: "206px 0",
    },
    emptyIcon: {
      width: 56,
      height: 56,
      borderRadius: "50%",
      background: colors.purple10,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    emptyTitle: {
      ...font.bold,
      fontSize: 16,
      color: colors.grey100,
      lineHeight: "21px",
    },
    emptySub: {
      ...font.regular,
      fontSize: 12,
      color: colors.grey80,
      lineHeight: "21px",
    },

    /* Rule item */
    ruleItem: {
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
      padding: "12px 14px",
      border: `1px solid ${colors.grey20}`,
      borderRadius: 8,
      marginBottom: 8,
      background: colors.white,
    },
    ruleOrder: (p) => {
      const c = getPriorityColor(p);
      return {
        width: 26, height: 26, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, ...font.bold, flexShrink: 0, marginTop: 1,
        background: c.bg, color: c.fg,
      };
    },
    ruleContent: { flex: 1, minWidth: 0 },
    ruleStatement: { ...font.regular, fontSize: 13, lineHeight: 1.5, marginBottom: 2, letterSpacing: 0.25, color: colors.grey100 },
    ruleMeta: { ...font.regular, fontSize: 11, color: colors.grey40, letterSpacing: 0.25 },
    actionBtn: {
      width: 28, height: 28, border: "none", background: "transparent",
      color: colors.grey40, cursor: "pointer", borderRadius: 6,
      display: "flex", alignItems: "center", justifyContent: "center",
    },

    /* Builder */
    builder: { border: `2px dashed ${colors.grey20}`, borderRadius: 8, padding: 18, marginTop: 6 },
    condGroup: { padding: 14, background: colors.grey5, borderRadius: 8, marginBottom: 14 },
    condTitle: { ...font.bold, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: colors.grey40, marginBottom: 10 },
    row: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
    label: { ...font.regular, fontSize: 13, color: colors.grey80, minWidth: 76, letterSpacing: 0.25 },
    select: { padding: "7px 10px", border: `1px solid ${colors.grey20}`, borderRadius: 4, fontSize: 13, background: colors.white, color: colors.grey100, ...font.regular, letterSpacing: 0.25 },
    input: { padding: "7px 10px", border: `1px solid ${colors.grey20}`, borderRadius: 4, fontSize: 13, background: colors.white, color: colors.grey100, ...font.regular, letterSpacing: 0.25 },
    nlPreview: { background: colors.grey5, borderRadius: 8, padding: "10px 14px", fontSize: 13, lineHeight: 1.6, borderLeft: `3px solid ${colors.purple}`, marginBottom: 14, ...font.regular, letterSpacing: 0.25 },

    /* Outlined button */
    btnOutline: {
      padding: "7px 14px", fontSize: 13, ...font.bold, border: `1px solid ${colors.grey20}`,
      borderRadius: 4, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
      background: colors.white, color: colors.grey100, letterSpacing: 0.25,
    },
    btnPrimary: {
      padding: "7px 14px", fontSize: 13, ...font.bold, border: "none",
      borderRadius: 4, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
      background: colors.purple, color: colors.white, letterSpacing: 0.25,
    },

    /* Live Preview panel */
    slotCount: { ...font.regular, fontSize: 12, color: colors.grey80, lineHeight: "21px" },

    /* Stats summary pill */
    statBlock: {
      background: colors.grey5,
      borderRadius: 8,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 2,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
    },
    statNumber: { ...font.bold, fontSize: 20, color: colors.grey100, letterSpacing: 0.25 },
    statLabel: { ...font.bold, fontSize: 12, color: colors.grey40, letterSpacing: 0.25, textTransform: "uppercase" },

    /* Day group in preview */
    dayLabel: { ...font.bold, fontSize: 12, color: colors.grey100, letterSpacing: 0.25, marginBottom: 8 },
    slotRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "8px 16px",
      background: colors.grey5,
      borderRadius: 8,
      borderLeft: `4px solid ${colors.grey60}`,
    },
    slotRowWithPriority: (p) => {
      const c = getPriorityColor(p);
      return {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 16px",
        background: colors.grey5,
        borderRadius: 8,
        borderLeft: `4px solid ${c.border}`,
      };
    },
    slotTime: { ...font.regular, fontSize: 14, color: colors.grey100, letterSpacing: 0.25 },
    slotMeta: { ...font.regular, fontSize: 12, color: colors.grey40, letterSpacing: 0.25, textAlign: "center" },
    unsetBadge: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 8px",
      borderRadius: 30,
      background: colors.grey30,
    },
    priorityBadge: (p) => {
      const c = getPriorityColor(p);
      return {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2px 10px",
        borderRadius: 30,
        background: c.badge,
        ...font.bold,
        fontSize: 11,
        color: colors.white,
        letterSpacing: 0.25,
        minWidth: 20,
      };
    },

    /* Toast */
    toast: {
      position: "fixed", bottom: 24, right: 24, background: colors.grey100,
      color: colors.white, padding: "12px 20px", borderRadius: 8,
      ...font.bold, fontSize: 13, letterSpacing: 0.25,
      boxShadow: "0 12px 40px rgba(0,0,0,0.12)", zIndex: 100,
    },
  };

  /* ── Build preview data ──────────────────────────────── */
  const previewByDay = useMemo(() => {
    const dayMap = {};
    DAYS.forEach((d) => { dayMap[d.label] = []; });

    sortedSlots.forEach((slot) => {
      dayMap[slot.day]?.push(slot);
    });

    // Collapse consecutive same-priority slots per day
    const result = {};
    Object.entries(dayMap).forEach(([day, slots]) => {
      const groups = [];
      let i = 0;
      while (i < slots.length) {
        const slot = slots[i];
        const p = slotPriorities[slot.id];
        let runEnd = i + 1;
        while (runEnd < slots.length && slotPriorities[slots[runEnd].id] === p) {
          runEnd++;
        }
        const lastSlot = slots[runEnd - 1];
        groups.push({
          startTime: slot.startTime,
          endTime: lastSlot.endTime,
          count: runEnd - i,
          priority: p,
        });
        i = runEnd;
      }
      result[day] = groups;
    });

    return result;
  }, [sortedSlots, slotPriorities]);

  const totalSlots = SLOTS.length;
  const unsetCount = stats["unset"] || 0;
  const priorityStatKeys = Object.keys(stats).filter((k) => k !== "unset").sort((a, b) => parseInt(b) - parseInt(a));

  return (
    <div style={s.page}>
      {/* ── Header ──────────────────────────────────── */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <img src={gripLogo} alt="Grip" style={s.logo} />
          <span style={s.headerTitle}>TechCrunch Slot Priorities</span>
        </div>
        <button style={s.goBackBtn}>
          <BackArrowIcon />
          Go back
        </button>
      </header>

      {/* ── Content ─────────────────────────────────── */}
      <div style={s.content}>
        <h1 style={s.h1}>Slot Priorities</h1>
        <p style={s.subtitle}>
          Create rules to control which time slots get the best-ranked meetings. Rules are evaluated top to bottom, the first matching rule wins. Unmatched slots are left unset (–). Priority values can be 1–100.
        </p>

        <div style={s.layout}>
          {/* ── Left: Priority Rules ───────────────── */}
          <div style={s.leftCol}>
            <div style={s.card}>
              <div style={s.cardHeaderRow}>
                <h2 style={s.cardH2}>Priority Rules</h2>
                <button style={s.addRuleBtn} onClick={() => setShowBuilder(true)}>
                  <PlusIcon />
                  Add Rule
                </button>
              </div>

              <div style={s.cardBody}>
                {/* Empty state */}
                {rules.length === 0 && !showBuilder && (
                  <div style={s.emptyState}>
                    <div style={s.emptyIcon}>
                      <FlagIcon />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
                      <span style={s.emptyTitle}>No priority rules yet</span>
                      <span style={s.emptySub}>All slots will receive default (–) priority</span>
                    </div>
                  </div>
                )}

                {/* Rules list */}
                {rules.map((rule, idx) => {
                  const matchCount = SLOTS.filter((sl) => slotMatchesRule(sl, rule)).length;
                  return (
                    <div key={rule.id} style={s.ruleItem}>
                      <div style={{ color: colors.grey40, paddingTop: 2, cursor: "grab" }}><GripIcon /></div>
                      <div style={s.ruleOrder(rule.priority)}>{rule.priority}</div>
                      <div style={s.ruleContent}>
                        <div style={s.ruleStatement}>{getRuleDescription(rule)}</div>
                        <div style={s.ruleMeta}>{matchCount} slot{matchCount !== 1 ? "s" : ""} matched</div>
                      </div>
                      <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                        <button style={{ ...s.actionBtn, opacity: idx === 0 ? 0.25 : 1 }} onClick={() => moveRule(rule.id, -1)} disabled={idx === 0}><ChevronUp /></button>
                        <button style={{ ...s.actionBtn, opacity: idx === rules.length - 1 ? 0.25 : 1 }} onClick={() => moveRule(rule.id, 1)} disabled={idx === rules.length - 1}><ChevronDown /></button>
                        <button style={s.actionBtn} onClick={() => removeRule(rule.id)}><XIcon /></button>
                      </div>
                    </div>
                  );
                })}

                {/* Builder */}
                {showBuilder && (
                  <div style={s.builder}>
                    <div style={{ ...font.semibold, fontSize: 14, marginBottom: 14, color: colors.grey100 }}>New Rule</div>

                    <div style={s.condGroup}>
                      <div style={s.condTitle}>Match slots where</div>
                      <div style={s.row}>
                        <span style={s.label}>Condition</span>
                        <select style={s.select} value={condType} onChange={(e) => setCondType(e.target.value)}>
                          <option value="day">Day is…</option>
                          <option value="time_exact">Start time is exactly…</option>
                          <option value="time_range">Start time is between…</option>
                          <option value="location">Location is…</option>
                          <option value="day_time">Day + start time are…</option>
                        </select>
                      </div>

                      {condType === "day" && (
                        <div style={s.row}>
                          <span style={s.label}>Day</span>
                          <select style={s.select} value={condDay} onChange={(e) => setCondDay(e.target.value)}>
                            {DAYS.map((d) => <option key={d.label} value={d.label}>{d.label}</option>)}
                          </select>
                        </div>
                      )}

                      {condType === "time_exact" && (
                        <div style={s.row}>
                          <span style={s.label}>Start time</span>
                          <input type="time" style={{ ...s.input, width: 120 }} value={condTimeExact} onChange={(e) => setCondTimeExact(e.target.value)} />
                        </div>
                      )}

                      {condType === "time_range" && (
                        <div style={s.row}>
                          <span style={s.label}>Between</span>
                          <input type="time" style={{ ...s.input, width: 120 }} value={condTimeFrom} onChange={(e) => setCondTimeFrom(e.target.value)} />
                          <span style={{ fontSize: 13, color: colors.grey80 }}>and</span>
                          <input type="time" style={{ ...s.input, width: 120 }} value={condTimeTo} onChange={(e) => setCondTimeTo(e.target.value)} />
                        </div>
                      )}

                      {condType === "location" && (
                        <div style={s.row}>
                          <span style={s.label}>Location</span>
                          <select style={s.select} value={condLocation} onChange={(e) => setCondLocation(e.target.value)}>
                            {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                          </select>
                        </div>
                      )}

                      {condType === "day_time" && (
                        <>
                          <div style={s.row}>
                            <span style={s.label}>Day</span>
                            <select style={s.select} value={condDayTime} onChange={(e) => setCondDayTime(e.target.value)}>
                              {DAYS.map((d) => <option key={d.label} value={d.label}>{d.label}</option>)}
                            </select>
                          </div>
                          <div style={s.row}>
                            <span style={s.label}>Start time</span>
                            <input type="time" style={{ ...s.input, width: 120 }} value={condDayTimeTime} onChange={(e) => setCondDayTimeTime(e.target.value)} />
                          </div>
                        </>
                      )}
                    </div>

                    <div style={s.condGroup}>
                      <div style={s.condTitle}>Set priority to</div>
                      <div style={s.row}>
                        <span style={s.label}>Priority</span>
                        <input type="number" style={{ ...s.input, width: 72, textAlign: "center" }} value={condPriority} min={1} max={100} onChange={(e) => setCondPriority(e.target.value)} />
                        <span style={{ fontSize: 11, color: colors.grey40 }}>100 = highest, 1 = lowest (default)</span>
                      </div>
                    </div>

                    <div style={s.nlPreview}>{nlPreview}</div>

                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 14, borderTop: `1px solid ${colors.grey20}` }}>
                      <button style={s.btnOutline} onClick={() => setShowBuilder(false)}>Cancel</button>
                      <button style={s.btnPrimary} onClick={addRule}>Add Rule</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right: Live Preview ────────────────── */}
          <div style={s.rightCol}>
            <div style={s.card}>
              <div style={s.cardHeaderRow}>
                <h2 style={s.cardH2}>Live Preview</h2>
                <span style={s.slotCount}>{totalSlots} slots</span>
              </div>

              <div style={s.cardBody}>
                {/* Stats summary */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  {unsetCount > 0 && (
                    <div style={{ ...s.statBlock, flex: priorityStatKeys.length > 0 ? "0 0 auto" : 1 }}>
                      <span style={s.statNumber}>{unsetCount}</span>
                      <span style={s.statLabel}>UNSET</span>
                    </div>
                  )}
                  {priorityStatKeys.map((k) => {
                    const c = getPriorityColor(k);
                    return (
                      <div key={k} style={{ ...s.statBlock, background: c.bg }}>
                        <span style={{ ...s.statNumber, color: c.fg }}>{stats[k]}</span>
                        <span style={{ ...s.statLabel, color: c.fg }}>P{k}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Day groups */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {DAYS.map((day) => {
                    const groups = previewByDay[day.label] || [];
                    return (
                      <div key={day.label}>
                        <div style={s.dayLabel}>{day.label}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {groups.map((g, i) => (
                            <div key={i} style={g.priority !== null ? s.slotRowWithPriority(g.priority) : s.slotRow}>
                              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                <span style={s.slotTime}>{g.startTime} - {g.endTime}</span>
                                <span style={s.slotMeta}>{g.count} Slot{g.count !== 1 ? "s" : ""}</span>
                              </div>
                              {g.priority !== null ? (
                                <span style={s.priorityBadge(g.priority)}>{g.priority}</span>
                              ) : (
                                <div style={s.unsetBadge}>
                                  <MinusIcon />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && <div style={s.toast}>{toast}</div>}
    </div>
  );
}
