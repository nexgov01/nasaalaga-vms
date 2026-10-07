import { useEffect, useRef, useState } from 'react';
import { Flame, ArrowRight } from 'lucide-react';

interface HeatPoint {
  id: string;
  disease: string;
  barangay: string;
  cases: number;
  lat: number;
  lng: number;
  radius_km: number;
  status: string;
  severity?: string;
  is_archived?: boolean;
}

const CALACA_CENTER = { lat: 13.9345, lng: 120.8135 };
const CALACA_ZOOM = 11;

// Intensity weight: more cases + higher severity + unresolved => hotter
function weightOf(p: HeatPoint): number {
  const sev: Record<string, number> = { Critical: 1, High: 0.75, Medium: 0.5, Low: 0.3 };
  const base = sev[p.severity || ''] ?? 0.5;
  const caseFactor = Math.min(1, Math.log2((p.cases || 1) + 1) / 5);
  return Math.min(1, base * 0.6 + caseFactor * 0.6);
}

function heatColor(w: number): string {
  if (w >= 0.75) return '#dc2626';
  if (w >= 0.5) return '#f97316';
  if (w >= 0.3) return '#facc15';
  return '#22c55e';
}

export function OutbreakHeatmap({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const [points, setPoints] = useState<HeatPoint[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load outbreak data (same endpoint as the Outbreak Monitoring module)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = sessionStorage.getItem('nasaalaga_token') || '';
        const r = await fetch('/api/outbreaks', { headers: { Authorization: `Bearer ${token}` } });
        if (r.ok) {
          const d = await r.json();
          const list: HeatPoint[] = (d.outbreaks || []).filter(
            (o: HeatPoint) => !o.is_archived && o.status !== 'Resolved' && o.lat != null && o.lng != null
          );
          if (!cancelled) setPoints(list);
        }
      } catch { /* leave empty */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Init Leaflet (shared CDN script/CSS ids with OutbreakMonitoring)
  useEffect(() => {
    const init = () => {
      const el = mapRef.current;
      const L = (window as any).L;
      if (!el || !L || (el as any)._leaflet_id) return;
      const map = L.map(el, {
        center: [CALACA_CENTER.lat, CALACA_CENTER.lng],
        zoom: CALACA_ZOOM,
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: false,
        attributionControl: true,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 18,
      }).addTo(map);
      leafletMap.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      setReady(true);
    };

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css'; link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    let poll: any;
    if ((window as any).L) init();
    else if (!document.getElementById('leaflet-js')) {
      const s = document.createElement('script');
      s.id = 'leaflet-js'; s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s.onload = init; document.head.appendChild(s);
    } else {
      poll = setInterval(() => { if ((window as any).L) { clearInterval(poll); init(); } }, 50);
    }
    return () => {
      if (poll) clearInterval(poll);
      if (leafletMap.current) {
        try { leafletMap.current.remove(); } catch { }
        leafletMap.current = null; layerRef.current = null; setReady(false);
      }
    };
  }, []);

  // Draw heat blobs: stacked translucent circles approximate a heat gradient
  useEffect(() => {
    const L = (window as any).L;
    if (!ready || !L || !layerRef.current || !leafletMap.current) return;
    layerRef.current.clearLayers();
    const latlngs: any[] = [];
    points.forEach(p => {
      const w = weightOf(p);
      const color = heatColor(w);
      const baseM = Math.max(500, (p.radius_km || 1) * 1000);
      [1.6, 1.15, 0.7, 0.35].forEach((scale, i) => {
        L.circle([p.lat, p.lng], {
          radius: baseM * scale * (0.6 + w * 0.6),
          stroke: false,
          fillColor: color,
          fillOpacity: 0.16 + i * 0.1,
          interactive: false,
        }).addTo(layerRef.current);
      });
      L.circleMarker([p.lat, p.lng], {
        radius: 5, color: '#fff', weight: 2, fillColor: color, fillOpacity: 1, interactive: false,
      }).addTo(layerRef.current);
      latlngs.push([p.lat, p.lng]);
    });
    if (latlngs.length) {
      const b = L.latLngBounds(latlngs);
      if (b.isValid()) leafletMap.current.fitBounds(b.pad(0.6), { maxZoom: 13, animate: false });
    }
  }, [ready, points]);

  const clickable = !!onNavigate;
  const go = () => onNavigate?.('outbreak');

  // Top hotspots by barangay
  const byBrgy = Object.values(
    points.reduce((acc: Record<string, { barangay: string; cases: number; w: number }>, p) => {
      const a = acc[p.barangay] || { barangay: p.barangay, cases: 0, w: 0 };
      a.cases += p.cases || 0; a.w = Math.max(a.w, weightOf(p));
      acc[p.barangay] = a; return acc;
    }, {})
  ).sort((a, b) => b.w - a.w || b.cases - a.cases).slice(0, 4);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
            <Flame className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-base">Outbreak Heatmap</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {points.length} active outbreak{points.length !== 1 ? 's' : ''} · click map to open Outbreak Monitor
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
          {[['Low', '#22c55e'], ['Moderate', '#facc15'], ['High', '#f97316'], ['Critical', '#dc2626']].map(([l, c]) => (
            <span key={l} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />{l}
            </span>
          ))}
        </div>
      </div>

      <div
        className={`relative rounded-xl overflow-hidden border border-slate-200 group ${clickable ? 'cursor-pointer' : ''}`}
        style={{ height: 340 }}
        onClick={go}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onKeyDown={e => { if (clickable && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); go(); } }}
        title={clickable ? 'Go to Outbreak Monitor' : undefined}
      >
        <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 0 }} />
        {(loading || !ready) && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm text-slate-500 font-semibold">
            Loading heatmap…
          </div>
        )}
        {!loading && ready && points.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="bg-white/90 border border-emerald-200 text-emerald-700 text-sm font-semibold px-4 py-2 rounded-xl shadow">
              No active outbreaks — all clear
            </span>
          </div>
        )}
        {clickable && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/95 border border-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow opacity-90 group-hover:bg-blue-600 group-hover:text-white transition-colors" style={{ zIndex: 500 }}>
            Open Outbreak Monitor <ArrowRight className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {byBrgy.length > 0 && (
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2">
          {byBrgy.map(b => (
            <div key={b.barangay} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: heatColor(b.w) }} />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-700 truncate">{b.barangay}</p>
                <p className="text-[11px] text-slate-400">{b.cases} case{b.cases !== 1 ? 's' : ''}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
