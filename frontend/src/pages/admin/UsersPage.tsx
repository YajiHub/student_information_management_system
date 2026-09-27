import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Search, Pencil, Trash2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { usersApi } from '../../api/users.api';
import type { ManagedUser } from '../../types/admin.types';
import type { Role } from '../../types/auth.types';
import { useAuth } from '../../hooks/useAuth';
import { UserModal } from './UserModal';

export const UsersPage: React.FC = () => {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const queryParams = React.useMemo(
    () => ({
      search: search || undefined,
      role: (roleFilter || undefined) as Role | undefined,
      status: (statusFilter || undefined) as 'ACTIVE' | 'INACTIVE' | undefined,
      page,
      per_page: 10,
    }),
    [search, roleFilter, statusFilter, page],
  );

  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ['users', queryParams],
    queryFn: () => usersApi.getAll(queryParams),
  });
  const users = usersResponse?.data || [];
  const meta = usersResponse?.meta;

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, any>) => usersApi.create(payload as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showFeedback('success', 'User account created successfully.');
    },
    onError: (err: any) =>
      showFeedback('error', err?.response?.data?.message || 'Failed to create user account.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, any> }) =>
      usersApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showFeedback('success', 'User account updated successfully.');
    },
    onError: (err: any) =>
      showFeedback('error', err?.response?.data?.message || 'Failed to update user account.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showFeedback('success', 'User account deleted successfully.');
    },
    onError: (err: any) =>
      showFeedback('error', err?.response?.data?.message || 'Failed to delete user account.'),
  });

  const handleSave = async (payload: Record<string, any>) => {
    if (editingUser) {
      await updateMutation.mutateAsync({ id: editingUser.id, payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  const handleDelete = (u: ManagedUser) => {
    if (
      window.confirm(
        `Delete the account of ${u.name} (${u.email})? Deactivation is safer for accounts with history.`,
      )
    ) {
      deleteMutation.mutate(u.id);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              System Administration
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Users size={22} className="text-emerald-400" />
            User Accounts
          </h1>
          <p className="text-xs text-slate-400">
            Provision system accounts, assign roles, and deactivate access.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-md transition-all cursor-pointer"
        >
          <Plus size={15} />
          <span>Create Account</span>
        </button>
      </div>

      {feedback && (
        <div
          role="status"
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            aria-label="Search user accounts"
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
          />
        </div>
        <select
          aria-label="Filter by Role"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 cursor-pointer"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="REGISTRAR">Registrar</option>
          <option value="INSTRUCTOR">Instructor</option>
          <option value="STUDENT">Student</option>
        </select>
        <select
          aria-label="Filter by Account Status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        {(search || roleFilter || statusFilter) && (
          <button
            onClick={resetFilters}
            aria-label="Clear filters"
            className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 cursor-pointer"
          >
            <X size={13} />
            Clear
          </button>
        )}
      </div>

      {/* Accounts Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Linked Student</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Loading user accounts...
                  </td>
                </tr>
              )}
              {!isLoading && users.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No user accounts match the current filters.
                  </td>
                </tr>
              )}
              {!isLoading &&
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{u.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                          u.status === 'ACTIVE' ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-slate-600'
                          }`}
                        />
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {u.student
                        ? `${u.student.student_number} - ${u.student.first_name} ${u.student.last_name}`
                        : 'None'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setIsModalOpen(true);
                          }}
                          title="Edit account"
                          aria-label={`Edit ${u.name}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                        >
                          <Pencil size={14} />
                        </button>
                        {u.id !== currentUserId && (
                          <button
                            onClick={() => handleDelete(u)}
                            title="Delete account"
                            aria-label={`Delete ${u.name}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
            {meta.total_records} total accounts)
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

      <UserModal
        key={editingUser?.id ?? 'new'}
        isOpen={isModalOpen}
        user={editingUser}
        currentUserId={currentUserId}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSave}
      />
    </div>
  );
};

export default UsersPage;
