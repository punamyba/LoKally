import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Send, MessageCircle, ChevronRight, ArrowLeft,
  CheckCircle, Clock, RefreshCw, Lock,
  AlertCircle, Inbox, MessageSquare, Shield, Zap,
} from "lucide-react";
import Navbar from "../Components/Layout/Navbar/Navbar";
import Footer from "../Components/Layout/Footer/Footer";
import { contactApi } from "./ContactApi";
import "./ContactUs.css";

type FormData = { name: string; email: string; subject: string; message: string };
type CStatus = "new" | "open" | "replied" | "closed";
type Conv = { id: number; ref_number: string; subject: string; status: CStatus; allow_user_reply: boolean; created_at: string; updated_at: string };
type ConvMsg = { id: number; sender_type: "user" | "admin"; body: string; created_at: string };
type ConvDetail = Conv & { name: string; email: string; message: string; messages: ConvMsg[] };

const BADGE: Record<CStatus, { label: string; cls: string }> = {
  new:     { label: "New",         cls: "cu-badge--new"     },
  open:    { label: "In Progress", cls: "cu-badge--open"    },
  replied: { label: "Replied",     cls: "cu-badge--replied" },
  closed:  { label: "Closed",      cls: "cu-badge--closed"  },
};

function ago(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return days < 7 ? `${days}d ago` : new Date(d).toLocaleDateString();
}

export default function ContactUs() {
  const isLoggedIn = !!localStorage.getItem("token");
  const me = JSON.parse(localStorage.getItem("currentUser") || "{}");

  const [tab, setTab] = useState<"form" | "msgs">("form");
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState("");
  const [done, setDone] = useState<{ ref_number: string } | null>(null);
  const [convs, setConvs] = useState<Conv[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [detail, setDetail] = useState<ConvDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [replyErr, setReplyErr] = useState("");

  const { register, handleSubmit, formState: { errors }, reset, setValue } =
    useForm<FormData>({ mode: "onChange" });

  useEffect(() => {
    if (isLoggedIn && me?.first_name) {
      setValue("name", `${me.first_name} ${me.last_name || ""}`.trim());
      setValue("email", me.email || "");
    }
  }, []);

  useEffect(() => {
    if (tab === "msgs" && isLoggedIn) loadConvs();
  }, [tab]);

  const loadConvs = async () => {
    setListLoading(true);
    try {
      const r = await contactApi.getMyConversations();
      if (r.success) setConvs(r.data);
    } catch {}
    setListLoading(false);
  };

  const openDetail = async (id: number) => {
    setDetailLoading(true);
    setDetail(null);
    setReplyText("");
    setReplyErr("");
    try {
      const r = await contactApi.getMyConversationDetail(id);
      if (r.success) setDetail(r.data);
    } catch {}
    setDetailLoading(false);
  };

  const onSubmit = async (data: FormData) => {
    setSending(true);
    setSendErr("");
    try {
      const r = await contactApi.sendMessage({
        ...data,
        subject: data.subject || "General Inquiry",
      });
      if (r.success) {
        reset();
        setDone(r.data);
      } else {
        setSendErr(r.message || "Something went wrong.");
      }
    } catch (e: any) {
      setSendErr(e?.response?.data?.message || "Could not reach server.");
    }
    setSending(false);
  };

  const sendReply = async () => {
    if (!detail || !replyText.trim()) return;
    setReplying(true);
    setReplyErr("");
    try {
      const r = await contactApi.userReply(detail.id, replyText.trim());
      if (r.success) {
        setReplyText("");
        setDetail(p => p ? { ...p, messages: [...p.messages, r.data], status: "open" } : p);
      } else {
        setReplyErr(r.message || "Failed.");
      }
    } catch (e: any) {
      setReplyErr(e?.response?.data?.message || "Failed.");
    }
    setReplying(false);
  };

  const hasUnread = convs.some(c => c.status === "replied");

  return (
    <div className="cu-page">
      <Navbar />

      {/* Hero section */}
      <div className="cu-hero">
        <div className="cu-hero-blob1" />
        <div className="cu-hero-blob2" />

        <div className="cu-hero-inner">
          {/* Left content */}
          <div className="cu-hero-left">
            <div className="cu-hero-chip">
              <MessageSquare size={12} strokeWidth={2.5} />
              LoKally Support
            </div>

            <h1 className="cu-hero-title">
              We're here
              <br />
              to <span>help you.</span>
            </h1>

            <p className="cu-hero-desc">
              Found an issue on the map, want to suggest a hidden gem,
              or have a question? We read every message and reply fast.
            </p>

            <div className="cu-hero-facts">
              <div className="cu-hero-fact">
                <div className="cu-hero-fact-dot cu-hero-fact-dot--blue">
                  <Clock size={14} strokeWidth={2.5} />
                </div>
                Reply within 24 hours (Sun–Fri)
              </div>
              <div className="cu-hero-fact">
                <div className="cu-hero-fact-dot cu-hero-fact-dot--green">
                  <CheckCircle size={14} strokeWidth={2.5} />
                </div>
                Every message is personally read
              </div>
              <div className="cu-hero-fact">
                <div className="cu-hero-fact-dot cu-hero-fact-dot--amber">
                  <Shield size={14} strokeWidth={2.5} />
                </div>
                Your privacy is fully protected
              </div>
            </div>
          </div>

          {/* Right card */}
          <div className="cu-hero-card">
            <div className="cu-hero-card-title">
              <Zap size={15} strokeWidth={2.5} />
              How it works
            </div>
            <div className="cu-hero-steps">
              <div className="cu-hero-step">
                <div className="cu-hero-step-num">1</div>
                <div className="cu-hero-step-body">
                  <div className="cu-hero-step-label">Fill the form</div>
                  <div className="cu-hero-step-desc">Describe your issue or suggestion clearly.</div>
                </div>
              </div>
              <div className="cu-hero-step">
                <div className="cu-hero-step-num">2</div>
                <div className="cu-hero-step-body">
                  <div className="cu-hero-step-label">We review it</div>
                  <div className="cu-hero-step-desc">Our team reads and processes your message.</div>
                </div>
              </div>
              <div className="cu-hero-step">
                <div className="cu-hero-step-num">3</div>
                <div className="cu-hero-step-body">
                  <div className="cu-hero-step-label">Get a reply</div>
                  <div className="cu-hero-step-desc">We reply by email and in your Messages tab.</div>
                </div>
              </div>
            </div>
            <div className="cu-hero-card-note">
              <Clock size={13} strokeWidth={2} />
              Average response: under 24 hours
            </div>
          </div>
        </div>
      </div>

      <main className="cu-main">
        <div className="cu-wrap">

          {/* Tabs */}
          <div className="cu-tabs">
            <button
              className={`cu-tab ${tab === "form" ? "cu-tab--on" : ""}`}
              onClick={() => {
                setTab("form");
                setDetail(null);
              }}
            >
              <MessageSquare size={14} strokeWidth={2.5} /> Send Message
            </button>

            {isLoggedIn && (
              <button
                className={`cu-tab ${tab === "msgs" ? "cu-tab--on" : ""}`}
                onClick={() => setTab("msgs")}
              >
                <Inbox size={14} strokeWidth={2.5} /> My Messages
                {hasUnread && <span className="cu-pip" />}
              </button>
            )}
          </div>

          {/* Form tab */}
          {tab === "form" && (
            done ? (
              <div className="cu-success">
                <div className="cu-success-ring">
                  <CheckCircle size={34} strokeWidth={1.8} />
                </div>
                <h2>Message Sent!</h2>
                <p>We've received your message and will reply within 24 hours.</p>
                <div className="cu-ref-box">
                  <span className="cu-ref-label">Reference Number</span>
                  <span className="cu-ref-val">{done.ref_number}</span>
                </div>
                <p className="cu-ref-hint">A confirmation has been sent to your email.</p>
                <div className="cu-success-btns">
                  {isLoggedIn && (
                    <button
                      className="cu-btn"
                      onClick={() => {
                        setDone(null);
                        setTab("msgs");
                      }}
                    >
                      View My Messages <ChevronRight size={14} strokeWidth={2.5} />
                    </button>
                  )}
                  <button className="cu-btn-ghost" onClick={() => setDone(null)}>
                    Send another
                  </button>
                </div>
              </div>
            ) : (
              <div className="cu-grid">
                <div className="cu-form-card">
                  <h2 className="cu-form-title">Send a message</h2>
                  <p className="cu-form-desc">We read every message. Please be as clear as possible.</p>

                  {sendErr && (
                    <div className="cu-alert">
                      <AlertCircle size={14} /> {sendErr}
                    </div>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)} noValidate className="cu-form">
                    <div className="cu-row2">
                      <div className="cu-field">
                        <label>Full name</label>
                        <input
                          placeholder="Your name"
                          className={errors.name ? "cu-input cu-input--err" : "cu-input"}
                          {...register("name", {
                            required: "Required",
                            minLength: { value: 2, message: "Min 2 chars" },
                          })}
                        />
                        {errors.name && <span className="cu-err">{errors.name.message}</span>}
                      </div>

                      <div className="cu-field">
                        <label>Email</label>
                        <input
                          type="email"
                          placeholder="you@example.com"
                          className={errors.email ? "cu-input cu-input--err" : "cu-input"}
                          {...register("email", {
                            required: "Required",
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: "Invalid email",
                            },
                          })}
                        />
                        {errors.email && <span className="cu-err">{errors.email.message}</span>}
                      </div>
                    </div>

                    <div className="cu-field">
                      <label>Subject <span className="cu-opt">(optional)</span></label>
                      <input
                        placeholder='e.g. "Wrong place info"'
                        className="cu-input"
                        {...register("subject", {
                          maxLength: { value: 100, message: "Max 100 chars" },
                        })}
                      />
                    </div>

                    <div className="cu-field">
                      <label>Message</label>
                      <textarea
                        rows={5}
                        placeholder="Write your message..."
                        className={errors.message ? "cu-input cu-input--err" : "cu-input"}
                        {...register("message", {
                          required: "Required",
                          minLength: { value: 10, message: "Min 10 chars" },
                          maxLength: { value: 2000, message: "Max 2000 chars" },
                        })}
                      />
                      {errors.message && <span className="cu-err">{errors.message.message}</span>}
                    </div>

                    <button className="cu-btn cu-btn--full" type="submit" disabled={sending}>
                      {sending
                        ? <><RefreshCw size={14} className="cu-spin" /> Sending...</>
                        : <><Send size={14} strokeWidth={2.5} /> Send message</>
                      }
                    </button>
                  </form>
                </div>

                {/* Side cards */}
                <aside className="cu-aside">
                  <div className="cu-aside-card cu-aside-card--time">
                    <div className="cu-aside-icon cu-aside-icon--blue">
                      <Clock size={20} strokeWidth={2} />
                    </div>
                    <h3>Response time</h3>
                    <p>Usually within 24 hours (Sun–Fri).</p>
                  </div>

                  <div className="cu-aside-card cu-aside-card--tip">
                    <div className="cu-aside-icon cu-aside-icon--green">
                      <CheckCircle size={20} strokeWidth={2} />
                    </div>
                    <h3>Tip</h3>
                    <p>If your issue is about a place, include the place name so we can find it quickly.</p>
                  </div>

                  {isLoggedIn && (
                    <div className="cu-aside-card cu-aside-card--track">
                      <div className="cu-aside-icon cu-aside-icon--purple">
                        <MessageCircle size={20} strokeWidth={2} />
                      </div>
                      <h3>Track your messages</h3>
                      <p>View replies and continue conversations anytime.</p>
                      <button className="cu-aside-link" onClick={() => setTab("msgs")}>
                        My Messages <ChevronRight size={13} strokeWidth={2.5} />
                      </button>
                    </div>
                  )}
                </aside>
              </div>
            )
          )}

          {/* Messages tab */}
          {tab === "msgs" && isLoggedIn && (
            detail ? (
              <div>
                <button className="cu-back" onClick={() => setDetail(null)}>
                  <ArrowLeft size={14} strokeWidth={2.5} /> Back
                </button>

                <div className="cu-thread-head">
                  <span className="cu-thread-ref">{detail.ref_number}</span>
                  <h2 className="cu-thread-subject">{detail.subject}</h2>
                  <div className="cu-thread-meta">
                    <span className={`cu-badge ${BADGE[detail.status]?.cls}`}>{BADGE[detail.status]?.label}</span>
                    <span className="cu-thread-time">Opened {ago(detail.created_at)}</span>
                  </div>
                </div>

                <div className="cu-thread-body">
                  {/* First message */}
                  <div className="cu-msg cu-msg--user">
                    <div className="cu-av cu-av--user">{detail.name[0]?.toUpperCase()}</div>
                    <div className="cu-bubble cu-bubble--user">
                      <div className="cu-msg-meta">
                        <span>You</span>
                        <span>{ago(detail.created_at)}</span>
                      </div>
                      <p className="cu-msg-text">{detail.message}</p>
                    </div>
                  </div>

                  {/* Reply messages */}
                  {detail.messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`cu-msg ${msg.sender_type === "admin" ? "cu-msg--admin" : "cu-msg--user"}`}
                    >
                      <div className={`cu-av ${msg.sender_type === "admin" ? "cu-av--admin" : "cu-av--user"}`}>
                        {msg.sender_type === "admin" ? "L" : detail.name[0]?.toUpperCase()}
                      </div>
                      <div className={`cu-bubble ${msg.sender_type === "admin" ? "cu-bubble--admin" : "cu-bubble--user"}`}>
                        <div className="cu-msg-meta">
                          <span>{msg.sender_type === "admin" ? "LoKally Support" : "You"}</span>
                          <span>{ago(msg.created_at)}</span>
                        </div>
                        <p className="cu-msg-text">{msg.body}</p>
                      </div>
                    </div>
                  ))}

                  {detail.status === "closed" && (
                    <div className="cu-closed">
                      <Lock size={12} strokeWidth={2} /> This conversation has been closed.
                    </div>
                  )}
                </div>

                {/* Reply box */}
                {detail.allow_user_reply && detail.status !== "closed" ? (
                  <div className="cu-reply-box">
                    {replyErr && (
                      <div className="cu-alert">
                        <AlertCircle size={13} /> {replyErr}
                      </div>
                    )}
                    <textarea
                      className="cu-input cu-reply-input"
                      rows={3}
                      placeholder="Write your reply..."
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                    />
                    <button className="cu-btn" onClick={sendReply} disabled={replying || !replyText.trim()}>
                      {replying
                        ? <><RefreshCw size={13} className="cu-spin" /> Sending...</>
                        : <><Send size={13} strokeWidth={2.5} /> Send reply</>
                      }
                    </button>
                  </div>
                ) : detail.status !== "closed" ? (
                  <div className="cu-reply-off">
                    <MessageCircle size={14} /> Replies are disabled.
                  </div>
                ) : null}
              </div>
            ) : (
              <div>
                <div className="cu-list-head">
                  <h2 className="cu-list-title">My Messages</h2>
                  <button className="cu-btn-sm" onClick={() => setTab("form")}>
                    <Send size={13} strokeWidth={2.5} /> New Message
                  </button>
                </div>

                {listLoading ? (
                  <div className="cu-loading">
                    <div className="cu-dot" />
                    <div className="cu-dot" />
                    <div className="cu-dot" />
                  </div>
                ) : convs.length === 0 ? (
                  <div className="cu-empty">
                    <MessageCircle size={44} strokeWidth={1.2} />
                    <p>No messages yet. Send your first support request!</p>
                    <button className="cu-btn" onClick={() => setTab("form")}>
                      <Send size={14} strokeWidth={2.5} /> Send a Message
                    </button>
                  </div>
                ) : (
                  <div className="cu-conv-list">
                    {convs.map(c => (
                      <button key={c.id} className="cu-conv-item" onClick={() => openDetail(c.id)}>
                        <div className="cu-conv-left">
                          <div className="cu-conv-ref">{c.ref_number}</div>
                          <div className="cu-conv-subject">{c.subject}</div>
                          <div className="cu-conv-time">{ago(c.updated_at)}</div>
                        </div>
                        <div className="cu-conv-right">
                          <span className={`cu-badge ${BADGE[c.status]?.cls}`}>{BADGE[c.status]?.label}</span>
                          {c.status === "replied" && <span className="cu-new-pill">New reply!</span>}
                        </div>
                        <ChevronRight size={15} strokeWidth={2} className="cu-conv-arrow" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}