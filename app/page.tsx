"use client";
import { useEffect, useState, useCallback } from "react";
import {
  collection, getDocs, query, orderBy, where, doc, getDoc, updateDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Student, Session } from "@/lib/types";
import { PricingConfig, DEFAULT_PRICING, DEFAULT_SUBJECTS } from "@/lib/pricing";
import SessionTable from "@/components/SessionTable";
import AddSessionModal from "@/components/AddSessionModal";
import PaymentModal from "@/components/PaymentModal";
import SettingsTab from "@/components/SettingsTab";

type View = "sesi" | "pengaturan";

export default function Home() {
  const [view, setView] = useState<View>("sesi");
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAddSession, setShowAddSession] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<string[]>(DEFAULT_SUBJECTS);
  const [pricing, setPricing] = useState<PricingConfig>(DEFAULT_PRICING);

  const fetchStudents = useCallback(async () => {
    const snap = await getDocs(collection(db, "students"));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Student));
    setStudents(list);
    setActiveStudentId((prev) => prev ?? (list[0]?.id ?? null));
  }, []);

  const fetchConfig = useCallback(async () => {
    const [pricingSnap, subjectsSnap] = await Promise.all([
      getDoc(doc(db, "config", "pricing")),
      getDoc(doc(db, "config", "subjects")),
    ]);
    if (pricingSnap.exists()) setPricing(pricingSnap.data() as PricingConfig);
    if (subjectsSnap.exists()) setSubjects(subjectsSnap.data().list as string[]);
  }, []);

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

  useEffect(() => {
    fetchStudents();
    fetchConfig();
  }, []);

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

  const selectedSessions = sessions.filter((s) => selected.has(s.id));
  const activeStudent = students.find((s) => s.id === activeStudentId);
  const unpaidTotal = sessions.filter((s) => !s.isPaid).reduce((sum, s) => sum + s.total, 0);

  const selectionType: "none" | "unpaid" | "paid" | "mixed" =
    selectedSessions.length === 0 ? "none"
    : selectedSessions.every((s) => !s.isPaid) ? "unpaid"
    : selectedSessions.every((s) => s.isPaid) ? "paid"
    : "mixed";

  async function handleMarkUnpaid() {
    await Promise.all(
      selectedSessions.map((s) => updateDoc(doc(db, "sessions", s.id), { isPaid: false, paidAt: null }))
    );
    if (activeStudentId) fetchSessions(activeStudentId);
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">Les Tracker</div>
        <nav className="nav">
          <button className={`nav-btn ${view === "sesi" ? "active" : ""}`} onClick={() => setView("sesi")}>Sesi</button>
          <button className={`nav-btn ${view === "pengaturan" ? "active" : ""}`} onClick={() => setView("pengaturan")}>Pengaturan</button>
        </nav>
        {view === "sesi" && (
          <button className="btn-primary" onClick={() => setShowAddSession(true)} disabled={students.length === 0}>
            + Tambah Sesi
          </button>
        )}
      </header>

      <main className="main">
        {view === "pengaturan" ? (
          <SettingsTab
            students={students}
            subjects={subjects}
            pricing={pricing}
            onStudentsChange={fetchStudents}
            onSubjectsChange={setSubjects}
            onPricingChange={setPricing}
          />
        ) : students.length === 0 ? (
          <div className="empty-state">
            <h2>Belum ada murid</h2>
            <p>Tambahkan murid di tab Pengaturan untuk mulai mencatat sesi.</p>
            <button className="btn-primary" onClick={() => setView("pengaturan")}>Buka Pengaturan</button>
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
                {selectionType === "mixed" && (
                  <span className="selection-warning">Pilih hanya sesi lunas atau belum lunas</span>
                )}
                {selectionType === "unpaid" && (
                  <button className="btn-pay" onClick={() => setShowPayment(true)}>
                    Tandai Lunas ({selected.size} sesi)
                  </button>
                )}
                {selectionType === "paid" && (
                  <button className="btn-unpay" onClick={handleMarkUnpaid}>
                    Batalkan Pembayaran ({selected.size} sesi)
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
                  onToggleAll={(ids) => setSelected(new Set(ids))}
                />
              )}
            </div>
          </>
        )}
      </main>

      {showAddSession && (
        <AddSessionModal
          students={students}
          subjects={subjects}
          pricing={pricing}
          onClose={() => setShowAddSession(false)}
          onAdded={() => activeStudentId && fetchSessions(activeStudentId)}
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
          display: flex; align-items: center; gap: 16px;
          position: sticky; top: 0; z-index: 10;
        }
        .brand { font-weight: 700; font-size: 18px; color: #6366f1; letter-spacing: -0.3px; margin-right: auto; }
        .nav { display: flex; gap: 2px; background: #f3f4f6; border-radius: 8px; padding: 3px; }
        .nav-btn {
          background: none; border: none; padding: 5px 14px; border-radius: 6px;
          font-size: 14px; cursor: pointer; color: #6b7280; font-weight: 500;
        }
        .nav-btn.active { background: white; color: #111827; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .btn-primary {
          background: #6366f1; color: white; border: none; padding: 8px 16px;
          border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; white-space: nowrap;
        }
        .btn-primary:hover:not(:disabled) { background: #4f46e5; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .main { max-width: 1100px; margin: 0 auto; padding: 24px; }
        .empty-state { text-align: center; padding: 80px 0; }
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
        .table-card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
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
        .btn-unpay {
          background: #f97316; color: white; border: none;
          padding: 7px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer;
        }
        .btn-unpay:hover { background: #ea580c; }
        .selection-warning {
          font-size: 13px; color: #dc2626; font-weight: 500;
          background: #fef2f2; border: 1px solid #fecaca;
          padding: 5px 12px; border-radius: 8px;
        }
        .loading { text-align: center; padding: 32px; color: #9ca3af; font-size: 14px; }
      `}</style>
    </div>
  );
}
