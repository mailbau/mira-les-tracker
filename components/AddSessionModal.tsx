"use client";
import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Student } from "@/lib/types";
import { calcSession, getDayName, formatRupiah } from "@/lib/pricing";

interface Props {
  students: Student[];
  onClose: () => void;
  onAdded: () => void;
}

const SUBJECTS = ["MTK", "Bindo", "IPA", "IPS", "Inggris", "Fisika", "Kimia", "Biologi", "Lainnya"];

export default function AddSessionModal({ students, onClose, onAdded }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [date, setDate] = useState(today);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [extraBlocks, setExtraBlocks] = useState(0);
  const [loading, setLoading] = useState(false);

  const preview = date ? calcSession(date, extraBlocks) : null;
  const dayName = date ? getDayName(date) : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId || !date) return;
    setLoading(true);

    const student = students.find((s) => s.id === studentId)!;
    const calc = calcSession(date, extraBlocks);

    await addDoc(collection(db, "sessions"), {
      studentId,
      studentName: student.name,
      date,
      day: getDayName(date),
      subject,
      isWeekend: calc.isWeekend,
      extraBlocks,
      baseRate: calc.baseRate,
      weekendBonus: calc.weekendBonus,
      extraCharge: calc.extraCharge,
      total: calc.total,
      isPaid: false,
      paidAt: null,
      createdAt: new Date().toISOString(),
    });

    setLoading(false);
    onAdded();
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Tambah Sesi</h2>
          <button className="close-btn" onClick={onClose}>x</button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div className="field">
            <label>Murid</label>
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — Kelas {s.grade}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            {dayName && <span className="hint">{dayName}{preview?.isWeekend ? " (Weekend)" : " (Weekday)"}</span>}
          </div>

          <div className="field">
            <label>Mapel</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)}>
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="field">
            <label>Waktu Tambahan</label>
            <select value={extraBlocks} onChange={(e) => setExtraBlocks(Number(e.target.value))}>
              <option value={0}>Tidak ada</option>
              <option value={1}>+30 menit</option>
              <option value={2}>+60 menit</option>
              <option value={3}>+90 menit</option>
            </select>
          </div>

          {preview && (
            <div className="preview-box">
              <div className="preview-row">
                <span>Base ({preview.isWeekend ? "Weekend" : "Weekday"})</span>
                <span>{formatRupiah(preview.baseRate)}</span>
              </div>
              {preview.extraCharge > 0 && (
                <div className="preview-row">
                  <span>Extra {extraBlocks * 30} menit</span>
                  <span>{formatRupiah(preview.extraCharge)}</span>
                </div>
              )}
              <div className="preview-row total">
                <span>Total</span>
                <span>{formatRupiah(preview.total)}</span>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.4);
          display: flex; align-items: center; justify-content: center; z-index: 50;
        }
        .modal {
          background: white; border-radius: 12px; padding: 24px;
          width: 100%; max-width: 420px; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .modal-header h2 { margin: 0; font-size: 18px; font-weight: 600; }
        .close-btn { background: none; border: none; font-size: 18px; cursor: pointer; color: #6b7280; padding: 4px 8px; }
        .form { display: flex; flex-direction: column; gap: 14px; }
        .field { display: flex; flex-direction: column; gap: 4px; }
        .field label { font-size: 13px; font-weight: 500; color: #374151; }
        .field input, .field select {
          padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px;
          font-size: 14px; outline: none;
        }
        .field input:focus, .field select:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,0.15); }
        .hint { font-size: 12px; color: #6b7280; }
        .preview-box {
          background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;
          padding: 12px; display: flex; flex-direction: column; gap: 6px;
        }
        .preview-row { display: flex; justify-content: space-between; font-size: 14px; }
        .preview-row.total { font-weight: 600; border-top: 1px solid #e5e7eb; padding-top: 6px; margin-top: 2px; }
        .form-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
        .btn-primary {
          background: #6366f1; color: white; border: none; padding: 8px 20px;
          border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;
        }
        .btn-primary:hover:not(:disabled) { background: #4f46e5; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-secondary {
          background: white; color: #374151; border: 1px solid #d1d5db;
          padding: 8px 20px; border-radius: 8px; font-size: 14px; cursor: pointer;
        }
        .btn-secondary:hover { background: #f3f4f6; }
      `}</style>
    </div>
  );
}
