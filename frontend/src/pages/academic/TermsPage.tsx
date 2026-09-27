import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Pencil,
  Trash2,
} from 'lucide-react';
import { referenceApi } from '../../api/reference.api';
import type { AcademicTerm, Semester } from '../../types/academic.types';
import { useAuth } from '../../hooks/useAuth';

export const TermsPage: React.FC = () => {
  const { user } = useAuth();
  // Both Admin and Registrar manage academic terms according to the laboratory specification
  const canManageTerms = user?.role === 'ADMIN' || user?.role === 'REGISTRAR';
  // Backend DELETE /academic-terms/:id is restricted to ADMIN
  const isAdmin = user?.role === 'ADMIN';
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<AcademicTerm | null>(null);
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [semester, setSemester] = useState<Semester>('FIRST_SEMESTER');
  const [startDate, setStartDate] = useState('2026-08-15');
  const [endDate, setEndDate] = useState('2026-12-18');
  const [isActive, setIsActive] = useState(true);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTerm(null);
    setAcademicYear('2026-2027');
    setSemester('FIRST_SEMESTER');
    setStartDate('2026-08-15');
    setEndDate('2026-12-18');
    setIsActive(true);
  };

  const openEdit = (t: AcademicTerm) => {
    setEditingTerm(t);
    setAcademicYear(t.academic_year);
    setSemester(t.semester as Semester);
    setStartDate(t.start_date ? t.start_date.split('T')[0] : '');
    setEndDate(t.end_date ? t.end_date.split('T')[0] : '');
    setIsActive(t.status === 'ACTIVE');
    setIsModalOpen(true);
  };

  const { data: termsData, isLoading } = useQuery({
    queryKey: ['reference', 'terms'],
    queryFn: () => referenceApi.getTerms(),
  });
  const terms: AcademicTerm[] = termsData?.data || [];

  const createTermMutation = useMutation({
    mutationFn: (payload: {
      academic_year: string;
      semester: string;
      start_date: string;
      end_date: string;
      status: 'ACTIVE' | 'INACTIVE';
    }) => referenceApi.createTerm(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference', 'terms'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      closeModal();
      showFeedback('success', 'Academic term registered successfully.');
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        (Array.isArray(err?.response?.data?.errors)
          ? err.response.data.errors.join(', ')
          : 'Failed to create academic term.');
      showFeedback('error', msg);
    },
  });

  const updateTermMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) =>
      referenceApi.updateTerm(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference', 'terms'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      closeModal();
      showFeedback('success', 'Academic term updated successfully.');
    },
    onError: (err: any) => {
      showFeedback('error', err?.response?.data?.message || 'Failed to update term.');
    },
  });

  const deleteTermMutation = useMutation({
    mutationFn: (id: number) => referenceApi.deleteTerm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference', 'terms'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showFeedback('success', 'Academic term deleted.');
    },
    onError: (err: any) => {
      showFeedback('error', err?.response?.data?.message || 'Failed to delete term. It may have active offerings.');
    },
  });

  const toggleTermStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'ACTIVE' | 'INACTIVE' }) =>
      referenceApi.updateTerm(id, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reference', 'terms'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setFeedback({
        type: 'success',
        text: `Term status updated to ${variables.status === 'ACTIVE' ? 'ACTIVE' : 'CLOSED'}.`,
      });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      setFeedback({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to update term status.',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate Academic Year pattern YYYY-YYYY
    const ayPattern = /^\d{4}-\d{4}$/;
    if (!ayPattern.test(academicYear.trim())) {
      setFeedback({
        type: 'error',
        text: 'Academic year must be in format YYYY-YYYY (e.g. 2026-2027).',
      });
      return;
    }

    // Validate Start Date is before End Date
    if (new Date(startDate) >= new Date(endDate)) {
      setFeedback({
        type: 'error',
        text: 'Term start date must be strictly before end date.',
      });
      return;
    }

    const payload = {
      academic_year: academicYear.trim(),
      semester,
      start_date: new Date(`${startDate}T00:00:00.000Z`).toISOString(),
      end_date: new Date(`${endDate}T23:59:59.000Z`).toISOString(),
      status: (isActive ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE',
    };

    if (editingTerm) {
      updateTermMutation.mutate({ id: editingTerm.id, payload });
    } else {
      createTermMutation.mutate(payload);
    }
  };

  const handleDelete = (t: AcademicTerm) => {
    if (window.confirm(`Delete term "${t.academic_year} ${t.semester}"? This cannot be undone.`)) {
      deleteTermMutation.mutate(t.id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Session Management
            </span>
            <span className="text-xs text-slate-500">&bull;</span>
            <span className="text-xs text-slate-400">Institutional Calendar</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Calendar className="text-emerald-400" size={26} />
            Academic Terms &amp; Semesters
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure institutional academic calendars, enrollment periods, and active operational terms
          </p>
        </div>

        {canManageTerms && (
          <button
            onClick={() => { setEditingTerm(null); setAcademicYear('2026-2027'); setSemester('FIRST_SEMESTER'); setStartDate('2026-08-15'); setEndDate('2026-12-18'); setIsActive(true); setIsModalOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Academic Term</span>
          </button>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="status"
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Terms Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold">
              <th className="py-3.5 px-4">Academic Year</th>
              <th className="py-3.5 px-4">Semester</th>
              <th className="py-3.5 px-4">Term Window</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              {canManageTerms && <th className="py-3.5 px-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {isLoading && (
              <tr>
                <td colSpan={canManageTerms ? 5 : 4} className="py-10 text-center text-slate-500">
                  Loading academic terms...
                </td>
              </tr>
            )}
            {!isLoading && terms.length === 0 && (
              <tr>
                <td colSpan={canManageTerms ? 5 : 4} className="py-10 text-center text-slate-500">
                  No academic terms configured in database.
                </td>
              </tr>
            )}
            {!isLoading &&
              terms.map((t) => {
                // Term is active if status is ACTIVE or is_active is true
                const isTermActive = t.status === 'ACTIVE' || (t as any).is_active === true;
                const startDateStr = t.start_date ? t.start_date.split('T')[0] : 'TBA';
                const endDateStr = t.end_date ? t.end_date.split('T')[0] : 'TBA';

                return (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">{t.academic_year}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200">{t.semester}</td>
                    <td className="py-3.5 px-4 text-slate-400">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <Clock size={13} className="text-slate-500" />
                        <span>{startDateStr}</span>
                        <span>&rarr;</span>
                        <span>{endDateStr}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isTermActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          ACTIVE TERM
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium text-slate-500 bg-slate-800/60 border border-slate-800">
                          Closed / Inactive
                        </span>
                      )}
                    </td>
                    {canManageTerms && (
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              toggleTermStatusMutation.mutate({
                                id: t.id,
                                status: isTermActive ? 'INACTIVE' : 'ACTIVE',
                              })
                            }
                            disabled={toggleTermStatusMutation.isPending}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer disabled:opacity-50 ${
                              isTermActive
                                ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                                : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                          >
                            {isTermActive ? (
                              <>
                                <ToggleLeft size={14} />
                                <span>Deactivate</span>
                              </>
                            ) : (
                              <>
                                <ToggleRight size={14} />
                                <span>Set Active</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => openEdit(t)}
                            title="Edit term"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                          >
                            <Pencil size={14} />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(t)}
                              title="Delete term"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Create Term Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles size={16} className="text-emerald-400" />
                {editingTerm ? 'Edit Academic Term' : 'Create Academic Term'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="academic_year" className="block text-xs font-semibold text-slate-300 mb-1">
                  Academic Year (e.g. 2026-2027)
                </label>
                <input
                  id="academic_year"
                  type="text"
                  required
                  placeholder="YYYY-YYYY"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                />
              </div>
              <div>
                <label htmlFor="semester" className="block text-xs font-semibold text-slate-300 mb-1">
                  Semester
                </label>
                <select
                  id="semester"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value as Semester)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 cursor-pointer"
                >
                  <option value="FIRST_SEMESTER">FIRST_SEMESTER</option>
                  <option value="SECOND_SEMESTER">SECOND_SEMESTER</option>
                  <option value="SUMMER">SUMMER</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="start_date" className="block text-xs font-semibold text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    id="start_date"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label htmlFor="end_date" className="block text-xs font-semibold text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    id="end_date"
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/40 bg-slate-950 cursor-pointer"
                />
                <label htmlFor="is_active" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Set as Active Operational Term
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTermMutation.isPending || updateTermMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 cursor-pointer disabled:opacity-50"
                >
                  {(createTermMutation.isPending || updateTermMutation.isPending)
                    ? 'Saving...'
                    : (editingTerm ? 'Save Changes' : 'Register Term')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TermsPage;
