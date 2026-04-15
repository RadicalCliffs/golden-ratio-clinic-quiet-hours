import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { requireAdmin } from "@/lib/requireAdmin";
import { createProduct } from "../actions";

/**
 * New product form — admin-only.
 *
 * Deliberately minimal. The fields we collect match the columns on
 * pharma.products 1:1 so the server action can upsert without
 * surprising transformations (except unit_price which is stored in
 * cents but displayed/entered in dollars for UX).
 */

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  sku_invalid: "SKU must be at least 2 characters.",
  sku_duplicate: "A product with that SKU already exists.",
  name_required: "Product name is required.",
  schedule_invalid: "Please choose a schedule.",
  price_invalid: "Unit price must be a positive number.",
  reorder_invalid: "Reorder point must be 0 or higher.",
  min_qty_invalid: "Minimum order quantity must be at least 1.",
  insert_failed: "Something went wrong saving this product.",
};

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { error } = await searchParams;
  const errorCodes = error?.split(",").filter(Boolean) ?? [];
  const errorSet = new Set(errorCodes);

  return (
    <div className="max-w-[720px] space-y-6">
      <div>
        <Link
          href="/portal/admin/pharma/products"
          className="inline-flex items-center gap-1.5 text-[12px] mb-4 transition-colors"
          style={{ color: "var(--portal-text-muted)" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Product catalog
        </Link>
        <p
          className="text-[11px] font-bold uppercase tracking-[0.15em] mb-1"
          style={{ color: "var(--portal-text-subtle)" }}
        >
          New product
        </p>
        <h1
          className="text-3xl font-bold"
          style={{ color: "var(--portal-text)" }}
        >
          Add to catalog
        </h1>
      </div>

      {errorCodes.length > 0 && (
        <div
          className="rounded-xl p-3 flex items-start gap-2.5"
          style={{
            background: "var(--portal-danger-soft)",
            border: "1px solid var(--portal-danger)",
          }}
        >
          <AlertCircle
            className="w-4 h-4 flex-shrink-0 mt-0.5"
            style={{ color: "var(--portal-danger)" }}
          />
          <ul
            className="text-[12px] space-y-0.5"
            style={{ color: "var(--portal-danger)" }}
          >
            {errorCodes.map((code) => (
              <li key={code}>{ERRORS[code] ?? code}</li>
            ))}
          </ul>
        </div>
      )}

      <form action={createProduct} className="space-y-6">
        <Section title="Basics">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field
              label="SKU"
              name="sku"
              placeholder="GRC-OIL-T10-30"
              required
              mono
              error={errorSet.has("sku_invalid") || errorSet.has("sku_duplicate")}
            />
            <SelectField
              label="Schedule"
              name="schedule"
              required
              error={errorSet.has("schedule_invalid")}
              options={[
                { value: "", label: "Choose a schedule…" },
                { value: "S8", label: "S8 · Controlled drug" },
                { value: "S4", label: "S4 · Prescription" },
                { value: "unscheduled", label: "Unscheduled" },
              ]}
            />
          </div>
          <Field
            label="Name"
            name="name"
            placeholder="Balance Oil T10"
            required
            error={errorSet.has("name_required")}
          />
        </Section>

        <Section title="Clinical specifics">
          <div className="grid sm:grid-cols-3 gap-4">
            <Field
              label="Strength"
              name="strength"
              placeholder="10mg/mL"
            />
            <Field label="Form" name="form" placeholder="Oral oil" />
            <Field
              label="Pack size"
              name="pack_size"
              placeholder="30mL"
            />
          </div>
          <Field
            label="Active ingredients"
            name="active_ingredients"
            placeholder="THC 10mg/mL"
          />
        </Section>

        <Section title="Operations">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field
              label="Unit price (AUD)"
              name="unit_price_dollars"
              type="number"
              placeholder="95.00"
              required
              mono
              step="0.01"
              min="0"
              error={errorSet.has("price_invalid")}
            />
            <Field
              label="Reorder point"
              name="reorder_point"
              type="number"
              placeholder="20"
              required
              mono
              min="0"
              error={errorSet.has("reorder_invalid")}
            />
            <Field
              label="Min order qty"
              name="min_order_qty"
              type="number"
              placeholder="1"
              required
              mono
              min="1"
              defaultValue="1"
              error={errorSet.has("min_qty_invalid")}
            />
            <Field
              label="Vault location"
              name="vault_location"
              placeholder="Vault A, Shelf 1"
            />
          </div>
        </Section>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-3 rounded-lg text-[13px] font-bold transition-opacity hover:opacity-90"
            style={{
              background: "var(--portal-accent)",
              color: "#fff",
            }}
          >
            Create product
          </button>
          <Link
            href="/portal/admin/pharma/products"
            className="text-[13px]"
            style={{ color: "var(--portal-text-muted)" }}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl p-6 space-y-4"
      style={{
        background: "var(--portal-surface)",
        border: "1px solid var(--portal-border)",
      }}
    >
      <h2
        className="text-[14px] font-bold"
        style={{ color: "var(--portal-text)" }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  error,
  mono,
  step,
  min,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: boolean;
  mono?: boolean;
  step?: string;
  min?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-[11px] font-bold uppercase tracking-wider mb-1.5"
        style={{ color: "var(--portal-text-subtle)" }}
      >
        {label}
        {required && (
          <span style={{ color: "var(--portal-danger)" }}> *</span>
        )}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        step={step}
        min={min}
        defaultValue={defaultValue}
        className={`w-full px-3 py-2.5 rounded-lg text-[13px] ${mono ? "font-mono tabular-nums" : ""}`}
        style={{
          background: "var(--portal-surface-2)",
          color: "var(--portal-text)",
          border: error
            ? "1px solid var(--portal-danger)"
            : "1px solid var(--portal-border)",
        }}
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  required,
  error,
  options,
}: {
  label: string;
  name: string;
  required?: boolean;
  error?: boolean;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-[11px] font-bold uppercase tracking-wider mb-1.5"
        style={{ color: "var(--portal-text-subtle)" }}
      >
        {label}
        {required && (
          <span style={{ color: "var(--portal-danger)" }}> *</span>
        )}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue=""
        className="w-full px-3 py-2.5 rounded-lg text-[13px]"
        style={{
          background: "var(--portal-surface-2)",
          color: "var(--portal-text)",
          border: error
            ? "1px solid var(--portal-danger)"
            : "1px solid var(--portal-border)",
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.value === ""}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
