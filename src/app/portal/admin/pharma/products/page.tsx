import Link from "next/link";
import { Package, Plus, Search, ArrowRight } from "lucide-react";
import { requireStaff } from "@/lib/requireAdmin";
import { createClient } from "@/utils/supabase/server";
import type {
  Product,
  ProductStock,
  Schedule,
} from "@/lib/pharma.types";
import { formatCents, SCHEDULE_LABELS } from "@/lib/pharma.types";

/**
 * Products list — staff-visible catalog table.
 *
 * Joins pharma_products with pharma_product_stock in app code
 * (two queries + a Map) because PostgREST doesn't expose foreign-key
 * joins on views with an aggregation like product_stock. The
 * alternative would be a dedicated database VIEW that already joins
 * them, but the extra query is cheap (both are indexed on id) and
 * keeps the SQL schema simpler.
 */

export const dynamic = "force-dynamic";

const FILTER_OPTIONS: {
  value: string;
  label: string;
  schedule?: Schedule;
}[] = [
  { value: "all", label: "All" },
  { value: "S8", label: "S8 · Controlled", schedule: "S8" },
  { value: "S4", label: "S4 · Prescription", schedule: "S4" },
  { value: "low", label: "Low stock" },
  { value: "inactive", label: "Inactive" },
];

export default async function ProductsListPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  await requireStaff();
  const { filter = "all", q = "" } = await searchParams;

  const supabase = await createClient();

  let productQuery = supabase
    .from("pharma_products")
    .select("*")
    .order("name", { ascending: true });

  // Schedule filter
  const selected = FILTER_OPTIONS.find((f) => f.value === filter);
  if (selected?.schedule) {
    productQuery = productQuery.eq("schedule", selected.schedule);
  } else if (filter === "inactive") {
    productQuery = productQuery.eq("is_active", false);
  } else {
    // Default (and "low stock" filter) show only active products
    productQuery = productQuery.eq("is_active", true);
  }

  // Search
  if (q.trim()) {
    const term = q.trim().replace(/[%_,]/g, "");
    productQuery = productQuery.or(
      `name.ilike.%${term}%,sku.ilike.%${term}%,active_ingredients.ilike.%${term}%`
    );
  }

  const [productRes, stockRes] = await Promise.all([
    productQuery.returns<Product[]>(),
    supabase
      .from("pharma_product_stock")
      .select("*")
      .returns<ProductStock[]>(),
  ]);

  const stockMap = new Map(
    (stockRes.data ?? []).map((s) => [s.product_id, s])
  );

  let rows = productRes.data ?? [];

  // Post-filter for "low stock" — requires data from the stock view
  // which we can't SQL-filter without joining. Done in JS for MVP.
  if (filter === "low") {
    rows = rows.filter((p) => {
      const s = stockMap.get(p.id);
      return s?.below_reorder === true;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p
            className="text-[11px] font-bold uppercase tracking-[0.15em] mb-1"
            style={{ color: "var(--portal-text-subtle)" }}
          >
            Pharma operations
          </p>
          <h1
            className="text-3xl font-bold"
            style={{ color: "var(--portal-text)" }}
          >
            Product catalog
          </h1>
          <p
            className="text-[13px] mt-1"
            style={{ color: "var(--portal-text-muted)" }}
          >
            {rows.length} product{rows.length === 1 ? "" : "s"}
            {filter !== "all" && ` · ${selected?.label}`}
            {q && ` · matching "${q}"`}
          </p>
        </div>
        <Link
          href="/portal/admin/pharma/products/new"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[13px] font-bold transition-opacity hover:opacity-90"
          style={{
            background: "var(--portal-accent)",
            color: "#fff",
          }}
        >
          <Plus className="w-4 h-4" />
          New product
        </Link>
      </div>

      {/* Filters + search */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: "var(--portal-surface)",
          border: "1px solid var(--portal-border)",
        }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {FILTER_OPTIONS.map((opt) => {
              const active = opt.value === filter;
              const href = `/portal/admin/pharma/products?filter=${opt.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
              return (
                <Link
                  key={opt.value}
                  href={href}
                  className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors"
                  style={{
                    background: active
                      ? "var(--portal-accent)"
                      : "var(--portal-surface-2)",
                    color: active ? "#fff" : "var(--portal-text-muted)",
                    border: "1px solid var(--portal-border)",
                  }}
                >
                  {opt.label}
                </Link>
              );
            })}
          </div>
          <form
            method="GET"
            action="/portal/admin/pharma/products"
            className="ml-auto relative"
          >
            <input type="hidden" name="filter" value={filter} />
            <Search
              className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--portal-text-subtle)" }}
            />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search SKU, name, ingredients…"
              className="pl-9 pr-3 py-2 rounded-lg text-[13px] w-full sm:w-80"
              style={{
                background: "var(--portal-surface-2)",
                color: "var(--portal-text)",
                border: "1px solid var(--portal-border)",
              }}
            />
          </form>
        </div>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{
            background: "var(--portal-surface)",
            border: "1px solid var(--portal-border)",
          }}
        >
          <Package
            className="w-8 h-8 mx-auto mb-3"
            style={{ color: "var(--portal-text-subtle)" }}
          />
          <p
            className="text-[14px]"
            style={{ color: "var(--portal-text-muted)" }}
          >
            No products match.
          </p>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--portal-surface)",
            border: "1px solid var(--portal-border)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className="text-left text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    background: "var(--portal-surface-2)",
                    color: "var(--portal-text-subtle)",
                  }}
                >
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Schedule</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const stock = stockMap.get(p.id);
                  const onHand = stock?.stock_on_hand ?? 0;
                  const below = stock?.below_reorder ?? false;
                  const scheduleMeta = SCHEDULE_LABELS[p.schedule];
                  return (
                    <tr
                      key={p.id}
                      className="border-t text-[13px]"
                      style={{ borderColor: "var(--portal-border)" }}
                    >
                      <td
                        className="px-4 py-3 font-mono"
                        style={{ color: "var(--portal-text-muted)" }}
                      >
                        {p.sku}
                      </td>
                      <td className="px-4 py-3">
                        <p
                          className="font-semibold"
                          style={{ color: "var(--portal-text)" }}
                        >
                          {p.name}
                        </p>
                        {(p.strength || p.form) && (
                          <p
                            className="text-[11px] mt-0.5"
                            style={{ color: "var(--portal-text-muted)" }}
                          >
                            {[p.strength, p.form, p.pack_size]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                          style={{
                            background:
                              scheduleMeta.tone === "danger"
                                ? "var(--portal-danger-soft)"
                                : scheduleMeta.tone === "warn"
                                  ? "var(--portal-warning-soft)"
                                  : "var(--portal-surface-2)",
                            color:
                              scheduleMeta.tone === "danger"
                                ? "var(--portal-danger)"
                                : scheduleMeta.tone === "warn"
                                  ? "var(--portal-warning)"
                                  : "var(--portal-text-muted)",
                          }}
                        >
                          {p.schedule}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 text-right font-mono tabular-nums font-bold"
                        style={{
                          color: below
                            ? "var(--portal-warning)"
                            : "var(--portal-text)",
                        }}
                      >
                        {onHand}
                        {below && " ⚠"}
                      </td>
                      <td
                        className="px-4 py-3 text-right font-mono tabular-nums"
                        style={{ color: "var(--portal-text)" }}
                      >
                        {formatCents(p.unit_price_cents)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/portal/admin/pharma/products/${p.id}`}
                          className="inline-flex items-center gap-1 text-[12px] font-semibold"
                          style={{ color: "var(--portal-accent)" }}
                        >
                          Manage
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
