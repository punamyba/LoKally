import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Upload, Compass, Mountain, Droplets, Church, Waves,
  Home as HomeIcon, Heart, MessageCircle, BadgeCheck, TrendingUp,
  Users2, ArrowRight, Map, ThumbsUp, Bookmark,
} from 'lucide-react';
import Navbar from "../Components/Layout/Navbar/Navbar";
import Footer from "../Components/Layout/Footer/Footer";
import axiosInstance from "../../../shared/config/axiosinstance";
import "./home.css";

/* ── helpers ─────────────────────────────────────────────── */
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

/* ── types ────────────────────────────────────────────────── */
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

/* ── Nepal SVG map ────────────────────────────────────────── */
function NepalMapSVG() {
  return (
    <div className="nepal-map-wrap">
      {/* Floating stat pills */}
      <div className="hero-stat-pill" style={{top:"8%",right:"5%"}}>
        <span className="pill-icon">🗺️</span>
        <div><div className="pill-num">50+</div><div className="pill-label">Places</div></div>
      </div>
      <div className="hero-stat-pill" style={{bottom:"22%",left:"4%"}}>
        <span className="pill-icon">📸</span>
        <div><div className="pill-num">100+</div><div className="pill-label">Stories</div></div>
      </div>
      <div className="hero-stat-pill" style={{bottom:"6%",right:"8%"}}>
        <span className="pill-icon">👥</span>
        <div><div className="pill-num">Active</div><div className="pill-label">Community</div></div>
      </div>

      {/* Nepal outline SVG — simplified but recognizable shape */}
      <svg className="nepal-map-svg" viewBox="0 0 500 180" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="mapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#1a7fe8" stopOpacity="0.9"/>
            <stop offset="50%"  stopColor="#0d9488" stopOpacity="0.85"/>
            <stop offset="100%" stopColor="#16a34a" stopOpacity="0.8"/>
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          {/* Mountain texture pattern */}
          <pattern id="mtPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M10 2 L18 16 L2 16 Z" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8"/>
          </pattern>
        </defs>

        {/* Nepal shape — wider than tall, elongated E-W */}
        <path
          d="M 10 90
             L 20 70  L 35 60  L 55 55  L 80 50
             L 100 42 L 125 38 L 155 35 L 180 33
             L 210 30 L 240 28 L 265 26 L 290 25
             L 315 27 L 340 30 L 365 35 L 385 38
             L 405 42 L 425 50 L 445 60 L 460 72
             L 475 88 L 485 100 L 490 115
             L 475 125 L 455 132 L 430 138
             L 400 142 L 370 145 L 340 148
             L 310 150 L 280 152 L 250 153
             L 220 152 L 190 150 L 160 148
             L 130 145 L 100 140 L 70 132
             L 45 122  L 25 110 L 10 90 Z"
          fill="url(#mapGrad)"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1.5"
          filter="url(#glow)"
        />

        {/* Mountain texture overlay */}
        <path
          d="M 10 90
             L 20 70  L 35 60  L 55 55  L 80 50
             L 100 42 L 125 38 L 155 35 L 180 33
             L 210 30 L 240 28 L 265 26 L 290 25
             L 315 27 L 340 30 L 365 35 L 385 38
             L 405 42 L 425 50 L 445 60 L 460 72
             L 475 88 L 485 100 L 490 115
             L 475 125 L 455 132 L 430 138
             L 400 142 L 370 145 L 340 148
             L 310 150 L 280 152 L 250 153
             L 220 152 L 190 150 L 160 148
             L 130 145 L 100 140 L 70 132
             L 45 122  L 25 110 L 10 90 Z"
          fill="url(#mtPattern)"
        />

        {/* Himalayan ridge line */}
        <path
          d="M 80 50 L 100 38 L 120 28 L 145 22 L 165 18
             L 190 16 L 215 14 L 240 12 L 265 13
             L 288 16 L 310 20 L 335 26 L 355 32 L 375 38"
          fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2"
          strokeDasharray="4 3"
        />

        {/* Snow peaks */}
        {[
          {x:145,y:22}, {x:192,y:14}, {x:240,y:11}, {x:288,y:15}, {x:335,y:25}
        ].map((pt,i)=>(
          <g key={i}>
            <polygon
              points={`${pt.x},${pt.y-10} ${pt.x-7},${pt.y+4} ${pt.x+7},${pt.y+4}`}
              fill="rgba(255,255,255,0.85)"
              stroke="rgba(255,255,255,0.4)" strokeWidth="0.5"
            />
            <polygon
              points={`${pt.x},${pt.y-10} ${pt.x-3},${pt.y-2} ${pt.x+2},${pt.y-3}`}
              fill="rgba(200,230,255,0.6)"
            />
          </g>
        ))}

        {/* Rivers */}
        <path d="M 248 12 Q 252 60 250 153" fill="none" stroke="rgba(100,200,255,0.5)" strokeWidth="1.5"/>
        <path d="M 145 25 Q 140 80 130 145" fill="none" stroke="rgba(100,200,255,0.4)" strokeWidth="1"/>
        <path d="M 335 27 Q 340 90 340 148" fill="none" stroke="rgba(100,200,255,0.4)" strokeWidth="1"/>

        {/* City dots */}
        {[
          {x:248,y:105,label:"Kathmandu"},
          {x:145,y:115,label:"Pokhara"},
          {x:360,y:110,label:"Biratnagar"},
          {x:80,y:130,label:"Nepalgunj"},
          {x:420,y:125,label:"Dharan"},
        ].map((city,i)=>(
          <g key={i}>
            <circle cx={city.x} cy={city.y} r="5" fill="rgba(255,255,255,0.9)"
              stroke="rgba(255,255,255,0.4)" strokeWidth="2"
              style={{animation:`pinPulse 2s ease-in-out ${i*0.4}s infinite`}}
            />
            <circle cx={city.x} cy={city.y} r="10" fill="none"
              stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"
              style={{animation:`pinRipple 2.5s ease-out ${i*0.4}s infinite`}}
            />
            <text x={city.x} y={city.y-12}
              textAnchor="middle" fill="rgba(255,255,255,0.75)"
              fontSize="8" fontWeight="700" fontFamily="DM Sans,sans-serif"
              letterSpacing="0.05em">
              {city.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate();
  const mounted  = useRef(true);

  const [featured,      setFeatured]      = useState<Place[]>([]);
  const [catCounts,     setCatCounts]     = useState<Record<string,number>>({});
  const [totalPlaces,   setTotalPlaces]   = useState(0);
  const [posts,         setPosts]         = useState<Post[]>([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [postsLoading,  setPostsLoading]  = useState(true);

  useEffect(() => {
    mounted.current = true;

    /* places */
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
          setTotalPlaces(all.length);
          const c: Record<string,number> = {};
          all.forEach((p:Place) => { if(p.category) c[p.category]=(c[p.category]||0)+1; });
          setCatCounts(c);
        }
      } catch {}
      if (mounted.current) setPlacesLoading(false);
    })();

    /* posts — safe with timeout */
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

  /* post card helpers */
  const initials = (p: Post) =>
    `${p.author?.first_name?.[0]??""}${p.author?.last_name?.[0]??""}`.toUpperCase();

  const firstImg = (p: Post) => {
    const imgs = parseImages(p.images);
    return imgs[0] ? toUrl(imgs[0]) : null;
  };

  const bigPost   = posts[0] ?? null;
  const smallPosts = posts.slice(1, 3);
  const morePosts  = posts.slice(3);

  /* ── render ──────────────────────────────────────────────── */
  return (
    <div className="hw">
      <Navbar/>
      <main className="hm">

        {/* ══ HERO ══════════════════════════════════════════════ */}
        <div className="hero">
          <div className="hero-left">
            <div className="hero-kicker">
              <span className="hero-kicker-dot"/>
              Explore Nepal
            </div>
            <h1 className="hero-h1">
              Discover Nepal's<br/>
              <span>Hidden Treasures</span>
            </h1>
            <p className="hero-sub">
              Join thousands of explorers sharing secret places,
              mountain trails, and cultural stories from across Nepal.
            </p>
            <div className="hero-btns">
              <button className="btn btn-p" onClick={()=>navigate("/explore-map")}>
                <Compass size={16}/> Explore Map
              </button>
              <button className="btn btn-s" onClick={()=>navigate("/community")}>
                <Users2 size={16}/> Community
              </button>
            </div>
          </div>

          <div className="hero-right">
            <NepalMapSVG/>
          </div>
        </div>

        {/* ══ QUICK ACTIONS ═════════════════════════════════════ */}
        <div className="actions-row">
          <div className="action-tile at-blue" onClick={()=>navigate("/explore-map")}>
            <div className="at-icon"><MapPin size={26} strokeWidth={1.8}/></div>
            <div className="at-title">Explore Map</div>
            <div className="at-desc">Browse all hidden places</div>
          </div>
          <div className="action-tile at-green" onClick={()=>navigate("/explore-map")}>
            <div className="at-icon"><Upload size={26} strokeWidth={1.8}/></div>
            <div className="at-title">Add a Place</div>
            <div className="at-desc">Share your discovery</div>
          </div>
          <div className="action-tile at-purple" onClick={()=>navigate("/community")}>
            <div className="at-icon"><Users2 size={26} strokeWidth={1.8}/></div>
            <div className="at-title">Community</div>
            <div className="at-desc">Stories from explorers</div>
          </div>
        </div>

        {/* ══ CATEGORIES ════════════════════════════════════════ */}
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

        {/* ══ FEATURED DESTINATIONS ════════════════════════════ */}
        <div className="sec-head">
          <div className="sec-title">Featured Destinations</div>
          <div className="sec-badge"><TrendingUp size={12}/> Latest verified</div>
        </div>
        {placesLoading ? (
          <div className="ld"><div className="ld-dot"/><div className="ld-dot"/><div className="ld-dot"/></div>
        ) : featured.length===0 ? (
          <div className="empty">
            <p>No featured places yet.</p>
            <button className="empty-btn" onClick={()=>navigate("/explore-map")}>Add a Place</button>
          </div>
        ) : (
          <div className="places-scroll">
            {featured.map(place=>{
              const cover = parseCover(place.image);
              return (
                <div key={place.id} className="pcard" onClick={()=>navigate(`/place/${place.id}`)}>
                  {cover
                    ? <img src={cover} alt={place.name} className="pcard-img"/>
                    : <div className="pcard-noimg"><MapPin size={28} strokeWidth={1.2}/></div>
                  }
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

        {/* ══ COMMUNITY — magazine layout ══════════════════════ */}
        <div className="sec-head">
          <div className="sec-title">Community Stories</div>
          <button className="sec-link" onClick={()=>navigate("/community")}>
            View all <ArrowRight size={13}/>
          </button>
        </div>

        {postsLoading ? (
          <div className="ld"><div className="ld-dot"/><div className="ld-dot"/><div className="ld-dot"/></div>
        ) : posts.length===0 ? (
          <div className="empty">
            <p>No stories yet —{" "}
              <span style={{color:"var(--blue)",cursor:"pointer",fontWeight:600}}
                onClick={()=>navigate("/community")}>be the first to share!</span>
            </p>
          </div>
        ) : (
          <div className="magazine-layout">

            {/* ── main feed ─────────────────────────────── */}
            <div className="mag-main">

              {/* BIG post */}
              {bigPost && (
                <div className="post-big" onClick={()=>navigate("/community")}>
                  {firstImg(bigPost)
                    ? <img className="post-big-img" src={firstImg(bigPost)!} alt=""/>
                    : <div className="post-big-noimg">🏔️</div>
                  }
                  <div className="post-big-body">
                    <div className="post-big-head">
                      <div className="post-av">{initials(bigPost)}</div>
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
                    <div className="post-actions-bar">
                      <button className="post-act"><ThumbsUp size={14}/> Like</button>
                      <button className="post-act"><MessageCircle size={14}/> Comment</button>
                      <button className="post-act"><Bookmark size={14}/> Save</button>
                    </div>
                  </div>
                </div>
              )}

              {/* SMALL pair */}
              {smallPosts.length > 0 && (
                <div className="post-pair">
                  {smallPosts.map(post=>(
                    <div key={post.id} className="post-small" onClick={()=>navigate("/community")}>
                      {firstImg(post)
                        ? <img className="post-small-img" src={firstImg(post)!} alt=""/>
                        : <div className="post-small-noimg">📸</div>
                      }
                      <div className="post-small-body">
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                          <div className="post-av-sm">{initials(post)}</div>
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

              {/* more posts — vertical */}
              {morePosts.map(post=>(
                <div key={post.id} className="post-small" style={{display:"flex",flexDirection:"row"}}
                  onClick={()=>navigate("/community")}>
                  {firstImg(post) && (
                    <img src={firstImg(post)!} alt=""
                      style={{width:90,height:90,objectFit:"cover",flexShrink:0,borderRadius:"var(--r-sm) 0 0 var(--r-sm)"}}/>
                  )}
                  <div style={{padding:"12px 14px",flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}>
                      <div className="post-av-sm">{initials(post)}</div>
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

            {/* ── sidebar ───────────────────────────────── */}
            <aside className="mag-sidebar">
              <div className="sb-card">
                <div className="sb-cta">
                  <div className="sb-cta-icon"><Map size={22} strokeWidth={1.8}/></div>
                  <div className="sb-cta-title">Explore the Map</div>
                  <div className="sb-cta-desc">
                    Discover secret trails, hidden temples and breathtaking viewpoints.
                  </div>
                  <button className="sb-cta-btn" onClick={()=>navigate("/explore-map")}>
                    Open Map
                  </button>
                </div>
              </div>

              <div className="sb-card">
                <div className="sb-head"><MapPin size={13}/> Browse Categories</div>
                <div className="sb-body">
                  {CATEGORIES.map(({name,key,Icon})=>(
                    <div key={name} className="sb-cat-row"
                      onClick={()=>navigate(`/explore-map?category=${encodeURIComponent(key)}`)}>
                      <div className="sb-cat-left">
                        <Icon size={15} strokeWidth={1.8} style={{color:"var(--blue)"}}/>
                        {name}
                      </div>
                      <span className="sb-cat-count">{catCounts[key]||0}</span>
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