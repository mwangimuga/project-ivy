/**
 * The platform fee schedule, in ONE place so the legal page, the acceptance
 * dialog and the Super Agent's System Info page can never disagree.
 *
 * IMPORTANT: the money is actually computed in Postgres (calc_payment_split /
 * calc_withdrawal_fee). If you change a number in the database, change it here
 * too — and bump TERMS_VERSION in legal.ts so every user re-accepts, because
 * fee changes need notice (clause "Fees and profit share").
 */
export interface FeeTier {
  tier: 1 | 2 | 3;
  label: string;
  upTo: number; // inclusive upper bound of the amount
  paymentFee: number; // KSh taken from each rent payment in this band
  withdrawalRatePct: number; // % taken from each withdrawal in this band
}

export const FEE_TIERS: FeeTier[] = [
  { tier: 1, label: "Up to KSh 50,000", upTo: 50000, paymentFee: 20, withdrawalRatePct: 2.0 },
  { tier: 2, label: "KSh 50,001 – 200,000", upTo: 200000, paymentFee: 50, withdrawalRatePct: 2.5 },
  { tier: 3, label: "Above KSh 200,000", upTo: Number.POSITIVE_INFINITY, paymentFee: 500, withdrawalRatePct: 3.0 },
];

export function tierFor(amount: number): FeeTier {
  return FEE_TIERS.find((t) => amount <= t.upTo) || FEE_TIERS[FEE_TIERS.length - 1];
}

export const paymentFeeFor = (amount: number) => tierFor(amount).paymentFee;
export const withdrawalFeeFor = (amount: number) => Math.round((amount * tierFor(amount).withdrawalRatePct) / 100);
export const kes = (n: number) => `KSh ${n.toLocaleString("en-KE")}`;
