// Type.ts
// Place type updated to match backend response fields

export type Place = {
  id: string;           // backend returns number, convert with .toString()
  name: string;
  lat: number;
  lng: number;
  category?: string;
  description?: string;
  image?: string;       // main image path from backend e.g. "/uploads/xxx.jpg"
  address?: string;
  status?: "pending" | "approved" | "rejected";
  submitted_by?: number;
  created_at?: string;
  submitter?: {
    first_name: string;
    last_name: string;
  };
};
