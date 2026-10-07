import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import {
  Package,
  Users,
  Syringe,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  FileCheck,
  Activity,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
  ReferenceLine,
} from "recharts";
import { SmartAlertsInterventions } from "./SmartAlertsInterventions";
import { SmartAnalytics } from "./SmartAnalytics";
import { MedicineIntelligence } from "./MedicineIntelligence";

import { PetSurveyChart } from "./PetSurveyChart";
import { OutbreakHeatmap } from "./OutbreakHeatmap";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";

// ── Custom tooltip components ──────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f1b2d] border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      {label && (
        <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">
          {label}
        </p>
      )}
      {payload.map((p: any, i: number) => (
        <div
          key={i}
          className="flex items-center gap-2 text-sm"
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-slate-300">{p.name}:</span>
          <span className="text-white font-semibold">
            {typeof p.value === "number" &&
            p.name?.includes("₱")
              ? `₱${p.value.toLocaleString()}`
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f1b2d] border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-white font-semibold">
        {payload[0].name}
      </p>
      <p className="text-slate-300 text-sm">
        ₱{payload[0].value.toLocaleString()}
      </p>
    </div>
  );
};

export function DashboardOverview({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [lsData, setLsData] = useState<any[]>([]);
  const [tData, setTData] = useState<any[]>([]);
  const [bData, setBData] = useState<any[]>([]);
  const [budgetPrograms, setBudgetPrograms] = useState<any[]>([]);
  const [petSurvey, setPetSurvey] = useState<any>(null);
  const [dbSummary, setDbSummary] = useState<any>(null);
  const [diseaseAlertsDb, setDiseaseAlertsDb] = useState<any[]>([]);
  const [preRegsDb, setPreRegsDb] = useState<any[]>([]);
  const [petZoneDist, setPetZoneDist] = useState<{ data: any[]; species: string[] }>({ data: [], species: [] });
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getLivestockStats(),
      api.getVaccinationTrends(),
      api.getBudget(),
      api.getPetSurveyData(),
      api.getDashboardSummary().catch(() => null),
      api.getDiseaseAlerts().catch(() => ({ data: [] })),
      api.getPreRegistrations('Pending').catch(() => ({ preRegistrations: [] })),
      api.getDashboardAnimalPopulation().catch(() => null),
      api.getDashboardDiseaseIntel().catch(() => null),
    ]).then(([lsRes, tRes, bRes, psRes, sumRes, daRes, prRes, popRes, diseaseRes]) => {
      // Livestock stats - prefer live aggregated data from new population endpoint
      const liveLS = popRes?.livestockByBarangay?.length > 0 ? popRes.livestockByBarangay : lsRes.data;
      if (liveLS?.length) setLsData(liveLS.map((r: any) => ({
        barangay: (r.barangay || '').replace('Poblacion', 'Pob.').substring(0, 12),
        cattle: parseInt(r.cattle) || 0,
        swine: parseInt(r.swine) || 0,
        poultry: parseInt(r.poultry) || 0,
        goats: parseInt(r.goats) || 0,
      })));
      if (tRes.data?.length) setTData(tRes.data.map((r: any) => ({ month: r.month, vaccination: r.vaccination_rate, diseases: r.diseases })));
      if (bRes.data?.length) setBData(bRes.data.map((r: any) => ({ name: r.category, value: parseFloat(r.amount), color: r.color })));
      if (psRes) setPetSurvey(psRes);
      if (sumRes) setDbSummary(sumRes);
      // Active alerts - prefer disease intel endpoint for livestock events too
      const activeAlerts = [
        ...(diseaseRes?.activeEvents || []).map((e: any) => ({ ...e, disease: e.disease, location: e.barangay, severity: e.status === 'Active' ? 'Critical' : 'Low' })),
        ...(daRes?.data || []).filter((a: any) => a.status === 'Active'),
      ].slice(0, 5);
      setDiseaseAlertsDb(activeAlerts);
      if (prRes?.preRegistrations) setPreRegsDb(prRes.preRegistrations.slice(0, 5));
      // Fetch pet zone distribution
      api.getPetZoneDistribution().catch(() => null).then((zRes: any) => {
        if (zRes?.data?.length) setPetZoneDist({ data: zRes.data, species: zRes.species || [] });
      });
      // Fetch real budget programs
      api.getBudgetPrograms(2025).then((bp: any) => {
        if (bp?.programs?.length) {
          setBudgetPrograms(bp.programs);
          const progData = bp.programs.map((p: any) => ({
            name: p.name.split(' ').slice(0, 2).join(' '),
            value: parseFloat(p.total_allotment) || 0,
            color: p.color || '#2B5EA6',
          }));
          setBData(progData);
        }
      }).catch(() => {});
      setDbReady(true);
    }).catch(e => { console.error(e); setDbReady(true); });
  }, []);

  const livestockData = [
    {
      barangay: "Brgy 1",
      cattle: 120,
      swine: 450,
      poultry: 2300,
      goats: 80,
    },
    {
      barangay: "Brgy 2",
      cattle: 95,
      swine: 380,
      poultry: 1900,
      goats: 60,
    },
    {
      barangay: "Brgy 3",
      cattle: 150,
      swine: 520,
      poultry: 2800,
      goats: 110,
    },
    {
      barangay: "Brgy 4",
      cattle: 85,
      swine: 290,
      poultry: 1600,
      goats: 45,
    },
    {
      barangay: "Brgy 5",
      cattle: 110,
      swine: 410,
      poultry: 2100,
      goats: 70,
    },
  ];

  const trendData = [
    { month: "Jan", vaccination: 85, diseases: 12 },
    { month: "Feb", vaccination: 88, diseases: 8 },
    { month: "Mar", vaccination: 92, diseases: 5 },
    { month: "Apr", vaccination: 90, diseases: 7 },
    { month: "May", vaccination: 94, diseases: 4 },
    { month: "Jun", vaccination: 96, diseases: 3 },
  ];

  const budgetData = [
    { name: "Vaccines", value: 450000, color: "#3b82f6" },
    { name: "Equipment", value: 250000, color: "#10b981" },
    { name: "Training", value: 150000, color: "#f59e0b" },
    { name: "Operations", value: 350000, color: "#ef4444" },
  ];

  // Use DB data if available, else use hardcoded fallbacks
  const effectiveLivestock = lsData.length > 0 ? lsData : livestockData;
  const effectiveTrend = tData.length > 0 ? tData : trendData;
  const effectiveBudget = bData.length > 0 ? bData : budgetData;

  // ── Live stats from DB ────────────────────────────────────────────────────
  const lsTotal       = dbSummary?.livestock?.total ?? 0;
  const petCount      = dbSummary?.pets?.total ?? 0;
  const vaxRate       = dbSummary?.vaccinationRate ?? 0;
  const alertCount    = dbSummary?.activeAlerts ?? 0;
  const pendingApps   = dbSummary?.pendingApplications ?? 0;
  const budgetAmt     = budgetPrograms.length > 0
    ? budgetPrograms.reduce((s: number, p: any) => s + parseFloat(p.total_allotment || 0), 0)
    : (dbSummary?.budgetTotal ?? 0);
  const lowStock      = dbSummary?.lowStock ?? 0;
  const lostFoundOpen = dbSummary?.lostFoundOpen ?? 0;

  const stats = [
    {
      label: "Total Livestock",
      value: dbSummary ? lsTotal.toLocaleString('en-PH') : "—",
      icon: Package,
      gradient: "from-blue-600 to-blue-500",
      change: `${dbSummary?.livestock?.records ?? 0} records`,
      changeType: "neutral",
      sub: "All species · Calaca",
      navigateTo: "livestock",
    },
    {
      label: "Registered Pets",
      value: dbSummary ? petCount.toLocaleString('en-PH') : "—",
      icon: Users,
      gradient: "from-emerald-600 to-emerald-500",
      change: `${dbSummary?.pets?.active ?? 0} active`,
      changeType: "positive",
      sub: "Dogs, cats · all barangays",
      navigateTo: "rabies",
    },
    {
      label: "Vaccination Coverage",
      value: dbSummary ? `${vaxRate}%` : "—",
      icon: Syringe,
      gradient: "from-violet-600 to-violet-500",
      change: vaxRate >= 80 ? "On target" : "Below target",
      changeType: vaxRate >= 80 ? "positive" : "negative",
      sub: "Livestock + pets combined",
      navigateTo: "vaccination",
    },
    {
      label: "Budget Allocated",
      value: budgetAmt > 0 ? `₱${(budgetAmt/1000000).toFixed(1)}M` : "—",
      icon: DollarSign,
      gradient: "from-teal-600 to-cyan-500",
      change: budgetAmt > 0 ? "FY 2025" : "Not set",
      changeType: "neutral",
      sub: "Total allocation",
      navigateTo: "budget",
    },
    {
      label: "Active Disease Alerts",
      value: dbSummary ? String(alertCount) : "—",
      icon: AlertTriangle,
      gradient: alertCount > 0 ? "from-red-600 to-rose-500" : "from-green-600 to-emerald-500",
      change: alertCount > 0 ? "Urgent" : "Clear",
      changeType: alertCount > 0 ? "negative" : "positive",
      sub: "Requires immediate action",
      navigateTo: "outbreak",
    },
    {
      label: "Pending Pre-Registrations",
      value: dbSummary ? String(pendingApps) : "—",
      icon: FileCheck,
      gradient: "from-amber-500 to-yellow-500",
      change: pendingApps > 0 ? "For review" : "All reviewed",
      changeType: pendingApps > 0 ? "neutral" : "positive",
      sub: "Awaiting admin validation",
      navigateTo: "preregistered",
    },
    {
      label: "Lost & Found Open",
      value: dbSummary ? String(lostFoundOpen) : "—",
      icon: Activity,
      gradient: lostFoundOpen > 0 ? "from-orange-500 to-amber-500" : "from-green-600 to-emerald-500",
      change: lostFoundOpen > 0 ? "Open cases" : "All resolved",
      changeType: lostFoundOpen > 0 ? "neutral" : "positive",
      sub: "Active lost/found reports",
      navigateTo: "services",
    },
    {
      label: "Low Stock Alerts",
      value: dbSummary ? String(lowStock) : "—",
      icon: TrendingUp,
      gradient: lowStock > 0 ? "from-red-500 to-orange-500" : "from-indigo-600 to-blue-500",
      change: lowStock > 0 ? "Reorder needed" : "Stock OK",
      changeType: lowStock > 0 ? "negative" : "positive",
      sub: "Medicines + supplies",
      navigateTo: "inventory",
    },
  ];

  const CHART_COLORS = {
    cattle: "#3b82f6",
    swine: "#ef4444",
    poultry: "#10b981",
    goats: "#f59e0b",
  };

  // Zone base colors (matching tag color system)
  const ZONE_COLORS: Record<string, string> = {
    East: '#2B5EA6',
    West: '#8B5CF6',
    North: '#6B7280',
    'Baybay-Highway': '#E85D3B',
  };

  const ZONE_ORDER = ['East', 'West', 'North', 'Baybay-Highway'];

  // Fallback data when DB hasn't loaded yet
  const fallbackZoneDist = [
    { zone: 'East',           Dog: 8,  Cat: 5 },
    { zone: 'West',           Dog: 6,  Cat: 4 },
    { zone: 'North',          Dog: 9,  Cat: 3 },
    { zone: 'Baybay-Highway', Dog: 10, Cat: 6 },
  ];
  const fallbackSpecies = ['Dog', 'Cat'];
  const rawZoneDist   = petZoneDist.data.length > 0 ? petZoneDist.data : fallbackZoneDist;
  const effectiveSpecies = petZoneDist.species.length > 0 ? petZoneDist.species : fallbackSpecies;

  const tabs = [
    {
      value: "overview",
      label: "Overview",
      bg: "#2B5EA6",
      text: "#ffffff",
    },
    {
      value: "alerts",
      label: "Alerts & Interventions",
      bg: "#dc2626",
      text: "#ffffff",
    },
    {
      value: "analytics",
      label: "Smart Analytics",
      bg: "#16a34a",
      text: "#ffffff",
    },
    {
      value: "medicine",
      label: "Medicine Intel",
      bg: "#7c3aed",
      text: "#ffffff",
    },
  ];

  // ── Live disease alerts from DB ────────────────────────────────────────
  const ALERT_STYLES = [
    { borderColor:"#ef4444", bg:"#fef2f2", dotColor:"#ef4444", badgeBg:"#fee2e2", badgeText:"#b91c1c", badgeBorder:"#fca5a5", titleColor:"#7f1d1d", subColor:"#991b1b", timeColor:"#b91c1c", level:"CRITICAL" },
    { borderColor:"#f59e0b", bg:"#fffbeb", dotColor:"#f59e0b", badgeBg:"#fef3c7", badgeText:"#92400e", badgeBorder:"#fcd34d", titleColor:"#451a03", subColor:"#78350f", timeColor:"#92400e", level:"HIGH" },
    { borderColor:"#f97316", bg:"#fff7ed", dotColor:"#f97316", badgeBg:"#ffedd5", badgeText:"#9a3412", badgeBorder:"#fdba74", titleColor:"#431407", subColor:"#7c2d12", timeColor:"#9a3412", level:"WATCH" },
    { borderColor:"#8b5cf6", bg:"#f5f3ff", dotColor:"#8b5cf6", badgeBg:"#ede9fe", badgeText:"#4c1d95", badgeBorder:"#c4b5fd", titleColor:"#2e1065", subColor:"#4c1d95", timeColor:"#6d28d9", level:"MONITOR" },
    { borderColor:"#06b6d4", bg:"#ecfeff", dotColor:"#06b6d4", badgeBg:"#cffafe", badgeText:"#164e63", badgeBorder:"#67e8f9", titleColor:"#083344", subColor:"#155e75", timeColor:"#0e7490", level:"WATCH" },
  ];

  const alertSeverity = diseaseAlertsDb.length > 0
    ? diseaseAlertsDb.map((a: any, i: number) => {
        const style = ALERT_STYLES[i % ALERT_STYLES.length];
        const severityMap: Record<string,string> = { Critical:"CRITICAL", High:"HIGH", Medium:"WATCH", Low:"MONITOR" };
        const reported = new Date(a.reported_date || a.date_reported || a.created_at);
        const diffMs = Date.now() - reported.getTime();
        const diffH = Math.floor(diffMs / 3600000);
        const timeStr = diffH < 1 ? 'Just now' : diffH < 24 ? `${diffH}h ago` : `${Math.floor(diffH/24)}d ago`;
        return {
          ...style,
          level: severityMap[a.severity] || style.level,
          label: a.disease,
          location: `${a.location || a.barangay} — ${a.status}`,
          time: timeStr,
        };
      })
    : [
        { level:"NO ALERTS", label:"No active disease alerts", location:"All clear — Calaca City", time:"Updated now", borderColor:"#10b981", bg:"#f0fdf4", dotColor:"#10b981", badgeBg:"#dcfce7", badgeText:"#14532d", badgeBorder:"#86efac", titleColor:"#14532d", subColor:"#15803d", timeColor:"#16a34a" },
      ];

  // ── Live pending pre-registrations from DB ─────────────────────────────
  const applications = preRegsDb.length > 0
    ? preRegsDb.map((p: any) => ({
        id: p.pre_reg_number,
        type: "Pet Pre-Registration",
        applicant: p.owner_name,
        barangay: p.barangay,
        date: p.submitted_date ? new Date(p.submitted_date).toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' }) : '—',
        status: p.status || 'Pending',
        statusStyle: p.status === 'Approved'
          ? 'bg-green-500/15 text-green-600 border border-green-500/25'
          : p.status === 'Denied'
          ? 'bg-red-500/15 text-red-500 border border-red-500/25'
          : 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
      }))
    : [];

  return (
    <div className="space-y-6 min-h-screen">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1 h-7 rounded-full bg-gradient-to-b from-blue-500 to-blue-600" />
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Dashboard Overview
            </h2>
          </div>
          <p className="text-slate-500 text-sm pl-4">
            Real-time monitoring and analytics for Calaca City
            Veterinary Services
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-700">
            Live · Updated just now
          </span>
        </div>
      </div>

      {/* ── Tabbed Navigation ─────────────────────────────────────────── */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="flex w-full gap-1 bg-slate-100 border border-slate-200 p-1.5 rounded-2xl h-auto flex-wrap">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex-1 min-w-fit px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border border-transparent"
                style={
                  isActive
                    ? {
                        backgroundColor: tab.bg,
                        color: tab.text,
                        boxShadow: `0 2px 8px ${tab.bg}55`,
                        borderColor: "transparent",
                      }
                    : {
                        color: "#64748b",
                        backgroundColor: "transparent",
                      }
                }
              >
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* ── Overview Tab ──────────────────────────────────────────────── */}
        <TabsContent
          value="overview"
          className="space-y-6 mt-6"
        >
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  onClick={() => stat.navigateTo && onNavigate?.(stat.navigateTo)}
                  className={`group relative bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100 transition-all duration-300 overflow-hidden ${stat.navigateTo && onNavigate ? 'cursor-pointer' : ''}`}
                  title={stat.navigateTo && onNavigate ? `Go to ${stat.label}` : undefined}
                >
                  {/* Subtle top accent bar */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.gradient} opacity-60 group-hover:opacity-100 transition-opacity`}
                  />

                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-sm`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                        stat.changeType === "positive"
                          ? "bg-emerald-50 text-emerald-700"
                          : stat.changeType === "negative"
                            ? "bg-red-50 text-red-600"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {stat.changeType === "positive" && (
                        <ArrowUpRight className="w-3 h-3" />
                      )}
                      {stat.changeType === "negative" && (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {stat.changeType === "neutral" && (
                        <Minus className="w-3 h-3" />
                      )}
                      {stat.change}
                    </div>
                  </div>

                  <p className="text-2xl font-bold text-slate-900 mb-0.5 tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-sm font-medium text-slate-600">
                    {stat.label}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {stat.sub}
                  </p>
                  {stat.navigateTo && onNavigate && (
                    <div className="flex items-center gap-1 mt-3 text-xs text-slate-400 group-hover:text-slate-600 transition-colors">
                      <ChevronRight className="w-3 h-3" />
                      <span>View module</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Outbreak Heatmap — click to open Outbreak Monitor */}
          <OutbreakHeatmap onNavigate={onNavigate} />

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Livestock Distribution */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="font-bold text-slate-800 text-base">
                    Livestock Distribution
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Per barangay · All species
                  </p>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {[
                    ["Cattle", "#3b82f6"],
                    ["Swine", "#ef4444"],
                    ["Poultry", "#10b981"],
                    ["Goats", "#f59e0b"],
                  ].map(([n, c]) => (
                    <div
                      key={n}
                      className="flex items-center gap-1.5"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ backgroundColor: c as string }}
                      />
                      <span className="text-xs text-slate-500 font-medium">
                        {n}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={effectiveLivestock}
                  barSize={10}
                  barGap={2}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="barangay"
                    tick={{
                      fontSize: 11,
                      fill: "#94a3b8",
                      fontWeight: 500,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: "#f8fafc" }}
                  />
                  <Bar
                    dataKey="cattle"
                    fill={CHART_COLORS.cattle}
                    radius={[3, 3, 0, 0]}
                    name="Cattle"
                  />
                  <Bar
                    dataKey="swine"
                    fill={CHART_COLORS.swine}
                    radius={[3, 3, 0, 0]}
                    name="Swine"
                  />
                  <Bar
                    dataKey="poultry"
                    fill={CHART_COLORS.poultry}
                    radius={[3, 3, 0, 0]}
                    name="Poultry"
                  />
                  <Bar
                    dataKey="goats"
                    fill={CHART_COLORS.goats}
                    radius={[3, 3, 0, 0]}
                    name="Goats"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Vaccination & Disease Trends */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="font-bold text-slate-800 text-base">
                    Vaccination & Disease Trends
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {tData.length > 0 ? `${tData[0]?.month} – ${tData[tData.length-1]?.month}` : 'Vaccination & Disease trend'}
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-8 h-0.5 rounded bg-emerald-500" />
                    <span className="text-xs text-slate-500 font-medium">
                      Vaccination
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-8 h-0.5 rounded bg-red-400" />
                    <span className="text-xs text-slate-500 font-medium">
                      Disease
                    </span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={effectiveTrend}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{
                      fontSize: 11,
                      fill: "#94a3b8",
                      fontWeight: 500,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="vaccination"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{
                      fill: "#10b981",
                      r: 4,
                      strokeWidth: 0,
                    }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="Vaccination Rate (%)"
                  />
                  <Line
                    type="monotone"
                    dataKey="diseases"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    dot={{
                      fill: "#ef4444",
                      r: 4,
                      strokeWidth: 0,
                    }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="Disease Cases"
                    strokeDasharray="5 3"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Budget Utilization */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="font-bold text-slate-800 text-base">
                    Budget Allocation
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    FY 2025 · {budgetAmt > 0 ? `₱${budgetAmt.toLocaleString('en-PH')} total` : 'Budget not set'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="55%" height={220}>
                  <PieChart>
                    <Pie
                      data={effectiveBudget}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={88}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {effectiveBudget.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.color}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-3">
                  {effectiveBudget.map((item, i) => {
                    const total = effectiveBudget.reduce((s: number, d: any) => s + d.value, 0);
                    const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-sm shrink-0"
                              style={{
                                backgroundColor: item.color,
                              }}
                            />
                            <span className="text-xs font-semibold text-slate-700">
                              {item.name}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-slate-800">
                            {pct}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          ₱{item.value.toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pet Survey Chart */}
            <PetSurveyChart />

            {/* Pet Distribution by Zone & Type */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm lg:col-span-2">
              {/* Header */}
              <div className="flex items-start justify-between mb-1 flex-wrap gap-3">
                <div>
                  <p className="font-bold text-slate-800 text-base tracking-tight">
                    Pet Distribution by Zone &amp; Type
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Registered pets per zone · grouped by species
                  </p>
                </div>
                {/* Grand total badge */}
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-600">
                  {rawZoneDist.reduce((acc: number, r: any) =>
                    acc + effectiveSpecies.reduce((s, sp) => s + ((r as any)[sp] || 0), 0), 0
                  )} total pets
                </span>
              </div>

              {/* Zone color legend — pill style */}
              <div className="flex flex-wrap gap-2 mb-5 mt-3">
                {ZONE_ORDER.map(zone => (
                  <div
                    key={zone}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold"
                    style={{
                      borderColor: `${ZONE_COLORS[zone]}40`,
                      background: `${ZONE_COLORS[zone]}10`,
                      color: ZONE_COLORS[zone],
                    }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: ZONE_COLORS[zone] }} />
                    {zone === 'Baybay-Highway' ? 'Baybay-Hwy' : zone}
                  </div>
                ))}
              </div>

              <div className="flex gap-6 flex-wrap lg:flex-nowrap">
                {/* Grouped bar chart — X = zone, groups = species */}
                <div className="flex-1 min-w-0">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={(() => {
                        // Pivot: X-axis = zone, one bar per species — correct shading by species index
                        return ZONE_ORDER
                          .filter(z => rawZoneDist.find((r: any) => r.zone === z))
                          .map(z => {
                            const row = rawZoneDist.find((r: any) => r.zone === z) || {};
                            const entry: Record<string, any> = {
                              zone: z === 'Baybay-Highway' ? 'Baybay-Hwy' : z,
                              _zoneKey: z,
                            };
                            effectiveSpecies.forEach(sp => {
                              entry[sp] = (row as any)[sp] || 0;
                            });
                            return entry;
                          });
                      })()}
                      barSize={22}
                      barGap={3}
                      barCategoryGap="32%"
                      margin={{ top: 10, right: 8, left: -10, bottom: 0 }}
                    >
                      <defs>
                        {ZONE_ORDER.map(zone => (
                          <linearGradient key={`grad-${zone}`} id={`zoneGrad-${zone}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={ZONE_COLORS[zone]} stopOpacity={0.95} />
                            <stop offset="100%" stopColor={ZONE_COLORS[zone]} stopOpacity={0.65} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="zone"
                        tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        width={32}
                        tickCount={5}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          const zoneKey = payload[0]?.payload?._zoneKey || label;
                          const zoneColor = ZONE_COLORS[zoneKey] || '#64748b';
                          const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0);
                          return (
                            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg" style={{ minWidth: 160 }}>
                              <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-slate-100">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: zoneColor }} />
                                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">{label} Zone</p>
                              </div>
                              {payload.map((p: any) => (
                                <div key={p.dataKey} className="flex items-center justify-between gap-4 text-xs mb-1">
                                  <span className="flex items-center gap-1.5 text-slate-500">
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.fill }} />
                                    {p.dataKey}
                                  </span>
                                  <span className="font-bold text-slate-700">{p.value}</span>
                                </div>
                              ))}
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                                <span className="text-[10px] text-slate-400 font-medium">Total</span>
                                <span className="text-xs font-black text-slate-700">{total} pets</span>
                              </div>
                            </div>
                          );
                        }}
                        cursor={{ fill: '#f8fafc', radius: 6 }}
                      />
                      {effectiveSpecies.map((sp, si) => {
                        // Each species gets a distinct opacity of the zone's base color via Cell
                        const opacities = [1, 0.58]; // Dog = full, Cat = lighter
                        const opacity = opacities[Math.min(si, opacities.length - 1)];
                        return (
                          <Bar
                            key={sp}
                            dataKey={sp}
                            radius={[4, 4, 0, 0]}
                            name={sp}
                          >
                            {ZONE_ORDER
                              .filter(z => rawZoneDist.find((r: any) => r.zone === z))
                              .map(zone => (
                                <Cell
                                  key={`cell-${zone}-${sp}`}
                                  fill={ZONE_COLORS[zone]}
                                  fillOpacity={opacity}
                                />
                              ))}
                            <LabelList
                              dataKey={sp}
                              position="top"
                              style={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                              formatter={(v: number) => v > 0 ? v : ''}
                            />
                          </Bar>
                        );
                      })}
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Species legend */}
                  <div className="flex flex-wrap items-center gap-4 mt-2 px-1">
                    {effectiveSpecies.map((sp, si) => {
                      const total = ZONE_ORDER.reduce((s, z) => {
                        const row = rawZoneDist.find((r: any) => r.zone === z);
                        return s + (row ? ((row as any)[sp] || 0) : 0);
                      }, 0);
                      const opacityLabel = si === 0 ? 'Full color' : 'Lighter';
                      return (
                        <div key={sp} className="flex items-center gap-1.5">
                          <div className="flex gap-0.5">
                            {/* Show mini color swatch representing opacity difference */}
                            <span
                              className="w-3 h-3 rounded-sm border border-white/50"
                              style={{ background: '#64748b', opacity: si === 0 ? 1 : 0.58 }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-600">{sp}</span>
                          <span className="text-xs text-slate-400">· {total} total</span>
                        </div>
                      );
                    })}
                    <span className="text-[10px] text-slate-300 ml-auto">bar color = zone · shade = species</span>
                  </div>
                </div>

                {/* Sidebar — per-zone stat cards */}
                <div className="flex flex-col gap-2.5 w-full lg:w-44 shrink-0 justify-center">
                  {ZONE_ORDER.filter(zone => rawZoneDist.find((r: any) => r.zone === zone)).map(zone => {
                    const row = rawZoneDist.find((r: any) => r.zone === zone) || {};
                    const total = effectiveSpecies.reduce((s, sp) => s + ((row as any)[sp] || 0), 0);
                    const base = ZONE_COLORS[zone];
                    const grandTotal = rawZoneDist.reduce((acc: number, r: any) =>
                      acc + effectiveSpecies.reduce((s, sp) => s + ((r as any)[sp] || 0), 0), 0
                    );
                    const zonePct = grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0;
                    return (
                      <div
                        key={zone}
                        className="rounded-xl p-3 border"
                        style={{ borderColor: `${base}30`, background: `${base}08` }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ background: base }} />
                            <span className="text-xs font-bold" style={{ color: base }}>
                              {zone === 'Baybay-Highway' ? 'Baybay-Hwy' : zone}
                            </span>
                          </div>
                          <span className="text-xs font-black text-slate-700">{total}</span>
                        </div>
                        {/* Species breakdown */}
                        <div className="space-y-1.5">
                          {effectiveSpecies.map((sp, si) => {
                            const cnt = (row as any)[sp] || 0;
                            if (!cnt) return null;
                            const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
                            const opacity = si === 0 ? 1 : 0.58;
                            return (
                              <div key={sp}>
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-[10px] font-medium text-slate-500">{sp}</span>
                                  <span className="text-[10px] font-bold text-slate-600">{cnt} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${pct}%`, background: base, opacity }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {/* Zone share of total */}
                        <div className="mt-2 pt-2 border-t flex items-center justify-between" style={{ borderColor: `${base}20` }}>
                          <span className="text-[10px] text-slate-400">of city total</span>
                          <span className="text-[10px] font-bold" style={{ color: base }}>{zonePct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Active Disease Alerts */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="font-bold text-slate-800 text-base">
                    Active Disease Alerts
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {alertCount > 0 ? `${alertCount} open case${alertCount > 1 ? 's' : ''} requiring attention` : 'No active alerts'}
                  </p>
                </div>
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border border-red-200 rounded-lg text-xs font-bold text-red-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  {alertCount} Active
                </span>
              </div>
              <div className="space-y-3">
                {alertSeverity.map((a, i) => (
                  <div
                    key={i}
                    className="rounded-r-xl p-4 transition-all hover:scale-[1.01] border-l-4"
                    style={{
                      backgroundColor: a.bg,
                      borderLeftColor: a.borderColor,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                          style={{
                            backgroundColor: a.dotColor,
                          }}
                        />
                        <div className="min-w-0">
                          <p
                            className="font-semibold text-sm"
                            style={{ color: a.titleColor }}
                          >
                            {a.label}
                          </p>
                          <p
                            className="text-xs truncate mt-0.5"
                            style={{ color: a.subColor }}
                          >
                            {a.location}
                          </p>
                          <p
                            className="text-[10px] mt-1 flex items-center gap-1"
                            style={{ color: a.timeColor }}
                          >
                            <span
                              className="w-3 h-px inline-block"
                              style={{
                                backgroundColor: a.timeColor,
                              }}
                            />
                            {a.time}
                          </p>
                        </div>
                      </div>
                      <span
                        className="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider shrink-0 border"
                        style={{
                          backgroundColor: a.badgeBg,
                          color: a.badgeText,
                          borderColor: a.badgeBorder,
                        }}
                      >
                        {a.level}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pending Applications Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">
                  Pending Applications & Requests
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {pendingApps} pending · awaiting validation
                </p>
              </div>
              <button className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                View all{" "}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100">
                    {[
                      "Application ID",
                      "Service Type",
                      "Applicant",
                      "Barangay",
                      "Date Filed",
                      "Status",
                      "Action",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">
                        No pending pre-registrations
                      </td>
                    </tr>
                  ) : applications.map((app, i) => (
                    <tr
                      key={i}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      <td className="py-3.5 px-5">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {app.id}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-sm text-slate-700 font-medium">
                        {app.type}
                      </td>
                      <td className="py-3.5 px-5 text-sm text-slate-600">
                        {app.applicant}
                      </td>
                      <td className="py-3.5 px-5 text-sm text-slate-500">
                        {app.barangay}
                      </td>
                      <td className="py-3.5 px-5 text-sm text-slate-500">
                        {app.date}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${app.statusStyle}`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <button className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors group-hover:gap-2">
                          Review{" "}
                          <ChevronRight className="w-3.5 h-3.5 transition-all" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ── Alerts & Interventions (combined) ─────────────────────── */}
        <TabsContent value="alerts" className="mt-6">
          <SmartAlertsInterventions onNavigateOutbreak={onNavigate ? () => onNavigate('outbreak') : undefined} />
        </TabsContent>
        <TabsContent value="analytics" className="mt-6">
          <SmartAnalytics />
        </TabsContent>
        <TabsContent value="medicine" className="mt-6">
          <MedicineIntelligence onOrderFromIntel={onNavigate ? (prefill) => {
            sessionStorage.setItem('inventory_order_prefill', JSON.stringify(prefill));
            onNavigate('inventory');
          } : undefined} />
        </TabsContent>
      </Tabs>
    </div>
  );
}