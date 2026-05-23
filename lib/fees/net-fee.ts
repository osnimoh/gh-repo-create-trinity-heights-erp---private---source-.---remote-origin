// The 10% net-fee floor (ENTRENCHED). No scholarship or combination may reduce
// a family's net payable below 10% of the standard fee. This pure function is
// the single source of truth for the calculation on the app side; the
// generate_invoice() RPC mirrors it, and a DB CHECK on `invoice` is the final
// backstop. Money is computed in integer pesewas (GH₵ ×100) to avoid float
// drift; never do money math in floating point.

export const FLOOR_RATE = 0.1; // 10%

export type ScholarshipKind = "percentage" | "fixed";
export type ScholarshipInput = { kind: ScholarshipKind; value: number };

export type InvoiceAmounts = {
  standard: number; // GH₵
  discount: number; // GH₵
  net: number; // GH₵ — what the family actually pays
};

function toPesewas(cedis: number): number {
  return Math.round(cedis * 100);
}

/**
 * Given a standard fee and any number of (possibly stacked) scholarships,
 * return the standard, the applied discount, and the net payable — with the
 * 10% floor enforced. A 100% scholarship still leaves 10% payable.
 *
 * Percentages are summed; fixed amounts are summed; together they form the raw
 * discount, which is then capped so the net never drops below the floor.
 */
export function computeInvoiceAmounts(
  standardCedis: number,
  scholarships: ScholarshipInput[],
): InvoiceAmounts {
  const standard = Math.max(0, toPesewas(standardCedis));

  let percentTotal = 0;
  let fixedPesewas = 0;
  for (const s of scholarships) {
    if (s.value <= 0) continue;
    if (s.kind === "percentage") percentTotal += s.value;
    else fixedPesewas += toPesewas(s.value);
  }

  const rawDiscount =
    Math.round((standard * percentTotal) / 100) + fixedPesewas;

  // Floor rounded UP to the nearest pesewa so net is always >= 10% exactly,
  // which keeps it on the right side of the DB CHECK (net >= standard * 0.10).
  const minNet = Math.ceil(standard * FLOOR_RATE);

  let net = standard - rawDiscount;
  if (net < minNet) net = minNet;
  if (net > standard) net = standard; // guard against negative discounts

  const discount = standard - net;

  return {
    standard: standard / 100,
    discount: discount / 100,
    net: net / 100,
  };
}
