export interface Emergency {
  id: number;
  reporter_name: string;
  reporter_phone: string;
  disaster_type_name: string;
  severity: string;
  latitude: number;
  longitude: number;
  location_description: string;
  description: string;
  status: string;
  operator_name: string | null;
  reported_at: string;
  // Enriched fields from API
  active_teams?: number;
  assigned_teams?: string | null;
  admitted_patients?: number;
  allocated_budget?: number | null;
  spent_budget?: number | null;
}

export interface Role {
  id: number;
  name: string;
  description: string;
}

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  role_id: number;
  is_active: boolean;
  created_at: string;
}
