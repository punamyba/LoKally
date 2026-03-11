
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, MapPin, Clock, CheckCircle, XCircle,
  ArrowRight, Zap
} from "lucide-react";
import { adminApi } from "../adminApi";
import type { AdminStats, Place } from "../AdminTypes";
import "./AdminDashboard.css";
import { getImageUrl } from "../../../../shared/config/imageUrl";

// ── Bar Chart (pure SVG/CSS, no library)
function BarChart() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
  const submitted = [3, 6, 9, 5, 12, 8, 10, 7, 14];
  const approved  = [2, 4, 7, 4, 9,  6,  8, 6, 11];
  const max = Math.max(...submitted);

  return (
    <div className="adh-bar-chart">
      {months.map((m, i) => (
        <div key={m} className="adh-bar-group">
          <div className="adh-bars">
            <div className="adh-bar adh-bar--primary"
              style={{ height: `${(submitted[i] / max) * 110}px` }} />
            <div className="adh-bar adh-bar--secondary"
              style={{ height: `${(approved[i] / max) * 110}px` }} />
          </div>
          <span className="adh-bar-label">{m}</span>
        </div>
      ))}
    </div>
  );
}

//  Donut Chart
function DonutChart({ approved, total }: { approved: number; total: number }) {
  const pct = total > 0 ? Math.round((approved / total) * 100) : 0;
  const r = 44;
  const circ = 2 * Math.PI * r;
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
            <circle cx="55" cy="55" r={r} fill="none"
              stroke="url(#donutGrad)"
              strokeWidth="10"
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeLinecap="round" />
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

//  Main
export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingPreview, setPendingPreview] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getStats().then((res) => {
      if (res.success) {
        setStats(res.data.stats);
        setPendingPreview(res.data.pendingPreview || []);
      }
      setLoading(false);
    });
  }, []);

  const STAT_CARDS = [
    { label: "Total Users",    value: stats?.users,    Icon: Users,       color: "blue",  badge: "registered" },
    { label: "Total Places",   value: stats?.places,   Icon: MapPin,      color: "green", badge: "submitted" },
    { label: "Pending Review", value: stats?.pending,  Icon: Clock,       color: "amber", badge: "needs action" },
    { label: "Approved",       value: stats?.approved, Icon: CheckCircle, color: "teal",  badge: "live on map" },
    { label: "Rejected",       value: stats?.rejected, Icon: XCircle,     color: "red",   badge: "declined" },
  ];

  if (loading) {
    return (
      <div className="adh-loading">
        <div className="adh-spinner" />
      </div>
    );
  }

  return (
    <div className="adh-root">

      {/* HEADER  */}
      <div className="adh-header">
        <div>
          <h1 className="adh-title">Dashboard</h1>
          <p className="adh-subtitle">Welcome back! Here's what's happening with LoKally.</p>
        </div>
        <div className="adh-date">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })}
        </div>
      </div>

      {/*  STAT CARDS  */}
      <div className="adh-stats">
        {STAT_CARDS.map(({ label, value, Icon, color, badge }) => (
          <div key={label} className={`adh-card adh-card--${color}`}>
            <div className="adh-card-top">
              <div className={`adh-card-icon adh-card-icon--${color}`}>
                <Icon size={17} strokeWidth={2} />
              </div>
              <span className={`adh-card-badge adh-card-badge--${color}`}>{badge}</span>
            </div>
            <div className="adh-card-value">{value ?? "—"}</div>
            <div className="adh-card-label">{label}</div>
            <div className="adh-card-bar">
              <div className="adh-card-fill"
                style={{ width: `${Math.min(100, ((value || 0) / Math.max(stats?.places || 1, 1)) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/*  CHARTS  */}
      <div className="adh-charts-row">
        <div className="adh-chart-card">
          <div className="adh-chart-header">
            <div>
              <div className="adh-chart-title">Monthly Activity</div>
              <div className="adh-chart-subtitle">Places submitted vs approved</div>
            </div>
            <div className="adh-chart-legend">
              <div className="adh-legend-item">
                <span className="adh-legend-dot" style={{ background: "#3b82f6" }} />
                Submitted
              </div>
              <div className="adh-legend-item">
                <span className="adh-legend-dot" style={{ background: "#4ade80" }} />
                Approved
              </div>
            </div>
          </div>
          <BarChart />
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

      {/*  PENDING PREVIEW */}
      <div className="adh-section">
        <div className="adh-section-header">
          <h2 className="adh-section-title">
            <Clock size={16} strokeWidth={2} />
            Pending Review
          </h2>
          <Link to="/admin/pending" className="adh-section-link">
            View all <ArrowRight size={13} />
          </Link>
        </div>

        {pendingPreview.length === 0 ? (
          <div className="adh-empty">
            <CheckCircle size={40} strokeWidth={1.5} className="adh-empty-icon" />
            <div className="adh-empty-text">All caught up — no pending places!</div>
          </div>
        ) : (
          <div className="adh-pending-grid">
            {pendingPreview.map((p) => (
              <div key={p.id} className="adh-pending-card">
                <div className="adh-pending-card-img">
                  {p.image
                    ? <img src={getImageUrl(p.image)} alt={p.name} />
                    : <div className="adh-pending-card-img-placeholder"><MapPin size={32} strokeWidth={1.5} /></div>
                  }
                  {p.category && (
                    <span className="adh-pending-card-cat">{p.category}</span>
                  )}
                </div>
                <div className="adh-pending-card-body">
                  <div className="adh-pending-card-row">
                    <div className="adh-pending-card-name">{p.name}</div>
                    <span className="adh-badge adh-badge--pending">Pending</span>
                  </div>
                  <div className="adh-pending-card-addr">
                    <MapPin size={11} strokeWidth={2} /> {p.address}
                  </div>
                  <div className="adh-pending-card-footer">
                    <div className="adh-pending-card-by">
                      By {p.submitter?.first_name} {p.submitter?.last_name}
                    </div>
                    <div className="adh-pending-card-date">
                      {new Date(p.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/*  QUICK ACTIONS */}
      <div className="adh-section">
        <h2 className="adh-section-title" style={{ marginBottom: 14 }}>
          <Zap size={16} strokeWidth={2} />
          Quick Actions
        </h2>
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