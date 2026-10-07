import React, { useState, useRef, useCallback, useEffect } from "react";
import { BreedSelect } from './BreedSelect';
import { toast } from "sonner";
import type { FC } from "react";
import {
  Plus, Search, Syringe, Download, Calendar, PawPrint,
  AlertCircle, Heart, X, CheckCircle, Camera, Upload,
  RefreshCw, ImagePlus, FlipHorizontal, ChevronLeft,
  ChevronRight, Phone, MapPin, Clock, Users, Eye,
  Zap, Tag, FileText, ArrowRight,
  TriangleAlert, Info, BarChart3, TrendingUp, Shield,
  Activity, Scissors
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar
} from "recharts";
import { api } from "../lib/api";

// ── Icon type compatibility shim (lucide-react + @types/react version mismatch) ──
type IconComponent = FC<{ className?: string; size?: number; color?: string; strokeWidth?: number }>;
const I = (Icon: any): IconComponent => (props) => React.createElement(Icon, props);
const IPlus = I(Plus), ISearch = I(Search), ISyringe = I(Syringe), IDownload = I(Download),
  ICalendar = I(Calendar), IPawPrint = I(PawPrint), IAlertCircle = I(AlertCircle),
  IHeart = I(Heart), IX = I(X), ICheckCircle = I(CheckCircle), ICamera = I(Camera),
  IUpload = I(Upload), IRefreshCw = I(RefreshCw), IImagePlus = I(ImagePlus),
  IFlipHorizontal = I(FlipHorizontal), IChevronLeft = I(ChevronLeft),
  IChevronRight = I(ChevronRight), IPhone = I(Phone), IMapPin = I(MapPin),
  IClock = I(Clock), IUsers = I(Users), IEye = I(Eye), IZap = I(Zap),
  ITag = I(Tag), IFileText = I(FileText), IArrowRight = I(ArrowRight),
  ITriangleAlert = I(TriangleAlert), IInfo = I(Info), IBarChart3 = I(BarChart3),
  ITrendingUp = I(TrendingUp), IShield = I(Shield), IActivity = I(Activity),
  IScissors = I(Scissors);

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface Pet {
  id: string;
  pet_name: string; petName?: string; pet_tag_id?: string; petTagId?: string;
  species: string; breed: string; age?: string;
  color: string; gender?: string;
  is_spayed?: boolean; is_neutered?: boolean;
  owner_name: string; ownerName?: string;
  contact_number?: string; ownerContact?: string;
  address?: string; ownerAddress?: string;
  barangay: string;
  microchip_id?: string; microchipId?: string;
  registration_date?: string; registrationDate?: string;
  vaccination_status: string; vaccinationStatus?: string;
  last_vaccination_date?: string; lastVaccinationDate?: string;
  next_vaccination_date?: string; nextVaccinationDate?: string;
  status: string;
  photo?: string; photoUrl?: string;
  impound_status?: string; impoundStatus?: string;
  impound_date?: string;
  impound_reason?: string;
  // registration renewal / archive (server-computed)
  is_archived?: boolean; archived_at?: string; archived_reason?: string; archive_type?: 'auto' | 'manual';
  renewal_due_date?: string; days_until_renewal?: number; renewal_count?: number;
  renewal_status?: 'valid' | 'expiring' | 'expired' | 'archived';
}

const REG_BADGE: Record<string, { cls: string; label: string }> = {
  valid: { cls: 'bg-green-100 text-green-700', label: 'Registered' },
  expiring: { cls: 'bg-amber-100 text-amber-700', label: 'Renew soon' },
  expired: { cls: 'bg-red-100 text-red-700', label: 'Expired' },
  archived: { cls: 'bg-gray-200 text-gray-700', label: 'Archived' },
};
function RegBadge({ pet }: { pet: Pet }) {
  const st = pet.renewal_status || 'valid';
  const b = REG_BADGE[st] || REG_BADGE.valid;
  const d = pet.days_until_renewal;
  return (
    <div>
      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${b.cls}`}>{b.label}</span>
      {pet.renewal_due_date && (
        <p className="text-[10px] text-gray-400 mt-0.5">
          {st === 'archived' ? `Archived ${fmtDate(pet.archived_at)}` : `${d != null && d < 0 ? 'Due' : 'Until'} ${fmtDate(pet.renewal_due_date)}`}
        </p>
      )}
    </div>
  );
}

interface LFReport {
  id: string; pet_id?: string; petId?: string;
  pet_name: string; petName?: string;
  species: string; breed?: string; color?: string;
  type: "Lost"|"Found";
  reported_by: string; reportedBy?: string;
  contact_number?: string; contactNumber?: string;
  last_seen_location?: string; lastSeenLocation?: string;
  barangay: string;
  date_reported?: string; dateReported?: string;
  description?: string;
  status: string;
}

interface BarangaySchedule {
  id: string; barangay: string; date: string;
  time_start?: string; time_end?: string; time?: string;
  venue?: string; location?: string;
  status: string; registered?: number; registeredPets?: number;
  capacity: number; notes?: string;
}

interface SurveyData {
  total: number;
  survey: { totalDogs: number; totalCats: number; total: number };
  registered: { dogs: number; cats: number; total: number };
  registrationRate: { dogs: string; cats: string; overall: string };
  vaccination: { vaccinated: number; notVaccinated: number; dueSoon: number };
  spayedNeutered: { spayed: number; neutered: number };
  impounded: number;
  byBarangay: Array<{ barangay: string; count: string }>;
  lostFound: { lost: number; found: number };
}

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

const CALACA_BARANGAYS = [
  "Baclas","Bagong Tubig","Balimbing","Bambang","Bisaya","Cahil","Calantas",
  "Caluangan","Camastilisan","Coral Ni Bacal","Coral Ni Lopez","Dacanlao","Dila",
  "Loma","Lumbang Calzada","Lumbang Na Bata","Lumbang Na Matanda","Madalunot",
  "Makina","Matipok","Munting Coral","Niyugan","Pantay","Poblacion 1","Poblacion 2",
  "Poblacion 3","Poblacion 4","Poblacion 5","Poblacion 6","Puting Bato East",
  "Puting Bato West","Quisumbing","Salong","San Rafael","Sinisian","Taklang Anak",
  "Talisay","Tamayo","Timbain"
];

const ZONE_COLORS: Record<string,string> = {
  North: "#6B7280", West: "#8B5CF6", East: "#2B5EA6", "Baybay-Highway": "#E85D3B", Red: "#E85D3B"
};

const PIE_COLORS = ["#2B5EA6","#60A85C","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899"];

// ─── HELPERS ────────────────────────────────────────────────────────────────

const pn = (p: Pet) => p.pet_name || p.petName || "";
const on = (p: Pet) => p.owner_name || p.ownerName || "";
const vs = (p: Pet) => p.vaccination_status || p.vaccinationStatus || "Not Vaccinated";
const brgy = (p: Pet) => p.barangay || "";
const spayed = (p: Pet) => p.is_spayed || false;
const neutered = (p: Pet) => p.is_neutered || false;
const impound = (p: Pet) => p.impound_status && p.impound_status !== "None" ? p.impound_status : "";
const petPhoto = (p: Pet) => p.photo || p.photoUrl || "";

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
}

// ── Smart Matching Engine ─────────────────────────────────────────────────
// Multi-factor weighted algorithm with full breakdown per criterion

interface MatchFactor {
  label: string;
  points: number;
  max: number;
  matched: boolean;
  detail: string;
  icon: string;
}

interface MatchResult {
  report: LFReport;
  score: number;           // 0–100 normalised
  rawScore: number;        // raw weighted sum
  confidence: "High" | "Medium" | "Low";
  factors: MatchFactor[];
}

// Levenshtein distance for fuzzy string comparison
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({length: m+1}, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] :
        1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function fuzzyMatch(a: string, b: string): number {
  if (!a || !b) return 0;
  const al = a.toLowerCase().trim(), bl = b.toLowerCase().trim();
  if (al === bl) return 1.0;
  if (al.includes(bl) || bl.includes(al)) return 0.85;
  const dist = levenshtein(al, bl);
  const maxLen = Math.max(al.length, bl.length);
  const similarity = 1 - dist / maxLen;
  return similarity > 0.6 ? similarity : 0;
}

function colorOverlap(a: string, b: string): number {
  if (!a || !b) return 0;
  const tokenize = (s: string) => s.toLowerCase().split(/[\s/,+&]+/).filter(w => w.length > 2);
  const wa = tokenize(a), wb = tokenize(b);
  if (!wa.length || !wb.length) return 0;
  let hits = 0;
  for (const w of wa) {
    if (wb.some(x => fuzzyMatch(w, x) > 0.75)) hits++;
  }
  return hits / Math.max(wa.length, wb.length);
}

function keywordOverlap(a: string, b: string): number {
  if (!a || !b) return 0;
  const stopWords = new Set(["the","a","an","and","or","in","at","on","near","with","was","is","very","small","medium","large"]);
  const tokenize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
     .filter(w => w.length > 3 && !stopWords.has(w));
  const wa = tokenize(a), wb = tokenize(b);
  if (!wa.length || !wb.length) return 0;
  let hits = 0;
  for (const w of wa) if (wb.some(x => fuzzyMatch(w, x) > 0.7)) hits++;
  return hits / Math.max(wa.length, wb.length);
}

function daysBetween(a?: string, b?: string): number | null {
  if (!a || !b) return null;
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60 * 24);
}

function adjacentBarangay(a: string, b: string): boolean {
  // Approximate adjacency for Calaca barangays by zone
  const zones: Record<string, string> = {
    "Baclas":"North","Balimbing":"North","Bambang":"North","Bisaya":"North",
    "Madalunot":"North","Matipok":"North","Munting Coral":"North","Niyugan":"North","Tamayo":"North",
    "Bagong Tubig":"West","Cahil":"West","Calantas":"West","Coral Ni Lopez":"West",
    "Dacanlao":"West","Loma":"West","Makina":"West","Pantay":"West","Taklang Anak":"West","Timbain":"West",
    "Caluangan":"East","Coral Ni Bacal":"East","Dila":"East","Lumbang Na Bata":"East",
    "Lumbang Na Matanda":"East","Poblacion 1":"East","Poblacion 2":"East","Poblacion 3":"East",
    "Poblacion 4":"East","Poblacion 6":"East",
    "Camastilisan":"Baybay-Highway","Lumbang Calzada":"Baybay-Highway","Poblacion 5":"Baybay-Highway","Puting Bato East":"Baybay-Highway",
    "Puting Bato West":"Baybay-Highway","Quisumbing":"Baybay-Highway","Salong":"Baybay-Highway","San Rafael":"Baybay-Highway",
    "Sinisian":"Baybay-Highway","Talisay":"Baybay-Highway",
  };
  return zones[a] !== undefined && zones[a] === zones[b];
}

function analyzeMatch(lost: LFReport, found: LFReport): MatchFactor[] {
  const factors: MatchFactor[] = [];
  const lostDate = lost.date_reported || lost.dateReported;
  const foundDate = found.date_reported || found.dateReported;
  const days = daysBetween(lostDate, foundDate);

  // 1. Species — hard gate (40 pts)
  const speciesMatch = (lost.species||"").toLowerCase() === (found.species||"").toLowerCase();
  factors.push({
    label: "Species",
    points: speciesMatch ? 40 : 0,
    max: 40,
    matched: speciesMatch,
    detail: speciesMatch
      ? `Both are ${lost.species}`
      : `Lost: ${lost.species || "?"} · Found: ${found.species || "?"}`,
    icon: "paw",
  });

  // 2. Breed — fuzzy (20 pts)
  const breedSim = fuzzyMatch(lost.breed||"", found.breed||"");
  const breedPts = Math.round(breedSim * 20);
  factors.push({
    label: "Breed",
    points: breedPts,
    max: 20,
    matched: breedPts >= 10,
    detail: breedPts >= 20
      ? `Exact match: ${lost.breed}`
      : breedPts >= 10
      ? `Similar: "${lost.breed}" ≈ "${found.breed}" (${Math.round(breedSim*100)}%)`
      : `Different: "${lost.breed||"?"}" vs "${found.breed||"?"}"`  ,
    icon: "microscope",
  });

  // 3. Color — token overlap (15 pts)
  const colorSim = colorOverlap(lost.color||"", found.color||"");
  const colorPts = Math.round(colorSim * 15);
  factors.push({
    label: "Color / Markings",
    points: colorPts,
    max: 15,
    matched: colorPts >= 8,
    detail: colorPts >= 15
      ? `Colors match: ${lost.color}`
      : colorPts >= 8
      ? `Partial color overlap: "${lost.color}" / "${found.color}"`
      : `Colors differ: "${lost.color||"?"}" vs "${found.color||"?"}"`,
    icon: "palette",
  });

  // 4. Location — same barangay (10 pts) or adjacent zone (5 pts)
  const sameBarangay = lost.barangay === found.barangay;
  const nearbyBarangay = !sameBarangay && adjacentBarangay(lost.barangay, found.barangay);
  const locPts = sameBarangay ? 10 : nearbyBarangay ? 5 : 0;
  factors.push({
    label: "Location",
    points: locPts,
    max: 10,
    matched: locPts > 0,
    detail: sameBarangay
      ? `Same barangay: ${lost.barangay}`
      : nearbyBarangay
      ? `Adjacent zone: ${lost.barangay} ↔ ${found.barangay}`
      : `Different areas: ${lost.barangay} / ${found.barangay}`,
    icon: "pin",
  });

  // 5. Date proximity — within 3 days (10 pts), 7 days (6 pts), 14 days (3 pts)
  let datePts = 0;
  let dateDetail = "No dates to compare";
  if (days !== null) {
    if (days <= 3) { datePts = 10; dateDetail = `Found ${Math.round(days)}d after lost — very close`; }
    else if (days <= 7) { datePts = 6; dateDetail = `${Math.round(days)} days apart — plausible`; }
    else if (days <= 14) { datePts = 3; dateDetail = `${Math.round(days)} days apart — possible`; }
    else { datePts = 0; dateDetail = `${Math.round(days)} days apart — unlikely but possible`; }
  }
  factors.push({
    label: "Date Proximity",
    points: datePts,
    max: 10,
    matched: datePts >= 3,
    detail: dateDetail,
    icon: "calendar",
  });

  // 6. Description keyword overlap (5 pts)
  const kwSim = keywordOverlap(lost.description||"", found.description||"");
  const kwPts = Math.round(kwSim * 5);
  factors.push({
    label: "Description Keywords",
    points: kwPts,
    max: 5,
    matched: kwPts >= 2,
    detail: kwPts >= 4
      ? "Strong keyword overlap in descriptions"
      : kwPts >= 2
      ? "Some shared keywords in descriptions"
      : "No significant keyword overlap",
    icon: "notes",
  });

  return factors;
}

function computeMatchResult(lost: LFReport, found: LFReport): MatchResult {
  const factors = analyzeMatch(lost, found);
  const rawScore = factors.reduce((s, f) => s + f.points, 0);
  const maxPossible = factors.reduce((s, f) => s + f.max, 0);
  const score = Math.round((rawScore / maxPossible) * 100);

  // Species mismatch = automatic disqualification
  if (!factors[0].matched) return { report: found, score: 0, rawScore: 0, confidence: "Low", factors };

  const confidence: "High" | "Medium" | "Low" =
    score >= 70 ? "High" : score >= 45 ? "Medium" : "Low";

  return { report: found, score, rawScore, confidence, factors };
}

function getMatches(report: LFReport, all: LFReport[]): MatchResult[] {
  const opp = report.type === "Lost" ? "Found" : "Lost";
  const candidates = all.filter(r => r.type === opp && r.status === "Open" && r.id !== report.id);

  return candidates
    .map(candidate => {
      const [lost, found] = report.type === "Lost" ? [report, candidate] : [candidate, report];
      const result = computeMatchResult(lost, found);
      return { ...result, report: candidate };
    })
    .filter(r => r.score >= 20 && r.factors[0].matched) // species must match, min 20%
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // top 5 matches
}

const INPUT = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent bg-white transition-all";

// ─── STAT CARD ──────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, color, bg, ring, onClick }: any) {
  return (
    <div onClick={onClick} className={`bg-white rounded-2xl shadow-sm border ${ring} p-5 ${onClick?"cursor-pointer hover:shadow-md hover:scale-[1.02]":""} transition-all group`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
        <div className={`${bg} ${color} w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>{icon}</div>
      </div>
      <p className={`text-3xl font-black ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── PHOTO CAPTURE ──────────────────────────────────────────────────────────

function PetPhotoCapture({ onCapture, onClose, petName }: { onCapture:(d:string)=>void; onClose:()=>void; petName:string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const [mode, setMode] = useState<"choose"|"camera"|"preview">("choose");
  const [preview, setPreview] = useState<string|null>(null);
  const [camErr, setCamErr] = useState<string|null>(null);
  const [facing, setFacing] = useState<"user"|"environment">("environment");
  const [camReady, setCamReady] = useState(false);

  const stop = useCallback(()=>{ streamRef.current?.getTracks().forEach(t=>t.stop()); streamRef.current=null; setCamReady(false); },[]);
  const startCam = useCallback(async(f:"user"|"environment")=>{
    stop(); setCamErr(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({video:{facingMode:f,width:{ideal:1280},height:{ideal:720}}});
      streamRef.current=s;
      if(videoRef.current){videoRef.current.srcObject=s;await videoRef.current.play();}
      setCamReady(true);
    } catch(e:any){setCamErr(e.name==="NotAllowedError"?"Camera permission denied.":"Camera not available.");}
  },[stop]);
  const snap = ()=>{
    if(!videoRef.current||!canvasRef.current) return;
    const v=videoRef.current,c=canvasRef.current;
    c.width=v.videoWidth;c.height=v.videoHeight;
    c.getContext("2d")?.drawImage(v,0,0);
    stop();setPreview(c.toDataURL("image/jpeg",0.9));setMode("preview");
  };
  const onFile=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0];if(!f) return;
    const r=new FileReader();r.onload=ev=>{setPreview(ev.target?.result as string);setMode("preview");};r.readAsDataURL(f);
  };
  useEffect(()=>()=>stop(),[stop]);

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#1e4080] to-[#2B5EA6] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"><ICamera className="w-4 h-4 text-white"/></div>
            <div><p className="font-bold text-white text-sm">Pet Photo</p><p className="text-white/60 text-xs">{petName||"New Pet"}</p></div>
          </div>
          <button onClick={()=>{stop();onClose();}} className="text-white/60 hover:text-white"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-5">
          {mode==="choose"&&(
            <div className="space-y-3">
              <p className="text-sm text-gray-400 text-center mb-4">Add a photo to help identify this pet</p>
              <button onClick={()=>{setMode("camera");startCam(facing);}} className="w-full flex items-center gap-4 p-4 border-2 border-dashed border-[#2B5EA6]/30 rounded-xl hover:border-[#2B5EA6] hover:bg-blue-50 transition-all group">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 shrink-0"><ICamera className="w-6 h-6 text-[#2B5EA6]"/></div>
                <div className="text-left"><p className="font-semibold text-gray-800 text-sm">Open Camera</p><p className="text-xs text-gray-400">Take a live photo now</p></div>
              </button>
              <button onClick={()=>fileInputRef.current?.click()} className="w-full flex items-center gap-4 p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all group">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 shrink-0"><IUpload className="w-6 h-6 text-gray-500"/></div>
                <div className="text-left"><p className="font-semibold text-gray-800 text-sm">Upload from Gallery</p><p className="text-xs text-gray-400">Choose an existing photo</p></div>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={onFile} className="hidden"/>
              <button onClick={()=>{stop();onClose();}} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600">Skip for now</button>
            </div>
          )}
          {mode==="camera"&&(
            <div className="space-y-3">
              <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"/>
                {camErr&&<div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 text-white p-4 text-center"><ICamera className="w-8 h-8 mb-2 opacity-40"/><p className="text-sm">{camErr}</p><button onClick={()=>fileInputRef.current?.click()} className="mt-3 px-4 py-1.5 bg-white text-gray-800 rounded-lg text-xs font-semibold">Upload instead</button></div>}
              </div>
              <canvas ref={canvasRef} className="hidden"/>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={onFile} className="hidden"/>
              <div className="flex gap-2">
                <button onClick={()=>{const nf=facing==="environment"?"user":"environment";setFacing(nf);startCam(nf);}} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm"><IFlipHorizontal className="w-4 h-4"/>Flip</button>
                <button onClick={snap} disabled={!!camErr||!camReady} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#2B5EA6] text-white rounded-lg font-semibold hover:bg-[#234a85] disabled:opacity-40"><ICamera className="w-4 h-4"/>Capture</button>
              </div>
              <button onClick={()=>{stop();setMode("choose");}} className="w-full py-1.5 text-sm text-gray-400 hover:text-gray-600">← Back</button>
            </div>
          )}
          {mode==="preview"&&preview&&(
            <div className="space-y-3">
              <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
                <img src={preview} alt="Preview" className="w-full h-full object-cover"/>
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"><ICheckCircle className="w-3 h-3"/>Ready</div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>{setPreview(null);setMode("camera");startCam(facing);}} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm"><IRefreshCw className="w-4 h-4"/>Retake</button>
                <button onClick={()=>{onCapture(preview);stop();}} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#60A85C] text-white rounded-lg font-semibold hover:bg-[#4a8a47]"><ICheckCircle className="w-4 h-4"/>Use Photo</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── OVERVIEW TAB ───────────────────────────────────────────────────────────

function OverviewTab({ survey, pets, reports, schedules, onTab }: {
  survey: SurveyData|null; pets: Pet[]; reports: LFReport[];
  schedules: BarangaySchedule[]; onTab: (t: string) => void;
}) {
  if (!survey) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-4 border-[#2B5EA6] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  const totalVax = survey.vaccination.vaccinated;
  const totalPets = survey.total || pets.length;
  const vaxRate = totalPets > 0 ? Math.round((totalVax/totalPets)*100) : 0;
  const openLost = survey.lostFound.lost;
  const openFound = survey.lostFound.found;

  const vaxPieData = [
    { name: "Vaccinated", value: survey.vaccination.vaccinated, color: "#60A85C" },
    { name: "Not Vaccinated", value: survey.vaccination.notVaccinated, color: "#ef4444" },
    { name: "Due Soon", value: survey.vaccination.dueSoon, color: "#f59e0b" },
  ].filter(d => d.value > 0);

  const spayData = [
    { name: "Spayed", value: survey.spayedNeutered.spayed, fill: "#8b5cf6" },
    { name: "Neutered", value: survey.spayedNeutered.neutered, fill: "#06b6d4" },
    { name: "Not S/N", value: Math.max(0, totalPets - survey.spayedNeutered.spayed - survey.spayedNeutered.neutered), fill: "#e5e7eb" },
  ];

  const topBarangays = (survey.byBarangay || []).slice(0, 10).map(b => ({
    name: b.barangay.replace("Poblacion","Pob.").replace("Putting Bato","P.Bato").replace("Lumbang","Lmbg"),
    count: parseInt(b.count),
  }));

  const lfData = [
    { name: "Lost", value: survey.lostFound.lost, fill: "#ef4444" },
    { name: "Found", value: survey.lostFound.found, fill: "#60A85C" },
  ];

  const totalMatches = reports
    .filter(r => r.type === "Lost" && r.status === "Open")
    .reduce((a, r) => a + (getMatches(r, reports).length > 0 ? 1 : 0), 0);

  return (
    <div className="space-y-6">
      {/* ── KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Registered" value={totalPets} sub="All species · Calaca"
          icon={<IPawPrint className="w-5 h-5"/>} color="text-blue-600" bg="bg-blue-100" ring="border-blue-200"
          onClick={() => onTab("pets")} />
        <StatCard label="Vaccinated" value={totalVax} sub={`${vaxRate}% coverage rate`}
          icon={<ISyringe className="w-5 h-5"/>} color="text-green-600" bg="bg-green-100" ring="border-green-200" />
        <StatCard label="Impounded" value={survey.impounded} sub="Currently in pound"
          icon={<IShield className="w-5 h-5"/>} color="text-orange-600" bg="bg-orange-100" ring="border-orange-200" />
        <StatCard label="Lost & Found" value={openLost + openFound} sub={`${openLost} lost · ${openFound} found open`}
          icon={<IHeart className="w-5 h-5"/>} color="text-red-600" bg="bg-red-100" ring="border-red-200"
          onClick={() => onTab("lost-found")} />
      </div>

      {/* Smart Match Alert */}
      {totalMatches > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shrink-0"><IZap className="w-6 h-6 text-white"/></div>
          <div className="flex-1">
            <p className="font-bold text-amber-800">{totalMatches} Lost Pet{totalMatches>1?"s":""} with Smart Match{totalMatches>1?"es":""}!</p>
            <p className="text-sm text-amber-600">AI matching found potential Lost/Found connections. Review now.</p>
          </div>
          <button onClick={() => onTab("lost-found")} className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 flex items-center gap-1.5 shrink-0">
            Review <IArrowRight className="w-4 h-4"/>
          </button>
        </div>
      )}

      {/* ── Charts Row 1: Vaccination Pie + Barangay Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vaccination breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"><ISyringe className="w-4 h-4 text-green-600"/></div>
            <div>
              <p className="font-bold text-gray-900">Vaccination Status</p>
              <p className="text-xs text-gray-500">Across all registered pets</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={vaxPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}
                label={({name,percent}) => `${(percent*100).toFixed(0)}%`} labelLine={false}>
                {vaxPieData.map((d,i) => <Cell key={i} fill={d.color}/>)}
              </Pie>
              <Tooltip formatter={(v:any, n:any) => [v, n]}/>
              <Legend/>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
            <div className="text-center"><p className="text-2xl font-black text-green-600">{vaxRate}%</p><p className="text-xs text-gray-500">Coverage</p></div>
            <div className="text-center"><p className="text-2xl font-black text-amber-600">{survey.vaccination.dueSoon}</p><p className="text-xs text-gray-500">Due Soon</p></div>
            <div className="text-center"><p className="text-2xl font-black text-red-500">{survey.vaccination.notVaccinated}</p><p className="text-xs text-gray-500">Unvaccinated</p></div>
          </div>
        </div>

        {/* Pets per barangay */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><IBarChart3 className="w-4 h-4 text-blue-600"/></div>
            <div>
              <p className="font-bold text-gray-900">Pets per Barangay</p>
              <p className="text-xs text-gray-500">Top 10 barangays by count</p>
            </div>
          </div>
          {topBarangays.length === 0
            ? <div className="flex items-center justify-center h-40 text-gray-300 text-sm">No data yet</div>
            : <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topBarangays} layout="vertical" margin={{left:-10,right:10}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                  <XAxis type="number" tick={{fontSize:10}} allowDecimals={false}/>
                  <YAxis type="category" dataKey="name" tick={{fontSize:9}} width={72}/>
                  <Tooltip/>
                  <Bar dataKey="count" name="Pets" fill="#2B5EA6" radius={[0,4,4,0]}>
                    {topBarangays.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
          }
        </div>
      </div>

      {/* ── Charts Row 2: Spayed/Neutered + Lost/Found + Impound */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spayed & Neutered */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center"><IScissors className="w-4 h-4 text-purple-600"/></div>
            <div>
              <p className="font-bold text-gray-900">Spayed / Neutered</p>
              <p className="text-xs text-gray-500">Reproductive control</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={spayData.filter(d=>d.value>0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={28}
                label={({name,percent}) => percent > 0.05 ? `${(percent*100).toFixed(0)}%` : ""} labelLine={false}>
                {spayData.map((d,i) => <Cell key={i} fill={d.fill}/>)}
              </Pie>
              <Tooltip/>
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-purple-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-purple-600">{survey.spayedNeutered.spayed}</p>
              <p className="text-xs text-purple-500 font-semibold">Spayed (F)</p>
            </div>
            <div className="bg-cyan-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-cyan-600">{survey.spayedNeutered.neutered}</p>
              <p className="text-xs text-cyan-500 font-semibold">Neutered (M)</p>
            </div>
          </div>
        </div>

        {/* Lost & Found */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center"><IHeart className="w-4 h-4 text-red-600"/></div>
            <div>
              <p className="font-bold text-gray-900">Lost & Found</p>
              <p className="text-xs text-gray-500">Open reports only</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={lfData.filter(d=>d.value>0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={28}
                label={({name,percent}) => percent > 0.05 ? `${(percent*100).toFixed(0)}%` : ""} labelLine={false}>
                {lfData.map((d,i) => <Cell key={i} fill={d.fill}/>)}
              </Pie>
              <Tooltip/>
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-red-600">{survey.lostFound.lost}</p>
              <p className="text-xs text-red-500 font-semibold">Lost</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-green-600">{survey.lostFound.found}</p>
              <p className="text-xs text-green-500 font-semibold">Found</p>
            </div>
          </div>
        </div>

        {/* Impounded */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center"><IShield className="w-4 h-4 text-orange-600"/></div>
            <div>
              <p className="font-bold text-gray-900">Impounded Pets</p>
              <p className="text-xs text-gray-500">Currently in custody</p>
            </div>
          </div>
          <div className="flex items-center justify-center h-[150px]">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg shadow-orange-200 mb-3">
                <span className="text-4xl font-black text-white">{survey.impounded}</span>
              </div>
              <p className="text-sm font-semibold text-gray-700">Pets Impounded</p>
              <p className="text-xs text-gray-400 mt-0.5">Awaiting redemption or adoption</p>
            </div>
          </div>
          <button onClick={() => onTab("pets")} className="w-full mt-3 py-2 bg-orange-50 text-orange-600 border border-orange-200 rounded-xl text-xs font-bold hover:bg-orange-100 transition-colors">
            View Impounded Pets →
          </button>
        </div>
      </div>

      {/* ── Registration Rate */}
      <div className="bg-gradient-to-br from-[#1a3a6e] to-[#2B5EA6] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-4">
          <ITrendingUp className="w-5 h-5"/>
          <p className="font-bold">Survey vs Registration Rate</p>
          <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">Based on CSWD Survey Data</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label:"Dogs", surveyed: survey.survey.totalDogs, registered: survey.registered.dogs, rate: survey.registrationRate.dogs },
            { label:"Cats", surveyed: survey.survey.totalCats, registered: survey.registered.cats, rate: survey.registrationRate.cats },
            { label:"Overall", surveyed: survey.survey.total, registered: survey.registered.total, rate: survey.registrationRate.overall },
          ].map(d => (
            <div key={d.label} className="bg-white/10 rounded-xl p-4 text-center">
              <p className="text-white/70 text-xs mb-1">{d.label}</p>
              <p className="text-2xl font-black">{d.rate}%</p>
              <div className="w-full h-1.5 bg-white/20 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-[#60A85C] rounded-full transition-all" style={{width:`${Math.min(parseFloat(d.rate),100)}%`}}/>
              </div>
              <p className="text-xs text-white/60 mt-1">{d.registered} / {d.surveyed}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Upcoming Schedules */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-bold text-gray-800 flex items-center gap-2"><ICalendar className="w-4 h-4 text-[#2B5EA6]"/>Upcoming Schedules</p>
          <button onClick={() => onTab("schedule")} className="text-xs text-[#2B5EA6] font-semibold hover:underline">View All →</button>
        </div>
        {schedules.filter(s=>s.status==="Upcoming").length === 0
          ? <div className="text-center py-6 text-gray-300"><ICalendar className="w-8 h-8 mx-auto mb-2"/><p className="text-sm text-gray-400">No upcoming schedules</p></div>
          : <div className="space-y-2">
              {schedules.filter(s=>s.status==="Upcoming").sort((a,b)=>new Date(a.date).getTime()-new Date(b.date).getTime()).slice(0,3).map(s=>{
                const reg = s.registered || s.registeredPets || 0;
                return (
                  <div key={s.id} className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <div className="w-11 h-11 bg-[#2B5EA6] rounded-xl flex flex-col items-center justify-center text-white shrink-0">
                      <p className="text-[9px] font-bold">{new Date(s.date).toLocaleString("en",{month:"short"}).toUpperCase()}</p>
                      <p className="text-base font-black leading-none">{new Date(s.date).getDate()}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{s.barangay}</p>
                      <p className="text-xs text-gray-500 truncate">{s.time_start||s.time} · {s.venue||s.location}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-[#2B5EA6]">{reg}/{s.capacity}</p>
                      <p className="text-xs text-gray-400">registered</p>
                    </div>
                  </div>
                );
              })}
            </div>
        }
      </div>
    </div>
  );
}

// ─── PET DETAIL MODAL ────────────────────────────────────────────────────────

function PetDetailModal({ pet, onClose, onVaccinate, onUpdate, canRenew, canArchive, onRenew, onArchive }: { pet:Pet; onClose:()=>void; onVaccinate:(p:Pet)=>void; onUpdate?:()=>void; canRenew?:boolean; canArchive?:boolean; onRenew?:(p:Pet)=>void; onArchive?:(p:Pet)=>void }) {
  const vacStatus = vs(pet);
  const isImpounded = impound(pet);
  const [tab, setTab] = useState<'info'|'old-records'>('info');
  const [oldRecords, setOldRecords] = useState<any[]>([]);
  const [loadingOld, setLoadingOld] = useState(false);
  const [showAddOld, setShowAddOld] = useState(false);
  const [savingOld, setSavingOld] = useState(false);
  const [or, setOr] = useState({
    recordType: 'Vaccination',
    recordDate: '',
    vaccineName: '',
    veterinarian: '',
    lotNumber: '',
    nextDueDate: '',
    notes: '',
  });

  useEffect(() => {
    if (tab === 'old-records') {
      setLoadingOld(true);
      api.getPetOldRecords(pet.id)
        .then((r: any) => { setOldRecords(r.records || []); setLoadingOld(false); })
        .catch(() => setLoadingOld(false));
    }
  }, [tab, pet.id]);

  const saveOldRecord = async () => {
    if (!or.recordDate) { alert('Please enter the record date.'); return; }
    setSavingOld(true);
    try {
      await api.addPetOldRecord(pet.id, or);
      const r = await api.getPetOldRecords(pet.id);
      setOldRecords(r.records || []);
      setShowAddOld(false);
      setOr({ recordType:'Vaccination', recordDate:'', vaccineName:'', veterinarian:'', lotNumber:'', nextDueDate:'', notes:'' });
      if (onUpdate) onUpdate();
    } catch(e:any) { alert('Error: ' + e.message); }
    setSavingOld(false);
  };

  const OLD_RECORD_TYPES = ['Vaccination','Checkup','Treatment','Deworming','Other'];
  const INPUT_SM = 'w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent bg-white';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className={`px-6 py-5 flex items-center justify-between shrink-0 ${vacStatus==="Vaccinated"?"bg-gradient-to-r from-green-600 to-green-500":vacStatus==="Due Soon"?"bg-gradient-to-r from-yellow-500 to-orange-500":"bg-gradient-to-r from-red-600 to-red-500"}`}>
          <div className="flex items-center gap-4">
            {petPhoto(pet)
              ? <img src={petPhoto(pet)} alt={pn(pet)} className="w-16 h-16 rounded-xl object-cover border-2 border-white/40"/>
              : <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center"><IPawPrint className="w-8 h-8 text-white"/></div>
            }
            <div>
              <h3 className="text-xl font-bold text-white">{pn(pet)}</h3>
              <p className="text-white/80 text-sm">{pet.species} · {pet.breed}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 text-white text-xs rounded-full">{pet.id}</span>
                {spayed(pet) && <span className="px-1.5 py-0.5 bg-purple-400 text-white text-[10px] font-bold rounded-full">Spayed</span>}
                {neutered(pet) && <span className="px-1.5 py-0.5 bg-cyan-400 text-white text-[10px] font-bold rounded-full">Neutered</span>}
                {isImpounded && <span className="px-1.5 py-0.5 bg-orange-400 text-white text-[10px] font-bold rounded-full">Impounded</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5"/></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 shrink-0">
          {([
            ['info', 'Details', <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>],
            ['old-records', 'Old Records', <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>],
          ] as any[]).map(([id, label, icon]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold transition-all ${tab===id?'border-b-2 border-[#2B5EA6] text-[#2B5EA6] bg-blue-50/50':'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
              {icon}{label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {/* ── INFO TAB ── */}
          {tab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Age", pet.age||"—"], ["Color", pet.color||"—"], ["Gender", pet.gender||"—"],
                  ["Registered", fmtDate(pet.registration_date||pet.registrationDate)],
                  ["Barangay", brgy(pet)], ["Status", pet.status],
                ].map(([k,v])=>(
                  <div key={k} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{k}</p>
                    <p className="text-sm font-semibold text-gray-800">{v}</p>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-3 font-semibold">Owner Information</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3"><div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><IUsers className="w-4 h-4 text-blue-600"/></div><div><p className="text-xs text-gray-400">Owner</p><p className="text-sm font-semibold text-gray-800">{on(pet)}</p></div></div>
                  <div className="flex items-center gap-3"><div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"><IPhone className="w-4 h-4 text-green-600"/></div><div><p className="text-xs text-gray-400">Contact</p><p className="text-sm font-semibold text-gray-800">{pet.contact_number||pet.ownerContact||"—"}</p></div></div>
                  <div className="flex items-center gap-3"><div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center"><IMapPin className="w-4 h-4 text-purple-600"/></div><div><p className="text-xs text-gray-400">Address</p><p className="text-sm font-semibold text-gray-800">{pet.address||pet.ownerAddress||"—"}, {brgy(pet)}</p></div></div>
                </div>
              </div>
              <div className={`rounded-xl p-4 border ${pet.renewal_status==="archived"?"bg-gray-50 border-gray-300":pet.renewal_status==="expired"?"bg-red-50 border-red-200":pet.renewal_status==="expiring"?"bg-amber-50 border-amber-200":"bg-green-50 border-green-200"}`}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-xs font-bold uppercase text-gray-500 mb-1">Registration</p>
                    <RegBadge pet={pet}/>
                    {pet.is_archived && pet.archived_reason && <p className="text-xs text-gray-500 mt-1">{pet.archived_reason}{pet.archive_type==="auto"?" (auto-archived)":""}</p>}
                    {!!pet.renewal_count && <p className="text-[11px] text-gray-400 mt-1">Renewed {pet.renewal_count}×</p>}
                  </div>
                  <div className="flex gap-2">
                    {canRenew && onRenew && <button onClick={()=>{onRenew(pet);onClose();}} className="px-3 py-1.5 bg-[#60A85C] text-white text-xs font-semibold rounded-lg hover:bg-[#4a8a47]">{pet.is_archived?"Restore & Renew":"Renew 12 months"}</button>}
                    {canArchive && onArchive && !pet.is_archived && <button onClick={()=>{onArchive(pet);onClose();}} className="px-3 py-1.5 border border-gray-300 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-100">Archive</button>}
                  </div>
                </div>
              </div>
              {isImpounded && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-orange-700 uppercase mb-2 flex items-center gap-1"><IShield className="w-3 h-3"/>Impound Record</p>
                  <p className="text-sm text-orange-800">{pet.impound_reason||"—"}</p>
                  {pet.impound_date && <p className="text-xs text-orange-600 mt-1">Date: {fmtDate(pet.impound_date)}</p>}
                </div>
              )}
              <div className={`rounded-xl p-4 ${vacStatus==="Vaccinated"?"bg-green-50 border border-green-200":vacStatus==="Due Soon"?"bg-yellow-50 border border-yellow-200":"bg-red-50 border border-red-200"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-bold text-sm ${vacStatus==="Vaccinated"?"text-green-700":vacStatus==="Due Soon"?"text-yellow-700":"text-red-700"}`}>{vacStatus}</p>
                    {(pet.last_vaccination_date||pet.lastVaccinationDate)&&<p className="text-xs text-gray-500 mt-0.5">Last: {fmtDate(pet.last_vaccination_date||pet.lastVaccinationDate)}</p>}
                    {(pet.next_vaccination_date||pet.nextVaccinationDate)&&<p className="text-xs text-gray-500">Next: {fmtDate(pet.next_vaccination_date||pet.nextVaccinationDate)}</p>}
                  </div>
                  {vacStatus!=="Vaccinated"&&<button onClick={()=>{onVaccinate(pet);onClose();}} className="px-3 py-1.5 bg-[#60A85C] text-white text-xs font-semibold rounded-lg hover:bg-[#4a8a47] flex items-center gap-1"><ISyringe className="w-3 h-3"/>Vaccinate</button>}
                </div>
              </div>
            </div>
          )}

          {/* ── OLD RECORDS TAB ── */}
          {tab === 'old-records' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-800 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    Pre-existing Records
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Records from before system implementation. Does not deduct from inventory.</p>
                </div>
                <button onClick={() => setShowAddOld(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600">
                  <Plus className="w-3.5 h-3.5"/>Add Old Record
                </button>
              </div>

              {showAddOld && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wide flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Add Pre-existing Record — No inventory deduction
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Record Type</label>
                      <select value={or.recordType} onChange={e=>setOr(p=>({...p,recordType:e.target.value}))} className={INPUT_SM}>
                        {OLD_RECORD_TYPES.map(t=><option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date of Record <span className="text-red-500">*</span></label>
                      <input type="date" value={or.recordDate} onChange={e=>setOr(p=>({...p,recordDate:e.target.value}))} className={INPUT_SM} max={new Date().toISOString().split('T')[0]}/>
                    </div>
                    {or.recordType === 'Vaccination' && <>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Vaccine Name</label>
                        <input value={or.vaccineName} onChange={e=>setOr(p=>({...p,vaccineName:e.target.value}))} className={INPUT_SM} placeholder="e.g. Anti-Rabies"/>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Lot Number</label>
                        <input value={or.lotNumber} onChange={e=>setOr(p=>({...p,lotNumber:e.target.value}))} className={INPUT_SM} placeholder="Optional"/>
                      </div>
                    </>}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Veterinarian</label>
                      <input value={or.veterinarian} onChange={e=>setOr(p=>({...p,veterinarian:e.target.value}))} className={INPUT_SM} placeholder="Dr. Name"/>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Next Due Date</label>
                      <input type="date" value={or.nextDueDate} onChange={e=>setOr(p=>({...p,nextDueDate:e.target.value}))} className={INPUT_SM}/>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notes</label>
                      <textarea value={or.notes} onChange={e=>setOr(p=>({...p,notes:e.target.value}))} rows={2} className={INPUT_SM + ' resize-none'} placeholder="Optional notes"/>
                    </div>
                  </div>
                  <div className="bg-amber-100 rounded-lg px-3 py-2 text-xs text-amber-800 flex items-start gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    This record will be saved as a historical entry. Inventory will <strong>not</strong> be deducted.
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>setShowAddOld(false)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
                    <button onClick={saveOldRecord} disabled={savingOld||!or.recordDate}
                      className="flex-1 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2">
                      {savingOld?<><RefreshCw className="w-3.5 h-3.5 animate-spin"/>Saving…</>:'Save Old Record'}
                    </button>
                  </div>
                </div>
              )}

              {loadingOld
                ? <div className="flex items-center justify-center py-8"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"/></div>
                : oldRecords.length === 0
                  ? <div className="text-center py-10 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto mb-2 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      <p className="text-sm">No pre-existing records added yet</p>
                      <p className="text-xs mt-1">Use "Add Old Record" to log records from before the system.</p>
                    </div>
                  : <div className="space-y-3">
                      {oldRecords.map((r: any) => (
                        <div key={r.id} className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${r.record_type==='Vaccination'?'bg-green-100 text-green-700':r.record_type==='Treatment'?'bg-red-100 text-red-700':'bg-blue-100 text-blue-700'}`}>
                              {r.record_type}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 bg-amber-200 text-amber-800 text-[10px] font-bold rounded-full">Old Record</span>
                              <p className="text-xs text-gray-400">{fmtDate(r.record_date)}</p>
                            </div>
                          </div>
                          {r.vaccine_name && <p className="text-sm text-gray-700 mb-1"><span className="font-semibold">Vaccine:</span> {r.vaccine_name}</p>}
                          {r.lot_number && <p className="text-xs text-gray-500 mb-1"><span className="font-semibold">Lot:</span> {r.lot_number}</p>}
                          {r.notes && <p className="text-xs text-gray-500 italic mt-1">{r.notes}</p>}
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-400">By: {r.veterinarian || r.created_by}</p>
                            {r.next_due_date && <p className="text-xs text-blue-600 font-semibold">Next: {fmtDate(r.next_due_date)}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── LOST/FOUND MODAL ────────────────────────────────────────────────────────

function ConfidenceBadge({ c }: { c: "High"|"Medium"|"Low" }) {
  const cfg = {
    High:   { bg:"bg-green-100",  text:"text-green-700",  dot:"bg-green-500",  label:"High Confidence"   },
    Medium: { bg:"bg-amber-100",  text:"text-amber-700",  dot:"bg-amber-500",  label:"Medium Confidence" },
    Low:    { bg:"bg-orange-100", text:"text-orange-700", dot:"bg-orange-500", label:"Low Confidence"    },
  }[c];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}/>
      {cfg.label}
    </span>
  );
}

function FactorBar({ factor }: { factor: MatchFactor }) {
  const pct = factor.max > 0 ? (factor.points / factor.max) * 100 : 0;
  return (
    <div className={`rounded-xl p-3 border ${factor.matched ? "bg-green-50 border-green-100" : "bg-gray-50 border-gray-100"}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-base">{factor.icon}</span>
          <span className="text-xs font-bold text-gray-700">{factor.label}</span>
        </div>
        <span className={`text-xs font-black ${factor.matched ? "text-green-600" : "text-gray-400"}`}>
          {factor.points}/{factor.max}
        </span>
      </div>
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1.5">
        <div
          className={`h-full rounded-full transition-all ${factor.matched ? "bg-green-500" : "bg-gray-300"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 leading-snug">{factor.detail}</p>
    </div>
  );
}

function LostFoundModal({ report, all, pets, onClose, onResolve }: {
  report: LFReport; all: LFReport[]; pets: Pet[];
  onClose: () => void; onResolve: (id: string, matchId: string) => void;
}) {
  const matches = getMatches(report, all);
  const linkedPet = pets.find(p => p.id === (report.pet_id || report.petId));
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-5 flex items-center justify-between shrink-0 ${
          report.type === "Lost"
            ? "bg-gradient-to-r from-red-600 to-orange-500"
            : "bg-gradient-to-r from-green-600 to-emerald-500"
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-white/25 text-white text-xs font-bold rounded-full">
                {report.type.toUpperCase()} REPORT
              </span>
              <span className="text-white/60 text-xs">{report.id}</span>
            </div>
            <h3 className="text-xl font-bold text-white">{report.pet_name || report.petName}</h3>
            <p className="text-white/80 text-sm">
              {report.species} · {report.breed} · {report.color}
            </p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Report info */}
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Reported By",  report.reported_by || report.reportedBy || "—"],
              ["Contact",      report.contact_number || report.contactNumber || "—"],
              ["Last Seen",    report.last_seen_location || report.lastSeenLocation || "—"],
              ["Barangay",     report.barangay],
              ["Date Reported",fmtDate(report.date_reported || report.dateReported)],
              ["Status",       report.status],
            ].map(([k, v]) => (
              <div key={k} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{k}</p>
                <p className="text-sm font-semibold text-gray-800">{v}</p>
              </div>
            ))}
            <div className="col-span-2 bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-gray-700 leading-relaxed">{report.description || "—"}</p>
            </div>
          </div>

          {/* Linked pet record */}
          {linkedPet && (
            <div className="border border-blue-200 bg-blue-50 rounded-xl p-4">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <ITag className="w-3.5 h-3.5"/>Linked Pet Record
              </p>
              <div className="flex items-center gap-3">
                {petPhoto(linkedPet)
                  ? <img src={petPhoto(linkedPet)} className="w-14 h-14 rounded-xl object-cover border border-blue-200" alt=""/>
                  : <div className="w-14 h-14 rounded-xl bg-blue-200 flex items-center justify-center">
                      <IPawPrint className="w-7 h-7 text-blue-600"/>
                    </div>
                }
                <div>
                  <p className="font-bold text-blue-800 text-sm">{pn(linkedPet)} <span className="text-blue-500 font-mono text-xs">({linkedPet.id})</span></p>
                  <p className="text-sm text-blue-600">Owner: {on(linkedPet)}</p>
                  <p className="text-xs text-blue-500">{linkedPet.contact_number || linkedPet.ownerContact}</p>
                </div>
              </div>
            </div>
          )}

          {/* Smart Match Engine */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
                <IZap className="w-4 h-4 text-amber-600"/>
              </div>
              <p className="font-bold text-gray-900">Smart Match Engine</p>
              {matches.length > 0 && (
                <span className="ml-auto px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                  {matches.length} candidate{matches.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {matches.length === 0 ? (
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <IAlertCircle className="w-7 h-7 text-gray-300"/>
                </div>
                <p className="text-sm font-semibold text-gray-500">No matches found yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  New reports are automatically scored when added
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {matches.map((m) => (
                  <div key={m.report.id}
                    className={`rounded-2xl border-2 overflow-hidden transition-all ${
                      m.confidence === "High"   ? "border-green-300 shadow-green-100 shadow-md" :
                      m.confidence === "Medium" ? "border-amber-200 shadow-amber-50 shadow-sm" :
                                                  "border-gray-200"
                    }`}
                  >
                    {/* Match header */}
                    <div className={`px-5 py-4 flex items-center justify-between ${
                      m.confidence === "High"   ? "bg-gradient-to-r from-green-50 to-emerald-50" :
                      m.confidence === "Medium" ? "bg-gradient-to-r from-amber-50 to-yellow-50" :
                                                  "bg-gray-50"
                    }`}>
                      <div className="flex items-start gap-3">
                        {/* Score ring */}
                        <div className="relative w-14 h-14 shrink-0">
                          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                            <circle cx="28" cy="28" r="24" fill="none" stroke="#e5e7eb" strokeWidth="5"/>
                            <circle cx="28" cy="28" r="24" fill="none"
                              stroke={m.confidence==="High"?"#16a34a":m.confidence==="Medium"?"#d97706":"#f97316"}
                              strokeWidth="5"
                              strokeDasharray={`${2*Math.PI*24}`}
                              strokeDashoffset={`${2*Math.PI*24*(1-m.score/100)}`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-sm font-black leading-none ${
                              m.confidence==="High"?"text-green-700":m.confidence==="Medium"?"text-amber-700":"text-orange-600"
                            }`}>{m.score}%</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                              m.report.type==="Found"?"bg-green-100 text-green-700":"bg-red-100 text-red-700"
                            }`}>{m.report.type}</span>
                            <span className="text-xs text-gray-400 font-mono">{m.report.id}</span>
                            <ConfidenceBadge c={m.confidence}/>
                          </div>
                          <p className="font-bold text-gray-900 text-sm">
                            {m.report.pet_name || m.report.petName || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-600">
                            {m.report.breed} · {m.report.color} · {m.report.barangay}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Reported by {m.report.reported_by || m.report.reportedBy} · {m.report.contact_number || m.report.contactNumber || "—"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Factor breakdown toggle */}
                    <div className="px-5 py-3 border-t border-gray-100 bg-white">
                      <button
                        onClick={() => setExpandedMatch(expandedMatch === m.report.id ? null : m.report.id)}
                        className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <IActivity className="w-3.5 h-3.5"/>
                          Factor Breakdown · {m.factors.filter(f=>f.matched).length}/{m.factors.length} criteria matched
                        </span>
                        <IChevronRight className={`w-4 h-4 transition-transform ${expandedMatch===m.report.id?"rotate-90":""}`}/>
                      </button>

                      {expandedMatch === m.report.id && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {m.factors.map(f => <FactorBar key={f.label} factor={f}/>)}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {report.status === "Open" && (
                      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex gap-2">
                        <button
                          onClick={() => { onResolve(report.id, m.report.id); onClose(); }}
                          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 transition-colors"
                        >
                          <ICheckCircle className="w-3.5 h-3.5"/>Mark as Reunited
                        </button>
                        <a
                          href={`tel:${m.report.contact_number || m.report.contactNumber || ""}`}
                          className="flex items-center gap-1.5 px-4 py-2 bg-blue-100 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-200 transition-colors"
                        >
                          <IPhone className="w-3.5 h-3.5"/>Contact Reporter
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              report.status === "Open" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-500"
            }`}>{report.status}</span>
            {report.status === "Open" && (
              <button
                onClick={() => { onResolve(report.id, ""); onClose(); }}
                className="text-sm text-gray-400 hover:text-gray-700 underline transition-colors"
              >
                Mark resolved (no match)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── SCHEDULE MANAGE MODAL ───────────────────────────────────────────────────
function ScheduleManageModal({ schedule, onClose, onSave }: {
  schedule: BarangaySchedule;
  onClose: () => void;
  onSave: (id: string, data: any) => Promise<void>;
}) {
  const [status,     setStatus]     = useState(schedule.status);
  const [registered, setRegistered] = useState(String(schedule.registered || schedule.registeredPets || 0));
  const [notes,      setNotes]      = useState((schedule as any).notes || "");
  const [saving,     setSaving]     = useState(false);

  const reg     = Math.max(0, parseInt(registered) || 0);
  const fillPct = schedule.capacity > 0 ? Math.min((reg / schedule.capacity) * 100, 100) : 0;
  const STATUS_OPTS  = ["Scheduled","Upcoming","Completed","Cancelled"];
  const STATUS_COLOR: Record<string,string> = {
    Scheduled:"bg-blue-100 text-blue-700", Upcoming:"bg-indigo-100 text-indigo-700",
    Completed:"bg-green-100 text-green-700", Cancelled:"bg-red-100 text-red-700",
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(schedule.id, { status, registered: reg, notes });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-[#1e4080] to-[#2B5EA6] px-6 py-5 flex items-center justify-between">
          <div>
            <p className="font-bold text-white text-lg">{schedule.barangay}</p>
            <p className="text-white/70 text-xs">{fmtDate(schedule.date)} · {schedule.time_start || schedule.time || "—"}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Venue",    schedule.venue || schedule.location || "—"],
              ["Capacity", String(schedule.capacity) + " slots"],
              ["ID",       schedule.id],
              ["Date",     fmtDate(schedule.date)],
            ].map(([k,v]) => (
              <div key={k} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{k}</p>
                <p className="text-sm font-semibold text-gray-800">{v}</p>
              </div>
            ))}
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Status</label>
            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTS.map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                    status === s
                      ? (STATUS_COLOR[s] + " border-current scale-105")
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}>{s}</button>
              ))}
            </div>
          </div>

          {/* Registered count */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
              Registered Pets
            </label>
            <div className="flex items-center gap-3">
              <button onClick={() => setRegistered(r => String(Math.max(0, (parseInt(r)||0) - 1)))}
                className="w-9 h-9 rounded-xl border border-gray-200 text-gray-600 text-xl font-bold hover:bg-gray-50 flex items-center justify-center">−</button>
              <input type="number" min="0" max={schedule.capacity} value={registered}
                onChange={e => setRegistered(e.target.value)}
                className="flex-1 text-center border border-gray-200 rounded-xl py-2 text-xl font-black text-gray-900 outline-none focus:ring-2 focus:ring-[#2B5EA6]"/>
              <button onClick={() => setRegistered(r => String(Math.min(schedule.capacity, (parseInt(r)||0) + 1)))}
                className="w-9 h-9 rounded-xl border border-gray-200 text-gray-600 text-xl font-bold hover:bg-gray-50 flex items-center justify-center">+</button>
              <span className="text-sm text-gray-400 shrink-0">/ {schedule.capacity}</span>
            </div>
            <div className="mt-2 w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${fillPct>=90?"bg-red-400":fillPct>=60?"bg-amber-400":"bg-[#60A85C]"}`}
                style={{ width: `${fillPct}%` }}/>
            </div>
            <p className="text-xs text-gray-400 mt-1 text-right">{fillPct.toFixed(0)}% full</p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Remarks, attendance notes…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2B5EA6] resize-none"/>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 bg-[#2B5EA6] text-white rounded-xl text-sm font-bold hover:bg-[#234a85] disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <><IRefreshCw className="w-4 h-4 animate-spin"/>Saving…</> : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SCHEDULE CALENDAR ───────────────────────────────────────────────────────

function ScheduleCalendar({ schedules, onAdd, onManage, onStatusChange }: {
  schedules: BarangaySchedule[];
  onAdd: () => void;
  onManage: (s: BarangaySchedule) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [filterBrgy, setFilterBrgy] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const allThisMonth = schedules.filter(s => {
    const d = new Date(s.date);
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
  });

  const filteredThisMonth = allThisMonth.filter(s =>
    (filterBrgy === "all" || s.barangay === filterBrgy) &&
    (filterStatus === "all" || s.status === filterStatus)
  );

  const getForDay = (day: number) =>
    schedules.filter(s => {
      const d = new Date(s.date);
      return d.getFullYear() === viewYear && d.getMonth() === viewMonth && d.getDate() === day;
    });

  const STATUS_CFG: Record<string, { bg: string; text: string; dot: string; calBg: string }> = {
    Scheduled:  { bg:"bg-blue-50",   text:"text-blue-700",  dot:"bg-blue-500",  calBg:"bg-[#2B5EA6]"  },
    Upcoming:   { bg:"bg-indigo-50", text:"text-indigo-700",dot:"bg-indigo-500",calBg:"bg-indigo-500"  },
    Completed:  { bg:"bg-green-50",  text:"text-green-700", dot:"bg-green-500", calBg:"bg-green-500"   },
    Cancelled:  { bg:"bg-red-50",    text:"text-red-700",   dot:"bg-red-400",   calBg:"bg-red-400"     },
  };

  const getCfg = (status: string) => STATUS_CFG[status] || STATUS_CFG["Scheduled"];

  // Summary stats
  const upcoming  = allThisMonth.filter(s => s.status === "Scheduled" || s.status === "Upcoming").length;
  const completed = allThisMonth.filter(s => s.status === "Completed").length;
  const totalCap  = allThisMonth.reduce((a, s) => a + (s.capacity || 0), 0);
  const totalReg  = allThisMonth.reduce((a, s) => a + (s.registered || s.registeredPets || 0), 0);

  return (
    <div className="space-y-4">
      {/* Month summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label:"Scheduled",  value: upcoming,   color:"text-blue-600",  bg:"bg-blue-50",   border:"border-blue-200"  },
          { label:"Completed",  value: completed,  color:"text-green-600", bg:"bg-green-50",  border:"border-green-200" },
          { label:"Total Slots",value: totalCap,   color:"text-gray-700",  bg:"bg-gray-50",   border:"border-gray-200"  },
          { label:"Registered", value: totalReg,   color:"text-purple-600",bg:"bg-purple-50", border:"border-purple-200"},
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-3 text-center`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-[#1e4080] to-[#2B5EA6] px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); }}
            className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
          ><IChevronLeft className="w-5 h-5 text-white"/></button>
          <div className="text-center">
            <p className="text-white font-bold text-xl">{MONTHS[viewMonth]} {viewYear}</p>
            <p className="text-white/60 text-xs">{allThisMonth.length} schedule{allThisMonth.length !== 1 ? "s" : ""} this month</p>
          </div>
          <button
            onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); } else setViewMonth(m => m+1); }}
            className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
          ><IChevronRight className="w-5 h-5 text-white"/></button>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => <div key={d} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({length: firstDay}, (_, i) => <div key={`e${i}`}/>)}
            {Array.from({length: daysInMonth}, (_, i) => {
              const day = i + 1;
              const ds = getForDay(day);
              const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
              const isPast  = new Date(viewYear, viewMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
              return (
                <div key={day} className={`min-h-[60px] rounded-xl p-1.5 border transition-colors ${
                  isToday ? "border-[#2B5EA6] bg-blue-50 ring-2 ring-[#2B5EA6]/20" :
                  ds.length ? "border-gray-200 bg-white hover:bg-gray-50" :
                  isPast ? "border-transparent bg-gray-50/50" :
                  "border-transparent hover:bg-gray-50"
                }`}>
                  <p className={`text-xs font-bold mb-1 ${isToday ? "text-[#2B5EA6]" : isPast ? "text-gray-300" : "text-gray-600"}`}>{day}</p>
                  {ds.map(s => {
                    const cfg = getCfg(s.status);
                    return (
                      <button key={s.id} onClick={() => onManage(s)}
                        className={`w-full text-left px-1.5 py-0.5 rounded-md text-white text-[9px] font-bold truncate block mb-0.5 ${cfg.calBg} hover:opacity-90 transition-opacity`}
                        title={`${s.barangay} — ${s.status}`}
                      >
                        {s.barangay.replace("Poblacion","Pob.").replace("Putting Bato","PB").replace("Lumbang","Lmb")}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100">
            {Object.entries(STATUS_CFG).map(([status, cfg]) => (
              <div key={status} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`}/>
                <span className="text-xs text-gray-500">{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Schedule list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <p className="font-bold text-gray-800 flex-1">Schedules — {MONTHS[viewMonth]} {viewYear}</p>
          <select value={filterBrgy} onChange={e => setFilterBrgy(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none">
            <option value="all">All Barangays</option>
            {CALACA_BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none">
            <option value="all">All Status</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button onClick={onAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#2B5EA6] text-white rounded-xl text-xs font-bold hover:bg-[#234a85] transition-colors">
            <IPlus className="w-3.5 h-3.5"/>Add Schedule
          </button>
        </div>

        {filteredThisMonth.length === 0 ? (
          <div className="p-10 text-center">
            <ICalendar className="w-10 h-10 text-gray-200 mx-auto mb-2"/>
            <p className="text-gray-400 text-sm">No schedules match your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredThisMonth
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map(s => {
                const cfg = getCfg(s.status);
                const reg = s.registered || s.registeredPets || 0;
                const fillPct = s.capacity > 0 ? Math.min((reg / s.capacity) * 100, 100) : 0;
                return (
                  <div key={s.id} className="px-5 py-4 hover:bg-gray-50/60 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* Date badge */}
                      <div className={`${cfg.calBg} w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white shrink-0 shadow-sm`}>
                        <p className="text-[10px] font-bold leading-none opacity-80">
                          {MONTHS[new Date(s.date).getMonth()].slice(0,3).toUpperCase()}
                        </p>
                        <p className="text-2xl font-black leading-tight">{new Date(s.date).getDate()}</p>
                        <p className="text-[9px] font-semibold opacity-70 leading-none">
                          {new Date(s.date).toLocaleDateString("en",{weekday:"short"}).toUpperCase()}
                        </p>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-bold text-gray-900 text-sm">{s.barangay}</p>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${cfg.bg} ${cfg.text}`}>
                            {s.status}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">{s.id}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1"><IClock className="w-3 h-3"/>{s.time_start || s.time || "—"}</span>
                          <span className="flex items-center gap-1"><IMapPin className="w-3 h-3"/>{s.venue || s.location || "—"}</span>
                        </div>
                        {/* Progress bar */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${fillPct>=90?"bg-red-400":fillPct>=60?"bg-amber-400":"bg-[#60A85C]"}`}
                              style={{ width: `${fillPct}%` }}/>
                          </div>
                          <span className="text-xs text-gray-500 shrink-0">{reg}/{s.capacity} slots</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button onClick={() => onManage(s)}
                          className="px-3 py-1.5 bg-[#2B5EA6] text-white text-xs font-bold rounded-lg hover:bg-[#234a85] transition-colors">
                          Manage
                        </button>
                        {s.status !== "Completed" && s.status !== "Cancelled" && (
                          <button onClick={() => onStatusChange(s.id, "Completed")}
                            className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-lg hover:bg-green-200 transition-colors">
                            Complete
                          </button>
                        )}
                        {s.status !== "Cancelled" && s.status !== "Completed" && (
                          <button onClick={() => onStatusChange(s.id, "Cancelled")}
                            className="px-3 py-1.5 bg-red-50 text-red-500 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors">
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            }
          </div>
        )}
      </div>
    </div>
  );
}

// ─── VACCINATE MODAL ─────────────────────────────────────────────────────────

function VaccinateModal({ pet, onConfirm, onClose }: { pet:Pet; onConfirm:(p:Pet)=>void; onClose:()=>void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"><ISyringe className="w-4 h-4 text-white"/></div><p className="font-bold text-white">Record Vaccination</p></div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 bg-green-50 rounded-xl p-4">
            {petPhoto(pet)?<img src={petPhoto(pet)} className="w-14 h-14 rounded-xl object-cover" alt=""/>:<div className="w-14 h-14 bg-green-200 rounded-xl flex items-center justify-center"><IPawPrint className="w-7 h-7 text-green-600"/></div>}
            <div><p className="font-bold text-gray-800">{pn(pet)}</p><p className="text-sm text-gray-600">{pet.species} · {pet.breed}</p><p className="text-xs text-gray-500">Owner: {on(pet)}</p></div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700 space-y-1">
            <p className="font-semibold flex items-center gap-1.5"><IInfo className="w-4 h-4"/>What will be recorded:</p>
            <p>• Vaccination date: <strong>Today ({fmtDate(new Date().toISOString().split("T")[0])})</strong></p>
            <p>• Next due date: <strong>1 year from today</strong></p>
            <p>• Status: <strong>Vaccinated</strong></p>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
            <button onClick={()=>onConfirm(pet)} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 flex items-center justify-center gap-1.5"><ISyringe className="w-4 h-4"/>Confirm</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

import { BitingIncidents } from './BitingIncidents';
import { VaccinationCard } from './VaccinationCard';

export function PetRegistration({ userRole, initialTab }: { userRole?: string; initialTab?: "overview"|"pets"|"lost-found"|"impounded"|"biting" } = {}) {
  const role = userRole || (() => { try { return JSON.parse(sessionStorage.getItem('nasaalaga_user') || '{}').role; } catch { return undefined; } })();
  const isBahw = role === 'bahw';
  const bahwBarangay = (() => { try { return JSON.parse(sessionStorage.getItem('nasaalaga_user') || '{}').barangay || ''; } catch { return ''; } })();
  const [pets, setPets] = useState<Pet[]>([]);
  const [archivedPets, setArchivedPets] = useState<Pet[]>([]);
  const [filterReg, setFilterReg] = useState<"all"|"expiring"|"expired"|"archived">("all");
  const [archiveSummary, setArchiveSummary] = useState<any>(null);
  const [busyPet, setBusyPet] = useState<string|null>(null);
  const [reports, setReports] = useState<LFReport[]>([]);
  const [schedules, setSchedules] = useState<BarangaySchedule[]>([]);
  const [survey, setSurvey] = useState<SurveyData|null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview"|"pets"|"lost-found"|"impounded"|"biting">(initialTab ?? "overview");
  const [showImpoundForm, setShowImpoundForm] = useState(false);
  const [impoundForm, setImpoundForm] = useState({ petName:'', species:'Dog', breed:'', color:'', barangay:'', lastSeenLocation:'', description:'', impoundLocation:'', impoundOfficer:'', impoundDate:new Date().toISOString().split('T')[0] });
  const [savingImpound, setSavingImpound] = useState(false);
  const [impoundedReports, setImpoundedReports] = useState<any[]>([]);
  const [vaxCardPet, setVaxCardPet] = useState<any>(null);
  const [vaxCardHistory, setVaxCardHistory] = useState<any[]>([]);
  const [vaxCardLoading, setVaxCardLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filterVax, setFilterVax] = useState("all");
  const [filterSpecies, setFilterSpecies] = useState("all");
  const [filterBrgy, setFilterBrgy] = useState("all");
  const [filterType, setFilterType] = useState<"all"|"Lost"|"Found">("all");
  const [filterImpound, setFilterImpound] = useState<"all"|"impounded">("all");

  const [showNewPet, setShowNewPet] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const [showVaccinate, setShowVaccinate] = useState(false);
  const [showLFDialog, setShowLFDialog] = useState(false);
  const [showScheduleAdd, setShowScheduleAdd] = useState(false);
  const [viewPet, setViewPet] = useState<Pet|null>(null);
  const [viewReport, setViewReport] = useState<LFReport|null>(null);
  const [manageSchedule, setManageSchedule] = useState<BarangaySchedule|null>(null);
  const [vaccinatePet, setVaccinatePet] = useState<Pet|null>(null);
  const [saving, setSaving] = useState(false);

  const [np, setNp] = useState({
    petName:"",species:"",breed:"",age:"",color:"",gender:"",
    isSpayed:false,isNeutered:false,
    ownerName:"",ownerContact:"",ownerAddress:"",barangay:"",
    microchipId:"",photoUrl:"",
    impoundStatus:"None",impoundReason:"",tagNumber:""
  });
  const [ownerSuggestions, setOwnerSuggestions] = useState<{id:string;username:string;owner_id:string;email:string;barangay:string;address:string}[]>([]);
  const [ownerLookupTimer, setOwnerLookupTimer] = useState<any>(null);
  const [selectedOwnerId, setSelectedOwnerId]   = useState<string|null>(null);
  const [isUnregisteredOwner, setIsUnregisteredOwner] = useState(false);
  const [generatedTempId, setGeneratedTempId]   = useState<string|null>(null);
  const [showOwnerSugg, setShowOwnerSugg]       = useState(false);
  const [lfForm, setLfForm] = useState({ petId:"",type:"Lost" as "Lost"|"Found", reportedBy:"",contactNumber:"",lastSeenLocation:"",barangay:"",description:"",species:"",breed:"",color:"" });
  const [lfPetSearch, setLfPetSearch] = useState("");
  const [lfPetSuggestions, setLfPetSuggestions] = useState<Pet[]>([]);
  const [showLfPetSugg, setShowLfPetSugg] = useState(false);
  const [schForm, setSchForm] = useState({ barangay:"",date:"",time:"",location:"",capacity:"100" });

  useEffect(() => { loadAll(); }, []);

  // Pre-fill/lock all barangay-entry forms with the BAHW's own assigned
  // barangay — the server also enforces this, this just keeps the UI and
  // client-side validation consistent with a BAHW's scope.
  useEffect(() => {
    if (isBahw && bahwBarangay) {
      setNp(p => p.barangay ? p : ({ ...p, barangay: bahwBarangay }));
      setLfForm(p => p.barangay ? p : ({ ...p, barangay: bahwBarangay }));
      setImpoundForm(p => p.barangay ? p : ({ ...p, barangay: bahwBarangay }));
      setSchForm(p => p.barangay ? p : ({ ...p, barangay: bahwBarangay }));
    }
  }, [isBahw, bahwBarangay]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [pRes, rRes, sRes, svRes] = await Promise.all([
        api.getPets(), api.getLostFound(), api.getSchedules(), api.getPetSurveyData()
      ]);
      setPets(pRes.pets || []);
      // Archive + renewal summary are staff-only extras; never let them break the main load.
      api.getPets(undefined, 'only').then((r: any) => setArchivedPets(r.pets || [])).catch(() => setArchivedPets([]));
      api.getPetArchiveSummary().then((r: any) => setArchiveSummary(r)).catch(() => setArchiveSummary(null));
      setReports(rRes.reports || rRes.lostFoundReports || []);
      setSchedules(sRes.schedules || []);
      setSurvey(svRes);
    } catch(e) { console.error("load error", e); }
    setLoading(false);
  };

  const handleAddPet = async () => {
    if(!np.petName||!np.species||!np.breed||!np.ownerName||!np.barangay) return;
    setSaving(true);
    try {
      const res = await api.createPet({
        petName: np.petName, species: np.species, breed: np.breed, age: np.age,
        color: np.color, gender: np.gender || null,
        isSpayed: np.isSpayed, isNeutered: np.isNeutered,
        ownerName: np.ownerName, contactNumber: np.ownerContact, address: np.ownerAddress,
        barangay: np.barangay, microchipId: np.microchipId || null,
        photoUrl: np.photoUrl || null, vaccinationStatus: "Not Vaccinated",
        impoundStatus: np.impoundStatus || "None",
        impoundReason: np.impoundReason || null,
        tagNumber: np.tagNumber || undefined,
        ownerId: selectedOwnerId || undefined,
        isUnregistered: isUnregisteredOwner,
      });
      if (res.pet) setPets(prev => [res.pet, ...prev]);
      if (res.tempId) {
        setGeneratedTempId(res.tempId);
      } else {
        setShowNewPet(false);
        setNp({ petName:"",species:"",breed:"",age:"",color:"",gender:"",isSpayed:false,isNeutered:false,ownerName:"",ownerContact:"",ownerAddress:"",barangay:"",microchipId:"",photoUrl:"",impoundStatus:"None",impoundReason:"",tagNumber:""});
        setSelectedOwnerId(null); setIsUnregisteredOwner(false); setGeneratedTempId(null);
      }
      await loadAll();
    } catch(e:any) { alert("Error: " + e.message); }
    setSaving(false);
  };

  const canRenew = ["admin","superadmin","cvoStaff","bahw"].includes(role || "");
  const canArchive = ["admin","superadmin","cvoStaff"].includes(role || "");

  const handleRenew = async (pet: Pet) => {
    const restoring = !!pet.is_archived;
    if (!confirm(restoring
      ? `Restore ${pn(pet)} from the archive and renew the registration for 12 months?`
      : `Renew ${pn(pet)}'s registration for another 12 months?`)) return;
    setBusyPet(pet.id);
    try {
      const r = restoring ? await api.restorePet(pet.id) : await api.renewPet(pet.id);
      toast.success(restoring ? `${pn(pet)} restored — valid until ${fmtDate(r.pet?.renewal_due_date)}` : `Registration renewed — valid until ${fmtDate(r.pet?.renewal_due_date)}`);
      await loadAll();
    } catch (e: any) { toast.error(e.message || "Could not renew registration"); }
    setBusyPet(null);
  };

  const handleArchive = async (pet: Pet) => {
    const reason = prompt(`Archive ${pn(pet)}? It will be hidden from lists and reports but can be restored later.\n\nReason (optional):`);
    if (reason === null) return;
    setBusyPet(pet.id);
    try { await api.archivePet(pet.id, reason || undefined); toast.success(`${pn(pet)} archived`); await loadAll(); }
    catch (e: any) { toast.error(e.message || "Could not archive pet"); }
    setBusyPet(null);
  };

  const handleVaccinate = async (pet: Pet) => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const next = new Date(today); next.setFullYear(next.getFullYear()+1);
    const nextStr = next.toISOString().split("T")[0];
    try {
      // 1. Update pet vaccination status fields
      await api.updatePet(pet.id, {
        vaccinationStatus: "Vaccinated",
        lastVaccinationDate: todayStr,
        nextVaccinationDate: nextStr,
      });
      // 2. Also write a vaccination_history record so the Vaccination Card shows it
      try {
        await api.recordVaccination({
          petId: pet.id,
          dateOfVaccination: todayStr,
          vaccineName: "Anti-Rabies Vaccine",
          notes: "Recorded via Pet Registration",
        });
      } catch(vaxErr) {
        // Non-fatal: status already updated above, history write is best-effort
        console.warn("Could not write vaccination_history entry:", vaxErr);
      }
      setPets(prev => prev.map(p => p.id === pet.id ? {
        ...p, vaccination_status:"Vaccinated",
        last_vaccination_date: todayStr,
        next_vaccination_date: nextStr,
      } : p));
    } catch(e:any) { alert("Error: " + e.message); }
    setShowVaccinate(false); setVaccinatePet(null);
  };

  const handleAddLF = async () => {
    if(!lfForm.reportedBy||!lfForm.contactNumber||!lfForm.barangay||!lfForm.description) return;
    setSaving(true);
    try {
      const pet = pets.find(p => p.id === lfForm.petId);
      const res = await api.createLostFound({
        petId: lfForm.petId || "UNKNOWN",
        petName: pet ? pn(pet) : "Unknown",
        species: lfForm.species || pet?.species || "Unknown",
        breed: lfForm.breed || pet?.breed || "Unknown",
        color: lfForm.color || pet?.color || "Unknown",
        type: lfForm.type, reportedBy: lfForm.reportedBy,
        contactNumber: lfForm.contactNumber,
        lastSeenLocation: lfForm.lastSeenLocation,
        barangay: lfForm.barangay, description: lfForm.description,
      });
      if (res.report) setReports(prev => [res.report, ...prev]);
      if (lfForm.type === "Lost" && pet) {
        await api.updatePet(pet.id, { status: "Lost" });
        setPets(prev => prev.map(p => p.id === pet.id ? { ...p, status: "Lost" } : p));
      }
      setLfForm({ petId:"",type:"Lost",reportedBy:"",contactNumber:"",lastSeenLocation:"",barangay:"",description:"",species:"",breed:"",color:"" });
      setLfPetSearch("");
      setShowLfPetSugg(false);
      setShowLFDialog(false);
      await loadAll();
    } catch(e:any) { alert("Error: " + e.message); }
    setSaving(false);
  };

  const handleResolve = async (id: string, matchId: string) => {
    try {
      await api.updateLostFound(id, { status: "Resolved" });
      if (matchId) await api.updateLostFound(matchId, { status: "Resolved" });
      setReports(prev => prev.map(r => r.id===id||r.id===matchId ? { ...r, status:"Resolved" } : r));
    } catch(e:any) { alert("Error: " + e.message); }
  };

  const handleSaveImpound = async () => {
    if (!impoundForm.petName || !impoundForm.barangay || !impoundForm.impoundLocation) return;
    setSavingImpound(true);
    try {
      // Create a Lost/Found report for the impounded pet so the matching algo can find potential owners
      const res = await api.createLostFound({
        petId: "IMPOUND",
        petName: impoundForm.petName,
        species: impoundForm.species,
        breed: impoundForm.breed,
        color: impoundForm.color,
        type: "Found",
        reportedBy: impoundForm.impoundOfficer || "Pound Officer",
        contactNumber: "",
        lastSeenLocation: impoundForm.lastSeenLocation || impoundForm.impoundLocation,
        barangay: impoundForm.barangay,
        description: `[IMPOUNDED] ${impoundForm.description} | Impound Facility: ${impoundForm.impoundLocation}`,
        impoundDate: impoundForm.impoundDate,
        impoundLocation: impoundForm.impoundLocation,
        isImpound: true,
      });
      const newRecord = {
        id: res.report?.id || `IMP-${Date.now()}`,
        petName: impoundForm.petName,
        species: impoundForm.species,
        breed: impoundForm.breed,
        color: impoundForm.color,
        barangay: impoundForm.barangay,
        lastSeenLocation: impoundForm.lastSeenLocation,
        impoundLocation: impoundForm.impoundLocation,
        impoundOfficer: impoundForm.impoundOfficer,
        impoundDate: impoundForm.impoundDate,
        description: impoundForm.description,
        status: "Open",
        lostFoundId: res.report?.id,
      };
      setImpoundedReports(prev => [newRecord, ...prev]);
      // Also add to reports so matching algo sees it
      if (res.report) setReports(prev => [res.report, ...prev]);
      setImpoundForm({ petName:'', species:'Dog', breed:'', color:'', barangay:'', lastSeenLocation:'', description:'', impoundLocation:'', impoundOfficer:'', impoundDate:new Date().toISOString().split('T')[0] });
      setShowImpoundForm(false);
    } catch(e:any) { alert("Error saving impound record: " + e.message); }
    setSavingImpound(false);
  };

  const handleResolveImpound = (id: string) => {
    setImpoundedReports(prev => prev.map(r => r.id === id ? { ...r, status: "Resolved" } : r));
    // Also resolve the linked LF report if any
    const imp = impoundedReports.find(r => r.id === id);
    if (imp?.lostFoundId) {
      api.updateLostFound(imp.lostFoundId, { status: "Resolved" }).catch(() => {});
      setReports(prev => prev.map(r => r.id === imp.lostFoundId ? { ...r, status: "Resolved" } : r));
    }
  };

  const handleAddSchedule = async () => {
    if(!schForm.barangay||!schForm.date||!schForm.time||!schForm.location) return;
    setSaving(true);
    try {
      const res = await api.createSchedule({
        barangay: schForm.barangay, date: schForm.date,
        timeStart: schForm.time, venue: schForm.location, capacity: +schForm.capacity||100,
      });
      if (res.schedule) setSchedules(prev => [...prev, res.schedule]);
      if (res.notification) {
        alert(res.notification.recipients > 0
          ? `Schedule saved. Emailing ${res.notification.recipients} resident${res.notification.recipients === 1 ? '' : 's'} in Brgy. ${schForm.barangay}.`
          : `Schedule saved. No registered residents with an email were found in Brgy. ${schForm.barangay}, so no email was sent.`);
      }
      setSchForm({ barangay:"",date:"",time:"",location:"",capacity:"100" });
      setShowScheduleAdd(false);
    } catch(e:any) { alert("Error: " + e.message); }
    setSaving(false);
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.updateSchedule(id, { status });
      setSchedules(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    } catch(e: any) { alert("Error: " + e.message); }
  };

  const handleExportPets = () => {
    const csv = ["Pet ID,Name,Species,Breed,Age,Color,Gender,Spayed,Neutered,Owner,Contact,Barangay,Vaccination,Last Vaccinated,Status,Impounded",
      ...filteredPets.map(p=>`${p.id},${pn(p)},${p.species},${p.breed},${p.age||""},${p.color},${p.gender||""},${spayed(p)},${neutered(p)},${on(p)},${p.contact_number||""},${brgy(p)},${vs(p)},${p.last_vaccination_date||""},${p.status},${impound(p)||"No"}`)
    ].join("\n");
    const b = new Blob([csv],{type:"text/csv"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download="pet_records.csv"; a.click();
  };

  // ── Computed
  const filteredPets = (filterReg === "archived" ? archivedPets : pets).filter(p => {
    const s = search.toLowerCase();
    const m = pn(p).toLowerCase().includes(s)||on(p).toLowerCase().includes(s)||p.id.toLowerCase().includes(s)||p.breed.toLowerCase().includes(s);
    const v = filterVax==="all"||(filterVax==="vaccinated"&&vs(p)==="Vaccinated")||(filterVax==="not-vaccinated"&&vs(p)==="Not Vaccinated")||(filterVax==="due-soon"&&vs(p)==="Due Soon");
    const sp2 = filterSpecies==="all"||p.species===filterSpecies;
    const br2 = filterBrgy==="all"||brgy(p)===filterBrgy;
    const imp = filterImpound==="all"||(filterImpound==="impounded"&&!!impound(p));
    const rg = filterReg==="all"||filterReg==="archived"||(filterReg==="expiring"&&p.renewal_status==="expiring")||(filterReg==="expired"&&p.renewal_status==="expired");
    return m&&v&&sp2&&br2&&imp&&rg;
  });

  const filteredReports = reports.filter(r => {
    const s = search.toLowerCase();
    const m = !s||(r.pet_name||r.petName||"").toLowerCase().includes(s)||(r.reported_by||r.reportedBy||"").toLowerCase().includes(s)||r.id.toLowerCase().includes(s)||r.barangay.toLowerCase().includes(s);
    const t = filterType==="all"||r.type===filterType;
    return m&&t;
  });

  const openReports = reports.filter(r=>r.status==="Open");
  const totalMatches = openReports.filter(r=>r.type==="Lost").reduce((a,r)=>a+(getMatches(r,reports).length>0?1:0),0);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#2B5EA6] border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-gray-500 text-sm">Loading pet records…</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 pb-8">
      {/* ── Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <IPawPrint className="w-6 h-6 text-[#2B5EA6]"/>Pets Management
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">Calaca CVO · Rabies Program · Lost & Found · Vaccination Schedules</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={loadAll} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500"><IRefreshCw className="w-4 h-4"/></button>
          <button onClick={()=>setShowNewPet(true)} className="flex items-center gap-2 px-4 py-2 bg-[#2B5EA6] text-white rounded-xl font-semibold text-sm hover:bg-[#234a85] shadow-sm transition-all hover:shadow-md"><IPlus className="w-4 h-4"/>Register Pet</button>
          <button onClick={()=>setShowLFDialog(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl font-semibold text-sm hover:bg-amber-600 shadow-sm"><IAlertCircle className="w-4 h-4"/>Report Lost/Found</button>

        </div>
      </div>

      {/* ── Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 flex gap-1 flex-wrap">
        {([
          ["overview","Overview",<IActivity className="w-4 h-4"/>],
          ["pets",`Pet Records (${pets.length})`,<IPawPrint className="w-4 h-4"/>],
          ["biting","Biting Incidents",<IAlertCircle className="w-4 h-4"/>],
          ["lost-found",`Lost & Found (${openReports.length})`,<IHeart className="w-4 h-4"/>],
          ["impounded",`Impounded (${impoundedReports.length})`,<IShield className="w-4 h-4"/>],

        ] as [string,string,any][]).map(([key,label,icon])=>(
          <button key={key} onClick={()=>setActiveTab(key as any)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${activeTab===key?"bg-[#2B5EA6] text-white shadow-sm":"text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}>
            {icon}{label}
          </button>
        ))}
      </div>

      {/* ══ OVERVIEW */}
      {activeTab==="overview" && (
        <OverviewTab survey={survey} pets={pets} reports={reports} schedules={schedules} onTab={t=>setActiveTab(t as any)}/>
      )}

      {/* ══ PETS */}
      {activeTab==="pets" && (
        <div className="space-y-4">
          {archiveSummary?.summary && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-gray-700 mr-1">Registration renewals</span>
                {([["expiring","Expiring ≤30 days",archiveSummary.summary.expiring,"bg-amber-100 text-amber-700"],
                   ["expired","Expired (pending archive)",archiveSummary.summary.expired,"bg-red-100 text-red-700"],
                   ["archived","Archived",archiveSummary.summary.archived,"bg-gray-200 text-gray-700"]] as [string,string,number,string][]).map(([k,l,n,c])=>(
                  <button key={k} onClick={()=>setFilterReg(filterReg===k?"all":k as any)} className={`px-3 py-1 rounded-full text-xs font-bold ${c} ${filterReg===k?"ring-2 ring-offset-1 ring-[#2B5EA6]":""}`}>{l}: {n}</button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Registrations are valid for {archiveSummary.settings?.renewalMonths ?? 12} months. Unrenewed records are archived automatically
                {!archiveSummary.settings?.enabled ? " — auto-archive is currently OFF." : archiveSummary.settings?.inGrace ? ` — starting after ${fmtDate(archiveSummary.settings.graceUntil)} (grace period).` : "."}
                {" "}Archived pets are hidden from lists and reports, never deleted, and can be restored.
              </p>
            </div>
          )}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px] relative"><ISearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/><input placeholder="Search pets, owners, IDs…" value={search} onChange={e=>setSearch(e.target.value)} className={`${INPUT} pl-9`}/></div>
              <select value={filterVax} onChange={e=>setFilterVax(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white">
                <option value="all">All Status</option><option value="vaccinated">Vaccinated</option><option value="not-vaccinated">Not Vaccinated</option><option value="due-soon">Due Soon</option>
              </select>
              <select value={filterSpecies} onChange={e=>setFilterSpecies(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white">
                <option value="all">All Species</option><option value="Dog">Dogs</option><option value="Cat">Cats</option>
              </select>
              <select value={filterBrgy} onChange={e=>setFilterBrgy(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white">
                <option value="all">All Barangays</option>{CALACA_BARANGAYS.map(b=><option key={b} value={b}>{b}</option>)}
              </select>
              <select value={filterReg} onChange={e=>setFilterReg(e.target.value as any)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white">
                <option value="all">All Registrations</option><option value="expiring">Expiring Soon</option><option value="expired">Expired</option><option value="archived">Archived ({archivedPets.length})</option>
              </select>
              <select value={filterImpound} onChange={e=>setFilterImpound(e.target.value as any)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white">
                <option value="all">All</option><option value="impounded">Impounded Only</option>
              </select>
              <button onClick={handleExportPets} className="flex items-center gap-2 px-4 py-2.5 bg-[#60A85C] text-white rounded-xl text-sm font-semibold hover:bg-[#4a8a47]"><IDownload className="w-4 h-4"/>Export CSV</button>
            </div>
            <p className="text-xs text-gray-400 mt-2">{filteredPets.length} of {filterReg==="archived"?archivedPets.length:pets.length} {filterReg==="archived"?"archived ":""}records shown</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-gray-50 border-b border-gray-100">
                  {["Photo","ID","Pet","Owner","Barangay","S/N","Vaccination","Registration","Actions"].map(h=><th key={h} className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredPets.map(pet=>(
                    <tr key={pet.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-3">
                        {petPhoto(pet)?<img src={petPhoto(pet)} alt={pn(pet)} className="w-10 h-10 rounded-xl object-cover border border-gray-200"/>:<div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center border border-dashed border-gray-300"><IPawPrint className="w-4 h-4 text-gray-400"/></div>}
                      </td>
                      <td className="py-3 px-3">
  {(()=>{
    const BARANGAY_ZONES: Record<string,string> = {
      "Baclas":"North","Balimbing":"North","Bambang":"North","Bisaya":"North",
      "Madalunot":"North","Matipok":"North","Munting Coral":"North","Niyugan":"North","Tamayo":"North",
      "Bagong Tubig":"West","Cahil":"West","Calantas":"West","Coral Ni Lopez":"West",
      "Dacanlao":"West","Loma":"West","Makina":"West","Pantay":"West","Taklang Anak":"West","Timbain":"West",
      "Caluangan":"East","Coral Ni Bacal":"East","Dila":"East","Lumbang Na Bata":"East",
      "Lumbang Na Matanda":"East","Poblacion 1":"East","Poblacion 2":"East","Poblacion 3":"East",
      "Poblacion 4":"East","Poblacion 6":"East",
      "Camastilisan":"Baybay-Highway","Lumbang Calzada":"Baybay-Highway","Poblacion 5":"Baybay-Highway","Puting Bato East":"Baybay-Highway",
      "Puting Bato West":"Baybay-Highway","Quisumbing":"Baybay-Highway","Salong":"Baybay-Highway","San Rafael":"Baybay-Highway",
      "Sinisian":"Baybay-Highway","Talisay":"Baybay-Highway",
    };
    const ZONE_BG: Record<string,string> = { North:"#6B7280", West:"#8B5CF6", East:"#2B5EA6", "Baybay-Highway":"#E85D3B" };
    const ZONE_LABEL: Record<string,string> = { North:"North", West:"West", East:"East", "Baybay-Highway":"Baybay-Hwy" };
    const petBarangay = brgy(pet);
    const zone = BARANGAY_ZONES[petBarangay] || "East";
    const zoneBg = ZONE_BG[zone] || "#6B7280";
    const tag = pet.pet_tag_id || pet.petTagId || pet.id || "";
    // Validate tag format: must match CLR-0000-00000 (3 letters, dash, 4 digits, dash, 5 digits)
    const validTag = /^[A-Z]{3}-\d{4}-\d{5}$/.test(tag);
    if (!validTag) return null;
    return (<>
      <p className="text-xs font-bold text-gray-600 font-mono">{tag}</p>
      <span style={{display:'inline-block',marginTop:2,padding:'1px 6px',borderRadius:4,fontSize:10,fontWeight:700,color:'#fff',background:zoneBg,letterSpacing:'0.04em'}}>{ZONE_LABEL[zone]} Zone</span>
      {pet.status!=="Active"&&<span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded ${pet.status==="Lost"?"bg-red-100 text-red-700":"bg-blue-100 text-blue-700"}`}>{pet.status}</span>}
    </>);
  })()}
</td>
                      <td className="py-3 px-3"><p className="font-semibold text-gray-800 text-sm">{pn(pet)}</p><p className="text-xs text-gray-500">{pet.species} · {pet.breed} · {pet.color}</p></td>
                      <td className="py-3 px-3"><p className="text-sm font-semibold text-gray-800">{on(pet)}</p><p className="text-xs text-gray-500">{pet.contact_number||pet.ownerContact||"—"}</p></td>
                      <td className="py-3 px-3 text-sm text-gray-600">{brgy(pet)}</td>
                      <td className="py-3 px-3">
                        <div className="flex gap-1">
                          {spayed(pet)&&<span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full">S</span>}
                          {neutered(pet)&&<span className="px-1.5 py-0.5 bg-cyan-100 text-cyan-700 text-[10px] font-bold rounded-full">N</span>}
                          {!spayed(pet)&&!neutered(pet)&&<span className="text-gray-300 text-xs">—</span>}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${vs(pet)==="Vaccinated"?"bg-green-100 text-green-700":vs(pet)==="Due Soon"?"bg-amber-100 text-amber-700":"bg-red-100 text-red-700"}`}>
                          {vs(pet)==="Vaccinated"?<ICheckCircle className="w-3 h-3"/>:<IAlertCircle className="w-3 h-3"/>}
                          {vs(pet)}
                        </span>
                      </td>
                      <td className="py-3 px-3"><RegBadge pet={pet}/></td>
                      <td className="py-3 px-3">
                        <div className="flex gap-1">
                          <button onClick={()=>setViewPet(pet)} className="px-2.5 py-1.5 bg-[#2B5EA6] text-white text-xs font-semibold rounded-lg hover:bg-[#234a85] flex items-center gap-1"><IEye className="w-3 h-3"/>View</button>
                          <button onClick={async()=>{
                            setVaxCardLoading(true);
                            try{
                              const h = await api.getVaccinationHistory(pet.id);
                              setVaxCardPet(pet); setVaxCardHistory(h.history||[]);
                            }catch{ toast.error('Could not load vaccination history'); }
                            finally{ setVaxCardLoading(false); }
                          }} className="px-2.5 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 inline-block mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>Card
                          </button>
                          {canRenew&&(pet.is_archived||pet.renewal_status==="expiring"||pet.renewal_status==="expired")&&(
                            <button disabled={busyPet===pet.id} onClick={()=>handleRenew(pet)} className="px-2.5 py-1.5 bg-[#60A85C] text-white text-xs font-semibold rounded-lg hover:bg-[#4a8a47] disabled:opacity-60 flex items-center gap-1"><IRefreshCw className="w-3 h-3"/>{pet.is_archived?"Restore":"Renew"}</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPets.length===0&&<tr><td colSpan={9} className="py-12 text-center text-gray-400"><IPawPrint className="w-8 h-8 mx-auto mb-2 text-gray-200"/><p className="text-sm">No pets found</p></td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══ LOST & FOUND */}
      {activeTab==="lost-found" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center"><p className="text-3xl font-black text-red-600">{openReports.filter(r=>r.type==="Lost").length}</p><p className="text-xs text-red-500 font-semibold mt-1">Lost (Open)</p></div>
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center"><p className="text-3xl font-black text-green-600">{openReports.filter(r=>r.type==="Found").length}</p><p className="text-xs text-green-500 font-semibold mt-1">Found (Open)</p></div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center"><p className="text-3xl font-black text-amber-600">{totalMatches}</p><p className="text-xs text-amber-600 font-semibold mt-1">Smart Matches</p></div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-3">
            <div className="flex-1 min-w-[180px] relative"><ISearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/><input placeholder="Search reports…" value={search} onChange={e=>setSearch(e.target.value)} className={`${INPUT} pl-9`}/></div>
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
              {(["all","Lost","Found"] as const).map(t=><button key={t} onClick={()=>setFilterType(t)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType===t?"bg-white shadow text-gray-800":"text-gray-500 hover:text-gray-700"}`}>{t==="all"?"All":t}</button>)}
            </div>
          </div>
          <div className="space-y-3">
            {filteredReports.map(r=>{
              const matches=getMatches(r,reports);
              return (
                <div key={r.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-all ${r.status==="Resolved"?"border-gray-200 opacity-70":"border-gray-100"}`}>
                  <div className={`h-1.5 ${r.type==="Lost"?"bg-gradient-to-r from-red-500 to-orange-400":"bg-gradient-to-r from-green-500 to-emerald-400"}`}/>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${r.type==="Lost"?"bg-red-100":"bg-green-100"}`}>
                          {r.type==="Lost"?<IAlertCircle className="w-6 h-6 text-red-500"/>:<IHeart className="w-6 h-6 text-green-500"/>}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${r.type==="Lost"?"bg-red-100 text-red-700":"bg-green-100 text-green-700"}`}>{r.type}</span>
                            <span className="text-xs text-gray-400">{r.id}</span>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${r.status==="Open"?"bg-yellow-100 text-yellow-700":"bg-gray-100 text-gray-500"}`}>{r.status}</span>
                            {matches.length>0&&r.status==="Open"&&<span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-700 flex items-center gap-0.5"><IZap className="w-3 h-3"/>{matches.length} match{matches.length>1?"es":""}</span>}
                          </div>
                          <p className="font-bold text-gray-800">{r.pet_name||r.petName} <span className="font-normal text-gray-500 text-sm">· {r.breed} · {r.color}</span></p>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5"><IMapPin className="w-3 h-3"/>{r.last_seen_location||r.lastSeenLocation||"—"}, {r.barangay}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-400">{fmtDate(r.date_reported||r.dateReported)}</p>
                        <p className="text-sm font-semibold text-gray-700 mt-0.5">{r.reported_by||r.reportedBy}</p>
                        <button onClick={()=>setViewReport(r)} className="mt-2 px-3 py-1.5 bg-[#2B5EA6] text-white text-xs font-bold rounded-lg hover:bg-[#234a85] flex items-center gap-1 ml-auto"><IEye className="w-3 h-3"/>Details</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredReports.length===0&&<div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-12 text-center"><IAlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-200"/><p className="text-sm text-gray-400">No reports found</p></div>}
          </div>
        </div>
      )}

      {/* ══ IMPOUNDED */}
      {activeTab==="impounded" && (
        <div className="space-y-4">
          {/* Header stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-amber-600">{impoundedReports.filter(r=>r.status==="Open").length}</p>
              <p className="text-xs text-amber-600 font-semibold mt-1">Currently Impounded</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-green-600">{impoundedReports.filter(r=>r.status==="Resolved").length}</p>
              <p className="text-xs text-green-600 font-semibold mt-1">Released / Claimed</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-blue-600">{
                (() => {
                  const imp = impoundedReports.filter(r=>r.status==="Open");
                  const lost = reports.filter(r=>r.type==="Lost"&&r.status==="Open");
                  let matches = 0;
                  imp.forEach(ir => {
                    lost.forEach(lr => {
                      if ((lr.species||'').toLowerCase()===(ir.species||'').toLowerCase() && (lr.barangay||'')===(ir.barangay||'')) matches++;
                    });
                  });
                  return matches;
                })()
              }</p>
              <p className="text-xs text-blue-600 font-semibold mt-1">Potential Lost Matches</p>
            </div>
          </div>

          {/* Post new impound button */}
          <div className="flex justify-end">
            <button onClick={()=>setShowImpoundForm(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl font-semibold text-sm hover:bg-amber-600 shadow-sm">
              <IPlus className="w-4 h-4"/>Post Impounded Pet
            </button>
          </div>

          {/* Impound form */}
          {showImpoundForm && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4">
              <p className="font-bold text-amber-800 flex items-center gap-2"><IShield className="w-4 h-4"/>New Impounded Pet Record</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={"block text-xs font-semibold text-gray-600 mb-1.5"}>Pet Name / Description *</label><input value={impoundForm.petName} onChange={e=>setImpoundForm(p=>({...p,petName:e.target.value}))} className={INPUT} placeholder="e.g., Brown male aspin"/></div>
                <div><label className={"block text-xs font-semibold text-gray-600 mb-1.5"}>Species</label><select value={impoundForm.species} onChange={e=>setImpoundForm(p=>({...p,species:e.target.value}))} className={INPUT}><option>Dog</option><option>Cat</option><option>Other</option></select></div>
                <div><label className={"block text-xs font-semibold text-gray-600 mb-1.5"}>Breed</label><BreedSelect species={impoundForm.species} value={impoundForm.breed} onChange={v=>setImpoundForm(p=>({...p,breed:v}))} className={INPUT}/></div>
                <div><label className={"block text-xs font-semibold text-gray-600 mb-1.5"}>Color / Markings</label><input value={impoundForm.color} onChange={e=>setImpoundForm(p=>({...p,color:e.target.value}))} className={INPUT} placeholder="e.g., Brown with white chest"/></div>
                <div><label className={"block text-xs font-semibold text-gray-600 mb-1.5"}>Barangay Found *</label>{isBahw
                  ? <input value={impoundForm.barangay || bahwBarangay || 'Your assigned barangay'} disabled className={INPUT+' bg-gray-100 text-gray-500'}/>
                  : <select value={impoundForm.barangay} onChange={e=>setImpoundForm(p=>({...p,barangay:e.target.value}))} className={INPUT}><option value="">Select Barangay</option>{CALACA_BARANGAYS.map(b=><option key={b}>{b}</option>)}</select>}</div>
                <div><label className={"block text-xs font-semibold text-gray-600 mb-1.5"}>Location Where Found</label><input value={impoundForm.lastSeenLocation} onChange={e=>setImpoundForm(p=>({...p,lastSeenLocation:e.target.value}))} className={INPUT} placeholder="Specific location"/></div>
                <div><label className={"block text-xs font-semibold text-gray-600 mb-1.5"}>Impound Facility *</label><input value={impoundForm.impoundLocation} onChange={e=>setImpoundForm(p=>({...p,impoundLocation:e.target.value}))} className={INPUT} placeholder="e.g., Calaca City Pound"/></div>
                <div><label className={"block text-xs font-semibold text-gray-600 mb-1.5"}>Impound Date</label><input type="date" value={impoundForm.impoundDate} onChange={e=>setImpoundForm(p=>({...p,impoundDate:e.target.value}))} className={INPUT}/></div>
                <div><label className={"block text-xs font-semibold text-gray-600 mb-1.5"}>Officer / By</label><input value={impoundForm.impoundOfficer} onChange={e=>setImpoundForm(p=>({...p,impoundOfficer:e.target.value}))} className={INPUT} placeholder="Name of officer"/></div>
                <div><label className={"block text-xs font-semibold text-gray-600 mb-1.5"}>Description / Condition</label><input value={impoundForm.description} onChange={e=>setImpoundForm(p=>({...p,description:e.target.value}))} className={INPUT} placeholder="Health condition, behavior…"/></div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>setShowImpoundForm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
                <button onClick={handleSaveImpound} disabled={!impoundForm.petName||!impoundForm.barangay||!impoundForm.impoundLocation||savingImpound}
                  className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2">
                  {savingImpound?<><IRefreshCw className="w-4 h-4 animate-spin"/>Saving…</>:<><IShield className="w-4 h-4"/>Post Record</>}
                </button>
              </div>
            </div>
          )}

          {/* Impounded list */}
          <div className="space-y-3">
            {impoundedReports.length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-12 text-center">
                <IShield className="w-8 h-8 mx-auto mb-2 text-gray-200"/>
                <p className="text-sm text-gray-400">No impounded pets on record</p>
              </div>
            )}
            {impoundedReports.map(r => {
              // Check for lost pet matches
              const lostMatches = reports.filter(lr =>
                lr.type === "Lost" && lr.status === "Open" &&
                (lr.species||'').toLowerCase() === (r.species||'').toLowerCase() &&
                (lr.barangay||'') === (r.barangay||'')
              );
              return (
                <div key={r.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-all ${r.status==="Resolved"?"border-gray-200 opacity-70":"border-amber-200"}`}>
                  <div className="h-1.5 bg-gradient-to-r from-amber-500 to-orange-400"/>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                          <IShield className="w-6 h-6 text-amber-600"/>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-700">Impounded</span>
                            <span className="text-xs text-gray-400 font-mono">{r.id}</span>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${r.status==="Open"?"bg-yellow-100 text-yellow-700":"bg-green-100 text-green-700"}`}>{r.status==="Open"?"In Pound":"Released"}</span>
                            {lostMatches.length > 0 && r.status === "Open" && (
                              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-700 flex items-center gap-0.5">
                                <IZap className="w-3 h-3"/>{lostMatches.length} lost match{lostMatches.length>1?"es":""}
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-gray-800">{r.pet_name||r.petName} <span className="font-normal text-gray-500 text-sm">· {r.breed||"—"} · {r.color||"—"}</span></p>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5"><IMapPin className="w-3 h-3"/>Found: {r.last_seen_location||r.lastSeenLocation||"—"}, {r.barangay}</p>
                          {(r as any).impound_location && <p className="text-sm text-amber-700 font-semibold flex items-center gap-1 mt-0.5"><IShield className="w-3 h-3"/>Pound: {(r as any).impound_location}</p>}
                          {(r as any).impound_officer && <p className="text-xs text-gray-400 mt-0.5">Officer: {(r as any).impound_officer}</p>}
                        </div>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <p className="text-xs text-gray-400">{fmtDate(r.date_reported||r.dateReported)}</p>
                        {r.status === "Open" && (
                          <button onClick={()=>handleResolveImpound(r.id)}
                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 flex items-center gap-1 ml-auto">
                            <ICheckCircle className="w-3 h-3"/>Mark Released
                          </button>
                        )}
                        <button onClick={()=>setViewReport(r)} className="px-3 py-1.5 bg-[#2B5EA6] text-white text-xs font-bold rounded-lg hover:bg-[#234a85] flex items-center gap-1 ml-auto">
                          <IEye className="w-3 h-3"/>Details
                        </button>
                      </div>
                    </div>
                    {/* Lost matches */}
                    {lostMatches.length > 0 && r.status === "Open" && (
                      <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
                        <p className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1"><IZap className="w-3 h-3"/>Possible owner reports:</p>
                        {lostMatches.slice(0,2).map(lr=>(
                          <div key={lr.id} className="flex items-center justify-between text-xs text-blue-800 py-1">
                            <span>{lr.pet_name||lr.petName} · {lr.reported_by||lr.reportedBy}</span>
                            <button onClick={()=>setViewReport(lr)} className="text-blue-600 underline font-semibold">View</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}



      {/* ══ BITING INCIDENTS */}
      {activeTab==="biting" && (
        <BitingIncidents userRole={userRole || 'admin'} />
      )}

      {/* ══ MODALS ══ */}

      {/* New Pet */}
      {showNewPet && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-[#1e4080] to-[#2B5EA6] px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3"><div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"><IPawPrint className="w-4 h-4 text-white"/></div><p className="font-bold text-white">Register New Pet</p></div>
              <button onClick={()=>setShowNewPet(false)} className="text-white/70 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-5">
              {/* Photo */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Pet Photo</label>
                {np.photoUrl
                  ? <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <img src={np.photoUrl} className="w-20 h-20 rounded-xl object-cover border border-gray-300" alt=""/>
                      <div className="space-y-2">
                        <button onClick={()=>setShowPhoto(true)} className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100"><IRefreshCw className="w-3.5 h-3.5"/>Change</button>
                        <button onClick={()=>setNp({...np,photoUrl:""})} className="flex items-center gap-2 text-red-500 text-sm hover:text-red-700"><X className="w-3.5 h-3.5"/>Remove</button>
                      </div>
                    </div>
                  : <button onClick={()=>setShowPhoto(true)} className="w-full flex items-center gap-4 p-4 border-2 border-dashed border-[#2B5EA6]/30 rounded-xl hover:border-[#2B5EA6] hover:bg-blue-50 transition-all group">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 shrink-0"><IImagePlus className="w-6 h-6 text-[#2B5EA6]"/></div>
                      <div className="text-left"><p className="text-sm font-semibold text-gray-700">Add Pet Photo</p><p className="text-xs text-gray-400">Camera or gallery upload</p></div>
                    </button>
                }
              </div>

              {/* Pet Info */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 border-b pb-2">Pet Information</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Pet Name *</label><input value={np.petName} onChange={e=>setNp({...np,petName:e.target.value})} className={INPUT} placeholder="e.g., Brownie"/></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Species *</label><select value={np.species} onChange={e=>setNp({...np,species:e.target.value})} className={INPUT}><option value="">Select…</option><option value="Dog">Dog</option><option value="Cat">Cat</option></select></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Breed *</label><BreedSelect species={np.species} value={np.breed} onChange={v=>setNp(p=>({...p,breed:v}))} className={INPUT}/></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Age</label><input value={np.age} onChange={e=>setNp({...np,age:e.target.value})} className={INPUT} placeholder="e.g., 2 years"/></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Color</label><input value={np.color} onChange={e=>setNp({...np,color:e.target.value})} className={INPUT} placeholder="e.g., Brown"/></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Gender</label><select value={np.gender} onChange={e=>setNp({...np,gender:e.target.value})} className={INPUT}><option value="">Select…</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Microchip ID</label><input value={np.microchipId} onChange={e=>setNp({...np,microchipId:e.target.value})} className={INPUT} placeholder="Optional"/></div>
                  {(()=>{const BZONE:Record<string,string>={'Caluangan':'East','Coral Ni Bacal':'East','Dila':'East','Lumbang Na Bata':'East','Lumbang Na Matanda':'East','Poblacion 1':'East','Poblacion 2':'East','Poblacion 3':'East','Poblacion 4':'East','Poblacion 6':'East','Bagong Tubig':'West','Cahil':'West','Calantas':'West','Coral Ni Lopez':'West','Dacanlao':'West','Loma':'West','Makina':'West','Pantay':'West','Taklang Anak':'West','Timbain':'West','Baclas':'North','Balimbing':'North','Bambang':'North','Bisaya':'North','Madalunot':'North','Matipok':'North','Munting Coral':'North','Niyugan':'North','Tamayo':'North','Camastilisan':'Baybay-Highway','Lumbang Calzada':'Baybay-Highway','Poblacion 5':'Baybay-Highway','Puting Bato East':'Baybay-Highway','Puting Bato West':'Baybay-Highway','Quisumbing':'Baybay-Highway','Salong':'Baybay-Highway','San Rafael':'Baybay-Highway','Sinisian':'Baybay-Highway','Talisay':'Baybay-Highway'};const ZPFX:Record<string,string>={East:'BLU',West:'PRP',North:'GRY','Baybay-Highway':'RED'};const ZCOL:Record<string,string>={BLU:'#2B5EA6',PRP:'#8B5CF6',GRY:'#6B7280',RED:'#E85D3B'};const zone=BZONE[np.barangay]||'East';const pfx=ZPFX[zone]||'BLU';const col=ZCOL[pfx]||'#2B5EA6';const numPad=(np.tagNumber||'').replace(/\D/g,'').padStart(4,'0');const preview=np.tagNumber?`${pfx}-${numPad}`:'';return(<div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1.5">Tag Number <span className="font-normal text-gray-400">(number only — prefix auto by zone)</span></label><div className="flex items-center gap-2"><span className="px-3 py-2.5 rounded-xl font-mono font-black text-white text-sm flex-shrink-0" style={{background:col}}>{pfx}-</span><input type="text" inputMode="numeric" value={np.tagNumber} onChange={e=>setNp({...np,tagNumber:e.target.value.replace(/\D/g,'').slice(0,6)})} className={INPUT} placeholder={np.barangay?`e.g. 0001`:'Select barangay first'} disabled={!np.barangay}/></div>{preview&&<div className="mt-2 flex items-center gap-2"><span className="text-xs text-gray-400">Full tag ID:</span><span className="font-mono font-black text-white text-xs px-2 py-0.5 rounded" style={{background:col}}>{preview}</span><span className="text-xs text-gray-400">({zone} Zone)</span></div>}{!np.barangay&&<p className="text-xs text-amber-600 mt-1">Select barangay first — prefix is auto by zone</p>}</div>);})()}
                  {/* Spay / Neuter */}
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Reproductive Status</label>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div onClick={()=>setNp({...np,isSpayed:!np.isSpayed})} className={`w-10 h-6 rounded-full transition-all relative ${np.isSpayed?"bg-purple-500":"bg-gray-200"}`}>
                          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${np.isSpayed?"left-4":"left-0.5"}`}/>
                        </div>
                        <span className="text-sm font-semibold text-gray-700">Spayed <span className="text-purple-500 text-xs">(♀ female)</span></span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div onClick={()=>setNp({...np,isNeutered:!np.isNeutered})} className={`w-10 h-6 rounded-full transition-all relative ${np.isNeutered?"bg-cyan-500":"bg-gray-200"}`}>
                          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${np.isNeutered?"left-4":"left-0.5"}`}/>
                        </div>
                        <span className="text-sm font-semibold text-gray-700">Neutered <span className="text-cyan-500 text-xs">(♂ male)</span></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Owner Info */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 border-b pb-2">Owner Information</p>

                {/* TempID success banner */}
                {generatedTempId && (
                  <div style={{background:'#fff8ed',border:'1.5px solid #fbbf24',borderRadius:10,padding:'12px 16px',marginBottom:12}}>
                    <p style={{margin:'0 0 4px',fontWeight:800,color:'#92400e',fontSize:13,display:'flex',alignItems:'center',gap:4}}><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>Unregistered Owner — Temporary ID Issued</p>
                    <p style={{margin:'0 0 6px',color:'#92400e',fontSize:13}}>This pet has been registered with a Temporary ID. Give this ID to the owner — they can enter it during account signup to auto-link this pet to their account.</p>
                    <div style={{background:'#fff',border:'2px solid #f59e0b',borderRadius:8,padding:'8px 14px',textAlign:'center',fontFamily:'monospace',fontSize:20,fontWeight:900,color:'#2B5EA6',letterSpacing:'.05em'}}>{generatedTempId}</div>
                    <button onClick={()=>{setGeneratedTempId(null);setShowNewPet(false);setNp({petName:"",species:"",breed:"",age:"",color:"",gender:"",isSpayed:false,isNeutered:false,ownerName:"",ownerContact:"",ownerAddress:"",barangay:"",microchipId:"",photoUrl:"",impoundStatus:"None",impoundReason:"",tagNumber:""});setSelectedOwnerId(null);setIsUnregisteredOwner(false);}} style={{marginTop:10,width:'100%',padding:'8px',background:'#2B5EA6',color:'#fff',border:'none',borderRadius:8,fontWeight:700,cursor:'pointer',fontSize:13}}>Done — Register Another Pet</button>
                  </div>
                )}

                {!generatedTempId && (
                <div className="grid grid-cols-2 gap-3">
                  <div style={{position:'relative',gridColumn:'1/-1'}}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Owner Name * <span style={{color:'#9ca3af',fontWeight:400,fontSize:11}}>(type to search registered users)</span></label>
                    {selectedOwnerId && (
                      <div style={{background:'#f0fdf4',border:'1.5px solid #86efac',borderRadius:8,padding:'6px 12px',marginBottom:6,fontSize:12,color:'#14532d',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <span style={{display:"flex",alignItems:"center",gap:4}}><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Linked to registered user</span>
                        <button onClick={()=>{setSelectedOwnerId(null);setIsUnregisteredOwner(false);}} style={{background:'none',border:'none',color:'#dc2626',cursor:'pointer',fontSize:12,fontWeight:700}}>✕ Remove</button>
                      </div>
                    )}
                    {isUnregisteredOwner && !selectedOwnerId && (
                      <div style={{background:'#fff8ed',border:'1.5px solid #fbbf24',borderRadius:8,padding:'6px 12px',marginBottom:6,fontSize:12,color:'#92400e',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <span style={{display:"flex",alignItems:"center",gap:4}}><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>Unregistered owner — Temp ID will be issued</span>
                        <button onClick={()=>setIsUnregisteredOwner(false)} style={{background:'none',border:'none',color:'#dc2626',cursor:'pointer',fontSize:12,fontWeight:700}}>✕ Cancel</button>
                      </div>
                    )}
                    <input
                      value={np.ownerName}
                      onChange={e=>{
                        setNp({...np,ownerName:e.target.value});
                        setSelectedOwnerId(null); setIsUnregisteredOwner(false);
                        if(ownerLookupTimer) clearTimeout(ownerLookupTimer);
                        if(e.target.value.length >= 2) {
                          const t = setTimeout(async()=>{
                            try{
                              const r = await fetch(`/api/pets/owner-search?q=${encodeURIComponent(e.target.value)}`);
                              const d = await r.json();
                              setOwnerSuggestions(d.users||[]);
                              setShowOwnerSugg(true);
                            }catch{}
                          },300);
                          setOwnerLookupTimer(t);
                        } else { setOwnerSuggestions([]); setShowOwnerSugg(false); }
                      }}
                      onFocus={()=>{ if(ownerSuggestions.length>0) setShowOwnerSugg(true); }}
                      onBlur={()=>setTimeout(()=>setShowOwnerSugg(false),200)}
                      className={INPUT} placeholder="Start typing owner name…"
                    />
                    {showOwnerSugg && (
                      <div style={{position:'absolute',top:'100%',left:0,right:0,background:'#fff',border:'1.5px solid #e5e7eb',borderRadius:10,boxShadow:'0 8px 24px rgba(0,0,0,.12)',zIndex:100,maxHeight:220,overflowY:'auto'}}>
                        {ownerSuggestions.map(u=>(
                          <div key={u.id} onClick={()=>{setNp({...np,ownerName:u.username,ownerContact:'',ownerAddress:u.address||'',barangay:u.barangay||np.barangay});setSelectedOwnerId(u.owner_id);setShowOwnerSugg(false);setOwnerSuggestions([]);}} style={{padding:'10px 14px',cursor:'pointer',borderBottom:'1px solid #f1f5f9',fontSize:13}} onMouseEnter={e=>(e.currentTarget.style.background='#f0f7ff')} onMouseLeave={e=>(e.currentTarget.style.background='')}>
                            <div style={{fontWeight:700,color:'#1f2937'}}>{u.username}</div>
                            <div style={{fontSize:11,color:'#9ca3af'}}>{u.email} · {u.barangay||'—'}</div>
                          </div>
                        ))}
                        <div onClick={()=>{setIsUnregisteredOwner(true);setSelectedOwnerId(null);setShowOwnerSugg(false);}} style={{padding:'10px 14px',cursor:'pointer',fontSize:13,fontWeight:700,color:'#f59e0b',background:'#fffbeb',borderTop:'1px solid #fde68a'}} onMouseEnter={e=>(e.currentTarget.style.background='#fef9c3')} onMouseLeave={e=>(e.currentTarget.style.background='#fffbeb')}>
                          Owner not registered — issue Temporary ID
                        </div>
                      </div>
                    )}
                  </div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Contact Number</label><input value={np.ownerContact} onChange={e=>setNp({...np,ownerContact:e.target.value})} className={INPUT} placeholder="0917-xxx-xxxx"/></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Address</label><input value={np.ownerAddress} onChange={e=>setNp({...np,ownerAddress:e.target.value})} className={INPUT} placeholder="Purok / Zone / Phase"/></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Barangay *</label>{isBahw
                    ? <input value={np.barangay || bahwBarangay || 'Your assigned barangay'} disabled className={INPUT+' bg-gray-100 text-gray-500'}/>
                    : <select value={np.barangay} onChange={e=>setNp({...np,barangay:e.target.value})} className={INPUT}><option value="">Select…</option>{CALACA_BARANGAYS.map(b=><option key={b} value={b}>{b}</option>)}</select>}</div>
                </div>
                )}
              </div>

              {/* Impound */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 border-b pb-2">Impound Status</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Impound Status</label>
                    <select value={np.impoundStatus} onChange={e=>setNp({...np,impoundStatus:e.target.value})} className={INPUT}>
                      <option value="None">None</option>
                      <option value="Impounded">Impounded</option>
                      <option value="For Redemption">For Redemption</option>
                      <option value="For Adoption">For Adoption</option>
                      <option value="Released">Released</option>
                    </select>
                  </div>
                  {np.impoundStatus !== "None" && (
                    <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1.5">Reason / Notes</label><input value={np.impoundReason} onChange={e=>setNp({...np,impoundReason:e.target.value})} className={INPUT} placeholder="Reason for impound…"/></div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={()=>setShowNewPet(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button onClick={handleAddPet} disabled={!np.petName||!np.species||!np.breed||!np.ownerName||!np.barangay||saving} className="flex-1 py-2.5 bg-[#2B5EA6] text-white rounded-xl text-sm font-bold hover:bg-[#234a85] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {saving?<><IRefreshCw className="w-4 h-4 animate-spin"/>Saving…</>:<><IPawPrint className="w-4 h-4"/>Register Pet</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lost/Found Report */}
      {showLFDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3"><div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"><IAlertCircle className="w-4 h-4 text-white"/></div><p className="font-bold text-white">Report Lost / Found Pet</p></div>
              <button onClick={()=>setShowLFDialog(false)} className="text-white/70 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                {(["Lost","Found"] as const).map(t=><button key={t} onClick={()=>{ setLfForm({...lfForm,type:t,petId:""}); setLfPetSearch(""); setLfPetSuggestions([]); setShowLfPetSugg(false); }} className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${lfForm.type===t?t==="Lost"?"border-red-500 bg-red-50 text-red-700":"border-green-500 bg-green-50 text-green-700":"border-gray-200 text-gray-500 hover:border-gray-300"}`}>{t==="Lost"?"Lost Pet":"Found Pet"}</button>)}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {lfForm.type === "Lost" ? (
                  <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1.5">Linked Pet from Registry (if known)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={lfPetSearch}
                      onChange={e => {
                        const val = e.target.value;
                        setLfPetSearch(val);
                        if (!val) { setLfForm({...lfForm, petId:""}); setLfPetSuggestions([]); setShowLfPetSugg(false); return; }
                        const filtered = pets.filter(p =>
                          pn(p).toLowerCase().includes(val.toLowerCase()) ||
                          on(p).toLowerCase().includes(val.toLowerCase()) ||
                          p.id.toLowerCase().includes(val.toLowerCase()) ||
                          (p.breed||"").toLowerCase().includes(val.toLowerCase())
                        ).slice(0, 8);
                        setLfPetSuggestions(filtered);
                        setShowLfPetSugg(true);
                      }}
                      onFocus={() => { if (lfPetSearch) setShowLfPetSugg(true); }}
                      onBlur={() => setTimeout(() => setShowLfPetSugg(false), 150)}
                      className={INPUT}
                      placeholder="Type pet name, ID, owner, or breed…"
                    />
                    {lfForm.petId && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600 font-bold">✓ Linked</span>}
                    {showLfPetSugg && lfPetSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-52 overflow-y-auto">
                        <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase border-b">Select from registry</div>
                        {lfPetSuggestions.map(p => (
                          <button key={p.id} type="button"
                            onMouseDown={() => {
                              setLfForm({...lfForm, petId: p.id, species: p.species||"", breed: p.breed||"", color: p.color||""});
                              setLfPetSearch(`${pn(p)} (${p.id})`);
                              setShowLfPetSugg(false);
                            }}
                            className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0">
                            <p className="text-sm font-semibold text-gray-800">{pn(p)} <span className="text-xs font-mono text-gray-400">{p.id}</span></p>
                            <p className="text-xs text-gray-500">{p.species} · {p.breed} · {on(p)} · {brgy(p)}</p>
                          </button>
                        ))}
                        <button type="button"
                          onMouseDown={() => { setLfForm({...lfForm, petId:""}); setLfPetSearch("Unknown / Not in Registry"); setShowLfPetSugg(false); }}
                          className="w-full text-left px-3 py-2.5 hover:bg-gray-50 text-xs text-gray-500 italic border-t">
                          Unknown / Not in Registry
                        </button>
                      </div>
                    )}
                    {showLfPetSugg && lfPetSearch.length > 0 && lfPetSuggestions.length === 0 && (
                      <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 px-3 py-3 text-sm text-gray-400 text-center">
                        No matching pets found in registry
                      </div>
                    )}
                  </div>
                </div>
                ) : (
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Pet ID Number <span className="font-normal text-gray-400">(enter if tag/collar has an ID)</span></label>
                    <input
                      type="text"
                      value={lfForm.petId}
                      onChange={e => setLfForm({...lfForm, petId: e.target.value})}
                      className={INPUT}
                      placeholder="e.g., PET-0023 — leave blank if unknown"
                    />
                    {lfForm.petId && pets.find(p => p.id === lfForm.petId) && (
                      <p className="text-xs text-green-600 font-semibold mt-1">
                        ✓ Matched: {pn(pets.find(p => p.id === lfForm.petId)!)} · {pets.find(p => p.id === lfForm.petId)!.species}
                      </p>
                    )}
                    {lfForm.petId && !pets.find(p => p.id === lfForm.petId) && lfForm.petId.length > 2 && (
                      <p className="text-xs text-amber-600 mt-1">ID not found in registry — will be recorded as provided</p>
                    )}
                  </div>
                )}
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Species</label><select value={lfForm.species} onChange={e=>setLfForm({...lfForm,species:e.target.value})} className={INPUT}><option value="">Select…</option><option value="Dog">Dog</option><option value="Cat">Cat</option><option value="Other">Other</option></select></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Breed</label><input value={lfForm.breed} onChange={e=>setLfForm({...lfForm,breed:e.target.value})} className={INPUT} placeholder="e.g., Aspin"/></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Color</label><input value={lfForm.color} onChange={e=>setLfForm({...lfForm,color:e.target.value})} className={INPUT} placeholder="e.g., Brown, White"/></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Barangay *</label>{isBahw
                  ? <input value={lfForm.barangay || bahwBarangay || 'Your assigned barangay'} disabled className={INPUT+' bg-gray-100 text-gray-500'}/>
                  : <select value={lfForm.barangay} onChange={e=>setLfForm({...lfForm,barangay:e.target.value})} className={INPUT}><option value="">Select…</option>{CALACA_BARANGAYS.map(b=><option key={b} value={b}>{b}</option>)}</select>}</div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Reported By *</label><input value={lfForm.reportedBy} onChange={e=>setLfForm({...lfForm,reportedBy:e.target.value})} className={INPUT} placeholder="Your name"/></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Contact Number *</label><input value={lfForm.contactNumber} onChange={e=>setLfForm({...lfForm,contactNumber:e.target.value})} className={INPUT} placeholder="0917-xxx-xxxx"/></div>
                <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1.5">Last Seen Location</label><input value={lfForm.lastSeenLocation} onChange={e=>setLfForm({...lfForm,lastSeenLocation:e.target.value})} className={INPUT} placeholder="Street, landmark…"/></div>
                <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1.5">Description *</label><textarea value={lfForm.description} onChange={e=>setLfForm({...lfForm,description:e.target.value})} rows={3} className={INPUT} placeholder="Color, size, collar, markings, behavior…"/></div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={()=>setShowLFDialog(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button onClick={handleAddLF} disabled={!lfForm.reportedBy||!lfForm.contactNumber||!lfForm.barangay||!lfForm.description||saving} className={`flex-1 py-2.5 text-white rounded-xl text-sm font-bold disabled:opacity-40 ${lfForm.type==="Lost"?"bg-red-500 hover:bg-red-600":"bg-green-600 hover:bg-green-700"} flex items-center justify-center gap-2`}>
                  {saving?<><IRefreshCw className="w-4 h-4 animate-spin"/>Saving…</>:`Submit ${lfForm.type} Report`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Schedule */}
      {showScheduleAdd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-[#3a7a35] to-[#60A85C] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"><ICalendar className="w-4 h-4 text-white"/></div><p className="font-bold text-white">Add Vaccination Schedule</p></div>
              <button onClick={()=>setShowScheduleAdd(false)} className="text-white/70 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Barangay *</label>{isBahw
                ? <input value={schForm.barangay || bahwBarangay || 'Your assigned barangay'} disabled className={INPUT+' bg-gray-100 text-gray-500'}/>
                : <select value={schForm.barangay} onChange={e=>setSchForm({...schForm,barangay:e.target.value})} className={INPUT}><option value="">Select barangay…</option>{CALACA_BARANGAYS.map(b=><option key={b} value={b}>{b}</option>)}</select>}</div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Date *</label><input type="date" value={schForm.date} onChange={e=>setSchForm({...schForm,date:e.target.value})} className={INPUT}/></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Capacity</label><input type="number" value={schForm.capacity} onChange={e=>setSchForm({...schForm,capacity:e.target.value})} className={INPUT}/></div>
              </div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Time *</label><input value={schForm.time} onChange={e=>setSchForm({...schForm,time:e.target.value})} className={INPUT} placeholder="e.g. 8:00 AM – 12:00 PM"/></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Location / Venue *</label><input value={schForm.location} onChange={e=>setSchForm({...schForm,location:e.target.value})} className={INPUT} placeholder="Venue name"/></div>
              <div className="flex gap-2 pt-2">
                <button onClick={()=>setShowScheduleAdd(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button onClick={handleAddSchedule} disabled={!schForm.barangay||!schForm.date||!schForm.time||!schForm.location||saving} className="flex-1 py-2.5 bg-[#60A85C] text-white rounded-xl text-sm font-bold hover:bg-[#4a8a47] disabled:opacity-40 flex items-center justify-center gap-2">
                  {saving?<><IRefreshCw className="w-4 h-4 animate-spin"/>Saving…</>:"Add Schedule"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modals */}
      {showPhoto && <PetPhotoCapture petName={np.petName} onCapture={url=>{setNp(p=>({...p,photoUrl:url}));setShowPhoto(false);}} onClose={()=>setShowPhoto(false)}/>}
      {viewPet && <PetDetailModal pet={viewPet} onClose={()=>setViewPet(null)} onVaccinate={p=>{setVaccinatePet(p);setViewPet(null);setShowVaccinate(true);}} onUpdate={loadAll} canRenew={canRenew} canArchive={canArchive} onRenew={handleRenew} onArchive={handleArchive}/>}
      {viewReport && <LostFoundModal report={viewReport} all={reports} pets={pets} onClose={()=>setViewReport(null)} onResolve={handleResolve}/>}
      {vaxCardPet && (
        <VaccinationCard
          pet={vaxCardPet}
          history={vaxCardHistory}
          onClose={()=>{ setVaxCardPet(null); setVaxCardHistory([]); }}
        />
      )}
      {manageSchedule && (
        <ScheduleManageModal
          schedule={manageSchedule}
          onClose={() => setManageSchedule(null)}
          onSave={async (id, data) => {
            try {
              await api.updateSchedule(id, data);
              setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
              setManageSchedule(null);
            } catch(e: any) { alert("Error: " + e.message); }
          }}
        />
      )}
      {showVaccinate && vaccinatePet && <VaccinateModal pet={vaccinatePet} onConfirm={p=>{handleVaccinate(p);}} onClose={()=>{setShowVaccinate(false);setVaccinatePet(null);}}/>}
    </div>
  );
}
