const WEEKDAY_RATE = 77500;
const WEEKEND_RATE = 83500;
const EXTRA_BLOCK_RATE = 25000;

const DAYS_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export function getDayName(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return DAYS_ID[d.getDay()];
}

export function isWeekend(dateStr: string): boolean {
  const day = new Date(dateStr + "T00:00:00").getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

export function calcSession(dateStr: string, extraBlocks: number) {
  const weekend = isWeekend(dateStr);
  const baseRate = weekend ? WEEKEND_RATE : WEEKDAY_RATE;
  const weekendBonus = 0; // already baked into baseRate
  const extraCharge = extraBlocks * EXTRA_BLOCK_RATE;
  const total = baseRate + extraCharge;
  return { isWeekend: weekend, baseRate, weekendBonus, extraCharge, total };
}

export function formatRupiah(amount: number): string {
  return "Rp" + amount.toLocaleString("id-ID");
}
