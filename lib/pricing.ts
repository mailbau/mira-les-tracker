export interface PricingConfig {
  weekdayRate: number;
  weekendRate: number;
  extraBlockRate: number;
}

export const DEFAULT_PRICING: PricingConfig = {
  weekdayRate: 77500,
  weekendRate: 83500,
  extraBlockRate: 12500, // per 15-min block (Rp25.000 / 30 min)
};

export const DEFAULT_SUBJECTS = ["MTK", "Bindo", "IPA", "IPS", "Inggris", "Fisika", "Kimia", "Biologi", "Lainnya"];

const DAYS_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export function getDayName(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return DAYS_ID[d.getDay()];
}

export function isWeekend(dateStr: string): boolean {
  const day = new Date(dateStr + "T00:00:00").getDay();
  return day === 0 || day === 6;
}

export function calcSession(dateStr: string, extraBlocks: number, pricing: PricingConfig = DEFAULT_PRICING) {
  const weekend = isWeekend(dateStr);
  const baseRate = weekend ? pricing.weekendRate : pricing.weekdayRate;
  const extraCharge = extraBlocks * pricing.extraBlockRate;
  return { isWeekend: weekend, baseRate, weekendBonus: 0, extraCharge, total: baseRate + extraCharge };
}

export function formatRupiah(amount: number): string {
  return "Rp" + amount.toLocaleString("id-ID");
}
