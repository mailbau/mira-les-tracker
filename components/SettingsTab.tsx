"use client";
import { useState } from "react";
import {
  collection, addDoc, updateDoc, deleteDoc, doc, setDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Student } from "@/lib/types";
import { PricingConfig, DEFAULT_SUBJECTS, formatRupiah } from "@/lib/pricing";

interface Props {
  students: Student[];
  subjects: string[];
  pricing: PricingConfig;
  onStudentsChange: () => void;
  onSubjectsChange: (subjects: string[]) => void;
  onPricingChange: (pricing: PricingConfig) => void;
}

export default function SettingsTab({ students, subjects, pricing, onStudentsChange, onSubjectsChange, onPricingChange }: Props) {
  return (
    <div className="settings">
      <StudentsSection students={students} onChange={onStudentsChange} />
      <SubjectsSection subjects={subjects} onChange={onSubjectsChange} />
      <PricingSection pricing={pricing} onChange={onPricingChange} />

      <style jsx>{`
        .settings { display: flex; flex-direction: column; gap: 24px; max-width: 700px; }
      `}</style>
    </div>
  );
}

function StudentsSection({ students, onChange }: { students: Student[]; onChange: () => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: "", grade: "", school: "" });
  const [newData, setNewData] = useState({ name: "", grade: "", school: "" });
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  function startEdit(s: Student) {
    setEditingId(s.id);
    setEditData({ name: s.name, grade: s.grade, school: s.school });
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    await updateDoc(doc(db, "students", editingId), editData);
    setEditingId(null);
    setSaving(false);
    onChange();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Hapus murid "${name}"? Riwayat sesi tidak ikut terhapus.`)) return;
    await deleteDoc(doc(db, "students", id));
    onChange();
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await addDoc(collection(db, "students"), newData);
    setNewData({ name: "", grade: "", school: "" });
    setAdding(false);
    setSaving(false);
    onChange();
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>Murid</h3>
        <button className="btn-sm" onClick={() => setAdding(true)}>+ Tambah</button>
      </div>

      <table className="tbl">
        <thead>
          <tr><th>Nama</th><th>Kelas</th><th>Sekolah</th><th></th></tr>
        </thead>
        <tbody>
          {students.map((s) =>
            editingId === s.id ? (
              <tr key={s.id} className="editing">
                <td><input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} /></td>
                <td><input value={editData.grade} onChange={(e) => setEditData({ ...editData, grade: e.target.value })} /></td>
                <td><input value={editData.school} onChange={(e) => setEditData({ ...editData, school: e.target.value })} /></td>
                <td className="actions">
                  <button className="btn-save" onClick={saveEdit} disabled={saving}>Simpan</button>
                  <button className="btn-cancel" onClick={() => setEditingId(null)}>Batal</button>
                </td>
              </tr>
            ) : (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.grade}</td>
                <td>{s.school || "—"}</td>
                <td className="actions">
                  <button className="btn-edit" onClick={() => startEdit(s)}>Edit</button>
                  <button className="btn-del" onClick={() => handleDelete(s.id, s.name)}>Hapus</button>
                </td>
              </tr>
            )
          )}
          {students.length === 0 && (
            <tr><td colSpan={4} className="empty">Belum ada murid</td></tr>
          )}
        </tbody>
      </table>

      {adding && (
        <form className="add-form" onSubmit={handleAdd}>
          <input
            placeholder="Nama" required value={newData.name}
            onChange={(e) => setNewData({ ...newData, name: e.target.value })}
          />
          <input
            placeholder="Kelas" required value={newData.grade}
            onChange={(e) => setNewData({ ...newData, grade: e.target.value })}
          />
          <input
            placeholder="Sekolah" value={newData.school}
            onChange={(e) => setNewData({ ...newData, school: e.target.value })}
          />
          <button type="submit" className="btn-save" disabled={saving}>Simpan</button>
          <button type="button" className="btn-cancel" onClick={() => setAdding(false)}>Batal</button>
        </form>
      )}

      <style jsx>{`
        .card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
        .card-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 20px; border-bottom: 1px solid #f3f4f6;
        }
        .card-header h3 { margin: 0; font-size: 15px; font-weight: 600; }
        .tbl { width: 100%; border-collapse: collapse; font-size: 14px; }
        .tbl th { padding: 10px 16px; text-align: left; font-size: 12px; color: #9ca3af; font-weight: 500; border-bottom: 1px solid #f3f4f6; }
        .tbl td { padding: 10px 16px; border-bottom: 1px solid #f9fafb; vertical-align: middle; }
        .tbl tbody tr:last-child td { border-bottom: none; }
        .tbl input {
          width: 100%; padding: 5px 8px; border: 1px solid #d1d5db; border-radius: 6px;
          font-size: 13px; outline: none;
        }
        .tbl input:focus { border-color: #6366f1; }
        .empty { text-align: center; color: #9ca3af; padding: 20px 0 !important; }
        .actions { display: flex; gap: 6px; white-space: nowrap; }
        .btn-sm {
          background: #6366f1; color: white; border: none; padding: 6px 14px;
          border-radius: 7px; font-size: 13px; cursor: pointer;
        }
        .btn-sm:hover { background: #4f46e5; }
        .btn-edit {
          background: #f3f4f6; color: #374151; border: none; padding: 4px 10px;
          border-radius: 6px; font-size: 12px; cursor: pointer;
        }
        .btn-edit:hover { background: #e5e7eb; }
        .btn-del {
          background: #fef2f2; color: #dc2626; border: none; padding: 4px 10px;
          border-radius: 6px; font-size: 12px; cursor: pointer;
        }
        .btn-del:hover { background: #fee2e2; }
        .btn-save {
          background: #22c55e; color: white; border: none; padding: 4px 12px;
          border-radius: 6px; font-size: 12px; cursor: pointer;
        }
        .btn-save:disabled { opacity: 0.6; }
        .btn-cancel {
          background: #f3f4f6; color: #6b7280; border: none; padding: 4px 10px;
          border-radius: 6px; font-size: 12px; cursor: pointer;
        }
        .add-form {
          display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid #f3f4f6;
          flex-wrap: wrap; align-items: center;
        }
        .add-form input {
          flex: 1; min-width: 100px; padding: 7px 10px; border: 1px solid #d1d5db;
          border-radius: 7px; font-size: 13px; outline: none;
        }
        .add-form input:focus { border-color: #6366f1; }
      `}</style>
    </div>
  );
}

function SubjectsSection({ subjects, onChange }: { subjects: string[]; onChange: (s: string[]) => void }) {
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveSubjects(list: string[]) {
    setSaving(true);
    await setDoc(doc(db, "config", "subjects"), { list });
    onChange(list);
    setSaving(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const val = input.trim();
    if (!val || subjects.includes(val)) { setInput(""); return; }
    await saveSubjects([...subjects, val]);
    setInput("");
  }

  async function handleRemove(s: string) {
    await saveSubjects(subjects.filter((x) => x !== s));
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>Mata Pelajaran</h3>
      </div>
      <div className="body">
        <div className="chips">
          {subjects.map((s) => (
            <span key={s} className="chip">
              {s}
              <button onClick={() => handleRemove(s)} className="chip-x" disabled={saving}>×</button>
            </span>
          ))}
          {subjects.length === 0 && <span className="muted">Belum ada mapel</span>}
        </div>
        <form className="add-row" onSubmit={handleAdd}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tambah mapel baru..."
          />
          <button type="submit" className="btn-sm" disabled={saving || !input.trim()}>Tambah</button>
        </form>
      </div>

      <style jsx>{`
        .card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
        .card-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 20px; border-bottom: 1px solid #f3f4f6;
        }
        .card-header h3 { margin: 0; font-size: 15px; font-weight: 600; }
        .body { padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }
        .chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .chip {
          display: flex; align-items: center; gap: 4px;
          background: #ede9fe; color: #5b21b6;
          padding: 4px 10px; border-radius: 9999px; font-size: 13px; font-weight: 500;
        }
        .chip-x {
          background: none; border: none; cursor: pointer; color: #7c3aed;
          font-size: 15px; line-height: 1; padding: 0 2px;
        }
        .chip-x:hover { color: #dc2626; }
        .chip-x:disabled { opacity: 0.4; cursor: not-allowed; }
        .muted { color: #9ca3af; font-size: 14px; }
        .add-row { display: flex; gap: 8px; }
        .add-row input {
          flex: 1; padding: 7px 12px; border: 1px solid #d1d5db; border-radius: 8px;
          font-size: 14px; outline: none;
        }
        .add-row input:focus { border-color: #6366f1; }
        .btn-sm {
          background: #6366f1; color: white; border: none; padding: 7px 16px;
          border-radius: 8px; font-size: 13px; cursor: pointer; white-space: nowrap;
        }
        .btn-sm:hover:not(:disabled) { background: #4f46e5; }
        .btn-sm:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}

function PricingSection({ pricing, onChange }: { pricing: PricingConfig; onChange: (p: PricingConfig) => void }) {
  const [draft, setDraft] = useState(pricing);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await setDoc(doc(db, "config", "pricing"), draft);
    onChange(draft);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>Harga</h3>
      </div>
      <form className="body" onSubmit={handleSave}>
        <div className="price-grid">
          <PriceField
            label="Weekday (90 menit)"
            value={draft.weekdayRate}
            onChange={(v) => setDraft({ ...draft, weekdayRate: v })}
          />
          <PriceField
            label="Weekend (90 menit)"
            value={draft.weekendRate}
            onChange={(v) => setDraft({ ...draft, weekendRate: v })}
          />
          <PriceField
            label="Extra time (per 30 menit)"
            value={draft.extraBlockRate}
            onChange={(v) => setDraft({ ...draft, extraBlockRate: v })}
          />
        </div>
        <div className="save-row">
          <button type="submit" className="btn-save" disabled={saving}>
            {saving ? "Menyimpan..." : saved ? "Tersimpan!" : "Simpan Harga"}
          </button>
        </div>
      </form>

      <style jsx>{`
        .card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
        .card-header { padding: 16px 20px; border-bottom: 1px solid #f3f4f6; }
        .card-header h3 { margin: 0; font-size: 15px; font-weight: 600; }
        .body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
        .price-grid { display: flex; gap: 16px; flex-wrap: wrap; }
        .save-row { display: flex; }
        .btn-save {
          background: #6366f1; color: white; border: none; padding: 8px 24px;
          border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;
        }
        .btn-save:hover:not(:disabled) { background: #4f46e5; }
        .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </div>
  );
}

function PriceField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="pf">
      <label>{label}</label>
      <div className="input-wrap">
        <span className="prefix">Rp</span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={0}
          step={500}
          required
        />
      </div>
      <span className="hint">{formatRupiah(value)}</span>

      <style jsx>{`
        .pf { display: flex; flex-direction: column; gap: 4px; min-width: 180px; flex: 1; }
        label { font-size: 13px; font-weight: 500; color: #374151; }
        .input-wrap { display: flex; align-items: center; border: 1px solid #d1d5db; border-radius: 8px; overflow: hidden; }
        .prefix { padding: 8px 10px; background: #f9fafb; color: #6b7280; font-size: 13px; border-right: 1px solid #d1d5db; }
        input { flex: 1; border: none; padding: 8px 10px; font-size: 14px; outline: none; min-width: 0; }
        .hint { font-size: 12px; color: #9ca3af; }
      `}</style>
    </div>
  );
}
