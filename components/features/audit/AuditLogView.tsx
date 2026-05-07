'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { formatThaiDateTime } from '@/lib/utils';

interface AuditEntry {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  changes: Record<string, unknown> | null;
  timestamp: string;
  user: { id: string; name: string; username: string };
}

interface AuditResponse {
  logs: AuditEntry[];
  total: number;
  page: number;
  pages: number;
}

const ACTION_COLOR: Record<string, string> = {
  CREATE: 'text-emerald-600 dark:text-emerald-400',
  UPDATE: 'text-blue-600 dark:text-blue-400',
  DELETE: 'text-red-600 dark:text-red-400',
  DEACTIVATE: 'text-orange-500 dark:text-orange-400',
  VOID: 'text-red-500 dark:text-red-400',
  IMPORT: 'text-purple-600 dark:text-purple-400',
  DAILY: 'text-teal-600 dark:text-teal-400',
  CHANGE: 'text-yellow-600 dark:text-yellow-400',
  RECORD: 'text-indigo-600 dark:text-indigo-400',
  LOGIN: 'text-slate-500 dark:text-slate-400',
};

function actionColor(action: string): string {
  const prefix = action.split('_')[0];
  return ACTION_COLOR[prefix] ?? 'text-slate-600 dark:text-slate-300';
}

export function AuditLogView() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [draftSearch, setDraftSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set('q', search);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await fetch(`/api/audit-logs?${params}`);
      const json = await res.json();
      if (res.ok) setData(json);
    } finally {
      setLoading(false);
    }
  }, [search, from, to, page]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = () => {
    setSearch(draftSearch);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">ประวัติการใช้งาน</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {data ? `${data.total.toLocaleString()} รายการ` : 'กำลังโหลด…'}
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-1 min-w-48 gap-2">
            <input
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="ค้นหา action, entity…"
              className="flex-1 px-3 py-2 border rounded-lg text-sm dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button variant="outline" onClick={handleSearch} className="px-3">
              <Icons.Search className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>จาก</span>
            <input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPage(1); }}
              className="px-2 py-2 border rounded-lg text-sm dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span>ถึง</span>
            <input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setPage(1); }}
              className="px-2 py-2 border rounded-lg text-sm dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {(search || from || to) && (
            <Button
              variant="outline"
              className="text-sm"
              onClick={() => { setSearch(''); setDraftSearch(''); setFrom(''); setTo(''); setPage(1); }}
            >
              ล้างตัวกรอง
            </Button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-850">
              <tr className="text-left text-slate-600 dark:text-slate-300">
                <th className="px-4 py-3 font-semibold">เวลา</th>
                <th className="px-4 py-3 font-semibold">ผู้ใช้</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Entity</th>
                <th className="px-4 py-3 font-semibold">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    <Icons.Loader className="w-5 h-5 mx-auto" />
                  </td>
                </tr>
              )}
              {!loading && (!data || data.logs.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    ไม่พบรายการ
                  </td>
                </tr>
              )}
              {data?.logs.map((log) => (
                <>
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer"
                    onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  >
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                      {formatThaiDateTime(log.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 dark:text-white">{log.user.name}</p>
                      <p className="text-xs text-slate-400">{log.user.username}</p>
                    </td>
                    <td className={`px-4 py-3 font-mono font-semibold whitespace-nowrap ${actionColor(log.action)}`}>
                      {log.action}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {log.entityType ? (
                        <span>
                          {log.entityType}
                          {log.entityId && (
                            <span className="ml-1 text-xs font-mono text-slate-400">
                              #{log.entityId.slice(0, 8)}
                            </span>
                          )}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {log.changes ? (
                        <Icons.ChevronRight
                          className={`w-4 h-4 inline transition-transform ${expanded === log.id ? 'rotate-90' : ''}`}
                        />
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                  {expanded === log.id && log.changes && (
                    <tr key={`${log.id}-detail`}>
                      <td colSpan={5} className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50">
                        <pre className="text-xs font-mono text-slate-600 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-32">
                          {JSON.stringify(log.changes, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              หน้า {data.page} / {data.pages} ({data.total.toLocaleString()} รายการ)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="px-3 py-1.5 text-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <Icons.ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                className="px-3 py-1.5 text-sm"
                disabled={page >= data.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                <Icons.ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
