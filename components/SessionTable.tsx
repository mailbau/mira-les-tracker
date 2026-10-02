"use client";
import { useState } from "react";
import { Session } from "@/lib/types";
import { formatRupiah } from "@/lib/pricing";

interface Props {
  sessions: Session[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (ids: string[]) => void;
}

export default function SessionTable({ sessions, selected, onToggle, onToggleAll }: Props) {
  if (sessions.length === 0) {
    return (
      <div className="empty">
        <p>Belum ada sesi. Klik "Tambah Sesi" untuk mulai.</p>
        <style jsx>{`.empty { text-align: center; padding: 48px 0; color: #9ca3af; font-size: 14px; }`}</style>
      </div>
    );
  }

  // Group by month
  const groups: { label: string; key: string; sessions: Session[] }[] = [];
  const monthMap = new Map<string, Session[]>();
  for (const s of sessions) {
    const key = s.date.slice(0, 7); // YYYY-MM
    if (!monthMap.has(key)) monthMap.set(key, []);
    monthMap.get(key)!.push(s);
  }
  for (const [key, list] of monthMap) {
    const [year, month] = key.split("-");
    const label = new Date(Number(year), Number(month) - 1, 1)
      .toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    groups.push({ label, key, sessions: list });
  }

  const latestKey = groups[groups.length - 1]?.key ?? "";
  const [collapsed, setCollapsed] = useState<Set<string>>(() =>
    new Set(groups.slice(0, -1).map((g) => g.key))
  );

  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th className="col-check">
              <input
                type="checkbox"
                onChange={(e) => onToggleAll(e.target.checked ? sessions.map(s => s.id) : [])}
                checked={sessions.length > 0 && sessions.every(s => selected.has(s.id))}
              />
            </th>
            <th>No</th>
            <th>Tanggal</th>
            <th>Hari</th>
            <th>Mapel</th>
            <th>Waktu</th>
            <th>Weekend</th>
            <th>Extra Time</th>
            <th>HR Pokok</th>
            <th>HR Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => {
            const monthTotal = g.sessions.reduce((sum, s) => sum + s.total, 0);
            const allIds = g.sessions.map((s) => s.id);
            const unpaidIds = g.sessions.filter((s) => !s.isPaid).map((s) => s.id);
            const allUnpaidSelected = unpaidIds.length > 0 && unpaidIds.every((id) => selected.has(id));
            const isCollapsed = collapsed.has(g.key);

            return [
              <tr key={`header-${g.label}`} className="month-header" onClick={() => toggle(g.key)} style={{ cursor: "pointer" }}>
                <td colSpan={11}>
                  <span className="chevron">{isCollapsed ? "▶" : "▼"}</span>
                  {g.label}
                  {isCollapsed && <span className="collapsed-hint"> — {g.sessions.length} sesi, {formatRupiah(monthTotal)}</span>}
                </td>
              </tr>,
              ...(isCollapsed ? [] : g.sessions.map((s, i) => (
                <tr
                  key={s.id}
                  className={`session-row ${s.isPaid ? "paid" : ""} ${s.isWeekend ? "weekend" : ""} ${selected.has(s.id) ? "selected" : ""}`}
                  onClick={() => onToggle(s.id)}
                >
                  <td className="col-check" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={() => onToggle(s.id)}
                    />
                  </td>
                  <td>{i + 1}</td>
                  <td>{new Date(s.date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "numeric", year: "numeric" })}</td>
                  <td>{s.day}</td>
                  <td>{s.subject}</td>
                  <td>90 Menit</td>
                  <td>{s.isWeekend ? formatRupiah(s.baseRate - 77500) : "Rp0"}</td>
                  <td>{s.extraBlocks > 0 ? formatRupiah(s.extraCharge) : "Rp0"}</td>
                  <td>{formatRupiah(s.isWeekend ? 83500 : 77500)}</td>
                  <td className="total-cell">{formatRupiah(s.total)}</td>
                  <td>
                    <span className={`badge ${s.isPaid ? "badge-paid" : "badge-unpaid"}`}>
                      {s.isPaid ? "Lunas" : "Belum"}
                    </span>
                  </td>
                </tr>
              ))),
              ...(!isCollapsed ? [<tr key={`total-${g.label}`} className="month-total">
                <td colSpan={9} style={{ textAlign: "right" }}>Total {g.label}</td>
                <td className="total-cell">{formatRupiah(monthTotal)}</td>
                <td></td>
              </tr>] : []),
            ];
          })}
        </tbody>
      </table>

      <style jsx>{`
        .table-wrap { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 700px; }
        th {
          background: #f3f4f6; padding: 10px 12px; text-align: left;
          font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;
          white-space: nowrap;
        }
        td { padding: 9px 12px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
        .col-check { width: 36px; }
        .month-header td {
          background: #ede9fe; color: #5b21b6; font-weight: 600;
          padding: 8px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;
          user-select: none;
        }
        .month-header:hover td { background: #ddd6fe; }
        .chevron { margin-right: 6px; font-size: 10px; display: inline-block; width: 10px; }
        .collapsed-hint { font-weight: 400; opacity: 0.75; text-transform: none; letter-spacing: 0; font-size: 11px; margin-left: 4px; }
        .month-total td {
          background: #f5f3ff; font-weight: 600; border-top: 1px solid #ddd6fe;
          padding: 8px 12px;
        }
        .total-cell { font-weight: 500; }
        .session-row:hover { background: #f5f3ff; cursor: pointer; }
        .session-row.selected { background: #ede9fe !important; }
        .session-row.paid { color: #9ca3af; }
        .session-row.weekend td:nth-child(7) { color: #b45309; font-weight: 500; }
        .badge {
          display: inline-block; padding: 2px 8px; border-radius: 9999px;
          font-size: 11px; font-weight: 500;
        }
        .badge-paid { background: #dcfce7; color: #166534; }
        .badge-unpaid { background: #fee2e2; color: #991b1b; }
      `}</style>
    </div>
  );
}
