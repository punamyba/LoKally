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
    <aside className="lk-panel">
      <div className="lk-panelHeader">
        <div className="lk-panelTitle">Explore</div>
        <div className="lk-panelSub">
          Search places and pick one to see details.
        </div>
      </div>

      {/* search inside panel */}
      <div className="lk-searchWrap">
        <span className="lk-searchIcon">🔍</span>
        <input
          className="lk-searchInput"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search places (name / category)..."
        />

        {query.trim() ? (
          <button
            className="lk-searchClear"
            onClick={() => setQuery("")}
            title="Clear"
            aria-label="Clear"
            type="button"
          >
            ✕
          </button>
        ) : null}
      </div>

      <div className="lk-resultsHead">
        <span>Places</span>
        <span className="lk-count">{results.length}</span>
      </div>

      <div className="lk-results">
        {results.length === 0 ? (
          <div className="lk-empty">No results. Try another keyword 🙂</div>
        ) : (
          results.map((p) => {
            const active = selectedPlaceId === p.id;

            return (
              <button
                key={p.id}
                className={active ? "lk-card lk-card--active" : "lk-card"}
                onClick={() => onPick(p)}
                type="button"
              >
                <div className="lk-thumb">
                  {p.image ? (
                    <img className="lk-thumbImg" src={p.image} alt={p.name} />
                  ) : (
                    <span className="lk-thumbLetter">
                      {p.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="lk-cardBody">
                  <div className="lk-cardTitle">{p.name}</div>

                  <div className="lk-metaRow">
                    {p.category ? <span className="lk-tag">{p.category}</span> : null}
                    <span className="lk-coord">
                      {p.lat.toFixed(3)}, {p.lng.toFixed(3)}
                    </span>
                  </div>

                  {p.description ? (
                    <div className="lk-desc">{p.description}</div>
                  ) : null}
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="lk-hint">
        Tip: Click a place from the list — map will move to it and details will open.
      </div>
    </aside>
  );
}
