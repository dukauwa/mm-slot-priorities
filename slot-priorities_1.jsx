import { useState, useMemo, useCallback } from "react";

const DAYS = [
  { label: "Mon 20 Jan", date: "2028-01-20" },
  { label: "Tue 21 Jan", date: "2028-01-21" },
  { label: "Wed 22 Jan", date: "2028-01-22" },
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

function getPriorityColor(p) {
  const n = parseInt(p);
  if (n >= 80) return { bg: "#f3edf9", fg: "#522DA6", badge: "#522DA6" };
  if (n >= 50) return { bg: "#eee8f6", fg: "#6b45b8", badge: "#6b45b8" };
  if (n >= 30) return { bg: "#fdf3ec", fg: "#c47a2d", badge: "#c47a2d" };
  if (n >= 10) return { bg: "#fdf8ec", fg: "#8b6914", badge: "#8b6914" };
  if (n >= 2) return { bg: "#eef2f6", fg: "#4a6a8a", badge: "#4a6a8a" };
  return { bg: "#f0eeea", fg: "#9e9890", badge: "#9e9890" };
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
    <span style={{ background: "#f3edf9", padding: "1px 6px", borderRadius: 4, fontWeight: 600, fontSize: 12, fontFamily: "monospace", color: "#522DA6" }}>{children}</span>
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

const ChevronUp = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6" /></svg>;
const ChevronDown = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>;
const XIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>;
const PlusIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>;
const GripIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" /><circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" /><circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" /></svg>;
const InfoIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.4, flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>;

export default function SlotPriorities() {
  const [rules, setRules] = useState([]);
  const [idCounter, setIdCounter] = useState(0);
  const [showBuilder, setShowBuilder] = useState(false);
  const [toast, setToast] = useState(null);

  // Builder state
  const [condType, setCondType] = useState("day");
  const [condDay, setCondDay] = useState("Mon 20 Jan");
  const [condTimeExact, setCondTimeExact] = useState("09:00");
  const [condTimeFrom, setCondTimeFrom] = useState("10:00");
  const [condTimeTo, setCondTimeTo] = useState("11:00");
  const [condLocation, setCondLocation] = useState("Booth A1");
  const [condDayTime, setCondDayTime] = useState("Mon 20 Jan");
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
    return 1;
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
      s[p] = (s[p] || 0) + 1;
      sp[slot.id] = p;
    });
    return { stats: s, slotPriorities: sp };
  }, [rules, sortedSlots]);

  const statKeys = Object.keys(stats).sort((a, b) => parseInt(b) - parseInt(a));

  const nlPreview = useMemo(() => {
    const p = condPriority;
    const h = (v) => <strong style={{ color: "#522DA6" }}>{v}</strong>;
    switch (condType) {
      case "day": return <span>All slots on {h(condDay)} → priority {h(p)}</span>;
      case "time_exact": return <span>Slots starting at {h(condTimeExact)} on any day → priority {h(p)}</span>;
      case "time_range": return <span>Slots starting between {h(condTimeFrom)} and {h(condTimeTo)} on any day → priority {h(p)}</span>;
      case "location": return <span>Slots at {h(condLocation)} → priority {h(p)}</span>;
      case "day_time": return <span>Slots on {h(condDayTime)} at {h(condDayTimeTime)} → priority {h(p)}</span>;
      default: return null;
    }
  }, [condType, condDay, condTimeExact, condTimeFrom, condTimeTo, condLocation, condDayTime, condDayTimeTime, condPriority]);

  const s = {
    app: { maxWidth: 1240, margin: "0 auto", padding: "24px 20px 80px", fontFamily: "'DM Sans', -apple-system, sans-serif", color: "#1a1816", WebkitFontSmoothing: "antialiased" },
    breadcrumb: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#9e9890", marginBottom: 20 },
    breadLink: { color: "#522DA6", textDecoration: "none" },
    h1: { fontSize: 26, fontWeight: 700, letterSpacing: -0.5, marginBottom: 6 },
    subtitle: { fontSize: 14, color: "#6b6560", maxWidth: 720, lineHeight: 1.6 },
    layout: { display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start", marginTop: 24 },
    card: { background: "#fff", border: "1px solid #e2dfd8", borderRadius: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
    cardHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid #e2dfd8" },
    cardH2: { fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 },
    cardBody: { padding: 18 },
    btn: (primary) => ({
      padding: "7px 14px", fontSize: 13, fontWeight: 500, border: primary ? "none" : "1px solid #e2dfd8",
      borderRadius: 6, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
      background: primary ? "#522DA6" : "#fff", color: primary ? "#fff" : "#1a1816",
      transition: "all 150ms",
    }),
    badge: { background: "#522DA6", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 10, fontFamily: "monospace" },
    callout: { display: "flex", gap: 10, padding: "11px 14px", borderRadius: 6, fontSize: 12, lineHeight: 1.5, color: "#6b6560", background: "#f7f6f3", marginBottom: 14 },
    ruleItem: { display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", border: "1px solid #e2dfd8", borderRadius: 10, marginBottom: 8, background: "#fff", transition: "all 150ms" },
    ruleOrder: (p) => {
      const c = getPriorityColor(p);
      return { width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1, fontFamily: "monospace", background: c.bg, color: c.fg };
    },
    ruleContent: { flex: 1, minWidth: 0 },
    ruleStatement: { fontSize: 13, fontWeight: 500, lineHeight: 1.5, marginBottom: 2 },
    ruleMeta: { fontSize: 11, color: "#9e9890", fontFamily: "monospace" },
    actionBtn: (danger) => ({
      width: 28, height: 28, border: "none", background: "transparent", color: "#9e9890",
      cursor: "pointer", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
    }),
    builder: { border: "2px dashed #e2dfd8", borderRadius: 10, padding: 18, marginTop: 6 },
    condGroup: { padding: 14, background: "#f7f6f3", borderRadius: 6, marginBottom: 14 },
    condTitle: { fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: "#9e9890", marginBottom: 10 },
    row: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
    label: { fontSize: 13, color: "#6b6560", fontWeight: 500, minWidth: 76 },
    select: { padding: "7px 10px", border: "1px solid #e2dfd8", borderRadius: 6, fontSize: 13, background: "#fff", color: "#1a1816", fontFamily: "inherit" },
    input: { padding: "7px 10px", border: "1px solid #e2dfd8", borderRadius: 6, fontSize: 13, background: "#fff", color: "#1a1816", fontFamily: "inherit" },
    nlPreview: { background: "#f7f6f3", borderRadius: 6, padding: "10px 14px", fontSize: 13, lineHeight: 1.6, borderLeft: "3px solid #522DA6", marginBottom: 14 },
    previewSlot: (p) => {
      const c = getPriorityColor(p);
      return { display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", borderRadius: 6, fontSize: 12, background: c.bg, marginBottom: 2 };
    },
    slotTime: { fontFamily: "monospace", fontSize: 10.5, color: "#6b6560", minWidth: 82 },
    slotLoc: { fontSize: 11, color: "#9e9890", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
    slotBadge: (p) => {
      const c = getPriorityColor(p);
      return { fontFamily: "monospace", fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 10, background: c.badge, color: "#fff", minWidth: 24, textAlign: "center" };
    },
    dayHeader: { fontSize: 11, fontWeight: 600, color: "#6b6560", padding: "10px 0 4px", textTransform: "uppercase", letterSpacing: 0.5 },
    statPill: (p) => {
      const c = getPriorityColor(p);
      return { flex: 1, textAlign: "center", padding: "8px 10px", borderRadius: 6, background: c.bg, minWidth: 60 };
    },
    toast: { position: "fixed", bottom: 24, right: 24, background: "#1a1816", color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 500, boxShadow: "0 12px 40px rgba(0,0,0,0.12)", zIndex: 100, transition: "all 300ms" },
  };

  return (
    <div style={s.app}>
      {/* Breadcrumb */}
      <nav style={s.breadcrumb}>
        <a href="#" style={s.breadLink}>Events</a>
        <span style={{ opacity: 0.4 }}>›</span>
        <a href="#" style={s.breadLink}>ALCHEMY2028</a>
        <span style={{ opacity: 0.4 }}>›</span>
        <span>Slot Priorities</span>
      </nav>

      <h1 style={s.h1}>Slot Priorities</h1>
      <p style={s.subtitle}>Create rules to boost specific time slots so the scheduler fills them with the best-ranked meetings first. All slots start at priority 1. Add rules to increase priority for the slots that matter most (up to 100).</p>

      <div style={s.layout}>
        {/* Left: Rules */}
        <div>
          <div style={s.card}>
            <div style={s.cardHeader}>
              <h2 style={s.cardH2}>Priority Rules <span style={s.badge}>{rules.length}</span></h2>
              <button style={s.btn(true)} onClick={() => setShowBuilder(true)}>
                <PlusIcon /> Add Rule
              </button>
            </div>
            <div style={s.cardBody}>
              <div style={s.callout}>
                <InfoIcon />
                <span>The scheduler fills the highest-priority slots first. All slots default to priority 1. Create rules to boost slots you want filled with the best meetings — higher number = higher priority.</span>
              </div>

              {/* Rules list */}
              {rules.length === 0 && !showBuilder && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#9e9890" }}>
                  <p style={{ fontSize: 14, marginBottom: 4 }}>No priority rules yet</p>
                  <span style={{ fontSize: 12 }}>All slots are at default priority (1)</span>
                </div>
              )}

              {rules.map((rule, idx) => {
                const matchCount = SLOTS.filter((sl) => slotMatchesRule(sl, rule)).length;
                return (
                  <div key={rule.id} style={s.ruleItem}>
                    <div style={{ color: "#9e9890", paddingTop: 2, cursor: "grab" }}><GripIcon /></div>
                    <div style={s.ruleOrder(rule.priority)}>{rule.priority}</div>
                    <div style={s.ruleContent}>
                      <div style={s.ruleStatement}>{getRuleDescription(rule)}</div>
                      <div style={s.ruleMeta}>{matchCount} slot{matchCount !== 1 ? "s" : ""} matched</div>
                    </div>
                    <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                      <button style={{ ...s.actionBtn(), opacity: idx === 0 ? 0.25 : 1 }} onClick={() => moveRule(rule.id, -1)} disabled={idx === 0}><ChevronUp /></button>
                      <button style={{ ...s.actionBtn(), opacity: idx === rules.length - 1 ? 0.25 : 1 }} onClick={() => moveRule(rule.id, 1)} disabled={idx === rules.length - 1}><ChevronDown /></button>
                      <button style={s.actionBtn(true)} onClick={() => removeRule(rule.id)}><XIcon /></button>
                    </div>
                  </div>
                );
              })}

              {/* Builder */}
              {showBuilder && (
                <div style={s.builder}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>New Rule</div>

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
                        <span style={{ fontSize: 13, color: "#6b6560" }}>and</span>
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
                      <span style={{ fontSize: 11, color: "#9e9890" }}>100 = highest, 1 = lowest (default)</span>
                    </div>
                  </div>

                  <div style={s.nlPreview}>{nlPreview}</div>

                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 14, borderTop: "1px solid #e2dfd8" }}>
                    <button style={s.btn(false)} onClick={() => setShowBuilder(false)}>Cancel</button>
                    <button style={s.btn(true)} onClick={addRule}>Add Rule</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div style={{ ...s.card, position: "sticky", top: 20 }}>
          <div style={s.cardHeader}>
            <h2 style={s.cardH2}>Live Preview</h2>
            <span style={{ fontSize: 11, color: "#9e9890", fontFamily: "monospace" }}>{SLOTS.length} slots</span>
          </div>
          <div style={s.cardBody}>
            {/* Stats */}
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {statKeys.map((k) => {
                const c = getPriorityColor(k);
                return (
                  <div key={k} style={s.statPill(k)}>
                    <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: c.fg }}>{stats[k]}</div>
                    <div style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.3, color: c.fg }}>P{k}</div>
                  </div>
                );
              })}
            </div>

            {/* Slots - chronological, consecutive same-priority collapsed */}
            <div style={{ maxHeight: 440, overflowY: "auto", paddingRight: 4 }}>
              {(() => {
                let currentDay = "";
                const elements = [];

                // Build runs of consecutive same-priority slots within each day
                let i = 0;
                while (i < sortedSlots.length) {
                  const slot = sortedSlots[i];
                  const p = slotPriorities[slot.id];

                  // Day header
                  if (slot.day !== currentDay) {
                    currentDay = slot.day;
                    elements.push(
                      <div key={`day-${slot.day}`} style={{ ...s.dayHeader, ...(elements.length === 0 ? { paddingTop: 0 } : {}) }}>{slot.day}</div>
                    );
                  }

                  // Find consecutive run of same priority within same day
                  let runEnd = i + 1;
                  while (
                    runEnd < sortedSlots.length &&
                    sortedSlots[runEnd].day === slot.day &&
                    slotPriorities[sortedSlots[runEnd].id] === p
                  ) {
                    runEnd++;
                  }

                  const runLength = runEnd - i;
                  const lastSlot = sortedSlots[runEnd - 1];

                  if (runLength === 1) {
                    // Single slot — show normally
                    elements.push(
                      <div key={slot.id} style={s.previewSlot(p)}>
                        <span style={s.slotTime}>{slot.startTime}–{slot.endTime}</span>
                        <span style={s.slotLoc}>{slot.location}</span>
                        <span style={s.slotBadge(p)}>{p}</span>
                      </div>
                    );
                  } else {
                    // Collapsed run
                    const c = getPriorityColor(p);
                    elements.push(
                      <div key={`run-${slot.id}`} style={{
                        ...s.previewSlot(p),
                        borderLeft: `3px solid ${c.badge}`,
                        paddingLeft: 10,
                      }}>
                        <span style={s.slotTime}>{slot.startTime}–{lastSlot.endTime}</span>
                        <span style={{ fontSize: 11, color: c.fg, flex: 1, fontWeight: 500 }}>
                          {runLength} slots
                        </span>
                        <span style={s.slotBadge(p)}>{p}</span>
                      </div>
                    );
                  }

                  i = runEnd;
                }

                return elements;
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && <div style={s.toast}>{toast}</div>}
    </div>
  );
}
