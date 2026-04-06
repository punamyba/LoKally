// pointsEvent.ts — global event bus for points updates
// Import this wherever points are earned and call refreshPoints()
// Navbar listens to this event and auto-updates the badge

export const POINTS_EVENT = "lokally:points-updated";

// Call this after any action that earns points
// (like, comment, post create, etc.)
export function refreshPoints() {
  window.dispatchEvent(new CustomEvent(POINTS_EVENT));
}