import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Upload, Compass, Heart, MessageCircle, BadgeCheck,
  Users2, ArrowRight, Map, ThumbsUp, Bookmark,
  ChevronLeft, ChevronRight, Volume2, VolumeX, Sparkles,
  Clock, TreePine, Waves, Church, Building2, Tent,
  UtensilsCrossed, Gem, Star, TrendingUp, Mountain,
} from 'lucide-react';
import Navbar from "../Components/Layout/Navbar/Navbar";
import Footer from "../Components/Layout/Footer/Footer";
import axiosInstance from "../../../shared/config/axiosinstance";
import "./home.css";

const SERVER   = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5001";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
const toUrl    = (p: string) => p?.startsWith("http") ? p : `${SERVER}${p}`;

function parseCover(image: any): string | null {
  if (!image) return null;
  if (typeof image === "string") {
    if (image.startsWith("[")) {
      try { const a = JSON.parse(image); return a[0] ? toUrl(a[0]) : null; } catch {}
    }
    return toUrl(image);
  }
  return null;
}

function parseImages(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return [raw]; }
}

function getAvatarUrl(avatar?: string | null): string | null {
  if (!avatar) return null;
  if (avatar.includes("|||")) return avatar.split("|||")[1];
  if (avatar.startsWith("http")) return avatar;
  if (avatar.startsWith("/")) return `${SERVER}${avatar}`;
  return null;
}

const ago = (d: string) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

type Place = { id: number; name: string; image: string | null; category: string; address: string; };
type Post = {
  id: number; user_id: number; caption: string | null; images: string | null;
  likes_count: number; comments_count: number; created_at: string;
  author: { first_name: string; last_name: string; avatar?: string | null; };
};

const CAT_META: Record<string, { icon: any; color: string; bg: string }> = {
  "Nature":     { icon: TreePine,        color: "#16a34a", bg: "linear-gradient(135deg,#16a34a,#0d9488)" },
  "Heritage":   { icon: Building2,       color: "#7c3aed", bg: "linear-gradient(135deg,#7c3aed,#4f46e5)" },
  "Temple":     { icon: Church,          color: "#f59e0b", bg: "linear-gradient(135deg,#f59e0b,#ef4444)" },
  "Lake":       { icon: Waves,           color: "#0891b2", bg: "linear-gradient(135deg,#0891b2,#1a7fe8)" },
  "Viewpoint":  { icon: Mountain,        color: "#ea580c", bg: "linear-gradient(135deg,#ea580c,#f59e0b)" },
  "Adventure":  { icon: Tent,            color: "#0d9488", bg: "linear-gradient(135deg,#0d9488,#16a34a)" },
  "Cultural":   { icon: Building2,       color: "#db2777", bg: "linear-gradient(135deg,#db2777,#7c3aed)" },
  "Food":       { icon: UtensilsCrossed, color: "#65a30d", bg: "linear-gradient(135deg,#65a30d,#0d9488)" },
  "City":       { icon: Building2,       color: "#4f46e5", bg: "linear-gradient(135deg,#4f46e5,#0891b2)" },
  "Hidden Gem": { icon: Gem,             color: "#be185d", bg: "linear-gradient(135deg,#be185d,#7c3aed)" },
  "Other":      { icon: MapPin,          color: "#6b7280", bg: "linear-gradient(135deg,#6b7280,#374151)" },
};

const VIDEOS = ["/src/assets/hero1.mp4", "/src/assets/hero2.mp4", "/src/assets/hero3.mp4"];

function VideoHero() {
  const navigate = useNavigate();
  const [cur, setCur] = useState(0);
  const [muted, setMuted] = useState(true);
  const [fading, setFading] = useState(false);
  const refs = useRef<(HTMLVideoElement | null)[]>([]);

  const goTo = useCallback((idx: number) => {
    setFading(true);
    setTimeout(() => { setCur(idx); setFading(false); }, 350);
  }, []);

  useEffect(() => {
    refs.current.forEach((v, i) => {
      if (!v) return;
      v.muted = muted;
      if (i === cur) v.play().catch(() => {});
      else { v.pause(); v.currentTime = 0; }
    });
  }, [cur, muted]);

  return (
    <div className="vh">
      {VIDEOS.map((src, i) => (
        <video key={i} ref={el => { refs.current[i] = el; }}
          className={`vh-vid ${i === cur ? "vh-vid--on" : ""}`}
          src={src} loop muted playsInline preload="auto" />
      ))}
      <div className="vh-fade" />
      <div className={`vh-cta ${fading ? "vh-cta--hide" : ""}`}>
        <button className="vh-btn-p" onClick={() => navigate("/explore-map")}>
          <Compass size={16} strokeWidth={2.5} /> Explore Map
        </button>
        <button className="vh-btn-s" onClick={() => navigate("/community")}>
          <Users2 size={16} strokeWidth={2.5} /> Community
        </button>
      </div>
      <button className="vh-arr vh-arr--l" onClick={() => goTo((cur - 1 + VIDEOS.length) % VIDEOS.length)}>
        <ChevronLeft size={20} strokeWidth={2.5} />
      </button>
      <button className="vh-arr vh-arr--r" onClick={() => goTo((cur + 1) % VIDEOS.length)}>
        <ChevronRight size={20} strokeWidth={2.5} />
      </button>
      <div className="vh-dots">
        {VIDEOS.map((_, i) => (
          <button key={i} className={`vh-dot ${i === cur ? "vh-dot--on" : ""}`} onClick={() => goTo(i)} />
        ))}
      </div>
      <button className="vh-mute" onClick={() => setMuted(m => !m)}>
        {muted ? <><VolumeX size={13} /> Unmute</> : <><Volume2 size={13} /> Mute</>}
      </button>
      <div className="vh-num">{String(cur + 1).padStart(2, "0")} / {String(VIDEOS.length).padStart(2, "0")}</div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const mounted = useRef(true);

  const [featured, setFeatured] = useState<Place[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      try {
        const [fr, ar] = await Promise.allSettled([
          axiosInstance.get("/places/featured"),
          axiosInstance.get("/places"),
        ]);
        if (!mounted.current) return;
        if (fr.status === "fulfilled" && fr.value.data?.success)
          setFeatured(fr.value.data.data || []);
        if (ar.status === "fulfilled" && ar.value.data?.success) {
          const all: Place[] = ar.value.data.data || [];
          const c: Record<string, number> = {};
          all.forEach(p => { if (p.category) c[p.category] = (c[p.category] || 0) + 1; });
          setCategories(Object.entries(c).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })));
        }
      } catch { }
      if (mounted.current) setPlacesLoading(false);
    })();
    (async () => {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 6000);
        const token = localStorage.getItem("token") || "";
        const res = await fetch(`${API_BASE}/posts?page=1&limit=6`, {
          signal: ctrl.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        clearTimeout(timer);
        if (!mounted.current) return;
        if (res.ok) { const d = await res.json(); if (d?.success) setPosts(d.data || []); }
      } catch { }
      if (mounted.current) setPostsLoading(false);
    })();
    return () => { mounted.current = false; };
  }, []);

  const getInitials = (p: Post) => `${p.author?.first_name?.[0] ?? ""}${p.author?.last_name?.[0] ?? ""}`.toUpperCase();
  const getFirstImg = (p: Post) => { const imgs = parseImages(p.images); return imgs[0] ? toUrl(imgs[0]) : null; };

  return (
    <div className="hw">
      <Navbar />
      <main className="hm">
        <VideoHero />

        {/* ── 4 QUICK ACTION TILES ── */}
        <div className="row3">
          <div className="tile tile-blue" onClick={() => navigate("/explore-map")}>
            <div className="tile-ic"><MapPin size={26} strokeWidth={1.8} /></div>
            <div className="tile-title">Explore Map</div>
            <div className="tile-desc">Browse all hidden places</div>
          </div>
          <div className="tile tile-green" onClick={() => navigate("/explore-map")}>
            <div className="tile-ic"><Upload size={26} strokeWidth={1.8} /></div>
            <div className="tile-title">Add a Place</div>
            <div className="tile-desc">Share your discovery</div>
          </div>
          <div className="tile tile-violet" onClick={() => navigate("/ai-search")}>
            <div className="tile-ic"><Sparkles size={26} strokeWidth={1.8} /></div>
            <div className="tile-title">AI Search</div>
            <div className="tile-desc">Find places with AI</div>
          </div>
          <div className="tile tile-teal" onClick={() => navigate("/community")}>
            <div className="tile-ic"><Users2 size={26} strokeWidth={1.8} /></div>
            <div className="tile-title">Community</div>
            <div className="tile-desc">Stories from explorers</div>
          </div>
        </div>

        {/* ── FEATURED DESTINATIONS ── */}
        <section className="sec">
          <div className="sec-hd">
            <div>
              <p className="eyebrow">Hand-picked for you</p>
              <h2 className="sec-ttl">Featured Destinations</h2>
            </div>
            <span className="badge-pill"><Star size={11} fill="currentColor" /> Verified spots</span>
          </div>
          {placesLoading ? (
            <div className="loading-dots"><span /><span /><span /></div>
          ) : featured.length === 0 ? (
            <div className="empty-state"><MapPin size={28} strokeWidth={1.2} /><p>No featured places yet.</p></div>
          ) : (
            <div className="feat-scroll">
              {featured.map((p) => {
                const cover = parseCover(p.image);
                return (
                  <div key={p.id} className="feat-card" onClick={() => navigate(`/place/${p.id}`)}>
                    <div className="feat-inner">
                      {cover
                        ? <img src={cover} alt={p.name} className="feat-img" />
                        : <div className="feat-blank"><MapPin size={28} /></div>}
                      <div className="feat-overlay">
                        <div className="feat-top-row">
                          <span className="feat-verified"><BadgeCheck size={10} /> Verified</span>
                          <span className="feat-cat">{p.category}</span>
                        </div>
                        <div className="feat-info">
                          <div className="feat-name">{p.name}</div>
                          <div className="feat-addr"><MapPin size={10} /> {p.address}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── EXPLORE BY CATEGORY ── */}
        <section className="sec">
          <div className="sec-hd">
            <div>
              <p className="eyebrow">What are you looking for?</p>
              <h2 className="sec-ttl">Explore by Category</h2>
            </div>
          </div>
          {placesLoading ? (
            <div className="loading-dots"><span /><span /><span /></div>
          ) : (
            <div className="cat-scroll">
              {categories.map(({ name, count }, i) => {
                const m = CAT_META[name] || CAT_META["Other"];
                const Icon = m.icon;
                return (
                  <div key={name} className="cat-card"
                    style={{ animationDelay: `${i * 0.06}s` }}
                    onClick={() => navigate(`/explore-map?category=${encodeURIComponent(name)}`)}>
                    <div className="cat-circle" style={{ '--cat-icon-color': m.color } as any}>
                      <Icon size={28} strokeWidth={1.8} style={{ color: m.color }} />
                    </div>
                    <div className="cat-name">{name}</div>
                    <div className="cat-count">{count} {count === 1 ? "place" : "places"}</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── COMMUNITY STORIES ── */}
        <section className="sec">
          <div className="sec-hd">
            <div>
              <p className="eyebrow">From our explorers</p>
              <h2 className="sec-ttl">Community Stories</h2>
            </div>
            <button className="sec-link" onClick={() => navigate("/community")}>
              View all <ArrowRight size={13} />
            </button>
          </div>
          {postsLoading ? (
            <div className="loading-dots"><span /><span /><span /></div>
          ) : posts.length === 0 ? (
            <div className="empty-state"><MessageCircle size={28} strokeWidth={1.2} /><p>No stories yet — be the first!</p></div>
          ) : (
            <div className="comm-layout">
              <div className="comm-posts">

                {/* Hero post — first with image */}
                {posts.slice(0, 1).map((post) => {
                  const img = getFirstImg(post);
                  const avatarUrl = getAvatarUrl(post.author?.avatar);
                  const initials = getInitials(post);
                  return (
                    <article key={post.id} className="post-hero" onClick={() => navigate("/community")}>
                      {img && (
                        <div className="post-hero-img-wrap">
                          <img src={img} alt="" className="post-hero-img" />
                          <div className="post-hero-img-fade" />
                        </div>
                      )}
                      <div className="post-hero-body">
                        <div className="post-author-row">
                          {avatarUrl
                            ? <img src={avatarUrl} alt={initials} className="post-avatar-img" />
                            : <div className="post-avatar-initials">{initials}</div>}
                          <div>
                            <div className="post-author-name">{post.author?.first_name} {post.author?.last_name}</div>
                            <div className="post-time"><Clock size={10} /> {ago(post.created_at)}</div>
                          </div>
                        </div>
                        {post.caption && <p className="post-caption-hero">{post.caption}</p>}
                        <div className="post-actions-row">
                          <div className="post-stats">
                            <span><Heart size={13} /> {post.likes_count}</span>
                            <span><MessageCircle size={13} /> {post.comments_count}</span>
                          </div>
                          <div className="post-action-btns">
                            <button><ThumbsUp size={12} /> Like</button>
                            <button><Bookmark size={12} /> Save</button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}

                {/* Small posts grid */}
                <div className="posts-grid">
                  {posts.slice(1, 4).map((post) => {
                    const img = getFirstImg(post);
                    const avatarUrl = getAvatarUrl(post.author?.avatar);
                    const initials = getInitials(post);
                    return (
                      <article key={post.id} className="post-small" onClick={() => navigate("/community")}>
                        {img && (
                          <div className="post-small-img-wrap">
                            <img src={img} alt="" className="post-small-img" />
                          </div>
                        )}
                        <div className="post-small-body">
                          <div className="post-author-row">
                            {avatarUrl
                              ? <img src={avatarUrl} alt={initials} className="post-avatar-img post-avatar-img--sm" />
                              : <div className="post-avatar-initials post-avatar-initials--sm">{initials}</div>}
                            <div>
                              <div className="post-author-name">{post.author?.first_name} {post.author?.last_name}</div>
                              <div className="post-time"><Clock size={9} /> {ago(post.created_at)}</div>
                            </div>
                          </div>
                          {post.caption && <p className="post-caption-small">{post.caption}</p>}
                          <div className="post-stats post-stats--sm">
                            <span><Heart size={11} /> {post.likes_count}</span>
                            <span><MessageCircle size={11} /> {post.comments_count}</span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <button className="view-more-btn" onClick={() => navigate("/community")}>
                  See all community posts <ArrowRight size={14} />
                </button>
              </div>

              {/* Sidebar — community related */}
              <aside className="comm-aside">

                {/* Share story CTA */}
                <div className="aside-share" onClick={() => navigate("/community")}>
                  <div className="aside-share-prompt">Share your Nepal experience...</div>
                  <button className="aside-share-btn">Post Story</button>
                </div>

                {/* Trending tags */}
                <div className="aside-tags-box">
                  <div className="aside-box-hd"><TrendingUp size={13} /> Trending Tags</div>
                  <div className="aside-tags-list">
                    {["Peaceful","Scenic","Hiking","Sunrise","Adventure","Wildlife","Cultural","Photography"].map(tag => (
                      <button key={tag} className="aside-tag" onClick={() => navigate("/ai-search")}>
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Explore links */}
                <div className="aside-links-box">
                  <div className="aside-box-hd">🗺️ Explore Nepal</div>
                  <div className="aside-link-item" onClick={() => navigate("/explore-map")}>
                    <Map size={14} /><span>View all places on map</span><ArrowRight size={12} />
                  </div>
                  <div className="aside-link-item" onClick={() => navigate("/ai-search")}>
                    <Sparkles size={14} /><span>Find places with AI</span><ArrowRight size={12} />
                  </div>
                  <div className="aside-link-item" onClick={() => navigate("/explore-map")}>
                    <MapPin size={14} /><span>Add a hidden place</span><ArrowRight size={12} />
                  </div>
                </div>

              </aside>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}