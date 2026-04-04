import { useEffect, useRef, useState } from "react";
import { Search, MapPin, X } from "lucide-react";

interface GeoResult {
  display_name: string;
  lat: number;
  lng: number;
}

interface Props {
  onPick: (lat: number, lng: number, label: string) => void;
  onClear?: () => void;
}

const MIN_CHARS   = 5;   // start searching after 5 chars
const DEBOUNCE_MS = 500; // wait 500ms after user stops typing

export default function MapLocationSearch({ onPick, onClear }: Props) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);
  const [hint,    setHint]    = useState(""); // shows "keep typing..." message
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = query.trim();

    // less than MIN_CHARS — show hint, clear results
    if (q.length > 0 && q.length < MIN_CHARS) {
      setResults([]);
      setOpen(false);
      setHint(`Type ${MIN_CHARS - q.length} more character${MIN_CHARS - q.length === 1 ? "" : "s"} to search…`);
      return;
    }

    // empty — reset everything
    if (q.length === 0) {
      setResults([]);
      setOpen(false);
      setHint("");
      return;
    }

    // 5+ chars — debounce then search
    setHint("");
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        let data: GeoResult[] = [];

        // try backend proxy first
        try {
          const res  = await fetch(
            `http://localhost:5001/api/geocode?q=${encodeURIComponent(q)}`,
            { headers: { "Content-Type": "application/json" } }
          );
          const json = await res.json();
          if (json.success && json.data?.length > 0) data = json.data;
        } catch {}

        // fallback to Nominatim if backend fails
        if (data.length === 0) {
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&countrycodes=np&accept-language=en`,
            { headers: { "User-Agent": "lokally-nepal/1.0" } }
          );
          const json = await res.json();
          data = (json || []).map((r: any) => ({
            display_name: r.display_name,
            lat: parseFloat(r.lat),
            lng: parseFloat(r.lon),
          }));
        }

        setResults(data);
        setOpen(true); // open dropdown — even if empty (shows "no results")
      } catch (err) {
        console.error("Geocode error:", err);
        setResults([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handlePick = (r: GeoResult) => {
    onPick(r.lat, r.lng, r.display_name);
    setQuery(r.display_name.split(",")[0]);
    setOpen(false);
    setResults([]);
    setHint("");
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setOpen(false);
    setHint("");
    onClear?.();
  };

  return (
    <div className="exmap-locWrap" ref={wrapRef}>
      <div className="exmap-locInputRow">
        {loading
          ? <div className="exmap-locSpinner" />
          : <Search size={15} className="exmap-locIcon" strokeWidth={2.5} />
        }
        <input
          className="exmap-locInput"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search location… e.g. Pokhara, Mustang"
          autoComplete="off"
        />
        {query && (
          <button className="exmap-locClear" type="button" onClick={handleClear}>
            <X size={13} strokeWidth={3} />
          </button>
        )}
      </div>

      {/* hint shown while typing < MIN_CHARS */}
      {hint && !open && (
        <div className="exmap-locResults">
          <div className="exmap-locHint">{hint}</div>
        </div>
      )}

      {/* results dropdown */}
      {open && results.length > 0 && (
        <div className="exmap-locResults">
          {results.map((r, i) => (
            <button
              key={i} type="button"
              className="exmap-locItem"
              onClick={() => handlePick(r)}
            >
              <MapPin size={13} strokeWidth={2} className="exmap-locItemIcon" />
              <span className="exmap-locItemText">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}

      {/* no results */}
      {open && !loading && results.length === 0 && (
        <div className="exmap-locResults">
          <div className="exmap-locEmpty">No results found for "{query}"</div>
        </div>
      )}
    </div>
  );
}