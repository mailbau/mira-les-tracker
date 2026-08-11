"use client";
import { useEffect, useState, useCallback } from "react";
import {
  collection, getDocs, query, orderBy, where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Student, Session } from "@/lib/types";
import SessionTable from "@/components/SessionTable";
import AddSessionModal from "@/components/AddSessionModal";
import AddStudentModal from "@/components/AddStudentModal";
import PaymentModal from "@/components/PaymentModal";

export default function Home() {
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAddSession, setShowAddSession] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStudents = useCallback(async () => {
    const snap = await getDocs(collection(db, "students"));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Student));
    setStudents(list);
    if (list.length > 0 && !activeStudentId) {
      setActiveStudentId(list[0].id);
    }
  }, [activeStudentId]);

  const fetchSessions = useCallback(async (studentId: string) => {
    setLoading(true);
    const q = query(
      collection(db, "sessions"),
      where("studentId", "==", studentId),
      orderBy("date", "asc")
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Session));
    setSessions(list);
    setSelected(new Set());
    setLoading(false);
  }, []);

  useEffect(() => { fetchStudents(); }, []);
  useEffect(() => {
    if (activeStudentId) fetchSessions(activeStudentId);
  }, [activeStudentId]);

  function handleToggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleToggleAll(ids: string[]) {
    setSelected(new Set(ids));
  }

  const selectedSessions = sessions.filter((s) => selected.has(s.id));
  const activeStudent = students.find((s) => s.id === activeStudentId);
  const unpaidTotal = sessions.filter((s) => !s.isPaid).reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">Les Tracker</div>
        <div className="actions">
          <button className="btn-ghost" onClick={() => setShowAddStudent(true)}>+ Murid</button>
          <button className="btn-primary" onClick={() => setShowAddSession(true)} disabled={students.length === 0}>
            + Tambah Sesi
          </button>
        </div>
      </header>

      <main className="main">
        {students.length === 0 ? (
          <div className="empty-state">
            <h2>Belum ada murid</h2>
            <p>Tambahkan murid terlebih dahulu untuk mulai mencatat sesi.</p>
            <button className="btn-primary" onClick={() => setShowAddStudent(true)}>+ Tambah Murid</button>
          </div>
        ) : (
          <>
            <div className="student-tabs">
              {students.map((s) => (
                <button
                  key={s.id}
                  className={`tab ${activeStudentId === s.id ? "active" : ""}`}
                  onClick={() => { setActiveStudentId(s.id); setSelected(new Set()); }}
                >
                  {s.name}
                  <span className="tab-sub">Kelas {s.grade}</span>
                </button>
              ))}
            </div>

            {activeStudent && (
              <div className="student-info">
                <div className="info-block">
                  <span className="info-label">Murid</span>
                  <span className="info-val">{activeStudent.name}</span>
                </div>
                <div className="info-block">
                  <span className="info-label">Kelas</span>
                  <span className="info-val">{activeStudent.grade}</span>
                </div>
                {activeStudent.school && (
                  <div className="info-block">
                    <span className="info-label">Sekolah</span>
                    <span className="info-val">{activeStudent.school}</span>
                  </div>
                )}
                <div className="info-block">
                  <span className="info-label">Belum Lunas</span>
                  <span className="info-val unpaid">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(unpaidTotal)}
                  </span>
                </div>
              </div>
            )}

            <div className="table-card">
              <div className="table-toolbar">
                <h3>Riwayat Sesi</h3>
                {selected.size > 0 && (
                  <button className="btn-pay" onClick={() => setShowPayment(true)}>
                    Tandai Lunas ({selected.size} sesi)
                  </button>
                )}
              </div>
              {loading ? (
                <div className="loading">Memuat...</div>
              ) : (
                <SessionTable
                  sessions={sessions}
                  selected={selected}
                  onToggle={handleToggle}
                  onToggleAll={handleToggleAll}
                />
              )}
            </div>
          </>
        )}
      </main>

      {showAddSession && (
        <AddSessionModal
          students={students}
          onClose={() => setShowAddSession(false)}
          onAdded={() => activeStudentId && fetchSessions(activeStudentId)}
        />
      )}
      {showAddStudent && (
        <AddStudentModal
          onClose={() => setShowAddStudent(false)}
          onAdded={fetchStudents}
        />
      )}
      {showPayment && (
        <PaymentModal
          sessions={selectedSessions}
          onClose={() => setShowPayment(false)}
          onPaid={() => activeStudentId && fetchSessions(activeStudentId)}
        />
      )}

      <style jsx>{`
        .app { min-height: 100vh; background: #f9fafb; }
        .topbar {
          background: white; border-bottom: 1px solid #e5e7eb;
          padding: 0 24px; height: 56px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 10;
        }
        .brand { font-weight: 700; font-size: 18px; color: #6366f1; letter-spacing: -0.3px; }
        .actions { display: flex; gap: 8px; }
        .btn-primary {
          background: #6366f1; color: white; border: none; padding: 8px 16px;
          border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;
        }
        .btn-primary:hover:not(:disabled) { background: #4f46e5; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-ghost {
          background: white; color: #374151; border: 1px solid #d1d5db;
          padding: 7px 14px; border-radius: 8px; font-size: 14px; cursor: pointer;
        }
        .btn-ghost:hover { background: #f3f4f6; }
        .main { max-width: 1100px; margin: 0 auto; padding: 24px 24px; }
        .empty-state {
          text-align: center; padding: 80px 0;
        }
        .empty-state h2 { margin: 0 0 8px; font-size: 22px; color: #374151; }
        .empty-state p { color: #9ca3af; margin-bottom: 24px; }
        .student-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
        .tab {
          background: white; border: 1px solid #e5e7eb; border-radius: 10px;
          padding: 8px 16px; cursor: pointer; display: flex; flex-direction: column;
          align-items: flex-start; transition: all 0.15s;
        }
        .tab:hover { border-color: #a5b4fc; background: #f5f3ff; }
        .tab.active { border-color: #6366f1; background: #ede9fe; }
        .tab-sub { font-size: 11px; color: #9ca3af; }
        .tab.active .tab-sub { color: #7c3aed; }
        .student-info {
          display: flex; gap: 24px; flex-wrap: wrap;
          background: white; border: 1px solid #e5e7eb; border-radius: 10px;
          padding: 14px 20px; margin-bottom: 16px;
        }
        .info-block { display: flex; flex-direction: column; gap: 2px; }
        .info-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; }
        .info-val { font-size: 15px; font-weight: 500; }
        .info-val.unpaid { color: #dc2626; }
        .table-card {
          background: white; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;
        }
        .table-toolbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; border-bottom: 1px solid #f3f4f6;
        }
        .table-toolbar h3 { margin: 0; font-size: 15px; font-weight: 600; }
        .btn-pay {
          background: #22c55e; color: white; border: none;
          padding: 7px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer;
        }
        .btn-pay:hover { background: #16a34a; }
        .loading { text-align: center; padding: 32px; color: #9ca3af; font-size: 14px; }
      `}</style>
    </div>
  );
}
