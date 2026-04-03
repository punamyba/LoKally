import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users, MapPin, Clock, CheckCircle, XCircle,
  ArrowRight, Zap, TrendingUp, TrendingDown, AlertCircle, BarChart2
} from "lucide-react";
import { adminApi } from "../adminApi";
import type { AdminStats, Place } from "../AdminTypes";
import "./AdminDashboard.css";
import { getImageUrl } from "../../../../shared/config/imageUrl";

function parseImages(image: string | null | undefined): string[] {
  if (!image) return [];
  if (image.startsWith("[")) {
    try { return (JSON.parse(image) as string[]).map((p) => getImageUrl(p)); }
    catch { return [getImageUrl(image)]; }
  }
  return [getImageUrl(image)];
}

// ── Bar Chart
function BarChart({ data }: { data: { month: string; submitted: number; approved: number }[] }) {
  const submitted = data.map(d => Number(d.submitted));
  const approved  = data.map(d => Number(d.approved));
  const max = Math.max(...submitted, 1);
  return (
    <div className="adh-bar-chart">
      {data.map((d, i) => (
        <div key={i} className="adh-bar-group">
          <div className="adh-bars">
            <div className="adh-bar adh-bar--primary"   style={{ height: `${(submitted[i] / max) * 110}px` }} />
            <div className="adh-bar adh-bar--secondary" style={{ height: `${(approved[i]  / max) * 110}px` }} />
          </div>
          <span className="adh-bar-label">{d.month}</span>
        </div>
      ))}
    </div>
  );
}

// ── Pie Chart
const PIE_COLORS = ["#3b82f6","#22c55e","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316"];

function PieChart({ data }: { data: { category: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + Number(d.count), 0) || 1;
  let cumulative = 0;
  const slices = data.map((d, i) => {
    const pct = Number(d.count) / total;
    const startAngle = cumulative * 2 * Math.PI;
    cumulative += pct;
    const endAngle = cumulative * 2 * Math.PI;
    const x1 = 50 + 40 * Math.cos(startAngle - Math.PI / 2);
    const y1 = 50 + 40 * Math.sin(startAngle - Math.PI / 2);
    const x2 = 50 + 40 * Math.cos(endAngle   - Math.PI / 2);
    const y2 = 50 + 40 * Math.sin(endAngle   - Math.PI / 2);
    return { ...d, x1, y1, x2, y2, largeArc: pct > 0.5 ? 1 : 0,
      color: PIE_COLORS[i % PIE_COLORS.length], pct };
  });
  return (
    <div className="adh-pie-inner">
      <svg viewBox="0 0 100 100" width="150" height="150" style={{ flexShrink: 0 }}>
        {slices.map((s, i) => (
          <path key={i}
            d={`M50,50 L${s.x1},${s.y1} A40,40 0 ${s.largeArc},1 ${s.x2},${s.y2} Z`}
            fill={s.color} stroke="white" strokeWidth="1" opacity="0.9" />
        ))}
        <circle cx="50" cy="50" r="22" fill="white" />
        <text x="50" y="47" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0f172a">{data.length}</text>
        <text x="50" y="57" textAnchor="middle" fontSize="5.5" fill="#94a3b8">types</text>
      </svg>
      <div className="adh-pie-legend">
        {slices.map((s, i) => (
          <div key={i} className="adh-pie-legend-item">
            <span className="adh-pie-legend-dot" style={{ background: s.color }} />
            <span className="adh-pie-legend-label">{s.category || "Other"}</span>
            <span className="adh-pie-legend-count">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Donut Chart
function DonutChart({ approved, total }: { approved: number; total: number }) {
  const pct  = total > 0 ? Math.round((approved / total) * 100) : 0;
  const r    = 44, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="adh-donut-wrap">
      <div className="adh-donut">
        <svg width="110" height="110" viewBox="0 0 110 110">
          <defs>
            <linearGradient id="donutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
          <circle cx="55" cy="55" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
          {pct > 0 && (
            <circle cx="55" cy="55" r={r} fill="none" stroke="url(#donutGrad)"
              strokeWidth="10" strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
          )}
        </svg>
        <div className="adh-donut-label">
          <span className="adh-donut-pct">{pct}%</span>
          <span className="adh-donut-sub">approved</span>
        </div>
      </div>
      <div className="adh-donut-stats">
        <div>
          <div className="adh-donut-stat-label">Total</div>
          <div className="adh-donut-stat-val">{total}</div>
          <div className="adh-donut-stat-growth">places submitted</div>
        </div>
        <div>
          <div className="adh-donut-stat-label">Approved</div>
          <div className="adh-donut-stat-val">{approved}</div>
          <div className="adh-donut-stat-growth">live on map</div>
        </div>
      </div>
    </div>
  );
}

// ── Main
export default function AdminDashboard() {
  const [stats, setStats]               = useState<AdminStats | null>(null);
  const [pendingPreview, setPendingPreview] = useState<Place[]>([]);
  const [chartData, setChartData]       = useState<{
    categoryData: { category: string; count: number }[];
    monthlyData:  { month: string; submitted: number; approved: number }[];
  }>({ categoryData: [], monthlyData: [] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([adminApi.getStats(), adminApi.getChartData()]).then(([sRes, cRes]) => {
      if (sRes.success) { setStats(sRes.data.stats); setPendingPreview(sRes.data.pendingPreview || []); }
      if (cRes.success) setChartData(cRes.data);
      setLoading(false);
    });
  }, []);

  const approvalRate  = stats?.places ? Math.round((stats.approved / stats.places) * 100) : 0;
  const rejectionRate = stats?.places ? Math.round((stats.rejected / stats.places) * 100) : 0;
  const pendingRate   = stats?.places ? Math.round((stats.pending  / stats.places) * 100) : 0;
  const placesPerUser = stats?.users  ? (stats.places / stats.users).toFixed(1) : "0";

  const STAT_CARDS = [
    { label: "Total Users",    value: stats?.users,    Icon: Users,       color: "blue",  badge: "registered"  },
    { label: "Total Places",   value: stats?.places,   Icon: MapPin,      color: "green", badge: "submitted"   },
    { label: "Pending Review", value: stats?.pending,  Icon: Clock,       color: "amber", badge: "needs action"},
    { label: "Approved",       value: stats?.approved, Icon: CheckCircle, color: "teal",  badge: "live on map" },
    { label: "Rejected",       value: stats?.rejected, Icon: XCircle,     color: "red",   badge: "declined"    },
  ];

  const EXTRA_CARDS = [
    { title: "Approval Rate",  value: `${approvalRate}%`,  sub: "of all submissions", Icon: TrendingUp,   color: "blue",  bar: approvalRate,                        barColor: "#3b82f6" },
    { title: "Rejection Rate", value: `${rejectionRate}%`, sub: "of all submissions", Icon: TrendingDown, color: "red",   bar: rejectionRate,                       barColor: "#ef4444" },
    { title: "Pending Rate",   value: `${pendingRate}%`,   sub: "awaiting review",    Icon: AlertCircle,  color: "amber", bar: pendingRate,                         barColor: "#f59e0b" },
    { title: "Places / User",  value: placesPerUser,       sub: "avg per user",       Icon: BarChart2,    color: "green", bar: Math.min(100, Number(placesPerUser) * 20), barColor: "#22c55e" },
  ];

  if (loading) return <div className="adh-loading"><div className="adh-spinner" /></div>;

  return (
    <div className="adh-root">

      {/* Header */}
      <div className="adh-header">
        <div>
          <h1 className="adh-title">Dashboard</h1>
          <p className="adh-subtitle">Welcome back! Here's what's happening with LoKally.</p>
        </div>
        <div className="adh-date">
          {new Date().toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="adh-stats">
        {STAT_CARDS.map(({ label, value, Icon, color, badge }) => (
          <div key={label} className={`adh-card adh-card--${color}`}>
            <div className="adh-card-top">
              <div className={`adh-card-icon adh-card-icon--${color}`}><Icon size={17} strokeWidth={2} /></div>
              <span className={`adh-card-badge adh-card-badge--${color}`}>{badge}</span>
            </div>
            <div className="adh-card-value">{value ?? "—"}</div>
            <div className="adh-card-label">{label}</div>
            <div className="adh-card-bar">
              <div className="adh-card-fill"
                style={{ width:`${Math.min(100,((value||0)/Math.max(stats?.places||1,1))*100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Extra Stats — redesigned with progress bar */}
      <div className="adh-extra-stats">
        {EXTRA_CARDS.map(({ title, value, sub, Icon, color, bar, barColor }) => (
          <div key={title} className={`adh-extra-card adh-extra-card--${color}`}>
            <div className="adh-extra-top">
              <div className={`adh-extra-icon-wrap adh-extra-icon-wrap--${color}`}>
                <Icon size={14} strokeWidth={2.5} />
              </div>
              <span className="adh-extra-title">{title}</span>
            </div>
            <div className="adh-extra-val">{value}</div>
            <div className="adh-extra-progress">
              <div className="adh-extra-progress-fill" style={{ width:`${bar}%`, background: barColor }} />
            </div>
            <div className="adh-extra-sub">{sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 — Bar + Donut */}
      <div className="adh-charts-row">
        <div className="adh-chart-card">
          <div className="adh-chart-header">
            <div>
              <div className="adh-chart-title">Monthly Activity</div>
              <div className="adh-chart-subtitle">Places submitted vs approved</div>
            </div>
            <div className="adh-chart-legend">
              <div className="adh-legend-item"><span className="adh-legend-dot" style={{ background:"#3b82f6" }} />Submitted</div>
              <div className="adh-legend-item"><span className="adh-legend-dot" style={{ background:"#4ade80" }} />Approved</div>
            </div>
          </div>
          {chartData.monthlyData.length > 0
            ? <BarChart data={chartData.monthlyData} />
            : <div className="adh-chart-empty">No monthly data yet</div>}
        </div>

        <div className="adh-chart-card">
          <div className="adh-chart-header">
            <div>
              <div className="adh-chart-title">Approval Rate</div>
              <div className="adh-chart-subtitle">Approved vs total submissions</div>
            </div>
          </div>
          <DonutChart approved={stats?.approved || 0} total={stats?.places || 0} />
        </div>
      </div>

      {/* Charts Row 2 — Pie + Status breakdown (same row) */}
      <div className="adh-charts-row adh-charts-row--equal" style={{ marginBottom: 24 }}>

        <div className="adh-chart-card">
          <div className="adh-chart-header">
            <div>
              <div className="adh-chart-title">Places by Category</div>
              <div className="adh-chart-subtitle">Approved places breakdown</div>
            </div>
          </div>
          {chartData.categoryData.length > 0
            ? <PieChart data={chartData.categoryData} />
            : <div className="adh-chart-empty">No category data yet</div>}
        </div>

        <div className="adh-chart-card">
          <div className="adh-chart-header">
            <div>
              <div className="adh-chart-title">Submission Status</div>
              <div className="adh-chart-subtitle">Overview of all place statuses</div>
            </div>
          </div>
          <div className="adh-status-list">
            {[
              { label: "Approved", value: stats?.approved || 0, color: "#22c55e", bg: "#f0fdf4" },
              { label: "Pending",  value: stats?.pending  || 0, color: "#f59e0b", bg: "#fffbeb" },
              { label: "Rejected", value: stats?.rejected || 0, color: "#ef4444", bg: "#fef2f2" },
            ].map(({ label, value, color, bg }) => {
              const pct = stats?.places ? Math.round((value / stats.places) * 100) : 0;
              return (
                <div key={label} className="adh-status-item">
                  <div className="adh-status-top">
                    <div className="adh-status-dot-label">
                      <span className="adh-status-dot" style={{ background: color }} />
                      <span className="adh-status-label">{label}</span>
                    </div>
                    <div className="adh-status-right">
                      <span className="adh-status-val">{value}</span>
                      <span className="adh-status-pct" style={{ background: bg, color }}>{pct}%</span>
                    </div>
                  </div>
                  <div className="adh-status-bar">
                    <div className="adh-status-bar-fill" style={{ width:`${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
            <div className="adh-status-total">
              <span>Total Places</span>
              <strong>{stats?.places || 0}</strong>
            </div>
          </div>
        </div>

      </div>

      {/* Pending Review */}
      <div className="adh-section">
        <div className="adh-section-header">
          <h2 className="adh-section-title"><Clock size={16} strokeWidth={2} />Pending Review</h2>
          <Link to="/admin/pending" className="adh-section-link">View all <ArrowRight size={13} /></Link>
        </div>
        {pendingPreview.length === 0 ? (
          <div className="adh-empty">
            <CheckCircle size={40} strokeWidth={1.5} className="adh-empty-icon" />
            <div className="adh-empty-text">All caught up — no pending places!</div>
          </div>
        ) : (
          <div className="adh-pending-grid">
            {pendingPreview.map((p) => {
              const coverImg = parseImages(p.image)[0] || null;
              return (
                <div key={p.id} className="adh-pending-card"
                  onClick={() => navigate("/admin/pending")} style={{ cursor:"pointer" }}>
                  <div className="adh-pending-card-img">
                    {coverImg
                      ? <img src={coverImg} alt={p.name} />
                      : <div className="adh-pending-card-img-placeholder"><MapPin size={32} strokeWidth={1.5} /></div>}
                    {p.category && <span className="adh-pending-card-cat">{p.category}</span>}
                  </div>
                  <div className="adh-pending-card-body">
                    <div className="adh-pending-card-row">
                      <div className="adh-pending-card-name">{p.name}</div>
                      <span className="adh-badge adh-badge--pending">Pending</span>
                    </div>
                    <div className="adh-pending-card-addr"><MapPin size={11} strokeWidth={2} /> {p.address}</div>
                    <div className="adh-pending-card-footer">
                      <div className="adh-pending-card-by">By {p.submitter?.first_name} {p.submitter?.last_name}</div>
                      <div className="adh-pending-card-date">{new Date(p.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="adh-section">
        <h2 className="adh-section-title" style={{ marginBottom:14 }}><Zap size={16} strokeWidth={2} />Quick Actions</h2>
        <div className="adh-actions">
          <Link to="/admin/pending" className="adh-action adh-action--amber">
            {stats?.pending ? <span className="adh-action-count">{stats.pending}</span> : null}
            <div className="adh-action-icon-wrap"><Clock size={20} strokeWidth={2} /></div>
            <div className="adh-action-label">Review Pending</div>
            <div className="adh-action-desc">Places awaiting approval</div>
          </Link>
          <Link to="/admin/add-place" className="adh-action adh-action--blue">
            <div className="adh-action-icon-wrap"><MapPin size={20} strokeWidth={2} /></div>
            <div className="adh-action-label">Add Place</div>
            <div className="adh-action-desc">Auto-approved & live</div>
          </Link>
          <Link to="/admin/places" className="adh-action adh-action--green">
            <div className="adh-action-icon-wrap"><CheckCircle size={20} strokeWidth={2} /></div>
            <div className="adh-action-label">Manage Places</div>
            <div className="adh-action-desc">View & moderate all places</div>
          </Link>
          <Link to="/admin/users" className="adh-action adh-action--teal">
            <div className="adh-action-icon-wrap"><Users size={20} strokeWidth={2} /></div>
            <div className="adh-action-label">View Users</div>
            <div className="adh-action-desc">All registered members</div>
          </Link>
        </div>
      </div>

    </div>
  );
}