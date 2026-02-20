// AdminUsers.tsx — LoKally Admin v2
import { useEffect, useState } from "react";
import { Users, Search, ShieldCheck, User, BadgeCheck, BadgeX } from "lucide-react";
import { adminApi } from "../AdminApi";
import type { User as UserType } from "../AdminTypes";
import "./AdminUsers.css";

export default function AdminUsers() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getUsers().then((res) => {
      if (res.success) setUsers(res.data);
      setLoading(false);
    });
  }, []);

  const filtered = users.filter((u) =>
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="aus-root">
      <div className="aus-header">
        <div>
          <h1 className="aus-title">
            <Users size={24} strokeWidth={2} />
            Users
          </h1>
          <p className="aus-subtitle">{users.length} registered users</p>
        </div>
        <div className="aus-search-wrap">
          <Search size={14} className="aus-search-icon" />
          <input
            className="aus-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
          />
        </div>
      </div>

      {loading ? (
        <div className="aus-loading"><div className="aus-spinner" /></div>
      ) : (
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
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="aus-empty">No users found.</td></tr>
              ) : filtered.map((u) => (
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
      )}
    </div>
  );
}