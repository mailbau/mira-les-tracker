"use client";
import { Session } from "@/lib/types";
import { formatRupiah } from "@/lib/pricing";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useState } from "react";

interface Props {
  sessions: Session[];
  onClose: () => void;
  onPaid: () => void;
}

export default function PaymentModal({ sessions, onClose, onPaid }: Props) {
  const [loading, setLoading] = useState(false);
  const total = sessions.reduce((sum, s) => sum + s.total, 0);

  async function handleMarkPaid() {
    setLoading(true);
    const paidAt = new Date().toISOString();
    await Promise.all(
      sessions.map((s) =>
        updateDoc(doc(db, "sessions", s.id), { isPaid: true, paidAt })
      )
    );
    setLoading(false);
    onPaid();
    onClose();
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="header">
          <h2>Konfirmasi Pembayaran</h2>
          <button className="close" onClick={onClose}>x</button>
        </div>

        <div className="session-list">
          {sessions.map((s, i) => (
            <div key={s.id} className="session-row">
              <span className="num">{i + 1}</span>
              <span className="info">
                {new Date(s.date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                {" "}&mdash; {s.subject}
                {s.isWeekend && <span className="badge-weekend">Weekend</span>}
              </span>
              <span className="amount">{formatRupiah(s.total)}</span>
            </div>
          ))}
        </div>

        <div className="total-row">
          <span>Total ({sessions.length} sesi)</span>
          <strong>{formatRupiah(total)}</strong>
        </div>

        <div className="actions">
          <button className="btn-secondary" onClick={onClose}>Batal</button>
          <button className="btn-paid" onClick={handleMarkPaid} disabled={loading}>
            {loading ? "Memproses..." : "Tandai Lunas"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center; z-index: 60;
        }
        .modal {
          background: white; border-radius: 12px; padding: 24px;
          width: 100%; max-width: 460px; max-height: 80vh; overflow: hidden;
          display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.25);
        }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .header h2 { margin: 0; font-size: 18px; font-weight: 600; }
        .close { background: none; border: none; font-size: 18px; cursor: pointer; color: #6b7280; }
        .session-list { overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
        .session-row {
          display: flex; align-items: center; gap: 10px; padding: 8px 10px;
          background: #f9fafb; border-radius: 8px; font-size: 14px;
        }
        .num { color: #9ca3af; font-size: 12px; min-width: 16px; }
        .info { flex: 1; color: #374151; }
        .badge-weekend {
          display: inline-block; background: #fef3c7; color: #92400e;
          font-size: 11px; padding: 1px 6px; border-radius: 4px; margin-left: 6px;
        }
        .amount { font-weight: 500; white-space: nowrap; }
        .total-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 0; border-top: 2px solid #e5e7eb; margin-bottom: 16px;
          font-size: 16px;
        }
        .actions { display: flex; gap: 8px; justify-content: flex-end; }
        .btn-secondary {
          background: white; color: #374151; border: 1px solid #d1d5db;
          padding: 8px 20px; border-radius: 8px; font-size: 14px; cursor: pointer;
        }
        .btn-paid {
          background: #22c55e; color: white; border: none;
          padding: 8px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;
        }
        .btn-paid:hover:not(:disabled) { background: #16a34a; }
        .btn-paid:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
