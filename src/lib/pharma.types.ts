/**
 * Pharma module types — the shape of rows returned from the
 * public.pharma_* views that wrap the pharma.* tables.
 *
 * Kept deliberately in its own file (not in database.types.ts) so
 * the patient-portal side of the Clinic app doesn't see pharma
 * types leaking into its autocomplete. The staff console imports
 * from here directly when building pharma admin pages.
 *
 * These types MUST stay in sync with
 *   Pharmabackend/src/lib/database.types.ts
 * If you change one, change both. Two separate repos consuming the
 * same DB means no single source of truth for row shapes — so the
 * compiler in each repo is our only check.
 */

// ─── Pharmacist profile ─────────────────────────────────────────────

export type VerificationStatus =
  | "pending"
  | "active"
  | "suspended"
  | "rejected";

export type AustralianState =
  | "NSW"
  | "VIC"
  | "QLD"
  | "WA"
  | "SA"
  | "TAS"
  | "ACT"
  | "NT";

export type PharmacistProfile = {
  id: string;
  ahpra_number: string;
  pharmacy_name: string;
  abn: string | null;
  street_address: string;
  suburb: string;
  state: AustralianState;
  postcode: string;
  phone: string;
  email: string;
  verification_status: VerificationStatus;
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
  credit_limit_cents: number;
  credit_used_cents: number;
  created_at: string;
  updated_at: string;
};

// ─── Product catalog ────────────────────────────────────────────────

export type Schedule = "S4" | "S8" | "unscheduled";

export type Product = {
  id: string;
  sku: string;
  name: string;
  schedule: Schedule;
  strength: string | null;
  form: string | null;
  pack_size: string | null;
  active_ingredients: string | null;
  unit_price_cents: number;
  min_order_qty: number;
  vault_location: string | null;
  is_active: boolean;
  reorder_point: number;
  created_at: string;
  updated_at: string;
};

export type ProductStock = {
  product_id: string;
  sku: string;
  name: string;
  schedule: Schedule;
  reorder_point: number;
  stock_on_hand: number;
  below_reorder: boolean;
  last_movement_at: string | null;
};

// ─── Stock ledger ──────────────────────────────────────────────────

export type StockMovementReason =
  | "initial_stock"
  | "purchase_receipt"
  | "order_dispatch"
  | "order_return"
  | "recall"
  | "destruction"
  | "adjustment_audit"
  | "transfer_in"
  | "transfer_out";

export type StockMovement = {
  id: string;
  product_id: string;
  delta_units: number;
  reason: StockMovementReason;
  batch_id: string | null;
  expiry_date: string | null;
  order_id: string | null;
  actor_user_id: string | null;
  notes: string | null;
  created_at: string;
};

// ─── Orders ────────────────────────────────────────────────────────

export type OrderStatus =
  | "draft"
  | "submitted"
  | "confirmed"
  | "picking"
  | "dispatched"
  | "delivered"
  | "cancelled";

export type Order = {
  id: string;
  pharmacist_id: string;
  status: OrderStatus;
  subtotal_cents: number;
  credit_applied_cents: number;
  total_cents: number;
  delivery_address: string | null;
  delivery_notes: string | null;
  tracking_number: string | null;
  submitted_at: string | null;
  confirmed_at: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  qty: number;
  unit_price_cents: number;
  line_total_cents: number;
  batch_id: string | null;
  created_at: string;
};

// ─── Display helpers ────────────────────────────────────────────────

/**
 * Format a cents value as an AUD price string. Matches the helper
 * in Pharmabackend so admins see the same formatting.
 */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export const SCHEDULE_LABELS: Record<
  Schedule,
  { label: string; tone: "danger" | "warn" | "neutral"; description: string }
> = {
  S8: {
    label: "S8 · Controlled",
    tone: "danger",
    description: "Controlled drug — vault storage + full ledger required",
  },
  S4: {
    label: "S4 · Prescription",
    tone: "warn",
    description: "Prescription-only medicine",
  },
  unscheduled: {
    label: "Unscheduled",
    tone: "neutral",
    description: "Over-the-counter",
  },
};

export const VERIFICATION_LABELS: Record<
  VerificationStatus,
  { label: string; tone: "info" | "success" | "warn" | "danger" }
> = {
  pending: { label: "Pending review", tone: "info" },
  active: { label: "Verified", tone: "success" },
  suspended: { label: "Suspended", tone: "warn" },
  rejected: { label: "Rejected", tone: "danger" },
};

export const ORDER_STATUS_LABELS: Record<
  OrderStatus,
  { label: string; tone: "info" | "warn" | "success" | "neutral" }
> = {
  draft: { label: "Draft", tone: "neutral" },
  submitted: { label: "Submitted", tone: "info" },
  confirmed: { label: "Confirmed", tone: "info" },
  picking: { label: "Picking", tone: "warn" },
  dispatched: { label: "Dispatched", tone: "warn" },
  delivered: { label: "Delivered", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export const STOCK_REASONS: Record<StockMovementReason, { label: string; direction: "in" | "out" }> = {
  initial_stock: { label: "Initial stock", direction: "in" },
  purchase_receipt: { label: "Purchase receipt", direction: "in" },
  order_dispatch: { label: "Order dispatch", direction: "out" },
  order_return: { label: "Customer return", direction: "in" },
  recall: { label: "Recall", direction: "out" },
  destruction: { label: "Destruction", direction: "out" },
  adjustment_audit: { label: "Audit adjustment", direction: "in" },
  transfer_in: { label: "Transfer in", direction: "in" },
  transfer_out: { label: "Transfer out", direction: "out" },
};

/**
 * Build a deep-link to the AHPRA public register pre-filtered by
 * name search. AHPRA's register URL scheme doesn't accept a direct
 * number query param — it only has a name/suburb/type form — so the
 * best we can do is open the register homepage and ask the admin
 * to paste the number. This helper centralises that so if AHPRA
 * ever ships a deeper link, we change it in one place.
 */
export function ahpraRegisterUrl(): string {
  return "https://www.ahpra.gov.au/registration/registers-of-practitioners.aspx";
}
