"use client";
import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Props {
  onClose: () => void;
  onAdded: () => void;
}

export default function AddStudentModal({ onClose, onAdded }: Props) {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [school, setSchool] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await addDoc(collection(db, "students"), { name, grade, school });
    setLoading(false);
    onAdded();
    onClose();
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="header">
          <h2>Tambah Murid</h2>
          <button className="close" onClick={onClose}>x</button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div className="field">
            <label>Nama</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama murid" required />
          </div>
          <div className="field">
            <label>Kelas</label>
            <input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="7" required />
          </div>
          <div className="field">
            <label>Sekolah</label>
            <input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="SMPN 1 ..." />
          </div>
          <div className="actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.4);
          display: flex; align-items: center; justify-content: center; z-index: 50;
        }
        .modal {
          background: white; border-radius: 12px; padding: 24px;
          width: 100%; max-width: 380px; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .header h2 { margin: 0; font-size: 18px; font-weight: 600; }
        .close { background: none; border: none; font-size: 18px; cursor: pointer; color: #6b7280; }
        .form { display: flex; flex-direction: column; gap: 14px; }
        .field { display: flex; flex-direction: column; gap: 4px; }
        .field label { font-size: 13px; font-weight: 500; color: #374151; }
        .field input {
          padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px;
          font-size: 14px; outline: none;
        }
        .field input:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,0.15); }
        .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
        .btn-primary {
          background: #6366f1; color: white; border: none; padding: 8px 20px;
          border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;
        }
        .btn-primary:hover:not(:disabled) { background: #4f46e5; }
        .btn-primary:disabled { opacity: 0.6; }
        .btn-secondary {
          background: white; color: #374151; border: 1px solid #d1d5db;
          padding: 8px 20px; border-radius: 8px; font-size: 14px; cursor: pointer;
        }
      `}</style>
    </div>
  );
}
