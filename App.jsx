import { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, X, Droplet, Edit3, CalendarDays,
  Sparkles, Trash2, Home, BookOpen, BarChart3, User, Moon, Sun, Brain,
  Coffee, Activity, AlertCircle, CheckCircle2, ArrowRight, Thermometer,
  Lock, ChevronDown
} from 'lucide-react';

const toKey = (d) => { const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const day = String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; };
const fromKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const today = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; };
const daysBetween = (a, b) => Math.round((fromKey(b) - fromKey(a)) / 86400000);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const fmtMonth = (d) => d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
const fmtLong = (d) => d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
const fmtShort = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const FLOW_LEVELS = [
  { id: 'spotting', label: 'Spotting', dots: 1 }, { id: 'light', label: 'Light', dots: 2 },
  { id: 'medium', label: 'Medium', dots: 3 }, { id: 'heavy', label: 'Heavy', dots: 4 },
];
const MOODS = [
  { id: 'radiant', label: 'Radiant' }, { id: 'good', label: 'Good' }, { id: 'meh', label: 'Meh' },
  { id: 'low', label: 'Low' }, { id: 'awful', label: 'Awful' },
];
const MOOD_TAGS = ['confident', 'calm', 'focused', 'joyful', 'sensitive', 'anxious', 'irritable', 'sad', 'foggy', 'unmotivated'];
const SYMPTOM_TAGS = ['cramps', 'headache', 'bloating', 'tender breasts', 'acne', 'fatigue', 'cravings', 'nausea', 'back pain', 'hot flashes', 'dizziness', 'insomnia'];
const DISCHARGE_TYPES = [
  { id: 'dry', label: 'Dry' }, { id: 'sticky', label: 'Sticky' }, { id: 'creamy', label: 'Creamy' },
  { id: 'watery', label: 'Watery' }, { id: 'eggwhite', label: 'Egg-white' },
];
const ENERGY_LEVELS = ['drained', 'low', 'steady', 'bright', 'peak'];
const STRESS_LEVELS = ['none', 'mild', 'moderate', 'high', 'overwhelming'];

const PHASES = {
  menstrual: {
    name: 'Menstrual', color: '#9A3A38', softColor: '#D08583', short: 'Rest phase',
    overview: 'Your uterus is shedding its lining. Estrogen and progesterone are at their lowest of the cycle.',
    feels: 'Energy is often low. Cramps, fatigue, and craving warmth are common. Some people feel introspective or quiet.',
    hormones: 'Estrogen and progesterone bottom out on day 1, then estrogen begins a slow rise as the next cycle\'s follicles wake up.',
    eat: 'Iron-rich foods (red meat, lentils, leafy greens), magnesium for cramps, warm foods over cold.',
    move: 'Gentle yoga, walking, stretching. Skip intense workouts if your body is asking for rest — that signal is real.',
    work: 'A natural time for reflection and planning rather than starting big new things. Honor the slowdown.',
    avoid: 'Pushing through severe pain, excessive caffeine, restrictive eating.',
  },
  follicular: {
    name: 'Follicular', color: '#6B7F5C', softColor: '#B8C2A8', short: 'Rising phase',
    overview: 'FSH rises, stimulating follicles in your ovaries to develop. Estrogen climbs steadily.',
    feels: 'Mood typically lifts. Energy returns. Skin tends to clear. Many feel most creative and motivated here.',
    hormones: 'Rising estrogen drives a sense of optimism and increases serotonin. Testosterone also begins to rise.',
    eat: 'Fresh produce, lean proteins, fermented foods. Your body tolerates more variety here.',
    move: 'Strength training, cardio, dance — your body responds well to challenge. PRs often happen here.',
    work: 'Excellent for new projects, learning, brainstorming, and outward-facing work like networking.',
    avoid: 'Sleep debt — easy to overdo it when energy feels infinite.',
  },
  ovulatory: {
    name: 'Ovulatory', color: '#C4944A', softColor: '#E2C28A', short: 'Peak phase',
    overview: 'An LH surge triggers ovulation: an egg is released. This is the brief fertile window.',
    feels: 'Often the most extroverted, confident, and energetic days. Libido peaks. Cervical mucus becomes egg-white.',
    hormones: 'Estrogen peaks just before ovulation, then drops sharply. Brief testosterone rise. LH surges for 24–36 hours.',
    eat: 'Antioxidant-rich foods (berries, dark leafy greens), fiber to support estrogen metabolism, plenty of water.',
    move: 'High-intensity workouts, group fitness, anything social. Coordination and stamina peak here.',
    work: 'Best window for big presentations, hard conversations, social events, and persuasion-heavy work.',
    avoid: 'Overcommitting — the energy is real but it doesn\'t last forever.',
  },
  luteal: {
    name: 'Luteal', color: '#7A5A8C', softColor: '#B89DC2', short: 'Wind-down',
    overview: 'After ovulation, the corpus luteum produces progesterone. If no pregnancy, hormones drop, triggering the next period.',
    feels: 'Two halves: early luteal often feels steady and grounded. Late luteal can bring PMS — bloating, cravings, mood shifts.',
    hormones: 'Progesterone dominates — calming but can also bring water retention, slight body temp rise, and slowed digestion.',
    eat: 'Complex carbs (oats, sweet potato), B vitamins, magnesium-rich foods, dark chocolate. Cravings are real, not weakness.',
    move: 'Moderate intensity, taper toward gentle as your period approaches. Pilates, swimming, walks all work well.',
    work: 'Great for detail-oriented work, editing, finishing things, organizing. Less ideal for high-stakes social events late in the phase.',
    avoid: 'Restrictive dieting (cravings will win), overscheduling, comparing your energy to ovulatory-phase you.',
  },
};

const DEFAULT = {
  cycles: [], symptoms: {}, customSymptoms: [], bbt: {}, lhTests: {},
  settings: { cycleLength: 28, periodLength: 5, mode: 'advanced', pregnancyMode: false, tempUnit: 'F' },
};

function computePhase(cycleDay, avgCycle, avgPeriod) {
  if (cycleDay == null || cycleDay < 1) return null;
  if (cycleDay <= avgPeriod) return 'menstrual';
  const ov = avgCycle - 14;
  if (cycleDay <= ov - 2) return 'follicular';
  if (cycleDay <= ov + 1) return 'ovulatory';
  return 'luteal';
}

function generateInsights({ data, stats, predictions, currentPhase, sortedCycles }) {
  const insights = [];
  const phaseSymptoms = { menstrual: {}, follicular: {}, ovulatory: {}, luteal: {} };
  const phaseMoods = { menstrual: {}, follicular: {}, ovulatory: {}, luteal: {} };

  for (let i = 0; i < sortedCycles.length; i++) {
    const c = sortedCycles[i];
    const cycleLen = (i < sortedCycles.length - 1) ? daysBetween(c.start, sortedCycles[i + 1].start) : stats.avgCycle;
    const periodLen = c.end ? daysBetween(c.start, c.end) + 1 : stats.avgPeriod;
    const start = fromKey(c.start);
    for (let d = 0; d < cycleLen; d++) {
      const key = toKey(addDays(start, d));
      const sym = data.symptoms[key];
      if (!sym) continue;
      const phase = computePhase(d + 1, cycleLen, periodLen);
      if (!phase) continue;
      (sym.tags || []).forEach(t => phaseSymptoms[phase][t] = (phaseSymptoms[phase][t] || 0) + 1);
      (sym.moodTags || []).forEach(t => phaseMoods[phase][t] = (phaseMoods[phase][t] || 0) + 1);
    }
  }

  if (currentPhase) {
    const top = Object.entries(phaseSymptoms[currentPhase]).sort((a, b) => b[1] - a[1]).slice(0, 3).filter(([_, n]) => n >= 2);
    if (top.length >= 1) {
      insights.push({ kind: 'pattern', icon: 'sparkles', title: `Your ${currentPhase} pattern`,
        body: `Across your logged ${currentPhase} phases, you most often note ${top.map(([t]) => t).join(', ')}. Knowing this means you can plan ahead.` });
    }
    const topMood = Object.entries(phaseMoods[currentPhase]).sort((a, b) => b[1] - a[1])[0];
    if (topMood && topMood[1] >= 2) {
      insights.push({ kind: 'mood', icon: 'brain', title: 'Mood signature',
        body: `You frequently describe yourself as "${topMood[0]}" during your ${currentPhase} phase. This isn't random — it tracks with hormonal shifts.` });
    }
  }

  if (stats.cycleLengths.length >= 3) {
    const min = Math.min(...stats.cycleLengths), max = Math.max(...stats.cycleLengths);
    const variance = max - min;
    if (variance > 8) {
      insights.push({ kind: 'flag', icon: 'alert', title: 'Cycle variation',
        body: `Your last ${stats.cycleLengths.length} cycles ranged from ${min} to ${max} days. Some variation is normal, but consistent swings over a week are worth discussing with a clinician.` });
    } else if (variance <= 4) {
      insights.push({ kind: 'positive', icon: 'check', title: 'Steady rhythm',
        body: `Your recent cycles vary by only ${variance} day${variance === 1 ? '' : 's'} — a sign of consistent hormonal balance.` });
    }
  }

  if (stats.cycleLengths.length >= 2) {
    const shortCycles = stats.cycleLengths.filter(l => l < 23).length;
    if (shortCycles >= 2) {
      insights.push({ kind: 'flag', icon: 'alert', title: 'Short cycles noted',
        body: `Several recent cycles have been under 23 days. If you're trying to conceive, this could indicate a short luteal phase worth checking with a provider.` });
    }
  }

  if (currentPhase && predictions?.cycleDay) {
    const phase = PHASES[currentPhase];
    insights.push({ kind: 'forecast', icon: 'sun', title: `Today: day ${predictions.cycleDay}, ${phase.name.toLowerCase()}`, body: phase.feels });
  }

  if (predictions?.period?.length) {
    const next = predictions.period[0];
    const days = daysBetween(toKey(today()), next);
    if (days >= 0 && days <= 3) {
      insights.push({ kind: 'forecast', icon: 'sparkles', title: 'Period approaching',
        body: `Estimated to start in ${days === 0 ? 'a day or so' : `${days} day${days === 1 ? '' : 's'}`}. PMS symptoms often peak now — consider gentler workouts and earlier nights.` });
    }
  }
  return insights;
}

export default function PeriodTracker() {
  const [data, setData] = useState(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('today');
  const [viewMonth, setViewMonth] = useState(() => { const t = today(); return new Date(t.getFullYear(), t.getMonth(), 1); });
  const [selectedDay, setSelectedDay] = useState(toKey(today()));
  const [editorOpen, setEditorOpen] = useState(false);
  const [logPeriodOpen, setLogPeriodOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [bbtOpen, setBbtOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem('period-data-v2');
        if (raw) {
          const parsed = JSON.parse(raw);
          setData({ ...DEFAULT, ...parsed, settings: { ...DEFAULT.settings, ...(parsed.settings || {}) } });
        }
      } catch (e) { }
      setLoading(false);
    })();
  }, []);

  const persist = async (next) => {
    setData(next);
    try { localStorage.setItem('period-data-v2', JSON.stringify(next)); } catch (e) { console.error(e); }
  };

  const sortedCycles = useMemo(() => [...data.cycles].sort((a, b) => a.start.localeCompare(b.start)), [data.cycles]);

  const stats = useMemo(() => {
    const completed = sortedCycles.filter(c => c.end);
    const periodLengths = completed.map(c => daysBetween(c.start, c.end) + 1);
    const cycleLengths = [];
    for (let i = 1; i < sortedCycles.length; i++) cycleLengths.push(daysBetween(sortedCycles[i - 1].start, sortedCycles[i].start));
    const avg = (arr, fb) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : fb;
    const stdDev = (arr) => {
      if (arr.length < 2) return 0;
      const m = arr.reduce((a, b) => a + b, 0) / arr.length;
      return Math.sqrt(arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length);
    };
    return {
      avgCycle: avg(cycleLengths, data.settings.cycleLength),
      avgPeriod: avg(periodLengths, data.settings.periodLength),
      totalLogged: sortedCycles.length, cycleLengths, periodLengths,
      regularity: stdDev(cycleLengths),
    };
  }, [sortedCycles, data.settings]);

  const predictions = useMemo(() => {
    if (sortedCycles.length === 0) return null;
    const last = sortedCycles[sortedCycles.length - 1];
    const lastStart = fromKey(last.start);
    const dayOfCycle = daysBetween(last.start, toKey(today())) + 1;
    const out = { period: [], fertile: [], ovulation: null, cycleDay: dayOfCycle > 0 ? dayOfCycle : null,
      confidence: Math.min(0.95, 0.4 + sortedCycles.length * 0.12) };
    for (let i = 1; i <= 6; i++) {
      const pStart = addDays(lastStart, stats.avgCycle * i);
      for (let d = 0; d < stats.avgPeriod; d++) out.period.push(toKey(addDays(pStart, d)));
      const ovulation = addDays(pStart, -14);
      if (i === 1) out.ovulation = toKey(ovulation);
      for (let d = -5; d <= 1; d++) out.fertile.push(toKey(addDays(ovulation, d)));
    }
    return out;
  }, [sortedCycles, stats]);

  const currentPhase = useMemo(() => {
    if (!predictions?.cycleDay) return null;
    return computePhase(predictions.cycleDay, stats.avgCycle, stats.avgPeriod);
  }, [predictions, stats]);

  const periodDaysSet = useMemo(() => {
    const s = new Set();
    for (const c of sortedCycles) {
      const start = fromKey(c.start), end = c.end ? fromKey(c.end) : start;
      for (let d = new Date(start); d <= end; d = addDays(d, 1)) s.add(toKey(d));
    }
    return s;
  }, [sortedCycles]);

  const insights = useMemo(() => generateInsights({ data, stats, predictions, currentPhase, sortedCycles }), [data, stats, predictions, currentPhase, sortedCycles]);

  const nextPeriodInfo = useMemo(() => {
    if (!predictions?.period?.length) return null;
    const next = predictions.period[0];
    return { date: next, days: daysBetween(toKey(today()), next) };
  }, [predictions]);

  const updateSymptom = (key, patch) => {
    const cur = data.symptoms[key] || {};
    const merged = { ...cur, ...patch };
    const empty = !merged.flow && !merged.mood && (!merged.tags || !merged.tags.length) && (!merged.moodTags || !merged.moodTags.length) && !merged.notes && merged.energy == null && merged.sleepHours == null && merged.stress == null && !merged.discharge;
    const next = { ...data.symptoms };
    if (empty) delete next[key]; else next[key] = merged;
    persist({ ...data, symptoms: next });
  };

  const addCycle = (start, end) => persist({ ...data, cycles: [...data.cycles, { id: Date.now(), start, end }] });
  const updateCycle = (id, patch) => persist({ ...data, cycles: data.cycles.map(c => c.id === id ? { ...c, ...patch } : c) });
  const deleteCycle = (id) => persist({ ...data, cycles: data.cycles.filter(c => c.id !== id) });
  const updateSettings = (patch) => persist({ ...data, settings: { ...data.settings, ...patch } });
  const setBBT = (key, value) => { const next = { ...data.bbt }; if (value == null || value === '') delete next[key]; else next[key] = value; persist({ ...data, bbt: next }); };
  const setLH = (key, value) => { const next = { ...data.lhTests }; if (!value) delete next[key]; else next[key] = value; persist({ ...data, lhTests: next }); };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: '#F4EDE0' }}>
      <div className="text-xs tracking-[0.3em]" style={{ color: '#8B7968', fontFamily: 'Manrope, system-ui, sans-serif' }}>BLOOM</div>
    </div>;
  }

  const tabProps = { data, stats, predictions, currentPhase, insights, sortedCycles, periodDaysSet, nextPeriodInfo, viewMonth, setViewMonth, selectedDay, setSelectedDay, setEditorOpen, setLogPeriodOpen, setBbtOpen, updateCycle, deleteCycle, setBBT, setLH, updateSettings };

  return (<>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&family=Manrope:wght@300;400;500;600;700&display=swap');
      :root {
        --bg:#F4EDE0; --bg-warm:#EFE5D2; --card:#FBF6EC; --ink:#2B1F17; --muted:#8B7968; --line:#E2D4BA;
        --primary:#9A3A38; --primary-soft:#D08583; --accent:#6B7F5C; --accent-soft:#B8C2A8; --warning:#C4944A;
        --display:'Fraunces', Georgia, serif; --body:'Manrope', system-ui, sans-serif;
      }
      body { background: var(--bg); margin: 0; }
      .display { font-family: var(--display); font-feature-settings: "ss01"; letter-spacing: -0.02em; }
      .num { font-family: var(--display); font-variant-numeric: oldstyle-nums; }
      .grain::before { content: ""; position: absolute; inset: 0; background-image: radial-gradient(rgba(43,31,23,0.08) 1px, transparent 1px); background-size: 3px 3px; opacity: 0.4; pointer-events: none; mix-blend-mode: multiply; }
      .day-cell { transition: all 0.15s ease; }
      .day-cell:active { transform: scale(0.92); }
      @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .fade-up { animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) backwards; }
      input[type="date"], input[type="number"], textarea { font-family: var(--body); color: var(--ink); }
      input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0.5; }
      button { font-family: var(--body); }
      ::-webkit-scrollbar { width: 0; height: 0; }
    `}</style>

    <div className="min-h-screen pb-28" style={{ background: 'var(--bg)', color: 'var(--ink)', fontFamily: 'var(--body)' }}>
      {tab === 'today' && <TodayView {...tabProps} onOpenMore={() => setMoreOpen(true)} />}
      {tab === 'calendar' && <CalendarTab {...tabProps} />}
      {tab === 'insights' && <InsightsView {...tabProps} />}
      {tab === 'learn' && <LearnView {...tabProps} />}
    </div>

    <nav className="fixed bottom-0 left-0 right-0 z-30" style={{ background: 'rgba(244, 237, 224, 0.92)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--line)' }}>
      <div className="flex max-w-md mx-auto">
        {[{ id: 'today', icon: Home, label: 'Today' }, { id: 'calendar', icon: CalendarDays, label: 'Calendar' }, { id: 'insights', icon: BarChart3, label: 'Insights' }, { id: 'learn', icon: BookOpen, label: 'Learn' }].map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setTab(id)} className="flex-1 py-3 flex flex-col items-center gap-1 transition-all" style={{ color: tab === id ? 'var(--ink)' : 'var(--muted)' }}>
            <Icon size={18} strokeWidth={tab === id ? 2 : 1.5} />
            <span className="text-[10px] uppercase tracking-widest" style={{ fontWeight: tab === id ? 600 : 400 }}>{label}</span>
          </button>
        ))}
      </div>
    </nav>

    {tab !== 'today' && (
      <button onClick={() => setLogPeriodOpen(true)} className="fixed bottom-24 right-5 w-12 h-12 rounded-full flex items-center justify-center z-20" style={{ background: 'var(--primary)', color: '#fff', boxShadow: '0 8px 24px rgba(154,58,56,0.35)' }}>
        <Droplet size={18} fill="#fff" />
      </button>
    )}

    {editorOpen && <SymptomEditor dateKey={selectedDay} value={data.symptoms[selectedDay]} mode={data.settings.mode} customSymptoms={data.customSymptoms} onAddCustom={(name) => persist({ ...data, customSymptoms: [...data.customSymptoms, name] })} onRemoveCustom={(name) => persist({ ...data, customSymptoms: data.customSymptoms.filter(s => s !== name) })} onClose={() => setEditorOpen(false)} onSave={(patch) => { updateSymptom(selectedDay, patch); setEditorOpen(false); }} onClear={() => { const n = { ...data.symptoms }; delete n[selectedDay]; persist({ ...data, symptoms: n }); setEditorOpen(false); }} />}
    {logPeriodOpen && <LogPeriodModal onClose={() => setLogPeriodOpen(false)} onLog={(s, e) => { addCycle(s, e); setLogPeriodOpen(false); }} />}
    {moreOpen && <MoreModal data={data} onClose={() => setMoreOpen(false)} onUpdateSettings={updateSettings} onOpenBBT={() => { setMoreOpen(false); setBbtOpen(true); }} onExport={() => exportData(data)} onWipe={() => { if (confirm('This will delete all your data. Are you sure?')) persist(DEFAULT); }} />}
    {bbtOpen && <BBTModal data={data} onClose={() => setBbtOpen(false)} onSave={setBBT} onSaveLH={setLH} />}
  </>);
}

function TodayView({ data, predictions, currentPhase, insights, nextPeriodInfo, setEditorOpen, setSelectedDay, setLogPeriodOpen, onOpenMore }) {
  const phase = currentPhase ? PHASES[currentPhase] : null;
  const todayKey = toKey(today());
  const todaySymptom = data.symptoms[todayKey];
  return (
    <div className="max-w-md mx-auto">
      <div className="px-6 pt-12 pb-2 fade-up flex items-baseline justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--muted)' }}>your cycle</div>
          <h1 className="display text-4xl mt-1" style={{ fontWeight: 400 }}>Bloom</h1>
        </div>
        <button onClick={onOpenMore} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--muted)' }}>
          <User size={16} />
        </button>
      </div>

      <div className="px-6 mt-6 fade-up" style={{ animationDelay: '60ms' }}>
        <div className="relative rounded-3xl overflow-hidden grain" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
          {phase && <div className="h-1.5 w-full" style={{ background: phase.color }} />}
          <div className="p-6 relative" style={{ zIndex: 1 }}>
            {!predictions ? <EmptyHero onLog={() => setLogPeriodOpen(true)} /> : (<>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--muted)' }}>cycle day</div>
                  <div className="display text-7xl mt-1" style={{ fontWeight: 300, lineHeight: 0.95 }}>{predictions.cycleDay ?? '—'}</div>
                </div>
                {phase && (
                  <div className="text-right max-w-[55%]">
                    <div className="text-[10px] uppercase tracking-[0.25em]" style={{ color: 'var(--muted)' }}>phase</div>
                    <div className="display text-2xl mt-1" style={{ fontWeight: 400, color: phase.color }}>{phase.name}</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{phase.short}</div>
                  </div>
                )}
              </div>
              {nextPeriodInfo && (
                <div className="mt-6 pt-5 border-t flex items-center justify-between" style={{ borderColor: 'var(--line)' }}>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.25em]" style={{ color: 'var(--muted)' }}>next period</div>
                    <div className="text-sm mt-1">{nextPeriodInfo.days <= 0 ? 'expected today or earlier' : <><span className="num text-base">{nextPeriodInfo.days}</span> {nextPeriodInfo.days === 1 ? 'day' : 'days'} away</>}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-[0.25em]" style={{ color: 'var(--muted)' }}>estimated</div>
                    <div className="display text-base mt-1">{fmtShort(fromKey(nextPeriodInfo.date))}</div>
                  </div>
                </div>
              )}
              <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                <Lock size={11} /><span>Confidence {Math.round(predictions.confidence * 100)}% · improves with more cycles</span>
              </div>
            </>)}
          </div>
        </div>
      </div>

      {phase && (
        <div className="px-6 mt-6 fade-up" style={{ animationDelay: '120ms' }}>
          <div className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: 'var(--muted)' }}>what to expect today</div>
          <div className="rounded-2xl p-5" style={{ background: phase.softColor + '40', border: `1px solid ${phase.softColor}` }}>
            <div className="display text-lg leading-snug" style={{ color: 'var(--ink)', fontWeight: 400 }}>{phase.feels}</div>
          </div>
        </div>
      )}

      <div className="px-6 mt-6 fade-up" style={{ animationDelay: '180ms' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--muted)' }}>today's check-in</div>
          <button onClick={() => { setSelectedDay(todayKey); setEditorOpen(true); }} className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'var(--ink)', color: 'var(--bg)' }}>
            <Edit3 size={11} /> {todaySymptom ? 'Edit' : 'Log'}
          </button>
        </div>
        <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
          {todaySymptom ? <SymptomSummary s={todaySymptom} /> : <div className="text-sm" style={{ color: 'var(--muted)' }}>How are you feeling today? Log mood, energy, and symptoms in seconds.</div>}
        </div>
      </div>

      {insights.length > 0 && (
        <div className="px-6 mt-8 fade-up" style={{ animationDelay: '240ms' }}>
          <div className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: 'var(--muted)' }}>for you</div>
          <div className="space-y-3">{insights.slice(0, 4).map((ins, i) => <InsightCard key={i} insight={ins} />)}</div>
        </div>
      )}

      {phase && (
        <div className="px-6 mt-8 fade-up" style={{ animationDelay: '300ms' }}>
          <div className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: 'var(--muted)' }}>recommendations</div>
          <div className="space-y-3">
            <RecCard icon={Activity} label="Move" title="Today's movement" body={phase.move} color={phase.color} />
            <RecCard icon={Coffee} label="Eat" title="Today's nutrition" body={phase.eat} color={phase.color} />
            <RecCard icon={Brain} label="Work" title="Productivity sweet spot" body={phase.work} color={phase.color} />
          </div>
        </div>
      )}

      <div className="px-6 mt-10 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
        Predictions, insights, and recommendations are estimates based on your logged history and well-established cycle science. They are not medical advice.
      </div>
    </div>
  );
}

function EmptyHero({ onLog }) {
  return (
    <div>
      <div className="display text-2xl leading-tight" style={{ fontWeight: 400 }}>Welcome.</div>
      <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--muted)' }}>Log your most recent period to begin. Bloom learns your patterns over time and gives you genuinely personalized insights — not generic advice.</p>
      <button onClick={onLog} className="mt-5 px-5 py-3 rounded-full text-sm tracking-wide inline-flex items-center gap-2" style={{ background: 'var(--ink)', color: 'var(--bg)' }}>
        <Plus size={16} /> Log first period
      </button>
    </div>
  );
}

function SymptomSummary({ s }) {
  const flow = FLOW_LEVELS.find(f => f.id === s.flow);
  const mood = MOODS.find(m => m.id === s.mood);
  return (
    <div className="space-y-2 text-sm">
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {flow && <span><span style={{ color: 'var(--muted)' }}>flow </span>{flow.label}</span>}
        {mood && <span><span style={{ color: 'var(--muted)' }}>mood </span>{mood.label}</span>}
        {s.energy && <span><span style={{ color: 'var(--muted)' }}>energy </span>{ENERGY_LEVELS[s.energy - 1]}</span>}
        {s.sleepHours != null && <span><span style={{ color: 'var(--muted)' }}>sleep </span>{s.sleepHours}h</span>}
      </div>
      {(s.tags?.length > 0 || s.moodTags?.length > 0) && (
        <div className="flex flex-wrap gap-1">
          {[...(s.moodTags || []), ...(s.tags || [])].map(t => (
            <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--muted)' }}>{t}</span>
          ))}
        </div>
      )}
      {s.notes && <div className="text-sm italic display" style={{ fontWeight: 400 }}>"{s.notes}"</div>}
    </div>
  );
}

function InsightCard({ insight }) {
  const iconMap = { sparkles: Sparkles, brain: Brain, alert: AlertCircle, check: CheckCircle2, sun: Sun, moon: Moon };
  const Icon = iconMap[insight.icon] || Sparkles;
  const tone = insight.kind === 'flag' ? 'var(--warning)' : insight.kind === 'positive' ? 'var(--accent)' : 'var(--ink)';
  return (
    <div className="rounded-2xl p-4 flex gap-3" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--bg)', color: tone }}><Icon size={15} /></div>
      <div className="flex-1">
        <div className="display text-sm" style={{ fontWeight: 500 }}>{insight.title}</div>
        <div className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>{insight.body}</div>
      </div>
    </div>
  );
}

function RecCard({ icon: Icon, label, title, body, color }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={13} style={{ color }} />
        <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: 'var(--muted)' }}>{label}</span>
      </div>
      <div className="display text-sm mb-1" style={{ fontWeight: 500 }}>{title}</div>
      <div className="text-sm leading-relaxed" style={{ color: 'var(--ink)' }}>{body}</div>
    </div>
  );
}

function CalendarTab({ data, predictions, periodDaysSet, viewMonth, setViewMonth, selectedDay, setSelectedDay, setEditorOpen, sortedCycles, updateCycle, deleteCycle }) {
  const calendarDays = useMemo(() => {
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewMonth]);

  const todayKey = toKey(today());
  const selectedSymptom = data.symptoms[selectedDay];

  return (
    <div className="max-w-md mx-auto">
      <div className="px-6 pt-12 pb-2 fade-up">
        <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--muted)' }}>calendar</div>
        <h1 className="display text-3xl mt-1" style={{ fontWeight: 400 }}>Your year</h1>
      </div>

      <div className="px-6 mt-6 fade-up" style={{ animationDelay: '60ms' }}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))} className="p-2 rounded-full" style={{ color: 'var(--muted)' }}><ChevronLeft size={18} /></button>
          <div className="display text-xl">{fmtMonth(viewMonth)}</div>
          <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))} className="p-2 rounded-full" style={{ color: 'var(--muted)' }}><ChevronRight size={18} /></button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="text-center text-[10px] uppercase tracking-widest py-1" style={{ color: 'var(--muted)' }}>{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((d, i) => {
            if (!d) return <div key={i} className="aspect-square" />;
            const k = toKey(d);
            const isPeriod = periodDaysSet.has(k);
            const isPredictedPeriod = predictions?.period?.includes(k) && !isPeriod;
            const isFertile = predictions?.fertile?.includes(k) && !isPeriod && !isPredictedPeriod;
            const isOvulation = predictions?.ovulation === k && !isPeriod;
            const isToday = k === todayKey;
            const isSelected = k === selectedDay;
            const hasSymptom = !!data.symptoms[k];
            const hasBBT = !!data.bbt?.[k];
            const lh = data.lhTests?.[k];

            let bg = 'transparent', color = 'var(--ink)', borderStyle = 'none';
            if (isPeriod) { bg = 'var(--primary)'; color = 'var(--card)'; }
            else if (isPredictedPeriod) { borderStyle = '1.5px dashed var(--primary)'; color = 'var(--primary)'; }
            else if (isFertile) { bg = 'var(--accent-soft)'; }

            return (
              <button key={i} onClick={() => setSelectedDay(k)} className="day-cell aspect-square rounded-full flex items-center justify-center relative" style={{ background: bg, color, border: isSelected ? '1.5px solid var(--ink)' : borderStyle, fontFamily: 'var(--display)', fontSize: '0.95rem', fontWeight: isToday ? 600 : 400 }}>
                <span style={{ textDecoration: isToday && !isPeriod ? 'underline' : 'none', textUnderlineOffset: '3px' }}>{d.getDate()}</span>
                {isOvulation && <span className="absolute" style={{ top: 3, right: 3, width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)' }} />}
                {(hasSymptom || hasBBT || lh) && !isPeriod && <span className="absolute" style={{ bottom: 3, width: 4, height: 4, borderRadius: '50%', background: 'var(--muted)' }} />}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3 mt-4 text-[11px]" style={{ color: 'var(--muted)' }}>
          <Legend swatch={<span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: 'var(--primary)' }} />} label="period" />
          <Legend swatch={<span className="inline-block w-2.5 h-2.5 rounded-full" style={{ border: '1.5px dashed var(--primary)' }} />} label="predicted" />
          <Legend swatch={<span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: 'var(--accent-soft)' }} />} label="fertile" />
          <Legend swatch={<span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />} label="ovulation" />
        </div>
      </div>

      <div className="px-6 mt-8 fade-up" style={{ animationDelay: '120ms' }}>
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--muted)' }}>selected</div>
            <div className="display text-lg mt-1">{fmtLong(fromKey(selectedDay))}</div>
          </div>
          <button onClick={() => setEditorOpen(true)} className="text-xs inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'var(--ink)', color: 'var(--bg)' }}><Edit3 size={11} /> {selectedSymptom ? 'Edit' : 'Log'}</button>
        </div>
        <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
          {selectedSymptom ? <SymptomSummary s={selectedSymptom} /> : <div className="text-sm" style={{ color: 'var(--muted)' }}>Nothing logged. Tap Log to record flow, mood, energy, or symptoms.</div>}
        </div>
      </div>

      {sortedCycles.length > 0 && (
        <div className="px-6 mt-8 fade-up" style={{ animationDelay: '180ms' }}>
          <div className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: 'var(--muted)' }}>history</div>
          <div className="rounded-2xl divide-y" style={{ background: 'var(--card)', border: '1px solid var(--line)', borderColor: 'var(--line)' }}>
            {[...sortedCycles].reverse().map(c => <CycleRow key={c.id} cycle={c} onUpdate={(p) => updateCycle(c.id, p)} onDelete={() => deleteCycle(c.id)} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function Legend({ swatch, label }) { return <div className="flex items-center gap-1.5">{swatch} {label}</div>; }

function CycleRow({ cycle, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [endValue, setEndValue] = useState(cycle.end || '');
  const start = fromKey(cycle.start);
  const len = cycle.end ? daysBetween(cycle.start, cycle.end) + 1 : null;
  return (
    <div className="p-4 flex items-center justify-between">
      <div>
        <div className="display text-sm">{fmtShort(start)}{cycle.end ? ` – ${fmtShort(fromKey(cycle.end))}` : ''}</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{len ? `${len} day${len === 1 ? '' : 's'}` : 'in progress · tap to set end date'}</div>
      </div>
      <div className="flex items-center gap-1">
        {editing ? (<>
          <input type="date" value={endValue} min={cycle.start} onChange={(e) => setEndValue(e.target.value)} className="text-xs px-2 py-1 rounded" style={{ border: '1px solid var(--line)', background: 'var(--bg)' }} />
          <button onClick={() => { if (endValue) onUpdate({ end: endValue }); setEditing(false); }} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--ink)', color: 'var(--bg)' }}>save</button>
        </>) : (<>
          <button onClick={() => setEditing(true)} className="p-2" style={{ color: 'var(--muted)' }}><Edit3 size={13} /></button>
          <button onClick={onDelete} className="p-2" style={{ color: 'var(--muted)' }}><Trash2 size={13} /></button>
        </>)}
      </div>
    </div>
  );
}

function InsightsView({ data, stats, sortedCycles, insights }) {
  const variance = stats.cycleLengths.length > 1 ? Math.max(...stats.cycleLengths) - Math.min(...stats.cycleLengths) : 0;
  const regularityScore = stats.cycleLengths.length === 0 ? null : Math.max(0, 100 - Math.round(stats.regularity * 8));
  const symptomCounts = useMemo(() => {
    const counts = {};
    Object.values(data.symptoms).forEach(s => (s.tags || []).forEach(t => counts[t] = (counts[t] || 0) + 1));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [data.symptoms]);

  return (
    <div className="max-w-md mx-auto">
      <div className="px-6 pt-12 pb-2 fade-up">
        <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--muted)' }}>your patterns</div>
        <h1 className="display text-3xl mt-1" style={{ fontWeight: 400 }}>Insights</h1>
      </div>

      {sortedCycles.length === 0 ? (
        <div className="px-6 mt-8 fade-up">
          <div className="rounded-2xl p-6 text-center" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
            <div className="display text-lg mb-2">No data yet</div>
            <div className="text-sm" style={{ color: 'var(--muted)' }}>Log a cycle or two and your personal insights will appear here.</div>
          </div>
        </div>
      ) : (<>
        <div className="px-6 mt-6 fade-up" style={{ animationDelay: '60ms' }}>
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Avg cycle" value={stats.avgCycle} unit="days" />
            <StatCard label="Avg period" value={stats.avgPeriod} unit="days" />
            <StatCard label="Logged" value={stats.totalLogged} unit={stats.totalLogged === 1 ? 'cycle' : 'cycles'} />
          </div>
        </div>

        {regularityScore != null && stats.cycleLengths.length >= 2 && (
          <div className="px-6 mt-6 fade-up" style={{ animationDelay: '120ms' }}>
            <div className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: 'var(--muted)' }}>regularity</div>
            <div className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
              <div className="flex items-baseline justify-between mb-3">
                <div className="display text-3xl" style={{ fontWeight: 400 }}>{regularityScore}<span className="text-base" style={{ color: 'var(--muted)' }}>/100</span></div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>variance: {variance} day{variance === 1 ? '' : 's'}</div>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg)' }}>
                <div className="h-full rounded-full" style={{ width: `${regularityScore}%`, background: regularityScore > 70 ? 'var(--accent)' : regularityScore > 40 ? 'var(--warning)' : 'var(--primary)' }} />
              </div>
              <div className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--muted)' }}>
                {regularityScore > 70 ? 'Your cycles are highly consistent — a sign of stable hormonal patterns.' : regularityScore > 40 ? 'Some variation across cycles, which is common. Watch for trends.' : 'Significant variation detected. Worth tracking factors like stress, sleep, and weight changes.'}
              </div>
            </div>
          </div>
        )}

        {stats.cycleLengths.length >= 2 && (
          <div className="px-6 mt-6 fade-up" style={{ animationDelay: '180ms' }}>
            <div className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: 'var(--muted)' }}>cycle lengths</div>
            <div className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}><CycleChart lengths={stats.cycleLengths} /></div>
          </div>
        )}

        {symptomCounts.length > 0 && (
          <div className="px-6 mt-6 fade-up" style={{ animationDelay: '240ms' }}>
            <div className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: 'var(--muted)' }}>most-logged symptoms</div>
            <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
              {symptomCounts.map(([name, count]) => (
                <div key={name} className="flex items-center gap-3">
                  <div className="text-sm capitalize flex-shrink-0 w-28">{name}</div>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg)' }}>
                    <div className="h-full rounded-full" style={{ width: `${(count / symptomCounts[0][1]) * 100}%`, background: 'var(--primary-soft)' }} />
                  </div>
                  <div className="text-xs num" style={{ color: 'var(--muted)' }}>{count}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {insights.length > 0 && (
          <div className="px-6 mt-6 fade-up" style={{ animationDelay: '300ms' }}>
            <div className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: 'var(--muted)' }}>personalized insights</div>
            <div className="space-y-3">{insights.map((ins, i) => <InsightCard key={i} insight={ins} />)}</div>
          </div>
        )}
      </>)}

      <div className="px-6 mt-10 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>Bloom looks for patterns in your data and surfaces them in plain language. Insights are not a substitute for clinical evaluation.</div>
    </div>
  );
}

function StatCard({ label, value, unit }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
      <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>{label}</div>
      <div className="display text-3xl mt-2" style={{ fontWeight: 400 }}>{value}</div>
      <div className="text-xs" style={{ color: 'var(--muted)' }}>{unit}</div>
    </div>
  );
}

function CycleChart({ lengths }) {
  const max = Math.max(...lengths, 35);
  const min = Math.max(0, Math.min(...lengths) - 3);
  const range = max - min || 1;
  const w = 280, h = 100, pad = 12;
  const points = lengths.map((l, i) => {
    const x = pad + (i / (lengths.length - 1 || 1)) * (w - pad * 2);
    const y = h - pad - ((l - min) / range) * (h - pad * 2);
    return [x, y, l];
  });
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 'auto' }}>
        <line x1={pad} y1={h - pad - ((28 - min) / range) * (h - pad * 2)} x2={w - pad} y2={h - pad - ((28 - min) / range) * (h - pad * 2)} stroke="var(--line)" strokeDasharray="3 3" strokeWidth="1" />
        <path d={path} fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="var(--card)" stroke="var(--primary)" strokeWidth="1.5" />)}
      </svg>
      <div className="flex justify-between mt-1 text-[10px]" style={{ color: 'var(--muted)' }}>
        <span>{lengths.length} cycles</span>
        <span>range {Math.min(...lengths)}–{Math.max(...lengths)} days</span>
      </div>
    </div>
  );
}

function LearnView({ currentPhase }) {
  const [expanded, setExpanded] = useState(currentPhase || 'menstrual');
  const [checkOpen, setCheckOpen] = useState(false);
  return (
    <div className="max-w-md mx-auto">
      <div className="px-6 pt-12 pb-2 fade-up">
        <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--muted)' }}>understand your body</div>
        <h1 className="display text-3xl mt-1" style={{ fontWeight: 400 }}>Learn</h1>
      </div>

      <div className="px-6 mt-6 fade-up" style={{ animationDelay: '60ms' }}>
        <button onClick={() => setCheckOpen(true)} className="w-full rounded-2xl p-5 text-left flex items-center justify-between" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
          <div>
            <div className="display text-base" style={{ fontWeight: 500 }}>Is this normal?</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Quick checker for common symptoms</div>
          </div>
          <ArrowRight size={16} style={{ color: 'var(--muted)' }} />
        </button>
      </div>

      <div className="px-6 mt-6 fade-up" style={{ animationDelay: '120ms' }}>
        <div className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: 'var(--muted)' }}>the four phases</div>
        <div className="space-y-3">
          {Object.entries(PHASES).map(([key, phase]) => (
            <PhaseAccordion key={key} phase={phase} isCurrent={currentPhase === key} isExpanded={expanded === key} onToggle={() => setExpanded(expanded === key ? null : key)} />
          ))}
        </div>
      </div>

      <div className="px-6 mt-8 fade-up" style={{ animationDelay: '180ms' }}>
        <div className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: 'var(--muted)' }}>meet your hormones</div>
        <div className="space-y-3">
          <HormoneCard name="Estrogen" color="var(--accent)" arc="Rises through follicular phase, peaks just before ovulation, dips, then has a smaller second peak in mid-luteal." does="Builds the uterine lining. Boosts serotonin (mood lift), collagen (skin glow), and verbal fluency." />
          <HormoneCard name="Progesterone" color="var(--warning)" arc="Low until after ovulation, then rises sharply through the luteal phase, dropping if no pregnancy occurs." does="Maintains uterine lining. Calming and slightly sedating. Raises body temperature ~0.3°C. Slows digestion." />
          <HormoneCard name="LH (Luteinizing)" color="var(--primary)" arc="Surges for 24–36 hours mid-cycle. The surge is what triggers ovulation." does="Causes the mature follicle to release the egg. LH tests detect this surge to predict ovulation." />
          <HormoneCard name="FSH (Follicle-stimulating)" color="#7A5A8C" arc="Rises in early follicular phase, then drops as estrogen rises." does="Stimulates the ovaries to develop follicles. The ovary that grows the dominant follicle ovulates that month." />
        </div>
      </div>

      <div className="px-6 mt-8 fade-up" style={{ animationDelay: '240ms' }}>
        <div className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: 'var(--muted)' }}>common questions</div>
        <div className="rounded-2xl divide-y overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--line)', borderColor: 'var(--line)' }}>
          <FaqItem q="Is a 28-day cycle normal?" a="Anywhere from 21 to 35 days is considered normal for adults. Cycles shift with age, stress, sleep, weight, and major life events. Your normal is what's normal for you over time." />
          <FaqItem q="What does my discharge tell me?" a="Cervical mucus changes through the cycle: dry/sticky in early follicular, creamy mid-cycle, watery before ovulation, and stretchy egg-white at peak fertility. After ovulation it returns to thicker, drier." />
          <FaqItem q="Why does my mood shift before my period?" a="In the late luteal phase, estrogen and progesterone both drop sharply. Estrogen affects serotonin, so the drop can mean mood dips, irritability, or anxiety for a few days. It's biological, not a personal failure." />
          <FaqItem q="When should I see a doctor?" a="Cycles consistently shorter than 21 or longer than 35 days, missed periods (not pregnancy-related), severe pain that disrupts your life, very heavy bleeding (soaking a pad/tampon hourly), or sudden major changes are all worth a check-up." />
          <FaqItem q="Can I trust ovulation predictions?" a="App predictions are estimates based on your cycle history. For higher confidence, layer in BBT (rises after ovulation) and LH tests (positive ~24–36h before ovulation). The fertile window is roughly 6 days: 5 before ovulation through ovulation day." />
        </div>
      </div>

      <div className="px-6 mt-10 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>Information here is grounded in established reproductive endocrinology. It is educational and not a substitute for personalized medical advice.</div>

      {checkOpen && <SymptomCheckerModal onClose={() => setCheckOpen(false)} />}
    </div>
  );
}

function PhaseAccordion({ phase, isCurrent, isExpanded, onToggle }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
      <button onClick={onToggle} className="w-full p-5 text-left flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-10 rounded-full" style={{ background: phase.color }} />
          <div>
            <div className="display text-base flex items-center gap-2" style={{ fontWeight: 500 }}>
              {phase.name}
              {isCurrent && <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: phase.color, color: '#fff' }}>now</span>}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{phase.short}</div>
          </div>
        </div>
        <ChevronDown size={16} style={{ color: 'var(--muted)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {isExpanded && (
        <div className="px-5 pb-5 space-y-3 border-t" style={{ borderColor: 'var(--line)', paddingTop: '1rem' }}>
          <PhaseSection label="What's happening" body={phase.overview} />
          <PhaseSection label="How it feels" body={phase.feels} />
          <PhaseSection label="Hormonally" body={phase.hormones} />
          <PhaseSection label="Eat" body={phase.eat} />
          <PhaseSection label="Move" body={phase.move} />
          <PhaseSection label="Work" body={phase.work} />
          <PhaseSection label="Watch out for" body={phase.avoid} />
        </div>
      )}
    </div>
  );
}

function PhaseSection({ label, body }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.25em] mb-1" style={{ color: 'var(--muted)' }}>{label}</div>
      <div className="text-sm leading-relaxed">{body}</div>
    </div>
  );
}

function HormoneCard({ name, arc, does, color }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
        <div className="display text-base" style={{ fontWeight: 500 }}>{name}</div>
      </div>
      <div className="text-sm leading-relaxed mb-2"><span style={{ color: 'var(--muted)' }}>Arc: </span>{arc}</div>
      <div className="text-sm leading-relaxed"><span style={{ color: 'var(--muted)' }}>Job: </span>{does}</div>
    </div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="w-full p-4 text-left flex items-center justify-between">
        <span className="text-sm" style={{ fontWeight: 500 }}>{q}</span>
        <ChevronDown size={14} style={{ color: 'var(--muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && <div className="px-4 pb-4 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{a}</div>}
    </div>
  );
}

const SYMPTOM_CHECK = [
  { s: 'Cramps so painful I miss work or school', severity: 'flag', msg: 'Severe pain that disrupts daily life can indicate endometriosis, adenomyosis, or fibroids. Worth a clinical evaluation — period pain is common but disabling pain is not "just normal."' },
  { s: 'Mild to moderate cramps for 1–3 days', severity: 'normal', msg: 'Common and typically caused by prostaglandins. Heat, ibuprofen, magnesium, and gentle movement help. Talk to a doctor if intensity has changed recently.' },
  { s: 'Bleeding heavily — soaking a pad/tampon every hour', severity: 'flag', msg: 'This is heavier than typical and can lead to anemia. Worth a clinical visit, especially if it\'s a new pattern.' },
  { s: 'Spotting between periods', severity: 'caution', msg: 'Light spotting around ovulation can be normal. Spotting at other times, especially regularly, is worth mentioning to a clinician.' },
  { s: 'Cycle longer than 35 days or shorter than 21 days', severity: 'caution', msg: 'Outside the typical range. Occasional outliers happen with stress, but a consistent pattern is worth investigating (PCOS, thyroid, perimenopause are common reasons).' },
  { s: 'Missed period (and not pregnant)', severity: 'caution', msg: 'Stress, weight change, intense exercise, illness, and hormonal shifts can all cause this. One missed period is usually not concerning. Multiple is worth a check.' },
  { s: 'Severe mood changes that affect relationships or work', severity: 'flag', msg: 'PMDD (premenstrual dysphoric disorder) affects ~3–8% of menstruating people and is treatable. If mood symptoms feel disabling, please talk to someone — a GP or therapist familiar with PMDD.' },
  { s: 'Mild PMS symptoms in the week before period', severity: 'normal', msg: 'Common. Estrogen and progesterone drop sharply pre-period, which affects mood, sleep, and water retention. Magnesium, B6, regular sleep, and gentle movement help most people.' },
];

function SymptomCheckerModal({ onClose }) {
  const [selected, setSelected] = useState(null);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: 'rgba(43,31,23,0.4)' }} onClick={onClose}>
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[88vh] overflow-y-auto" style={{ background: 'var(--bg)', border: '1px solid var(--line)' }} onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--muted)' }}>checker</div>
              <div className="display text-2xl mt-1">Is this normal?</div>
            </div>
            <button onClick={onClose} style={{ color: 'var(--muted)' }}><X size={20} /></button>
          </div>

          {!selected ? (
            <div className="space-y-2">
              <div className="text-sm mb-3" style={{ color: 'var(--muted)' }}>Tap whichever feels closest to what you're experiencing.</div>
              {SYMPTOM_CHECK.map((item, i) => (
                <button key={i} onClick={() => setSelected(item)} className="w-full text-left p-3 rounded-xl text-sm" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>{item.s}</button>
              ))}
            </div>
          ) : (
            <div>
              <div className="rounded-2xl p-5 mb-4" style={{ background: selected.severity === 'flag' ? '#FBE5E5' : selected.severity === 'caution' ? '#FBF1DC' : '#E8EFE0', border: `1px solid ${selected.severity === 'flag' ? 'var(--primary)' : selected.severity === 'caution' ? 'var(--warning)' : 'var(--accent)'}` }}>
                <div className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: 'var(--muted)' }}>{selected.severity === 'flag' ? 'worth checking' : selected.severity === 'caution' ? 'monitor' : 'common'}</div>
                <div className="display text-base mb-3" style={{ fontWeight: 500 }}>{selected.s}</div>
                <div className="text-sm leading-relaxed">{selected.msg}</div>
              </div>
              <button onClick={() => setSelected(null)} className="w-full py-3 rounded-full text-sm" style={{ background: 'var(--ink)', color: 'var(--bg)' }}>Check another</button>
            </div>
          )}

          <div className="text-xs leading-relaxed mt-5" style={{ color: 'var(--muted)' }}>This is general guidance, not a diagnosis. When in doubt, talk to a clinician who knows your history.</div>
        </div>
      </div>
    </div>
  );
}

function SymptomEditor({ dateKey, value, mode, customSymptoms, onAddCustom, onRemoveCustom, onClose, onSave, onClear }) {
  const [flow, setFlow] = useState(value?.flow || null);
  const [mood, setMood] = useState(value?.mood || null);
  const [moodTags, setMoodTags] = useState(value?.moodTags || []);
  const [tags, setTags] = useState(value?.tags || []);
  const [energy, setEnergy] = useState(value?.energy || null);
  const [sleepHours, setSleepHours] = useState(value?.sleepHours ?? '');
  const [sleepQuality, setSleepQuality] = useState(value?.sleepQuality || null);
  const [stress, setStress] = useState(value?.stress || null);
  const [discharge, setDischarge] = useState(value?.discharge || null);
  const [notes, setNotes] = useState(value?.notes || '');
  const [showCustom, setShowCustom] = useState(false);
  const [newCustom, setNewCustom] = useState('');
  const advanced = mode === 'advanced';
  const toggle = (arr, set, t) => set(arr.includes(t) ? arr.filter(x => x !== t) : [...arr, t]);
  const allSymptoms = [...SYMPTOM_TAGS, ...customSymptoms];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: 'rgba(43,31,23,0.4)' }} onClick={onClose}>
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto" style={{ background: 'var(--bg)', border: '1px solid var(--line)' }} onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--muted)' }}>logging</div>
              <div className="display text-xl mt-1">{fmtLong(fromKey(dateKey))}</div>
            </div>
            <button onClick={onClose} className="p-1" style={{ color: 'var(--muted)' }}><X size={20} /></button>
          </div>

          <Section label="Flow">
            <div className="flex gap-2 flex-wrap">
              {FLOW_LEVELS.map(f => (
                <Chip key={f.id} active={flow === f.id} onClick={() => setFlow(flow === f.id ? null : f.id)}>
                  <span className="flex items-center gap-1.5">{f.label}<span className="flex gap-0.5">{Array.from({ length: f.dots }).map((_, i) => <Droplet key={i} size={9} fill="currentColor" stroke="none" />)}</span></span>
                </Chip>
              ))}
            </div>
          </Section>

          <Section label="Mood">
            <div className="flex gap-2 flex-wrap mb-3">
              {MOODS.map(m => <Chip key={m.id} active={mood === m.id} onClick={() => setMood(mood === m.id ? null : m.id)}>{m.label}</Chip>)}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {MOOD_TAGS.map(t => <Chip key={t} small active={moodTags.includes(t)} onClick={() => toggle(moodTags, setMoodTags, t)}>{t}</Chip>)}
            </div>
          </Section>

          <Section label="Physical symptoms">
            <div className="flex gap-1.5 flex-wrap">
              {allSymptoms.map(t => (
                <Chip key={t} small active={tags.includes(t)} onClick={() => toggle(tags, setTags, t)}>
                  {t}
                  {customSymptoms.includes(t) && <span onClick={(e) => { e.stopPropagation(); onRemoveCustom(t); }} className="ml-1.5 opacity-50">×</span>}
                </Chip>
              ))}
              <Chip small onClick={() => setShowCustom(!showCustom)}>+ add</Chip>
            </div>
            {showCustom && (
              <div className="mt-3 flex gap-2">
                <input value={newCustom} onChange={(e) => setNewCustom(e.target.value)} placeholder="e.g. jaw tension" className="flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--card)', border: '1px solid var(--line)' }} />
                <button onClick={() => { if (newCustom.trim()) { onAddCustom(newCustom.trim()); setNewCustom(''); setShowCustom(false); } }} className="px-3 py-2 rounded-xl text-sm" style={{ background: 'var(--ink)', color: 'var(--bg)' }}>Add</button>
              </div>
            )}
          </Section>

          {advanced && (<>
            <Section label="Energy">
              <div className="flex gap-2 flex-wrap">
                {ENERGY_LEVELS.map((e, i) => <Chip key={e} active={energy === i + 1} onClick={() => setEnergy(energy === i + 1 ? null : i + 1)}>{e}</Chip>)}
              </div>
            </Section>

            <Section label="Sleep">
              <div className="flex gap-2 items-center">
                <input type="number" step="0.5" min="0" max="24" value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} placeholder="hours" className="w-24 rounded-xl px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--card)', border: '1px solid var(--line)' }} />
                <div className="flex gap-1.5 flex-wrap">
                  {['poor', 'okay', 'great'].map((q, i) => <Chip small key={q} active={sleepQuality === i + 1} onClick={() => setSleepQuality(sleepQuality === i + 1 ? null : i + 1)}>{q}</Chip>)}
                </div>
              </div>
            </Section>

            <Section label="Stress">
              <div className="flex gap-2 flex-wrap">
                {STRESS_LEVELS.map((s, i) => <Chip key={s} active={stress === i + 1} onClick={() => setStress(stress === i + 1 ? null : i + 1)}>{s}</Chip>)}
              </div>
            </Section>

            <Section label="Discharge">
              <div className="flex gap-2 flex-wrap">
                {DISCHARGE_TYPES.map(d => <Chip key={d.id} active={discharge === d.id} onClick={() => setDischarge(discharge === d.id ? null : d.id)}>{d.label}</Chip>)}
              </div>
            </Section>
          </>)}

          <Section label="Notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="anything else worth remembering..." rows={3} className="w-full rounded-xl p-3 text-sm resize-none focus:outline-none" style={{ background: 'var(--card)', border: '1px solid var(--line)' }} />
          </Section>

          <div className="flex gap-2 mt-2">
            <button onClick={() => onSave({ flow, mood, moodTags, tags, energy, sleepHours: sleepHours === '' ? null : Number(sleepHours), sleepQuality, stress, discharge, notes })} className="flex-1 py-3 rounded-full text-sm tracking-wide" style={{ background: 'var(--ink)', color: 'var(--bg)' }}>Save</button>
            {value && <button onClick={onClear} className="px-4 py-3 rounded-full text-sm" style={{ background: 'transparent', color: 'var(--muted)', border: '1px solid var(--line)' }}>Clear</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function LogPeriodModal({ onClose, onLog }) {
  const [start, setStart] = useState(toKey(today()));
  const [end, setEnd] = useState('');
  const [hasEnded, setHasEnded] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: 'rgba(43,31,23,0.4)' }} onClick={onClose}>
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl" style={{ background: 'var(--bg)', border: '1px solid var(--line)' }} onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--muted)' }}>new entry</div>
              <div className="display text-xl mt-1">Log a period</div>
            </div>
            <button onClick={onClose} className="p-1" style={{ color: 'var(--muted)' }}><X size={20} /></button>
          </div>

          <Section label="Start date">
            <input type="date" value={start} max={toKey(today())} onChange={(e) => setStart(e.target.value)} className="w-full rounded-xl p-3 text-sm focus:outline-none" style={{ background: 'var(--card)', border: '1px solid var(--line)' }} />
          </Section>

          <Section label="Has it ended?">
            <div className="flex gap-2">
              <Chip active={!hasEnded} onClick={() => setHasEnded(false)}>Still ongoing</Chip>
              <Chip active={hasEnded} onClick={() => setHasEnded(true)}>Yes, ended</Chip>
            </div>
            {hasEnded && <input type="date" value={end} min={start} max={toKey(today())} onChange={(e) => setEnd(e.target.value)} className="w-full rounded-xl p-3 text-sm focus:outline-none mt-3" style={{ background: 'var(--card)', border: '1px solid var(--line)' }} />}
          </Section>

          <button onClick={() => onLog(start, hasEnded && end ? end : null)} disabled={!start || (hasEnded && !end)} className="w-full py-3 rounded-full text-sm tracking-wide mt-2" style={{ background: 'var(--ink)', color: 'var(--bg)', opacity: (!start || (hasEnded && !end)) ? 0.4 : 1 }}>Save period</button>
        </div>
      </div>
    </div>
  );
}

function BBTModal({ data, onClose, onSave, onSaveLH }) {
  const [day, setDay] = useState(toKey(today()));
  const [temp, setTemp] = useState(data.bbt?.[day] || '');
  const [lh, setLh] = useState(data.lhTests?.[day] || '');
  useEffect(() => { setTemp(data.bbt?.[day] || ''); setLh(data.lhTests?.[day] || ''); }, [day]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: 'rgba(43,31,23,0.4)' }} onClick={onClose}>
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl" style={{ background: 'var(--bg)', border: '1px solid var(--line)' }} onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--muted)' }}>fertility tracking</div>
              <div className="display text-xl mt-1">BBT & LH tests</div>
            </div>
            <button onClick={onClose} className="p-1" style={{ color: 'var(--muted)' }}><X size={20} /></button>
          </div>

          <Section label="Date"><input type="date" value={day} max={toKey(today())} onChange={(e) => setDay(e.target.value)} className="w-full rounded-xl p-3 text-sm focus:outline-none" style={{ background: 'var(--card)', border: '1px solid var(--line)' }} /></Section>

          <Section label="Basal body temperature (°F)">
            <input type="number" step="0.01" min="95" max="100" placeholder="e.g. 97.4" value={temp} onChange={(e) => setTemp(e.target.value)} className="w-full rounded-xl p-3 text-sm focus:outline-none" style={{ background: 'var(--card)', border: '1px solid var(--line)' }} />
            <div className="text-xs mt-2" style={{ color: 'var(--muted)' }}>Take first thing in the morning before getting out of bed.</div>
          </Section>

          <Section label="LH test">
            <div className="flex gap-2">
              <Chip active={lh === 'negative'} onClick={() => setLh(lh === 'negative' ? '' : 'negative')}>Negative</Chip>
              <Chip active={lh === 'positive'} onClick={() => setLh(lh === 'positive' ? '' : 'positive')}>Positive</Chip>
            </div>
            <div className="text-xs mt-2" style={{ color: 'var(--muted)' }}>A positive LH test means ovulation is likely in the next 24–36 hours.</div>
          </Section>

          <button onClick={() => { onSave(day, temp ? Number(temp) : null); onSaveLH(day, lh || null); onClose(); }} className="w-full py-3 rounded-full text-sm tracking-wide mt-2" style={{ background: 'var(--ink)', color: 'var(--bg)' }}>Save</button>
        </div>
      </div>
    </div>
  );
}

function MoreModal({ data, onClose, onUpdateSettings, onOpenBBT, onExport, onWipe }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: 'rgba(43,31,23,0.4)' }} onClick={onClose}>
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[88vh] overflow-y-auto" style={{ background: 'var(--bg)', border: '1px solid var(--line)' }} onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--muted)' }}>more</div>
              <div className="display text-xl mt-1">Settings & tools</div>
            </div>
            <button onClick={onClose} className="p-1" style={{ color: 'var(--muted)' }}><X size={20} /></button>
          </div>

          <Section label="Mode">
            <div className="flex gap-2">
              <Chip active={data.settings.mode === 'simple'} onClick={() => onUpdateSettings({ mode: 'simple' })}>Simple</Chip>
              <Chip active={data.settings.mode === 'advanced'} onClick={() => onUpdateSettings({ mode: 'advanced' })}>Advanced</Chip>
            </div>
            <div className="text-xs mt-2" style={{ color: 'var(--muted)' }}>Simple mode shows flow, mood, and symptoms. Advanced adds energy, sleep, stress, and discharge.</div>
          </Section>

          <Section label="Pregnancy mode">
            <div className="flex gap-2">
              <Chip active={!data.settings.pregnancyMode} onClick={() => onUpdateSettings({ pregnancyMode: false })}>Off</Chip>
              <Chip active={data.settings.pregnancyMode} onClick={() => onUpdateSettings({ pregnancyMode: true })}>On</Chip>
            </div>
            <div className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--muted)' }}>When on, period predictions pause and the focus shifts to weekly milestones. Toggle off if not relevant.</div>
          </Section>

          <Section label="Fertility tracking">
            <button onClick={onOpenBBT} className="w-full text-left rounded-xl p-3 flex items-center justify-between" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
              <div className="flex items-center gap-3">
                <Thermometer size={16} style={{ color: 'var(--muted)' }} />
                <div>
                  <div className="text-sm" style={{ fontWeight: 500 }}>Log BBT & LH</div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>Confirm ovulation with temperature & test data</div>
                </div>
              </div>
              <ArrowRight size={14} style={{ color: 'var(--muted)' }} />
            </button>
          </Section>

          <Section label="Privacy">
            <div className="rounded-xl p-4 text-sm leading-relaxed" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Lock size={13} style={{ color: 'var(--accent)' }} />
                <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: 'var(--muted)' }}>your data</span>
              </div>
              <div style={{ color: 'var(--ink)' }}>Stored privately to your account. Never sold, never shared with third parties. You can export or wipe all data below.</div>
            </div>
          </Section>

          <Section label="Data">
            <div className="space-y-2">
              <button onClick={onExport} className="w-full text-left rounded-xl p-3 text-sm" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>Export all data (JSON)</button>
              <button onClick={onWipe} className="w-full text-left rounded-xl p-3 text-sm" style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)' }}>Delete all data</button>
            </div>
          </Section>

          <div className="text-xs leading-relaxed mt-2" style={{ color: 'var(--muted)' }}>Bloom · v2.0</div>
        </div>
      </div>
    </div>
  );
}

function exportData(data) {
  const blob = new Blob([JSON.stringify({ data, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `bloom-export-${toKey(today())}.json`; a.click();
  URL.revokeObjectURL(url);
}

function Section({ label, children }) {
  return (
    <div className="mb-5">
      <div className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: 'var(--muted)' }}>{label}</div>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children, small }) {
  return (
    <button onClick={onClick} className={`rounded-full transition-all ${small ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-2 text-sm'}`} style={{ background: active ? 'var(--ink)' : 'var(--card)', color: active ? 'var(--bg)' : 'var(--ink)', border: '1px solid', borderColor: active ? 'var(--ink)' : 'var(--line)' }}>{children}</button>
  );
}
