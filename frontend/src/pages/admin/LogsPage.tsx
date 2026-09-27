import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollText, Search, CheckCircle2, XCircle, X, ShieldAlert } from 'lucide-react';
import { auditApi } from '../../api/audit.api';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  UPDATE: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  DELETE: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  LOGIN: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  LOGOUT: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export const LogsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [resource, setResource] = useState('');
  const [outcome, setOutcome] = useState('');
  const [page, setPage] = useState(1);

  const queryParams = React.useMemo(
    () => ({
      search: search || undefined,
      resource: resource || undefined,
      success: (outcome || undefined) as '' | 'true' | 'false' | undefined,
      page,
      per_page: 15,
    }),
    [search, resource, outcome, page],
  );

  const { data: logsResponse, isLoading } = useQuery({
    queryKey: ['audit-logs', queryParams],
    queryFn: () => auditApi.getLogs(queryParams),
  });
  const logs = logsResponse?.data || [];
  const meta = logsResponse?.meta;

  const hasFilters = search || resource || outcome;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            System Administration
          </span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <ScrollText size={22} className="text-emerald-400" />
          System Activity Logs
        </h1>
        <p className="text-xs text-slate-400">
          Immutable audit trail of every create, update, delete, and authentication attempt.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            aria-label="Search audit logs"
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by actor email, path, or action..."
            className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
          />
        </div>
        <select
          aria-label="Filter by Resource"
          value={resource}
          onChange={(e) => {
            setResource(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 cursor-pointer"
        >
          <option value="">All Resources</option>
          <option value="programs">Programs</option>
          <option value="courses">Courses</option>
          <option value="academic-terms">Academic Terms</option>
          <option value="students">Students</option>
          <option value="course-offerings">Course Offerings</option>
          <option value="enrollments">Enrollments</option>
          <option value="grades">Grades</option>
          <option value="users">Users</option>
          <option value="auth">Authentication</option>
        </select>
        <select
          aria-label="Filter by Outcome"
          value={outcome}
          onChange={(e) => {
            setOutcome(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 cursor-pointer"
        >
          <option value="">All Outcomes</option>
          <option value="true">Success only</option>
          <option value="false">Failures only</option>
        </select>
        {hasFilters && (
          <button
            onClick={() => {
              setSearch('');
              setResource('');
              setOutcome('');
              setPage(1);
            }}
            aria-label="Clear filters"
            className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 cursor-pointer"
          >
            <X size={13} />
            Clear
          </button>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Resource & Endpoint</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              )}
              {!isLoading && logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No activity logs recorded matching criteria.
                  </td>
                </tr>
              )}
              {!isLoading &&
                logs.map((log) => {
                  const actionBadgeClass =
                    ACTION_COLORS[log.action] || 'bg-slate-800 text-slate-300 border-slate-700';

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-white">
                          {log.actor_email || 'System / Anonymous'}
                        </div>
                        {log.actor_role && (
                          <span className="inline-block text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 mt-0.5">
                            {log.actor_role}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${actionBadgeClass}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="font-bold text-slate-300">{log.method}</span>
                          <span className="text-slate-400">{log.path}</span>
                        </div>
                        {log.resource && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Target: {log.resource} {log.resource_id ? `#${log.resource_id}` : ''}
                          </div>
                        )}
                        {log.error_message && (
                          <div className="text-[10px] text-rose-400 mt-0.5 truncate max-w-xs flex items-center gap-1">
                            <ShieldAlert size={10} />
                            {log.error_message}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.success
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {log.success ? (
                            <CheckCircle2 size={11} />
                          ) : (
                            <XCircle size={11} />
                          )}
                          HTTP {log.status_code}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {log.duration_ms} ms
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {meta && (
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing Page <span className="font-semibold text-white">{meta.page}</span> of{' '}
            <span className="font-semibold text-white">{meta.total_pages || 1}</span> (
            {meta.total_records} total events)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!meta.has_prev}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!meta.has_next}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogsPage;
