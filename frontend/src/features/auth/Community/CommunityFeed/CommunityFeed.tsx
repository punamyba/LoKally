import { useState, useEffect, useRef, useMemo } from "react";
import { Bookmark, RefreshCw, Globe, Flame, Sparkles } from "lucide-react";
import { communityApi } from "../communityApi";
import CreatePost from "../CreatePost/CreatePost";
import PostCard from "../PostCard/PostCard";
import type { Post } from "../CommunityTypes";
import Navbar from "../../Components/Layout/Navbar/Navbar";
import "./CommunityFeed.css";

type Tab = "feed" | "trending" | "saved";

export default function CommunityFeed() {
  const currentUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("currentUser") || "{}"); }
    catch { return {}; }
  }, []);

  const [tab, setTab]         = useState<Tab>("feed");
  const [posts, setPosts]     = useState<Post[]>([]);
  const [page, setPage]       = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState("");

  const loaderRef    = useRef<HTMLDivElement>(null);
  const isLoading    = useRef(false);
  const currentTab   = useRef<Tab>("feed");

  const initials = `${currentUser.first_name?.[0] ?? ""}${currentUser.last_name?.[0] ?? ""}`.toUpperCase();

  async function fetchPosts(pg: number, tabName: Tab, replace: boolean) {
    if (isLoading.current) return;
    isLoading.current = true;
    setLoading(true);
    setErr("");
    try {
      let r;
      if (tabName === "trending")     r = await communityApi.getTrending(pg, 10);
      else if (tabName === "saved")   r = await communityApi.getSaved(pg, 10);
      else                            r = await communityApi.getFeed(pg, 10);

      // If tab changed while fetching, discard result
      if (currentTab.current !== tabName) return;

      if (r.success) {
        const newPosts: Post[] = Array.isArray(r.data) ? r.data : [];
        if (replace) {
          setPosts(newPosts);
        } else {
          setPosts(prev => {
            const ids = new Set(prev.map(p => p.id));
            return [...prev, ...newPosts.filter(p => !ids.has(p.id))];
          });
        }
        setHasMore(newPosts.length === 10);
        setPage(pg);
      }
    } catch {
      setErr("Failed to load posts.");
    } finally {
      isLoading.current = false;
      setLoading(false);
    }
  }

  // On tab change — reset everything and fetch fresh
  useEffect(() => {
    currentTab.current = tab;
    isLoading.current = false;
    setPosts([]);
    setPage(1);
    setHasMore(true);
    fetchPosts(1, tab, true);
  }, [tab]);

  // Infinite scroll
  useEffect(() => {
    const node = loaderRef.current;
    if (!node) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isLoading.current) {
        fetchPosts(page + 1, currentTab.current, false);
      }
    }, { threshold: 0.2 });
    obs.observe(node);
    return () => obs.disconnect();
  }, [page, hasMore]);

  const handleRefresh = () => {
    currentTab.current = tab;
    isLoading.current = false;
    setPosts([]);
    setPage(1);
    setHasMore(true);
    fetchPosts(1, tab, true);
  };

  const handleCreated = (post: Post) => setPosts(prev => [post, ...prev]);
  const handleDelete  = (id: number) => setPosts(prev => prev.filter(x => x.id !== id));
  const handleHide    = (id: number, hidden: boolean) =>
    setPosts(prev => prev.map(x => x.id === id ? { ...x, is_hidden: hidden } : x));

  const tabs = [
    { key: "feed"     as Tab, icon: <Globe    size={16} />, label: "Feed"     },
    { key: "trending" as Tab, icon: <Flame    size={16} />, label: "Trending" },
    { key: "saved"    as Tab, icon: <Bookmark size={16} />, label: "Saved"    },
  ];

  return (
    <>
      <Navbar />
      <div className="cf">
        <div className="cf-orb cf-orb--1" />
        <div className="cf-orb cf-orb--2" />
        <div className="cf-orb cf-orb--3" />

        <div className="cf-wrap">
          {/* Left sidebar */}
          <aside className="cf-left">
            <div className="cf-profile">
              <div className="cf-profile-bg" />
              <div className="cf-profile-av">{initials}</div>
              <div className="cf-profile-name">{currentUser.first_name} {currentUser.last_name}</div>
              <div className="cf-profile-badge">
                <Sparkles size={11} strokeWidth={2.5} /> LoKally Explorer
              </div>
              <div className="cf-profile-divider" />
              <div className="cf-profile-stat">
                <div className="cf-stat-num">{posts.filter(p => p.user_id === currentUser.id).length}</div>
                <div className="cf-stat-label">My Posts</div>
              </div>
            </div>

            <nav className="cf-nav">
              {tabs.map(item => (
                <button key={item.key}
                  className={`cf-nav-btn ${tab === item.key ? "cf-nav-btn--on" : ""}`}
                  onClick={() => setTab(item.key)}>
                  <span className="cf-nav-icon">{item.icon}</span>
                  {item.label}
                  {tab === item.key && <span className="cf-nav-pip" />}
                </button>
              ))}
            </nav>

            <div className="cf-rules">
              <div className="cf-rules-head">📋 Community Rules</div>
              <ul className="cf-rules-list">
                <li>Be respectful & kind</li>
                <li>Share real experiences</li>
                <li>No spam or fake content</li>
                <li>Tag places when possible</li>
              </ul>
            </div>
          </aside>

          {/* Main feed */}
          <main className="cf-main">
            <div className="cf-header">
              <div>
                <h1 className="cf-title">
                  {tab === "feed" ? "Community" : tab === "trending" ? "Trending" : "Saved"}
                </h1>
                <p className="cf-subtitle">
                  {tab === "feed"      ? "Share your Nepal travel stories"
                  : tab === "trending" ? "Most loved posts this week"
                  :                     "Your bookmarked posts"}
                </p>
              </div>
              <button className="cf-refresh" onClick={handleRefresh} title="Refresh">
                <RefreshCw size={15} strokeWidth={2.5} />
              </button>
            </div>

            {tab === "feed" && <CreatePost currentUser={currentUser} onCreated={handleCreated} />}
            {err && <div className="cf-err">{err}</div>}

            <div className="cf-posts">
              {posts.length === 0 && !loading && (
                <div className="cf-empty">
                  <div className="cf-empty-icon">🏔️</div>
                  <p className="cf-empty-title">{tab === "saved" ? "No saved posts yet" : "No posts yet"}</p>
                  <p className="cf-empty-sub">{tab === "saved" ? "Save posts to find them here!" : "Be the first to share your Nepal experience!"}</p>
                </div>
              )}
              {posts.map(post => (
                <PostCard key={post.id} post={post}
                  currentUserId={currentUser.id}
                  isAdmin={currentUser.role === "admin"}
                  onDelete={handleDelete} onHide={handleHide} />
              ))}
            </div>

            <div ref={loaderRef} className="cf-sentinel">
              {loading && <div className="cf-loader"><div className="cf-dot"/><div className="cf-dot"/><div className="cf-dot"/></div>}
              {!hasMore && posts.length > 0 && <p className="cf-end">✨ You're all caught up!</p>}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}