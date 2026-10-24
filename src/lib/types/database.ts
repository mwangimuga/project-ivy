export type Role = "super_agent" | "system_agent" | "project_manager" | "landlord" | "maintenance" | "client";
export type PropertyType = "apartment" | "student_housing" | "commercial" | "land" | "airbnb";
export type PropertyStatus = "active" | "draft";
export type LeaseStatus = "active" | "pending" | "terminated";
export type TicketPriority = "critical" | "high" | "medium" | "low";
export type TicketStatus = "open" | "in_progress" | "resolved";
export type LedgerTransactionType = "payment" | "charge" | "withdrawal";
export type ChatStream = "maintenance" | "security" | "billing";
export type WithdrawalStatus = "pending" | "processing" | "paid" | "failed";
export type RoleRequestStatus = "pending" | "approved" | "rejected";
export type InvoiceStatus = "pending" | "paid" | "expired" | "cancelled";

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  role: Role;
  additional_roles: Role[];
  created_by: string | null;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApartmentDetails {
  bedrooms: number;
  bathrooms: number;
  utilities_included: string[];
  security_deposit: number;
  parking: boolean;
}

export interface StudentHousingDetails {
  beds_per_room: number;
  price_per_bed: number;
  shared_amenities: string[];
  gender_designation: "male" | "female" | "mixed";
  term_length_months: number;
}

export interface CommercialDetails {
  floor_area_sqm: number;
  parking_ratio: string;
  cam_split_percent: number;
  zoning_permissions: string[];
}

export interface LandDetails {
  acreage: number;
  title_deed_status: string;
  gis_coordinates: { lat: number; lng: number };
  zoning_use: string;
}

export interface AirbnbDetails {
  per_night_rate: number;
  cleaning_fee: number;
  max_guests: number;
  min_stay: number;
}

export type PropertyDetails =
  | ApartmentDetails
  | StudentHousingDetails
  | CommercialDetails
  | LandDetails
  | AirbnbDetails
  | Record<string, unknown>;

// Matches public.properties exactly.
export interface PropertyRow {
  id: string;
  landlord_id: string | null;
  name: string;
  address: string;
  property_type: PropertyType;
  status: string; // 'active' | 'draft' at the DB level
  details: PropertyDetails;
  media_urls: string[];
  virtual_tour_url: string | null;
  rent: number;
  description: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

// Matches public.leases exactly.
export interface Lease {
  id: string;
  client_id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  status: LeaseStatus;
  autopay_enabled: boolean;
  paystack_authorization_code: string | null;
  created_at: string;
  updated_at: string;
}

// Matches public.ledgers exactly.
export interface LedgerEntry {
  id: string;
  client_id: string;
  lease_id: string | null;
  amount: number;
  balance_change: number;
  transaction_type: LedgerTransactionType;
  description: string | null;
  system_cut: number;
  landlord_share: number;
  paystack_reference: string | null;
  created_at: string;
}

// Matches public.role_requests exactly.
export interface RoleRequest {
  id: string;
  user_id: string;
  requested_role: Role;
  status: RoleRequestStatus;
  note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

// Matches public.invoices exactly.
export interface Invoice {
  id: string;
  lease_id: string;
  client_id: string;
  created_by: string | null;
  amount: number;
  description: string | null;
  status: InvoiceStatus;
  paystack_request_code: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

// Matches public.tickets exactly.
export interface Ticket {
  id: string;
  property_id: string;
  client_id: string | null;
  assigned_to: string | null;
  title: string;
  description: string;
  unit: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
}

// Matches public.messages exactly.
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string | null;
  lease_id: string;
  stream_type: ChatStream;
  content: string;
  created_at: string;
}

// Matches public.withdrawal_requests exactly.
export interface WithdrawalRequest {
  id: string;
  landlord_id: string;
  amount: number;
  tier: 1 | 2 | 3;
  fee: number;
  net_amount: number;
  status: WithdrawalStatus;
  paystack_reference: string | null;
  requested_at: string;
  resolved_at: string | null;
}

/**
 * These mirror the SQL functions calc_tier / calc_payment_split /
 * calc_withdrawal_fee in supabase/migrations/20260706000000_financial_engine.sql
 * for instant client-side previews (e.g. "here's what you'll receive"
 * before submitting). The database functions are the actual source of
 * truth — these are read-only conveniences and must stay in lockstep.
 */
export function calculateTier(amount: number): 1 | 2 | 3 {
  if (amount <= 50000) return 1;
  if (amount <= 200000) return 2;
  return 3;
}

export function calculatePaymentSplit(amount: number) {
  const tier = calculateTier(amount);
  const cuts: Record<number, number> = { 1: 20, 2: 50, 3: 500 };
  const systemCut = cuts[tier];
  return { tier, systemCut, landlordShare: amount - systemCut };
}

export function calculateWithdrawalFee(amount: number) {
  const tier = calculateTier(amount);
  const rates: Record<number, number> = { 1: 0.02, 2: 0.025, 3: 0.03 };
  const fee = Math.round(amount * rates[tier]);
  return { tier, fee, net: amount - fee, rate: rates[tier] * 100 };
}
