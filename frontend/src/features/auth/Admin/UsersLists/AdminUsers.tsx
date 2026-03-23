import { useEffect, useState } from "react";
import {
  Users, Search, ShieldCheck, User, BadgeCheck, BadgeX,
  Calendar, X, ChevronLeft, ChevronRight,
} from "lucide-react";
import { adminApi } from "../adminApi";
import type { User as UserType } from "../AdminTypes";
import "./AdminUsers.css";

const PAGE_SIZE = 10;

export default function AdminUsers() {
  const [users,    setUsers]    = useState<UserType[]>([]);
  const [search,   setSearch]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  useEffect(() => {
    adminApi.getUsers().then((res) => {
      if (res.success) setUsers(res.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => { setPage(1); }, [search, dateFrom, dateTo]);

  const filtered = users.filter((u) => {
    const matchSearch =
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const joinedAt  = new Date(u.created_at);
    const matchFrom = dateFrom ? joinedAt >= new Date(dateFrom) : true;
    const matchTo   = dateTo
      ? joinedAt <= new Date(new Date(dateTo).setHours(23, 59, 59, 999))
      : true;
    return matchSearch && matchFrom && matchTo;
  });

  const hasDateFilter   = dateFrom || dateTo;
  const clearDateFilter = () => { setDateFrom(""); setDateTo(""); };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageStart  = (safePage - 1) * PAGE_SIZE;
  const paginated  = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const getPageNumbers = () => {
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(1, safePage - delta); i <= Math.min(totalPages, safePage + delta); i++) {
      range.push(i);
    }
    return range;
  };

  return (
    <div className="aus-root">

      {/* ── HEADER: title left | filters right (search + date same line) ── */}
      <div className="aus-header">
        <div>
          <h1 className="aus-title">
            <Users size={24} strokeWidth={2} /> Users
          </h1>
          <p className="aus-subtitle">{users.length} registered users</p>
        </div>

        {/* search + date filter — same row, right side */}
        <div className="aus-filters">

          {/* Search */}
          <div className="aus-search-wrap">
            <Search size={14} className="aus-search-icon" />
            <input
              className="aus-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
            />
          </div>

          {/* Date range */}
          <div className="aus-date-row">
            <Calendar size={13} strokeWidth={2} className="aus-date-icon" />
            <span className="aus-date-label">From</span>
            <input
              type="date"
              className="aus-date-input"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={e => setDateFrom(e.target.value)}
            />
            <span className="aus-date-sep">—</span>
            <span className="aus-date-label">To</span>
            <input
              type="date"
              className="aus-date-input"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={e => setDateTo(e.target.value)}
            />
            {hasDateFilter && (
              <button className="aus-date-clear" onClick={clearDateFilter} title="Clear">
                <X size={12} strokeWidth={2.5} />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Active date filter badge */}
      {hasDateFilter && (
        <div className="aus-date-badge-wrap">
          <div className="aus-date-badge">
            <Calendar size={12} strokeWidth={2} />
            {filtered.length} user{filtered.length !== 1 ? "s" : ""} in selected range
          </div>
        </div>
      )}

      {loading ? (
        <div className="aus-loading"><div className="aus-spinner" /></div>
      ) : (
        <>
          <div className="aus-table-wrap">
            <table className="aus-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Verified</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={5} className="aus-empty">
                    {hasDateFilter ? "No users found in this date range." : "No users found."}
                  </td></tr>
                ) : paginated.map((u) => (
                  <tr key={u.id} className="aus-row">
                    <td>
                      <div className="aus-user-cell">
                        <div className="aus-avatar">
                          {u.first_name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <div className="aus-name">{u.first_name} {u.last_name}</div>
                          <div className="aus-id">ID #{u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="aus-email">{u.email}</td>
                    <td>
                      <span className={`aus-role aus-role--${u.role}`}>
                        {u.role === "admin"
                          ? <ShieldCheck size={11} strokeWidth={2} />
                          : <User size={11} strokeWidth={2} />
                        }
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`aus-verified aus-verified--${u.is_verified}`}>
                        {u.is_verified
                          ? <><BadgeCheck size={11} strokeWidth={2} /> Verified</>
                          : <><BadgeX    size={11} strokeWidth={2} /> Unverified</>
                        }
                      </span>
                    </td>
                    <td className="aus-date">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── PAGINATION ── */}
          {filtered.length > 0 && (
            <div className="aus-pagination">
              <div className="aus-pagination-info">
                Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} of {filtered.length} users
              </div>
              {totalPages > 1 && (
                <div className="aus-pagination-controls">
                  <button className="aus-page-btn aus-page-btn--nav"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={safePage === 1}>
                    <ChevronLeft size={15} strokeWidth={2.5} />
                  </button>

                  {getPageNumbers()[0] > 1 && (
                    <>
                      <button className="aus-page-btn" onClick={() => setPage(1)}>1</button>
                      {getPageNumbers()[0] > 2 && <span className="aus-page-dots">…</span>}
                    </>
                  )}

                  {getPageNumbers().map(n => (
                    <button key={n}
                      className={`aus-page-btn ${n === safePage ? "aus-page-btn--active" : ""}`}
                      onClick={() => setPage(n)}>{n}</button>
                  ))}

                  {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
                    <>
                      {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
                        <span className="aus-page-dots">…</span>
                      )}
                      <button className="aus-page-btn" onClick={() => setPage(totalPages)}>
                        {totalPages}
                      </button>
                    </>
                  )}

                  <button className="aus-page-btn aus-page-btn--nav"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}>
                    <ChevronRight size={15} strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}