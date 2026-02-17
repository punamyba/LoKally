import type { Dispatch, SetStateAction } from "react";
import type { Place } from "../../Map/Type";
import "./MapSearchPanel.css";

type Props = {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  results: Place[];
  selectedPlaceId?: string | null;
  onPick: (place: Place) => void;
};

export default function MapSearchPanel({
  query,
  setQuery,
  results,
  selectedPlaceId,
  onPick,
}: Props) {
  return (
    <aside className="msp-panel">
      <div className="msp-header">
        <div className="msp-title">Explore</div>
        <div className="msp-subtitle">Search places and select one to view details.</div>
      </div>

      <div className="msp-searchWrap">
        <span className="msp-searchIcon">🔎</span>
        <input
          className="msp-searchInput"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or category..."
        />
        {query.trim() ? (
          <button className="msp-clearBtn" onClick={() => setQuery("")} aria-label="Clear">
            ✕
          </button>
        ) : null}
      </div>

      <div className="msp-results">
        <div className="msp-resultsTop">
          <span>Places</span>
          <span className="msp-count">{results.length}</span>
        </div>

        {results.length === 0 ? (
          <div className="msp-empty">No results found.</div>
        ) : (
          <div className="msp-list">
            {results.map((p) => {
              const active = selectedPlaceId === p.id;
              return (
                <button
                  key={p.id}
                  className={active ? "msp-item msp-item--active" : "msp-item"}
                  onClick={() => onPick(p)}
                >
                  <div className="msp-thumb">
                    {p.image ? (
                      <img src={p.image} alt={p.name} />
                    ) : (
                      <span>{p.name.slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>

                  <div className="msp-meta">
                    <div className="msp-name">{p.name}</div>
                    <div className="msp-row">
                      {p.category ? <span className="msp-tag">{p.category}</span> : null}
                      <span className="msp-coords">
                        {p.lat.toFixed(3)}, {p.lng.toFixed(3)}
                      </span>
                    </div>

                    {p.description ? (
                      <div className="msp-desc">{p.description}</div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="msp-hint">
        Select a place from the list. Details will stay open until you close it.
      </div>
    </aside>
  );
}
