import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bookmark, RefreshCw, Globe, Flame, Sparkles,
  Users, MapPin, PenSquare, TrendingUp, Shield,
  Heart, MessageCircle, Star, Compass,
} from "lucide-react";
import { communityApi } from "../communityApi";
import CreatePost from "../CreatePost/CreatePost";
import PostCard from "../PostCard/PostCard";
import type { Post } from "../CommunityTypes";
import Navbar from "../../Components/Layout/Navbar/Navbar";
import { getAvatarUrl } from "../../../../shared/config/imageUrl";
import "./CommunityFeed.css";

type Tab = "feed" | "trending" | "saved";

export default function CommunityFeed() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<any>(() => {
    try { return JSON.parse(localStorage.getItem("currentUser") || "{}"); }
    catch { return {}; }
  });

  const [tab, setTab]       = useState<Tab>("feed");
  const [posts, setPosts]   = useState<Post[]>([]);
  const [page, setPage]     = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState("");

  const loaderRef   = useRef<HTMLDivElement>(null);
  const isLoading   = useRef(false);
  const currentTab  = useRef<Tab>("feed");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5001/api"}/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const merged = { ...JSON.parse(localStorage.getItem("currentUser") || "{}"), ...d.data };
          setCurrentUser(merged);
          localStorage.setItem("currentUser", JSON.stringify(merged));
        }
      })
      .catch(() => {});
  }, []);

  const initials    = `${currentUser.first_name?.[0] ?? ""}${currentUser.last_name?.[0] ?? ""}`.toUpperCase() || "U";
  const picUrl      = getAvatarUrl(currentUser?.avatar);
  const myPostsCount = posts.filter(p => p.user_id === currentUser.id).length;

  async function fetchPosts(pg: number, tabName: Tab, replace: boolean) {
    if (isLoading.current) return;
    isLoading.current = true;
    setLoading(true); setErr("");
    try {
      let r;
      if (tabName === "trending")   r = await communityApi.getTrending(pg, 10);
      else if (tabName === "saved") r = await communityApi.getSaved(pg, 10);
      else                          r = await communityApi.getFeed(pg, 10);
      if (currentTab.current !== tabName) return;
      if (r.success) {
        const newPosts: Post[] = Array.isArray(r.data) ? r.data : [];
        if (replace) setPosts(newPosts);
        else setPosts(prev => {
          const ids = new Set(prev.map(p => p.id));
          return [...prev, ...newPosts.filter(p => !ids.has(p.id))];
        });
        setHasMore(newPosts.length === 10);
        setPage(pg);
      } else setErr("Failed to load posts.");
    } catch { setErr("Failed to load posts."); }
    finally { isLoading.current = false; setLoading(false); }
  }

  useEffect(() => {
    currentTab.current = tab;
    isLoading.current = false;
    setPosts([]); setPage(1); setHasMore(true);
    fetchPosts(1, tab, true);
  }, [tab]);

  useEffect(() => {
    const node = loaderRef.current;
    if (!node) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isLoading.current)
        fetchPosts(page + 1, currentTab.current, false);
    }, { threshold: 0.2 });
    obs.observe(node);
    return () => obs.disconnect();
  }, [page, hasMore]);

  const handleRefresh = () => {
    currentTab.current = tab;
    isLoading.current = false;
    setPosts([]); setPage(1); setHasMore(true);
    fetchPosts(1, tab, true);
  };

  const handleCreated = (post: Post) => setPosts(prev => [post, ...prev]);
  const handleDelete  = (id: number) => setPosts(prev => prev.filter(x => x.id !== id));
  const handleHide    = (id: number, hidden: boolean) => setPosts(prev => prev.map(x => x.id === id ? { ...x, is_hidden: hidden } : x));

  const TABS = [
    { key: "feed"     as Tab, icon: <Globe size={15} />,    label: "Feed"     },
    { key: "trending" as Tab, icon: <Flame size={15} />,    label: "Trending" },
    { key: "saved"    as Tab, icon: <Bookmark size={15} />, label: "Saved"    },
  ];

  const tabTitle = { feed: "Community Feed", trending: "Trending Posts", saved: "Saved Posts" };
  const tabSub   = {
    feed:     "Share your Nepal travel stories",
    trending: "Most loved posts this week",
    saved:    "Your bookmarked posts",
  };

  return (
    <>
      <Navbar />
      <div className="cf">
        <div className="cf-wrap">

          {/* ── LEFT SIDEBAR ── */}
          <aside className="cf-sidebar">

            {/* Profile card */}
            <div className="cf-profile-card">
              <div className="cf-profile-banner" />
              <div className="cf-profile-body">
                <div className="cf-avatar-ring" onClick={() => navigate("/profile")}>
                  {picUrl
                    ? <img src={picUrl} alt={initials} className="cf-avatar-photo" referrerPolicy="no-referrer" onError={e => { e.currentTarget.style.display = "none"; }} />
                    : <div className="cf-avatar-text">{initials}</div>}
                </div>
                <div className="cf-profile-name" onClick={() => navigate("/profile")}>
                  {currentUser.first_name} {currentUser.last_name}
                </div>
                <div className="cf-profile-badge">
                  <Star size={10} strokeWidth={2.5} fill="currentColor" /> LoKally Explorer
                </div>
                <div className="cf-profile-divider" />
                <div className="cf-profile-stat">
                  <div className="cf-stat-num">{myPostsCount}</div>
                  <div className="cf-stat-label">My Posts</div>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav className="cf-nav">
              {TABS.map(t => (
                <button key={t.key}
                  className={`cf-nav-item ${tab === t.key ? "cf-nav-item--active" : ""}`}
                  onClick={() => setTab(t.key)} type="button">
                  <span className="cf-nav-item-icon">{t.icon}</span>
                  <span>{t.label}</span>
                  {tab === t.key && <span className="cf-nav-item-dot" />}
                </button>
              ))}
            </nav>

            {/* Quick actions */}
            <div className="cf-quick">
              <div className="cf-quick-title">Quick Actions</div>
              <button className="cf-quick-item" onClick={() => navigate("/explore-map")}>
                <Compass size={15} /> Explore the Map
              </button>
              <button className="cf-quick-item" onClick={() => navigate("/ai-search")}>
                <Sparkles size={15} /> AI Search
              </button>
              <button className="cf-quick-item" onClick={() => navigate("/explore-map")}>
                <MapPin size={15} /> Add a Place
              </button>
            </div>

            {/* Rules */}
            <div className="cf-rules-card">
              <div className="cf-rules-title">
                <Shield size={13} /> Community Rules
              </div>
              <ul className="cf-rules-list">
                <li><Heart size={11} /> Be respectful &amp; kind</li>
                <li><MapPin size={11} /> Share real experiences</li>
                <li><MessageCircle size={11} /> No spam or fake content</li>
                <li><Star size={11} /> Tag places when possible</li>
              </ul>
            </div>

          </aside>

          {/* ── MAIN FEED ── */}
          <main className="cf-main">

            {/* Header */}
            <div className="cf-header">
              <div className="cf-header-left">
                <div className="cf-header-icon">
                  {tab === "feed" ? <Users size={18} /> : tab === "trending" ? <TrendingUp size={18} /> : <Bookmark size={18} />}
                </div>
                <div>
                  <h1 className="cf-title">{tabTitle[tab]}</h1>
                  <p className="cf-subtitle">{tabSub[tab]}</p>
                </div>
              </div>
              <button className="cf-refresh-btn" onClick={handleRefresh} title="Refresh" type="button">
                <RefreshCw size={15} strokeWidth={2.5} />
              </button>
            </div>

            {/* Tab pills */}
            <div className="cf-tab-pills">
              {TABS.map(t => (
                <button key={t.key}
                  className={`cf-tab-pill ${tab === t.key ? "cf-tab-pill--active" : ""}`}
                  onClick={() => setTab(t.key)} type="button">
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {tab === "feed" && (
              <CreatePost currentUser={currentUser} onCreated={handleCreated} />
            )}

            {err && <div className="cf-error">{err}</div>}

            <div className="cf-posts">
              {posts.length === 0 && !loading && (
                <div className="cf-empty">
                  <div className="cf-empty-icon-wrap">
                    <PenSquare size={28} strokeWidth={1.5} />
                  </div>
                  <p className="cf-empty-title">
                    {tab === "saved" ? "No saved posts yet" : "No posts yet"}
                  </p>
                  <p className="cf-empty-sub">
                    {tab === "saved"
                      ? "Save posts to find them here!"
                      : "Be the first to share your Nepal experience!"}
                  </p>
                </div>
              )}

              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUser.id}
                  isAdmin={currentUser.role === "admin"}
                  onDelete={handleDelete}
                  onHide={handleHide}
                />
              ))}
            </div>

            <div ref={loaderRef} className="cf-sentinel">
              {loading && (
                <div className="cf-loader">
                  <span /><span /><span />
                </div>
              )}
              {!hasMore && posts.length > 0 && (
                <div className="cf-end">
                  <TrendingUp size={13} /> All caught up!
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}