export interface Student {
  id: string;
  name: string;
  grade: string;
  school: string;
}

export interface Session {
  id: string;
  studentId: string;
  studentName: string;
  date: string; // ISO date string YYYY-MM-DD
  day: string; // Senin, Selasa, etc.
  subject: string;
  isWeekend: boolean;
  extraBlocks: number; // number of 30-min extra blocks
  baseRate: number;
  weekendBonus: number;
  extraCharge: number;
  total: number;
  isPaid: boolean;
  paidAt: string | null;
  sessionNumber?: number; // per-month sequence number
}
