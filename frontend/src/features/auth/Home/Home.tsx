import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Upload, Compass, Mountain, Droplets, Church, Waves,
  Home as HomeIcon, Heart, MessageCircle, BadgeCheck, TrendingUp,
  Users2, ArrowRight, Map, ThumbsUp, Bookmark,
  ChevronLeft, ChevronRight, Volume2, VolumeX,
} from 'lucide-react';
import Navbar from "../Components/Layout/Navbar/Navbar";
import Footer from "../Components/Layout/Footer/Footer";
import axiosInstance from "../../../shared/config/axiosinstance";
import "./home.css";

const SERVER   = import.meta.env.VITE_API_URL?.replace("/api","") || "http://localhost:5001";
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
function parseImages(raw: string|null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return [raw]; }
}
const ago = (d: string) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m/60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h/24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"});
};

type Place = { id:number; name:string; image:string|null; category:string; address:string; };
type Post  = {
  id:number; user_id:number; caption:string|null; images:string|null;
  likes_count:number; comments_count:number; created_at:string;
  author:{ first_name:string; last_name:string; };
};

const CATEGORIES = [
  { name:"Mountains",  key:"Nature",    Icon:Mountain   },
  { name:"Waterfalls", key:"Viewpoint", Icon:Droplets   },
  { name:"Temples",    key:"Temple",    Icon:Church     },
  { name:"Lakes",      key:"Lake",      Icon:Waves      },
  { name:"Villages",   key:"Cultural",  Icon:HomeIcon   },
];

// Video files: src/assets/videos/hero1.mp4, hero2.mp4, hero3.mp4
const VIDEOS = [
  "/src/assets/hero1.mp4",
  "/src/assets/hero2.mp4",
  "/src/assets/hero3.mp4",
];

/* ── VIDEO HERO ─────────────────────────────────────────── */
function VideoHero() {
  const navigate = useNavigate();
  const [cur, setCur]       = useState(0);
  const [muted, setMuted]   = useState(true);
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
      {/* Videos */}
      {VIDEOS.map((src, i) => (
        <video
          key={i}
          ref={el => { refs.current[i] = el; }}
          className={`vh-vid ${i === cur ? "vh-vid--on" : ""}`}
          src={src}
          loop muted playsInline preload="auto"
        />
      ))}

      {/* Only a subtle bottom fade so controls are readable */}
      <div className="vh-fade" />

      {/* CTA buttons — bottom center */}
      <div className={`vh-cta ${fading ? "vh-cta--hide" : ""}`}>
        <button className="vh-btn-p" onClick={() => navigate("/explore-map")}>
          <Compass size={16} strokeWidth={2.5} /> Explore Map
        </button>
        <button className="vh-btn-s" onClick={() => navigate("/community")}>
          <Users2 size={16} strokeWidth={2.5} /> Community
        </button>
      </div>

      {/* Arrows */}
      <button className="vh-arr vh-arr--l"
        onClick={() => goTo((cur - 1 + VIDEOS.length) % VIDEOS.length)}>
        <ChevronLeft size={20} strokeWidth={2.5} />
      </button>
      <button className="vh-arr vh-arr--r"
        onClick={() => goTo((cur + 1) % VIDEOS.length)}>
        <ChevronRight size={20} strokeWidth={2.5} />
      </button>

      {/* Dots */}
      <div className="vh-dots">
        {VIDEOS.map((_, i) => (
          <button key={i}
            className={`vh-dot ${i === cur ? "vh-dot--on" : ""}`}
            onClick={() => goTo(i)} />
        ))}
      </div>

      {/* Mute */}
      <button className="vh-mute" onClick={() => setMuted(m => !m)}>
        {muted
          ? <><VolumeX size={14} strokeWidth={2} /> Unmute</>
          : <><Volume2 size={14} strokeWidth={2} /> Mute</>}
      </button>

      {/* Counter */}
      <div className="vh-num">
        {String(cur + 1).padStart(2,"0")} / {String(VIDEOS.length).padStart(2,"0")}
      </div>
    </div>
  );
}

/* ── MAIN ───────────────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();
  const mounted  = useRef(true);

  const [featured,      setFeatured]      = useState<Place[]>([]);
  const [catCounts,     setCatCounts]     = useState<Record<string,number>>({});
  const [posts,         setPosts]         = useState<Post[]>([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [postsLoading,  setPostsLoading]  = useState(true);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      try {
        const [fr, ar] = await Promise.allSettled([
          axiosInstance.get("/places/featured"),
          axiosInstance.get("/places"),
        ]);
        if (!mounted.current) return;
        if (fr.status==="fulfilled" && fr.value.data?.success)
          setFeatured(fr.value.data.data || []);
        if (ar.status==="fulfilled" && ar.value.data?.success) {
          const all = ar.value.data.data || [];
          const c: Record<string,number> = {};
          all.forEach((p:Place) => { if(p.category) c[p.category]=(c[p.category]||0)+1; });
          setCatCounts(c);
        }
      } catch {}
      if (mounted.current) setPlacesLoading(false);
    })();
    (async () => {
      try {
        const ctrl  = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 6000);
        const token = localStorage.getItem("token") || "";
        const res   = await fetch(`${API_BASE}/posts?page=1&limit=6`, {
          signal: ctrl.signal,
          headers: token ? { Authorization:`Bearer ${token}` } : {},
        });
        clearTimeout(timer);
        if (!mounted.current) return;
        if (res.ok) {
          const data = await res.json();
          if (data?.success) setPosts(data.data || []);
        }
      } catch {}
      if (mounted.current) setPostsLoading(false);
    })();
    return () => { mounted.current = false; };
  }, []);

  const initials = (p: Post) =>
    `${p.author?.first_name?.[0]??""}${p.author?.last_name?.[0]??""}`.toUpperCase();
  const firstImg = (p: Post) => {
    const imgs = parseImages(p.images);
    return imgs[0] ? toUrl(imgs[0]) : null;
  };

  const bigPost    = posts[0] ?? null;
  const smallPosts = posts.slice(1, 3);
  const morePosts  = posts.slice(3);

  return (
    <div className="hw">
      <Navbar/>
      <main className="hm">

        <VideoHero />

        {/* QUICK ACTIONS */}
        <div className="row3">
          <div className="tile tile-blue" onClick={()=>navigate("/explore-map")}>
            <div className="tile-ic"><MapPin size={26} strokeWidth={1.8}/></div>
            <div className="tile-title">Explore Map</div>
            <div className="tile-desc">Browse all hidden places</div>
          </div>
          <div className="tile tile-green" onClick={()=>navigate("/explore-map")}>
            <div className="tile-ic"><Upload size={26} strokeWidth={1.8}/></div>
            <div className="tile-title">Add a Place</div>
            <div className="tile-desc">Share your discovery</div>
          </div>
          <div className="tile tile-purple" onClick={()=>navigate("/community")}>
            <div className="tile-ic"><Users2 size={26} strokeWidth={1.8}/></div>
            <div className="tile-title">Community</div>
            <div className="tile-desc">Stories from explorers</div>
          </div>
        </div>

        {/* CATEGORIES */}
        <div className="sec-head" style={{marginBottom:16}}>
          <div className="sec-title">Explore by Category</div>
        </div>
        <div className="cats">
          {CATEGORIES.map(({name,key,Icon})=>(
            <div key={name} className="cat"
              onClick={()=>navigate(`/explore-map?category=${encodeURIComponent(key)}`)}>
              <div className="cat-ic"><Icon size={22} strokeWidth={1.8}/></div>
              <div className="cat-nm">{name}</div>
              <div className="cat-cnt">{placesLoading?"—":(catCounts[key]||0)} places</div>
            </div>
          ))}
        </div>

        {/* FEATURED */}
        <div className="sec-head">
          <div className="sec-title">Featured Destinations</div>
          <div className="sec-badge"><TrendingUp size={12}/> Latest verified</div>
        </div>
        {placesLoading ? (
          <div className="ld"><div className="ld-dot"/><div className="ld-dot"/><div className="ld-dot"/></div>
        ) : featured.length===0 ? (
          <div className="empty"><p>No featured places yet.</p>
            <button className="empty-btn" onClick={()=>navigate("/explore-map")}>Add a Place</button>
          </div>
        ) : (
          <div className="places-scroll">
            {featured.map(place=>{
              const cover = parseCover(place.image);
              return (
                <div key={place.id} className="pcard" onClick={()=>navigate(`/place/${place.id}`)}>
                  {cover ? <img src={cover} alt={place.name} className="pcard-img"/>
                    : <div className="pcard-noimg"><MapPin size={28} strokeWidth={1.2}/></div>}
                  <div className="pcard-badge"><BadgeCheck size={11} strokeWidth={2.5}/> Verified</div>
                  <div className="pcard-overlay">
                    <div className="pcard-name">{place.name}</div>
                    <div className="pcard-addr">{place.address}</div>
                    <div className="pcard-meta">
                      <span><Heart size={12} strokeWidth={2}/> 0</span>
                      <span><MessageCircle size={12} strokeWidth={2}/> 0</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* COMMUNITY */}
        <div className="sec-head">
          <div className="sec-title">Community Stories</div>
          <button className="sec-link" onClick={()=>navigate("/community")}>
            View all <ArrowRight size={13}/>
          </button>
        </div>
        {postsLoading ? (
          <div className="ld"><div className="ld-dot"/><div className="ld-dot"/><div className="ld-dot"/></div>
        ) : posts.length===0 ? (
          <div className="empty"><p>No stories yet —{" "}
            <span style={{color:"var(--blue)",cursor:"pointer",fontWeight:600}}
              onClick={()=>navigate("/community")}>be the first to share!</span></p>
          </div>
        ) : (
          <div className="mag">
            <div className="mag-main">
              {bigPost && (
                <div className="post-big" onClick={()=>navigate("/community")}>
                  {firstImg(bigPost)
                    ? <img className="post-big-img" src={firstImg(bigPost)!} alt=""/>
                    : <div className="post-big-noimg">🏔️</div>}
                  <div className="post-big-body">
                    <div className="post-big-head">
                      <div className="av">{initials(bigPost)}</div>
                      <div>
                        <div className="post-author">{bigPost.author?.first_name} {bigPost.author?.last_name}</div>
                        <div className="post-time">{ago(bigPost.created_at)}</div>
                      </div>
                    </div>
                    {bigPost.caption && <p className="post-caption">{bigPost.caption}</p>}
                  </div>
                  <div className="post-footer">
                    <div className="post-stats">
                      <span className="post-stat"><Heart size={14} strokeWidth={2}/> {bigPost.likes_count}</span>
                      <span className="post-stat"><MessageCircle size={14} strokeWidth={2}/> {bigPost.comments_count}</span>
                    </div>
                    <div className="post-acts">
                      <button className="post-act"><ThumbsUp size={14}/> Like</button>
                      <button className="post-act"><MessageCircle size={14}/> Comment</button>
                      <button className="post-act"><Bookmark size={14}/> Save</button>
                    </div>
                  </div>
                </div>
              )}
              {smallPosts.length > 0 && (
                <div className="post-pair">
                  {smallPosts.map(post=>(
                    <div key={post.id} className="post-sm" onClick={()=>navigate("/community")}>
                      {firstImg(post)
                        ? <img className="post-sm-img" src={firstImg(post)!} alt=""/>
                        : <div className="post-sm-noimg">📸</div>}
                      <div className="post-sm-body">
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                          <div className="av-sm">{initials(post)}</div>
                          <div>
                            <div className="post-author-sm">{post.author?.first_name} {post.author?.last_name}</div>
                            <div className="post-time-sm">{ago(post.created_at)}</div>
                          </div>
                        </div>
                        {post.caption && <p className="post-caption-sm">{post.caption}</p>}
                      </div>
                      <div className="post-footer-sm">
                        <div className="post-stats">
                          <span className="post-stat-sm"><Heart size={12}/> {post.likes_count}</span>
                          <span className="post-stat-sm"><MessageCircle size={12}/> {post.comments_count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {morePosts.map(post=>(
                <div key={post.id} className="post-sm" style={{display:"flex",flexDirection:"row"}}
                  onClick={()=>navigate("/community")}>
                  {firstImg(post) && (
                    <img src={firstImg(post)!} alt=""
                      style={{width:90,height:90,objectFit:"cover",flexShrink:0,borderRadius:"var(--r-sm) 0 0 var(--r-sm)"}}/>
                  )}
                  <div style={{padding:"12px 14px",flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}>
                      <div className="av-sm">{initials(post)}</div>
                      <div>
                        <div className="post-author-sm">{post.author?.first_name} {post.author?.last_name}</div>
                        <div className="post-time-sm">{ago(post.created_at)}</div>
                      </div>
                    </div>
                    {post.caption && <p className="post-caption-sm">{post.caption}</p>}
                    <div className="post-stats" style={{marginTop:4}}>
                      <span className="post-stat-sm"><Heart size={11}/> {post.likes_count}</span>
                      <span className="post-stat-sm"><MessageCircle size={11}/> {post.comments_count}</span>
                    </div>
                  </div>
                </div>
              ))}
              <button className="view-all-btn" onClick={()=>navigate("/community")}>
                See all community posts <ArrowRight size={15}/>
              </button>
            </div>

            <aside className="mag-side">
              <div className="sb-card">
                <div className="sb-cta">
                  <div className="sb-cta-icon"><Map size={22} strokeWidth={1.8}/></div>
                  <div className="sb-cta-title">Explore the Map</div>
                  <div className="sb-cta-desc">Discover secret trails, hidden temples and breathtaking viewpoints.</div>
                  <button className="sb-cta-btn" onClick={()=>navigate("/explore-map")}>Open Map</button>
                </div>
              </div>
              <div className="sb-card">
                <div className="sb-head"><MapPin size={13}/> Browse Categories</div>
                <div className="sb-body">
                  {CATEGORIES.map(({name,key,Icon})=>(
                    <div key={name} className="sb-row"
                      onClick={()=>navigate(`/explore-map?category=${encodeURIComponent(key)}`)}>
                      <div className="sb-row-left">
                        <Icon size={15} strokeWidth={1.8} style={{color:"var(--blue)"}}/>
                        {name}
                      </div>
                      <span className="sb-cnt">{catCounts[key]||0}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}

      </main>
      <Footer/>
    </div>
  );
}