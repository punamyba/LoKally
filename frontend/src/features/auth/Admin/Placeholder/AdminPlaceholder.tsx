// AdminPlaceholder.tsx
// Location: src/features/auth/Admin/Placeholder/AdminPlaceholder.tsx

import { BarChart2, Settings } from "lucide-react";
import "./AdminPlaceholder.css";

export function AdminReports() {
  return (
    <div className="aph-root">
      <h1 className="aph-title">Reports</h1>
      <div className="aph-card">
        <BarChart2 size={48} strokeWidth={1.2} className="aph-icon" />
        <div className="aph-text">Reports coming soon!</div>
        <div className="aph-sub">Analytics and insights will appear here.</div>
      </div>
    </div>
  );
}

export function AdminSettings() {
  return (
    <div className="aph-root">
      <h1 className="aph-title">Settings</h1>
      <div className="aph-card">
        <Settings size={48} strokeWidth={1.2} className="aph-icon" />
        <div className="aph-text">Settings coming soon!</div>
        <div className="aph-sub">App configuration will appear here.</div>
      </div>
    </div>
  );
}
