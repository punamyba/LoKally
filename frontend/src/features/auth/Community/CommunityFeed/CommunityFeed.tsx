import { useState, useEffect, useCallback, useRef } from "react";
import {
  Bookmark,
  RefreshCw,
  Globe,
  Flame,
} from "lucide-react";
import { communityApi } from "../communityApi";
import CreatePost from "../CreatePost/CreatePost";
import PostCard from "../PostCard/PostCard";
import type { Post } from "../CommunityTypes";
import Navbar from "../../Components/Layout/Navbar/Navbar";
import "./CommunityFeed.css";

interface Props {
  currentUser: { id: number; first_name: string; last_name: string; role?: string };
}

type Tab = "feed" | "trending" | "saved";

export default function CommunityFeed({ currentUser }: Props) {
  const [tab, setTab] = useState<Tab>("feed");
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const loaderRef = useRef<HTMLDivElement>(null);

  const initials = `${currentUser.first_name[0]}${currentUser.last_name?.[0] ?? ""}`.toUpperCase();

  const load = useCallback(async (pg = 1, reset = false) => {
    if (loading) return;

    setLoading(true);
    setErr("");

    try {
      const r = await communityApi.getFeed(pg, 10);

      if (r.success) {
        const newPosts = Array.isArray(r.data) ? r.data : [];

        setPosts((prev) => {
          if (reset) return newPosts;

          const existingIds = new Set(prev.map((p) => p.id));
          const merged = [...prev];

          newPosts.forEach((p: Post) => {
            if (!existingIds.has(p.id)) {
              merged.push(p);
            }
          });

          return merged;
        });

        setHasMore(newPosts.length === 10);
        setPage(pg);
      }
    } catch {
      setErr("Failed to load posts.");
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    load(1, true);
  }, [tab]);

  useEffect(() => {
    const node = loaderRef.current;
    if (!node) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          load(page + 1, false);
        }
      },
      { threshold: 0.2 }
    );

    obs.observe(node);
    return () => obs.disconnect();
  }, [page, hasMore, loading, load]);

  const handleCreated = (post: Post) => {
    setPosts((prev) => [post, ...prev]);
  };

  const handleDelete = (id: number) => {
    setPosts((prev) => prev.filter((x) => x.id !== id));
  };

  const handleHide = (id: number, hidden: boolean) => {
    setPosts((prev) => prev.map((x) => (x.id === id ? { ...x, is_hidden: hidden } : x)));
  };

  const navItems = [
    { key: "feed" as Tab, icon: <Globe size={17} />, label: "Feed" },
    { key: "trending" as Tab, icon: <Flame size={17} />, label: "Trending" },
    { key: "saved" as Tab, icon: <Bookmark size={17} />, label: "Saved" },
  ];

  return (
    <>
      <Navbar />
      <div className="cf">
        <div className="cf-blob1" />
        <div className="cf-blob2" />

        <div className="cf-inner">
          <aside className="cf-left">
            <div className="cf-profile-card">
              <div className="cf-profile-av">{initials}</div>
              <div className="cf-profile-name">
                {currentUser.first_name} {currentUser.last_name}
              </div>
              <div className="cf-profile-sub">LoKally Explorer</div>
              <div className="cf-profile-divider" />
              <div className="cf-profile-stat">
                <span>{posts.filter((p) => p.user_id === currentUser.id).length}</span>
                <label>My Posts</label>
              </div>
            </div>

            <nav className="cf-nav">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  className={`cf-nav-item ${tab === item.key ? "cf-nav-item--on" : ""}`}
                  onClick={() => setTab(item.key)}
                >
                  {item.icon} {item.label}
                  {tab === item.key && <span className="cf-nav-dot" />}
                </button>
              ))}
            </nav>

            <div className="cf-sidebar-rules">
              <div className="cf-rules-title">📋 Guidelines</div>
              <ul className="cf-rules-list">
                <li>Be respectful & kind</li>
                <li>Share real experiences</li>
                <li>No spam or fake content</li>
                <li>Tag places when possible</li>
              </ul>
            </div>
          </aside>

          <main className="cf-feed">
            <div className="cf-feed-header">
              <div>
                <h1 className="cf-feed-title">
                  {tab === "feed" ? "Community" : tab === "trending" ? "Trending" : "Saved Posts"}
                </h1>
                <p className="cf-feed-sub">
                  {tab === "feed"
                    ? "Share your Nepal travel stories"
                    : tab === "trending"
                    ? "Most loved posts this week"
                    : "Your bookmarked posts"}
                </p>
              </div>

              <button
                className="cf-refresh"
                onClick={() => {
                  setPosts([]);
                  setPage(1);
                  setHasMore(true);
                  load(1, true);
                }}
                title="Refresh"
              >
                <RefreshCw size={15} strokeWidth={2.5} />
              </button>
            </div>

            {tab === "feed" && (
              <CreatePost currentUser={currentUser} onCreated={handleCreated} />
            )}

            {err && <div className="cf-err">{err}</div>}

            <div className="cf-posts">
              {posts.length === 0 && !loading && (
                <div className="cf-empty">
                  <div className="cf-empty-icon">🏔️</div>
                  <p className="cf-empty-title">No posts yet</p>
                  <p className="cf-empty-sub">Be the first to share your Nepal experience!</p>
                </div>
              )}

              {posts.map((post) => (
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
                  <div className="cf-dot" />
                  <div className="cf-dot" />
                  <div className="cf-dot" />
                </div>
              )}

              {!hasMore && posts.length > 0 && (
                <p className="cf-end">You're all caught up! 🎉</p>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}