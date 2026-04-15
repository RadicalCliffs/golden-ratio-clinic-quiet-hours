import { Search, Package, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { requireStaff } from "@/lib/requireAdmin";
import { createClient } from "@/utils/supabase/server";
import type { Product, ProductStock } from "@/lib/pharma.types";
import { formatCents, SCHEDULE_LABELS } from "@/lib/pharma.types";

/**
 * Stock check — quick lookup for nurses during patient consults.
 *
 * The use case: a doctor is about to prescribe medicinal cannabis
 * and asks the nurse "do we have X in stock at the pharmacy
 * supplier?" The nurse opens this page, types the product name or
 * SKU, and sees the current stock level without having to navigate
 * the full product management section.
 *
 * Read-only, fast. No mutations. Uses requireStaff so any clinic
 * role (admin/nurse/doctor) can access.
 *
 * Search spans SKU, name, and active_ingredients via a single
 * PostgREST .or() filter. Empty search shows the 20 most recently
 * updated products so the page is useful even without a query.
 */

export const dynamic = "force-dynamic";

export default async function StockCheckPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireStaff();
  const { q = "" } = await searchParams;

  const supabase = await createClient();

  let productQuery = supabase
    .from("pharma_products")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true })
    .limit(50);

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

  const products = productRes.data ?? [];
  const stockMap = new Map(
    (stockRes.data ?? []).map((s) => [s.product_id, s])
  );

  return (
    <div className="space-y-6 max-w-[900px]">
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
          Stock check
        </h1>
        <p
          className="text-[13px] mt-1"
          style={{ color: "var(--portal-text-muted)" }}
        >
          Quick lookup of current vault stock. For operations details,
          use the full catalog.
        </p>
      </div>

      {/* Search */}
      <form
        method="GET"
        action="/portal/admin/pharma/stock-check"
        className="relative"
      >
        <Search
          className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2"
          style={{ color: "var(--portal-text-muted)" }}
        />
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name, SKU, or ingredient (e.g. THC, CBD, oil)…"
          autoFocus
          className="w-full pl-14 pr-5 py-4 rounded-2xl text-[15px]"
          style={{
            background: "var(--portal-surface)",
            color: "var(--portal-text)",
            border: "1px solid var(--portal-border)",
          }}
        />
      </form>

      {/* Results */}
      {products.length === 0 ? (
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
            {q ? `No products matching "${q}".` : "No products in catalog."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {products.map((p) => {
            const stock = stockMap.get(p.id);
            const onHand = stock?.stock_on_hand ?? 0;
            const belowReorder = stock?.below_reorder ?? false;
            return (
              <li
                key={p.id}
                className="rounded-xl p-4 flex items-center gap-4"
                style={{
                  background: "var(--portal-surface)",
                  border: "1px solid var(--portal-border)",
                }}
              >
                <StockIcon onHand={onHand} below={belowReorder} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className="text-[14px] font-semibold"
                      style={{ color: "var(--portal-text)" }}
                    >
                      {p.name}
                    </p>
                    <span
                      className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{
                        background:
                          SCHEDULE_LABELS[p.schedule].tone === "danger"
                            ? "var(--portal-danger-soft)"
                            : SCHEDULE_LABELS[p.schedule].tone === "warn"
                              ? "var(--portal-warning-soft)"
                              : "var(--portal-surface-2)",
                        color:
                          SCHEDULE_LABELS[p.schedule].tone === "danger"
                            ? "var(--portal-danger)"
                            : SCHEDULE_LABELS[p.schedule].tone === "warn"
                              ? "var(--portal-warning)"
                              : "var(--portal-text-muted)",
                      }}
                    >
                      {p.schedule}
                    </span>
                  </div>
                  <p
                    className="text-[11px] font-mono mt-0.5"
                    style={{ color: "var(--portal-text-muted)" }}
                  >
                    {p.sku}
                    {p.strength && ` · ${p.strength}`}
                    {p.form && ` · ${p.form}`}
                    {p.pack_size && ` · ${p.pack_size}`}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="text-2xl font-mono font-bold tabular-nums"
                    style={{
                      color:
                        onHand === 0
                          ? "var(--portal-danger)"
                          : belowReorder
                            ? "var(--portal-warning)"
                            : "var(--portal-accent)",
                    }}
                  >
                    {onHand}
                  </p>
                  <p
                    className="text-[10px] font-mono"
                    style={{ color: "var(--portal-text-subtle)" }}
                  >
                    {formatCents(p.unit_price_cents)} ea
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StockIcon({
  onHand,
  below,
}: {
  onHand: number;
  below: boolean;
}) {
  if (onHand === 0) {
    return (
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: "var(--portal-danger-soft)",
          color: "var(--portal-danger)",
        }}
      >
        <XCircle className="w-5 h-5" />
      </div>
    );
  }
  if (below) {
    return (
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: "var(--portal-warning-soft)",
          color: "var(--portal-warning)",
        }}
      >
        <AlertCircle className="w-5 h-5" />
      </div>
    );
  }
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{
        background: "var(--portal-accent-soft)",
        color: "var(--portal-accent)",
      }}
    >
      <CheckCircle2 className="w-5 h-5" />
    </div>
  );
}
