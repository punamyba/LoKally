import { useEffect, useMemo, useState } from "react";
import { contactApi } from "../../ContactUs/ContactApi";
import type { ContactMessage, ContactStatus } from "../AdminTypes";
import "./AdminContactInbox.css";

const FILTERS: { label: string; value: ContactStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "New", value: "new" },
  { label: "In Progress", value: "in_progress" },
  { label: "Replied", value: "replied" },
  { label: "Closed", value: "closed" },
];

function fmtDate(d: string) {
  return new Date(d).toLocaleString();
}

export default function AdminContactInbox() {
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [filter, setFilter] = useState<ContactStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchList = async () => {
    setLoadingList(true);
    setErrorMsg("");
    try {
      const status = filter === "all" ? undefined : filter;
      const res = await contactApi.adminList(status);
      if (res?.success) setItems(res.data || []);
      else setErrorMsg(res?.message || "Failed to load messages.");
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || "Failed to load messages.");
    }
    setLoadingList(false);
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((m) => {
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  const openOne = async (msg: ContactMessage) => {
    setSelected(msg);
    setReplyText("");
    setLoadingDetail(true);
    setErrorMsg("");

    try {
      const res = await contactApi.adminGet(msg.id);
      if (res?.success) setSelected(res.data);
      else setErrorMsg(res?.message || "Failed to load message.");
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || "Failed to load message.");
    }

    setLoadingDetail(false);
  };

  const setStatus = async (status: ContactStatus) => {
    if (!selected || busy) return;
    setBusy(true);
    setErrorMsg("");

    try {
      const res = await contactApi.adminUpdateStatus(selected.id, status);
      if (res?.success) {
        setSelected(res.data);
        setItems((prev) => prev.map((x) => (x.id === res.data.id ? res.data : x)));
      } else {
        setErrorMsg(res?.message || "Failed to update status.");
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || "Failed to update status.");
    }

    setBusy(false);
  };

  const sendReply = async () => {
    if (!selected || busy) return;
    const reply = replyText.trim();
    if (!reply) return;

    setBusy(true);
    setErrorMsg("");

    try {
      const res = await contactApi.adminReply(selected.id, reply);
      if (res?.success) {
        setSelected(res.data);
        setItems((prev) => prev.map((x) => (x.id === res.data.id ? res.data : x)));
        setReplyText("");
      } else {
        setErrorMsg(res?.message || "Failed to send reply.");
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || "Failed to send reply.");
    }

    setBusy(false);
  };

  return (
    <div className="aci-wrap">
      <div className="aci-header">
        <div>
          <h1 className="aci-title">Contact Inbox</h1>
          <p className="aci-sub">View messages from users and reply from admin.</p>
        </div>

        <button className="aci-btn" onClick={fetchList} disabled={loadingList}>
          Refresh
        </button>
      </div>

      {errorMsg && <div className="aci-alert">{errorMsg}</div>}

      <div className="aci-grid">
        <div className="aci-left">
          <div className="aci-filters">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                className={filter === f.value ? "aci-tab aci-tab-on" : "aci-tab"}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <input
            className="aci-search"
            placeholder="Search by name, email, subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="aci-list">
            {loadingList ? (
              <div className="aci-empty">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="aci-empty">No messages found.</div>
            ) : (
              filtered.map((m) => (
                <div
                  key={m.id}
                  className={selected?.id === m.id ? "aci-item aci-item-on" : "aci-item"}
                  onClick={() => openOne(m)}
                >
                  <div className="aci-item-top">
                    <div className="aci-item-name">{m.name}</div>
                    <div className="aci-item-status">{m.status}</div>
                  </div>
                  <div className="aci-item-subject">{m.subject}</div>
                  <div className="aci-item-email">{m.email}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="aci-right">
          {!selected ? (
            <div className="aci-empty">Select a message to view details.</div>
          ) : loadingDetail ? (
            <div className="aci-empty">Loading message...</div>
          ) : (
            <div className="aci-detail">
              <div className="aci-detail-head">
                <h2 className="aci-detail-subject">{selected.subject}</h2>
                <div className="aci-detail-meta">
                  <div>
                    <div className="aci-detail-name">{selected.name}</div>
                    <div className="aci-detail-email2">{selected.email}</div>
                  </div>
                  <div className="aci-detail-date">{fmtDate(selected.created_at)}</div>
                </div>
              </div>

              <div className="aci-statusbar">
                <span>Status:</span>
                {(["new", "in_progress", "replied", "closed"] as ContactStatus[]).map((s) => (
                  <button
                    key={s}
                    className={selected.status === s ? "aci-sbtn aci-sbtn-on" : "aci-sbtn"}
                    disabled={busy || selected.status === s}
                    onClick={() => setStatus(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="aci-message">
                <h3>Message</h3>
                <p>{selected.message}</p>
              </div>

              {selected.admin_reply && (
                <div className="aci-replied">
                  <h3>Last reply</h3>
                  <p>{selected.admin_reply}</p>
                  {selected.replied_at && <small>Replied at: {fmtDate(selected.replied_at)}</small>}
                </div>
              )}

              <div className="aci-replybox">
                <h3>Reply</h3>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write reply..."
                />
                <button className="aci-btn" onClick={sendReply} disabled={busy || !replyText.trim()}>
                  {busy ? "Working..." : "Send reply"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}