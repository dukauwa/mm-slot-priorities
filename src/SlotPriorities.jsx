import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import gripLogo from "./assets/0cd0e8be5eebbb0fd15be4cdbbc90cb59d5ed0de.png";

/* ── Design Tokens (from Figma) ─────────────────────────────── */
const colors = {
  white: "#FFFFFF",
  grey5: "#F4F4F4",
  grey10: "#E9EAEA",
  grey20: "#D4D5D6",
  grey30: "#BEC0C0",
  grey40: "#A9ABAC",
  grey60: "#7E8183",
  grey80: "#535759",
  grey100: "#282D30",
  purple: "#522DA6",
  purple5: "#F6F4FC",
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
function slotMatchesRule(slot, rule) {
  switch (rule.type) {
    case "day": return slot.day === rule.day;
    case "time_range": {
      const dayMatch = !rule.day || rule.day === "All days" ? true : slot.day === rule.day;
      return dayMatch && slot.startTime >= rule.timeFrom && slot.startTime <= rule.timeTo;
    }
    case "location": {
      const dayMatch = !rule.day || rule.day === "All days" ? true : slot.day === rule.day;
      return dayMatch && slot.location === rule.location;
    }
    case "day_time": return slot.day === rule.day && slot.startTime === rule.time;
    default: return false;
  }
}

function getRuleDescription(rule) {
  const V = ({ children }) => (
    <span style={{ ...font.bold, color: colors.purple }}>{children}</span>
  );
  const dayLabel = (!rule.day || rule.day === "All days") ? "all days" : rule.day;
  switch (rule.type) {
    case "day": return <span>All slots on <V>{rule.day}</V> → Priority <V>{rule.priority}</V></span>;
    case "time_range": return <span>Slots between <V>{rule.timeFrom}</V> and <V>{rule.timeTo}</V> on <V>{dayLabel}</V> → Priority <V>{rule.priority}</V></span>;
    case "location": return <span>Slots at <V>{rule.location}</V> on <V>{dayLabel}</V> → Priority <V>{rule.priority}</V></span>;
    case "day_time": return <span>All slots on <V>{rule.day}</V> at <V>{rule.time}</V> → Priority <V>{rule.priority}</V></span>;
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

const PencilIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.475 5.408l2.117 2.117m-.756-3.982L12.109 9.27a2.118 2.118 0 00-.58 1.082L11 13l2.648-.53c.41-.082.786-.283 1.082-.579l5.727-5.727a1.853 1.853 0 10-2.621-2.621z" stroke={colors.grey60} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19 15v3a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h3" stroke={colors.grey60} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronUp = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.grey60} strokeWidth="2"><path d="M18 15l-6-6-6 6" /></svg>;
const ChevronDown = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.grey60} strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>;
const XIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.grey60} strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>;
const GripIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill={colors.grey40}><circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" /><circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" /><circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" /></svg>;

const CaretDownIcon = () => (
  <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.2826 1.28318L6.28255 6.28318C6.21287 6.3531 6.13008 6.40857 6.03892 6.44643C5.94775 6.48428 5.85001 6.50377 5.7513 6.50377C5.65259 6.50377 5.55485 6.48428 5.46369 6.44643C5.37252 6.40857 5.28973 6.3531 5.22005 6.28318L0.220051 1.28318C0.0791548 1.14228 0 0.951183 0 0.751926C0 0.552669 0.0791548 0.361572 0.220051 0.220676C0.360947 0.0797797 0.552044 0.000625136 0.751301 0.000625134C0.950558 0.000625131 1.14165 0.0797797 1.28255 0.220676L5.75193 4.69005L10.2213 0.220051C10.3622 0.079155 10.5533 0 10.7526 0C10.9518 0 11.1429 0.079155 11.2838 0.220051C11.4247 0.360948 11.5039 0.552044 11.5039 0.751301C11.5039 0.950559 11.4247 1.14166 11.2838 1.28255L11.2826 1.28318Z" fill={colors.grey60} />
  </svg>
);

const CalendarIcon = () => (
  <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.29167 0.625V3.29167M3.95833 0.625V3.29167M0.625 5.95833H12.625M1.95833 1.95833H11.2917C12.028 1.95833 12.625 2.55529 12.625 3.29167V12.625C12.625 13.3614 12.028 13.9583 11.2917 13.9583H1.95833C1.22195 13.9583 0.625 13.3614 0.625 12.625V3.29167C0.625 2.55529 1.22195 1.95833 1.95833 1.95833Z" stroke={colors.grey60} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Main Component ──────────────────────────────────────── */
export default function SlotPriorities() {
  const [rules, setRules] = useState([]);
  const [idCounter, setIdCounter] = useState(0);
  const [showBuilder, setShowBuilder] = useState(false);
  const [expandedRuleId, setExpandedRuleId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [toast, setToast] = useState(null);

  // Builder state
  const [condType, setCondType] = useState("day");
  const [condDay, setCondDay] = useState(DAYS[0].label);
  const [condTimeFrom, setCondTimeFrom] = useState("09:00");
  const [condTimeTo, setCondTimeTo] = useState("11:00");
  const [condTimeRangeDay, setCondTimeRangeDay] = useState("All days");
  const [condLocation, setCondLocation] = useState("Booth A1");
  const [condLocationDay, setCondLocationDay] = useState("All days");
  const [condDayTime, setCondDayTime] = useState(DAYS[0].label);
  const [condDayTimeTime, setCondDayTimeTime] = useState("09:00");
  const [condPriority, setCondPriority] = useState("1");

  const expandedCardRef = useRef(null);
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const handleDragStart = (idx) => (e) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (idx) => (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIdx(idx);
  };
  const handleDrop = (idx) => (e) => {
    e.preventDefault();
    if (dragIdx !== null && dragIdx !== idx) {
      const next = [...rules];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      setRules(next);
    }
    setDragIdx(null);
    setDragOverIdx(null);
  };
  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

  // Click outside expanded card → close edit mode
  useEffect(() => {
    if (expandedRuleId === null) return;
    const handleClickOutside = (e) => {
      if (expandedCardRef.current && !expandedCardRef.current.contains(e.target)) {
        setExpandedRuleId(null);
        setEditDraft(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [expandedRuleId]);

  const showToastMsg = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const addRule = () => {
    const priority = Math.max(1, Math.min(100, parseInt(condPriority) || 1));
    const rule = { id: idCounter, type: condType, priority };
    switch (condType) {
      case "day": rule.day = condDay; break;
      case "time_range": rule.timeFrom = condTimeFrom; rule.timeTo = condTimeTo; rule.day = condTimeRangeDay; break;
      case "location": rule.location = condLocation; rule.day = condLocationDay; break;
      case "day_time": rule.day = condDayTime; rule.time = condDayTimeTime; break;
    }
    setRules([...rules, rule]);
    setIdCounter(idCounter + 1);
    setShowBuilder(false);
    showToastMsg("Rule added");
  };

  const updateDraftField = (field, value) => {
    setEditDraft((d) => (d ? { ...d, [field]: value } : d));
  };

  const toggleExpandRule = (id) => {
    if (expandedRuleId === id) {
      // Collapse — discard draft
      setExpandedRuleId(null);
      setEditDraft(null);
    } else {
      // Expand — snapshot rule into draft
      const rule = rules.find((r) => r.id === id);
      setExpandedRuleId(id);
      setEditDraft(rule ? { ...rule } : null);
    }
  };

  const confirmEdit = () => {
    if (editDraft) {
      const d = { ...editDraft, priority: Math.max(1, Math.min(100, parseInt(editDraft.priority) || 1)) };
      setRules(rules.map((r) => (r.id === d.id ? d : r)));
      showToastMsg("Rule updated");
    }
    setExpandedRuleId(null);
    setEditDraft(null);
  };

  const cancelEdit = () => {
    setExpandedRuleId(null);
    setEditDraft(null);
  };

  const removeRule = (id) => {
    setRules(rules.filter((r) => r.id !== id));
    if (expandedRuleId === id) { setExpandedRuleId(null); setEditDraft(null); }
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
    return null;
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
    const trDay = condTimeRangeDay === "All days" ? "all days" : condTimeRangeDay;
    const locDay = condLocationDay === "All days" ? "all days" : condLocationDay;
    switch (condType) {
      case "day": return <span>All slots on {h(condDay)} → priority {h(p)}</span>;
      case "time_range": return <span>Slots between {h(condTimeFrom)} and {h(condTimeTo)} on {h(trDay)} → priority {h(p)}</span>;
      case "location": return <span>Slots at {h(condLocation)} on {h(locDay)} → priority {h(p)}</span>;
      case "day_time": return <span>Slots on {h(condDayTime)} at {h(condDayTimeTime)} → priority {h(p)}</span>;
      default: return null;
    }
  }, [condType, condDay, condTimeFrom, condTimeTo, condTimeRangeDay, condLocation, condLocationDay, condDayTime, condDayTimeTime, condPriority]);

  /* ── Build preview data ──────────────────────────────── */
  /* Group consecutive slots by priority within each day. Slots with
     the same priority that appear consecutively are merged into one row
     showing the time range span, slot count, and priority.
     When a rule is expanded (editing), filter preview to only matching slots. */
  const expandedRule = expandedRuleId !== null ? rules.find((r) => r.id === expandedRuleId) : null;
  const previewRule = editDraft || expandedRule;

  const previewByDay = useMemo(() => {
    const dayMap = {};
    DAYS.forEach((d) => { dayMap[d.label] = []; });

    const filteredSlots = previewRule
      ? sortedSlots.filter((slot) => slotMatchesRule(slot, previewRule))
      : sortedSlots;

    filteredSlots.forEach((slot) => { dayMap[slot.day]?.push(slot); });

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
  }, [sortedSlots, slotPriorities, previewRule]);

  const totalSlots = SLOTS.length;
  const unsetCount = stats["unset"] || 0;
  const priorityStatKeys = Object.keys(stats).filter((k) => k !== "unset").sort((a, b) => parseInt(a) - parseInt(b));

  /* ── Styles ──────────────────────────────────────────── */
  const s = {
    page: {
      height: "100vh",
      background: colors.white,
      ...font.regular,
      color: colors.grey100,
      WebkitFontSmoothing: "antialiased",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    },

    /* Top header bar — always fixed at top */
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 24px",
      borderBottom: `1px solid ${colors.grey20}`,
      borderLeft: `5px solid ${colors.purple}`,
      background: colors.white,
      flexShrink: 0,
      position: "sticky",
      top: 0,
      zIndex: 50,
    },
    headerLeft: { display: "flex", alignItems: "center", gap: 36 },
    logo: { height: 27, display: "block" },
    headerTitle: { ...font.bold, fontSize: 18, color: colors.grey100, letterSpacing: -0.1 },
    goBackBtn: {
      display: "flex", alignItems: "center", gap: 8,
      padding: "8px 24px 8px 16px", border: `1px solid ${colors.purple}`,
      borderRadius: 4, background: colors.white, cursor: "pointer",
      ...font.bold, fontSize: 12, color: colors.purple, letterSpacing: 0.25,
    },

    /* Main body (below header) — both cols scroll independently */
    body: { display: "flex", flex: 1, minHeight: 0, overflow: "hidden" },

    /* Left column */
    leftCol: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflowY: "auto" },

    /* Title bar (with Add Rule) */
    titleBar: {
      display: "flex", gap: 40, alignItems: "flex-end",
      padding: "24px 32px", borderBottom: `1px solid ${colors.grey20}`,
      flexShrink: 0,
    },
    titleContent: { flex: 1, display: "flex", flexDirection: "column", gap: 4 },
    h1: { ...font.semibold, fontSize: 20, color: colors.grey100, letterSpacing: -0.14 },
    subtitle: { ...font.regular, fontSize: 12, color: colors.grey100, letterSpacing: 0.25, lineHeight: 1.4 },
    addRuleBtn: {
      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
      height: 32, padding: "4px 16px 4px 8px", border: `1px solid ${colors.purple}`,
      borderRadius: 4, background: colors.white, cursor: "pointer",
      ...font.bold, fontSize: 14, color: colors.purple, letterSpacing: 0.25, flexShrink: 0,
    },

    /* Rules list area */
    rulesArea: { padding: "16px 32px", display: "flex", flexDirection: "column", gap: 16, flex: 1 },

    /* Rule item — new flat style */
    ruleItem: {
      background: colors.white, border: `1px solid ${colors.grey20}`, borderRadius: 4,
      padding: 16, display: "flex", flexDirection: "column", gap: 0,
      cursor: "pointer", transition: "border-color 0.15s, background 0.15s",
    },
    ruleItemExpanded: {
      background: colors.white, border: `1px solid ${colors.purple}`, borderRadius: 4,
      padding: 16, display: "flex", flexDirection: "column", gap: 0,
      cursor: "pointer",
    },
    ruleRow: { display: "flex", alignItems: "center", gap: 16, width: "100%" },
    rulePriorityBadge: {
      background: colors.purple10, borderRadius: 27, padding: "8px 12px",
      ...font.regular, fontSize: 12, color: colors.purple, letterSpacing: 0.25,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      minWidth: 20,
    },
    ruleDescription: { flex: 1, ...font.bold, fontSize: 14, color: colors.grey100, letterSpacing: 0.25, lineHeight: 1.4 },
    ruleActions: { display: "flex", gap: 4, alignItems: "center", flexShrink: 0 },
    actionBtn: {
      width: 32, height: 32, border: "none", background: "transparent",
      cursor: "pointer", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 8,
    },
    ruleMeta: {
      ...font.regular, fontSize: 12, color: colors.grey60, letterSpacing: 0.25,
      paddingLeft: 75,
    },

    /* Empty state */
    emptyState: {
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 24, padding: "160px 0", flex: 1,
    },
    emptyIcon: {
      width: 56, height: 56, borderRadius: "50%", background: colors.purple10,
      display: "flex", alignItems: "center", justifyContent: "center",
    },
    emptyTitle: { ...font.bold, fontSize: 16, color: colors.grey100, lineHeight: "21px" },
    emptySub: { ...font.regular, fontSize: 12, color: colors.grey80, lineHeight: "21px" },

    /* Builder */
    builder: { border: `1px solid ${colors.grey10}`, borderRadius: 8, padding: 24 },
    builderTitle: { ...font.semibold, fontSize: 14, marginBottom: 20, color: colors.grey100 },
    condGroup: { padding: 16, background: "transparent", borderRadius: 8, marginBottom: 16 },
    condTitle: { ...font.regular, fontSize: 12, letterSpacing: 0.25, color: colors.grey40, marginBottom: 16 },
    row: { display: "flex", alignItems: "center", gap: 8, marginBottom: 16 },
    label: { ...font.regular, fontSize: 14, color: colors.grey100, width: 111, flexShrink: 0, letterSpacing: 0.25 },
    selectWrapper: { position: "relative", display: "inline-flex", alignItems: "center" },
    select: {
      padding: "12px 40px 12px 16px", border: `1px solid ${colors.grey20}`, borderRadius: 4,
      fontSize: 12, background: colors.white, color: colors.grey100, ...font.regular,
      letterSpacing: 0.25, appearance: "none", WebkitAppearance: "none", MozAppearance: "none",
      cursor: "pointer", minWidth: 160,
    },
    selectIcon: { position: "absolute", right: 14, pointerEvents: "none", display: "flex", alignItems: "center" },
    inputWrapper: { position: "relative", display: "inline-flex", alignItems: "center" },
    input: {
      padding: "12px 40px 12px 16px", border: `1px solid ${colors.grey20}`, borderRadius: 4,
      fontSize: 12, background: colors.white, color: colors.grey100, ...font.regular,
      letterSpacing: 0.25, minWidth: 160,
    },
    inputIcon: { position: "absolute", right: 14, pointerEvents: "none", display: "flex", alignItems: "center" },
    nlPreview: {
      background: colors.grey5, borderRadius: 8, padding: 16, fontSize: 14, lineHeight: 1.6,
      borderLeft: `4px solid ${colors.purple}`, marginBottom: 20, ...font.regular, letterSpacing: 0.25,
    },
    btnCancel: {
      padding: "14px 24px", fontSize: 15, ...font.bold, border: "none",
      borderRadius: 6, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
      background: colors.grey10, color: colors.grey100, letterSpacing: 0.25,
    },
    btnConfirm: {
      padding: "14px 24px", fontSize: 15, ...font.bold, border: "none",
      borderRadius: 6, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
      background: colors.purple, color: colors.white, letterSpacing: 0.25,
    },

    /* Right column — Live Preview sidebar */
    rightCol: {
      width: 359, flexShrink: 0, borderLeft: `1px solid ${colors.grey20}`,
      display: "flex", flexDirection: "column", overflowY: "auto",
    },

    /* Preview header section */
    previewHeader: {
      padding: 24, borderBottom: `1px solid ${colors.grey20}`,
      display: "flex", flexDirection: "column", gap: 24,
    },
    previewTitleRow: { display: "flex", alignItems: "center", gap: 2 },
    previewTitle: { ...font.bold, fontSize: 16, color: colors.grey100, letterSpacing: 0.25, flex: 1 },
    slotCount: { ...font.regular, fontSize: 12, color: colors.grey80, lineHeight: "21px" },

    /* Stats — separate card boxes, 3 per row max, excess fills space on new row */
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 8,
    },
    statCard: {
      padding: "16px 8px", display: "flex", flexDirection: "column",
      gap: 4, alignItems: "center", justifyContent: "center",
      border: `1px solid ${colors.purple}`, borderRadius: 8, background: colors.white,
    },
    statNumber: { ...font.bold, fontSize: 20, color: colors.purple, letterSpacing: 0.25 },
    statLabel: { ...font.bold, fontSize: 12, color: colors.purple, letterSpacing: 0.25, textAlign: "center" },
    statUnsetCard: {
      padding: "16px 8px", display: "flex", flexDirection: "column",
      gap: 4, alignItems: "center", justifyContent: "center",
      border: `1px solid ${colors.grey20}`, borderRadius: 8, background: colors.grey5,
    },
    statUnsetNumber: { ...font.bold, fontSize: 20, color: colors.grey100, letterSpacing: 0.25 },
    statUnsetLabel: { ...font.bold, fontSize: 12, color: colors.grey40, letterSpacing: 0.25, textAlign: "center" },

    /* Preview slots section */
    previewSlots: { padding: 24, borderBottom: `1px solid ${colors.grey20}` },
    dayLabel: { ...font.bold, fontSize: 12, color: colors.grey100, letterSpacing: 0.25, marginBottom: 8 },

    /* Slot row — purple for matched, grey for unset */
    slotRowPurple: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 12px", background: colors.purple10, borderRadius: 6,
      borderLeft: `3px solid ${colors.purple}`,
    },
    slotRowUnset: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 12px", background: colors.grey5, borderRadius: 6,
      borderLeft: `3px solid ${colors.grey30}`,
    },
    slotTime: { ...font.regular, fontSize: 14, color: colors.grey100, letterSpacing: 0.25 },
    slotMetaPurple: { ...font.regular, fontSize: 12, color: colors.purple, letterSpacing: 0.25, textAlign: "center" },
    slotMetaGrey: { ...font.regular, fontSize: 12, color: colors.grey40, letterSpacing: 0.25, textAlign: "center" },
    priorityBadge: {
      display: "flex", alignItems: "center", justifyContent: "center",
      width: 32, height: 16, borderRadius: 30, background: colors.purple,
      ...font.bold, fontSize: 10, color: colors.white, letterSpacing: 0.25,
    },
    unsetBadge: {
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 8px", borderRadius: 30, background: colors.grey30,
    },

    /* Toast */
    toast: {
      position: "fixed", bottom: 24, right: 24, background: colors.grey100,
      color: colors.white, padding: "12px 20px", borderRadius: 8,
      ...font.bold, fontSize: 13, letterSpacing: 0.25,
      boxShadow: "0 12px 40px rgba(0,0,0,0.12)", zIndex: 100,
    },
  };

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

      {/* ── Body: Left + Right columns ────────────── */}
      <div style={s.body}>
        {/* ── Left column ────────────────────────── */}
        <div style={s.leftCol}>
          {/* Title bar with Add Rule */}
          <div style={s.titleBar}>
            <div style={s.titleContent}>
              <h1 style={s.h1}>Slot Priorities</h1>
              <p style={s.subtitle}>
                Create rules to control which time slots get the best-ranked meetings. Rules are evaluated top to bottom, the first matching rule wins. Unmatched slots are left unset (–). Priority values can be 1–100.
              </p>
            </div>
            <button style={s.addRuleBtn} onClick={() => setShowBuilder(true)}>
              <PlusIcon />
              Add Rule
            </button>
          </div>

          {/* Rules area */}
          <div style={s.rulesArea}>
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
              const isExpanded = expandedRuleId === rule.id;
              const isDragging = dragIdx === idx;
              const isDragOver = dragOverIdx === idx && dragIdx !== idx;
              return (
                <div
                  key={rule.id}
                  ref={isExpanded ? expandedCardRef : undefined}
                  draggable={!isExpanded}
                  onDragStart={handleDragStart(idx)}
                  onDragOver={handleDragOver(idx)}
                  onDrop={handleDrop(idx)}
                  onDragEnd={handleDragEnd}
                  style={{
                    ...(isExpanded ? s.ruleItemExpanded : s.ruleItem),
                    ...(isDragging ? { opacity: 0.4 } : {}),
                    ...(isDragOver ? { borderTopColor: colors.purple, borderTopWidth: 2 } : {}),
                  }}
                  onClick={() => !isExpanded && toggleExpandRule(rule.id)}
                >
                  <div style={s.ruleRow}>
                    <div style={{ cursor: "grab", display: "flex", alignItems: "center" }} onMouseDown={(e) => e.stopPropagation()}><GripIcon /></div>
                    <div style={s.rulePriorityBadge}>{rule.priority}</div>
                    <div style={s.ruleDescription}>{getRuleDescription(rule)}</div>
                    <div style={s.ruleActions}>
                      <button style={{ ...s.actionBtn, opacity: idx === 0 ? 0.25 : 1 }} onClick={(e) => { e.stopPropagation(); moveRule(rule.id, -1); }} disabled={idx === 0}><ChevronUp /></button>
                      <button style={{ ...s.actionBtn, opacity: idx === rules.length - 1 ? 0.25 : 1 }} onClick={(e) => { e.stopPropagation(); moveRule(rule.id, 1); }} disabled={idx === rules.length - 1}><ChevronDown /></button>
                      <button style={s.actionBtn} onClick={(e) => { e.stopPropagation(); removeRule(rule.id); }}><XIcon /></button>
                    </div>
                  </div>
                  <div style={s.ruleMeta}>{matchCount} slot{matchCount !== 1 ? "s" : ""} matched</div>

                  {/* Inline edit fields — shown when expanded */}
                  {isExpanded && editDraft && (
                    <div style={{ marginTop: 16, borderTop: `1px solid ${colors.grey10}`, paddingTop: 16 }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ ...s.condGroup, marginBottom: 0 }}>
                        <div style={s.condTitle}>Edit rule</div>
                        <div style={s.row}>
                          <span style={s.label}>Condition</span>
                          <div style={s.selectWrapper}>
                            <select style={s.select} value={editDraft.type} onChange={(e) => {
                              const newType = e.target.value;
                              const updated = { ...editDraft, type: newType };
                              if (newType === "day" && !updated.day) updated.day = DAYS[0].label;
                              if (newType === "time_range") { if (!updated.timeFrom) updated.timeFrom = "09:00"; if (!updated.timeTo) updated.timeTo = "11:00"; if (!updated.day) updated.day = "All days"; }
                              if (newType === "location") { if (!updated.location) updated.location = LOCATIONS[0]; if (!updated.day) updated.day = "All days"; }
                              if (newType === "day_time") { if (!updated.day) updated.day = DAYS[0].label; if (!updated.time) updated.time = "09:00"; }
                              setEditDraft(updated);
                            }}>
                              <option value="day">Day is…</option>
                              <option value="day_time">Day + Start time are…</option>
                              <option value="time_range">Start time is between…</option>
                              <option value="location">Location on day…</option>
                            </select>
                            <span style={s.selectIcon}><CaretDownIcon /></span>
                          </div>
                        </div>

                        {editDraft.type === "day" && (
                          <div style={s.row}>
                            <span style={s.label}>Day</span>
                            <div style={s.selectWrapper}>
                              <select style={s.select} value={editDraft.day} onChange={(e) => updateDraftField("day", e.target.value)}>
                                {DAYS.map((d) => <option key={d.label} value={d.label}>{d.label}</option>)}
                              </select>
                              <span style={s.selectIcon}><CalendarIcon /></span>
                            </div>
                          </div>
                        )}

                        {editDraft.type === "day_time" && (
                          <>
                            <div style={s.row}>
                              <span style={s.label}>Day</span>
                              <div style={s.selectWrapper}>
                                <select style={s.select} value={editDraft.day} onChange={(e) => updateDraftField("day", e.target.value)}>
                                  {DAYS.map((d) => <option key={d.label} value={d.label}>{d.label}</option>)}
                                </select>
                                <span style={s.selectIcon}><CalendarIcon /></span>
                              </div>
                            </div>
                            <div style={s.row}>
                              <span style={s.label}>Start time</span>
                              <div style={s.inputWrapper}>
                                <input type="time" style={s.input} value={editDraft.time} onChange={(e) => updateDraftField("time", e.target.value)} />
                                <span style={s.inputIcon}><CalendarIcon /></span>
                              </div>
                            </div>
                          </>
                        )}

                        {editDraft.type === "time_range" && (
                          <>
                            <div style={s.row}>
                              <span style={s.label}>Day</span>
                              <div style={s.selectWrapper}>
                                <select style={s.select} value={editDraft.day || "All days"} onChange={(e) => updateDraftField("day", e.target.value)}>
                                  <option value="All days">All days</option>
                                  {DAYS.map((d) => <option key={d.label} value={d.label}>{d.label}</option>)}
                                </select>
                                <span style={s.selectIcon}><CalendarIcon /></span>
                              </div>
                            </div>
                            <div style={s.row}>
                              <span style={s.label}>Between</span>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={s.inputWrapper}>
                                  <input type="time" style={s.input} value={editDraft.timeFrom} onChange={(e) => updateDraftField("timeFrom", e.target.value)} />
                                  <span style={s.inputIcon}><CalendarIcon /></span>
                                </div>
                                <span style={{ fontSize: 12, color: colors.grey80, ...font.regular }}>and</span>
                                <div style={s.inputWrapper}>
                                  <input type="time" style={s.input} value={editDraft.timeTo} onChange={(e) => updateDraftField("timeTo", e.target.value)} />
                                  <span style={s.inputIcon}><CalendarIcon /></span>
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {editDraft.type === "location" && (
                          <>
                            <div style={s.row}>
                              <span style={s.label}>Location</span>
                              <div style={s.selectWrapper}>
                                <select style={s.select} value={editDraft.location} onChange={(e) => updateDraftField("location", e.target.value)}>
                                  {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                                </select>
                                <span style={s.selectIcon}><CaretDownIcon /></span>
                              </div>
                            </div>
                            <div style={s.row}>
                              <span style={s.label}>Day</span>
                              <div style={s.selectWrapper}>
                                <select style={s.select} value={editDraft.day || "All days"} onChange={(e) => updateDraftField("day", e.target.value)}>
                                  <option value="All days">All days</option>
                                  {DAYS.map((d) => <option key={d.label} value={d.label}>{d.label}</option>)}
                                </select>
                                <span style={s.selectIcon}><CalendarIcon /></span>
                              </div>
                            </div>
                          </>
                        )}

                        <div style={{ ...s.row, marginBottom: 0 }}>
                          <span style={s.label}>Priority</span>
                          <div style={s.inputWrapper}>
                            <input type="number" style={s.input} value={editDraft.priority} min={1} max={100}
                              onChange={(e) => updateDraftField("priority", e.target.value)} />
                            <span style={s.inputIcon}><CalendarIcon /></span>
                          </div>
                          <span style={{ fontSize: 12, color: colors.grey40, ...font.regular, letterSpacing: 0.25, whiteSpace: "nowrap" }}>1 = highest, 100 = lowest</span>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 16 }}>
                        <button style={s.btnCancel} onClick={cancelEdit}>Cancel</button>
                        <button style={s.btnConfirm} onClick={confirmEdit}>Update Rule</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Builder */}
            {showBuilder && (
              <div style={s.builder}>
                <div style={s.builderTitle}>New Rule</div>

                <div style={s.condGroup}>
                  <div style={s.row}>
                    <span style={s.label}>Condition</span>
                    <div style={s.selectWrapper}>
                      <select style={s.select} value={condType} onChange={(e) => setCondType(e.target.value)}>
                        <option value="day">Day is…</option>
                        <option value="day_time">Day + Start time are…</option>
                        <option value="time_range">Start time is between…</option>
                        <option value="location">Location on day…</option>
                      </select>
                      <span style={s.selectIcon}><CaretDownIcon /></span>
                    </div>
                  </div>

                  {condType === "day" && (
                    <div style={s.row}>
                      <span style={s.label}>Day</span>
                      <div style={s.selectWrapper}>
                        <select style={s.select} value={condDay} onChange={(e) => setCondDay(e.target.value)}>
                          {DAYS.map((d) => <option key={d.label} value={d.label}>{d.label}</option>)}
                        </select>
                        <span style={s.selectIcon}><CalendarIcon /></span>
                      </div>
                    </div>
                  )}

                  {condType === "day_time" && (
                    <>
                      <div style={s.row}>
                        <span style={s.label}>Day</span>
                        <div style={s.selectWrapper}>
                          <select style={s.select} value={condDayTime} onChange={(e) => setCondDayTime(e.target.value)}>
                            {DAYS.map((d) => <option key={d.label} value={d.label}>{d.label}</option>)}
                          </select>
                          <span style={s.selectIcon}><CalendarIcon /></span>
                        </div>
                      </div>
                      <div style={s.row}>
                        <span style={s.label}>Start time</span>
                        <div style={s.inputWrapper}>
                          <input type="time" style={s.input} value={condDayTimeTime} onChange={(e) => setCondDayTimeTime(e.target.value)} />
                          <span style={s.inputIcon}><CalendarIcon /></span>
                        </div>
                      </div>
                    </>
                  )}

                  {condType === "time_range" && (
                    <>
                      <div style={s.row}>
                        <span style={s.label}>Day</span>
                        <div style={s.selectWrapper}>
                          <select style={s.select} value={condTimeRangeDay} onChange={(e) => setCondTimeRangeDay(e.target.value)}>
                            <option value="All days">All days</option>
                            {DAYS.map((d) => <option key={d.label} value={d.label}>{d.label}</option>)}
                          </select>
                          <span style={s.selectIcon}><CalendarIcon /></span>
                        </div>
                      </div>
                      <div style={s.row}>
                        <span style={s.label}>Between</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={s.inputWrapper}>
                            <input type="time" style={s.input} value={condTimeFrom} onChange={(e) => setCondTimeFrom(e.target.value)} />
                            <span style={s.inputIcon}><CalendarIcon /></span>
                          </div>
                          <span style={{ fontSize: 12, color: colors.grey80, ...font.regular }}>and</span>
                          <div style={s.inputWrapper}>
                            <input type="time" style={s.input} value={condTimeTo} onChange={(e) => setCondTimeTo(e.target.value)} />
                            <span style={s.inputIcon}><CalendarIcon /></span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {condType === "location" && (
                    <>
                      <div style={s.row}>
                        <span style={s.label}>Location</span>
                        <div style={s.selectWrapper}>
                          <select style={s.select} value={condLocation} onChange={(e) => setCondLocation(e.target.value)}>
                            {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                          </select>
                          <span style={s.selectIcon}><CaretDownIcon /></span>
                        </div>
                      </div>
                      <div style={s.row}>
                        <span style={s.label}>Day</span>
                        <div style={s.selectWrapper}>
                          <select style={s.select} value={condLocationDay} onChange={(e) => setCondLocationDay(e.target.value)}>
                            <option value="All days">All days</option>
                            {DAYS.map((d) => <option key={d.label} value={d.label}>{d.label}</option>)}
                          </select>
                          <span style={s.selectIcon}><CalendarIcon /></span>
                        </div>
                      </div>
                    </>
                  )}

                  <div style={{ ...s.row, marginBottom: 0 }}>
                    <span style={s.label}>Priority</span>
                    <div style={s.inputWrapper}>
                      <input type="number" style={s.input} value={condPriority} min={1} max={100} onChange={(e) => setCondPriority(e.target.value)} />
                      <span style={s.inputIcon}><CalendarIcon /></span>
                    </div>
                    <span style={{ fontSize: 12, color: colors.grey40, ...font.regular, letterSpacing: 0.25, whiteSpace: "nowrap" }}>1 = highest, 100 = lowest</span>
                  </div>
                </div>

                <div style={s.nlPreview}>{nlPreview}</div>

                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                  <button style={s.btnCancel} onClick={() => setShowBuilder(false)}>Cancel</button>
                  <button style={s.btnConfirm} onClick={addRule}>Confirm Rule</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right column: Live Preview ─────────── */}
        <div style={s.rightCol}>
          {/* Header + Stats */}
          <div style={s.previewHeader}>
            <div style={s.previewTitleRow}>
              <h2 style={s.previewTitle}>Live Preview</h2>
              <span style={s.slotCount}>{totalSlots} slots</span>
            </div>
            {expandedRule && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: colors.purple5, borderRadius: 6, border: `1px solid ${colors.purple}` }}>
                <span style={{ ...font.regular, fontSize: 12, color: colors.purple, letterSpacing: 0.25, flex: 1 }}>
                  Filtering by Rule {rules.indexOf(expandedRule) + 1}
                </span>
                <button
                  style={{ width: 32, height: 32, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 8, borderRadius: 4 }}
                  onClick={cancelEdit}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.purple} strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
            )}

            {/* Stats — separate card boxes, max 3 per row, excess fills space */}
            {(() => {
              const allCells = [];
              priorityStatKeys.forEach((k) => allCells.push({ key: k, count: stats[k], label: `P${k}`, type: "purple" }));
              if (unsetCount > 0) allCells.push({ key: "unset", count: unsetCount, label: "UNSET", type: "unset" });
              const total = allCells.length;
              const cols = total <= 3 ? total : 3;
              return (
                <div style={{ ...s.statsGrid, gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                  {allCells.map((cell) => {
                    const isUnset = cell.type === "unset";
                    return (
                      <div key={cell.key} style={isUnset ? s.statUnsetCard : s.statCard}>
                        <span style={isUnset ? s.statUnsetNumber : s.statNumber}>{cell.count}</span>
                        <span style={isUnset ? s.statUnsetLabel : s.statLabel}>{cell.label}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Day groups */}
          <div style={s.previewSlots}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {DAYS.map((day) => {
                const groups = previewByDay[day.label] || [];
                return (
                  <div key={day.label}>
                    <div style={s.dayLabel}>{day.label}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {groups.length === 0 && previewRule ? (
                        <div style={{ ...s.slotRowUnset, justifyContent: "center", borderLeft: "none", background: colors.grey5 }}>
                          <span style={{ ...font.regular, fontSize: 14, color: colors.grey40, letterSpacing: 0.25 }}>
                            No matching slots
                          </span>
                        </div>
                      ) : (
                        groups.map((g, i) => (
                          <div key={i} style={g.priority !== null ? s.slotRowPurple : s.slotRowUnset}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <span style={s.slotTime}>{g.startTime} - {g.endTime}</span>
                              <span style={g.priority !== null ? s.slotMetaPurple : s.slotMetaGrey}>
                                {g.count === 1 ? "1" : `${g.count} Slots`}
                              </span>
                            </div>
                            {g.priority !== null ? (
                              <div style={s.priorityBadge}>{g.priority}</div>
                            ) : (
                              <div style={s.unsetBadge}>
                                <MinusIcon />
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && <div style={s.toast}>{toast}</div>}
    </div>
  );
}
