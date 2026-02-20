// types.ts
// TypeScript type definitions for admin dashboard.
// These describe the shape of data coming from the backend.

export type AdminStats = {
    users: number;
    places: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  
  export type Place = {
    id: number;
    name: string;
    address: string;
    category: string | null;
    description: string;
    lat: string;
    lng: string;
    image: string | null;
    submitted_by: number;
    status: "pending" | "approved" | "rejected";
    rejected_reason: string | null;
    approved_by: number | null;
    approved_at: string | null;
    created_at: string;
    updated_at: string;
    submitter?: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
    };
    approver?: {
      id: number;
      first_name: string;
      last_name: string;
    } | null;
  };
  
  export type User = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: "admin" | "user";
    is_verified: boolean;
    created_at: string;
  };
  