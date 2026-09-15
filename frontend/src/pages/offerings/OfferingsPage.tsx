import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Layers,
  Plus,
  Search,
  Users,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  UserCheck,
} from 'lucide-react';
import { enrollmentsApi } from '../../api/enrollments.api';
import { referenceApi } from '../../api/reference.api';
import { useAuth } from '../../hooks/useAuth';
import type { CourseOffering } from '../../types/academic.types';
import { OfferingModal } from './OfferingModal';
import { RosterModal } from './RosterModal';

export const OfferingsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const queryClient = useQueryClient();

  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [rosterOffering, setRosterOffering] = useState<CourseOffering | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reference queries
  const { data: termsData } = useQuery({
    queryKey: ['reference', 'terms'],
    queryFn: () => referenceApi.getTerms(),
  });
  const terms = termsData?.data || [];

  const { data: coursesData } = useQuery({
    queryKey: ['reference', 'courses'],
    queryFn: () => referenceApi.getCourses(),
  });
  const courses = coursesData?.data || [];

  // Active term default
  const activeTerm = terms.find((t) => t.is_active) || terms[0];
  const currentTermId = selectedTermId ? Number(selectedTermId) : activeTerm?.id;

  // Offerings query
  const { data: offeringsData, isLoading } = useQuery({
    queryKey: ['offerings', currentTermId],
    queryFn: () => enrollmentsApi.getOfferings({ academic_term_id: currentTermId }),
    enabled: !!currentTermId,
  });
  const rawOfferings: CourseOffering[] = offeringsData?.data || [];

  // Filter by search
  const offerings = rawOfferings.filter((o) => {
    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase();
    const code = o.course?.course_code?.toLowerCase() || '';
    const title = o.course?.course_title?.toLowerCase() || '';
    const sec = o.section.toLowerCase();
    return code.includes(query) || title.includes(query) || sec.includes(query);
  });

  // Create offering mutation
  const createOfferingMutation = useMutation({
    mutationFn: (payload: {
      course_id: number;
      academic_term_id: number;
      instructor_id: number;
      section: string;
      schedule: string;
      room: string;
      capacity: number;
    }) => enrollmentsApi.createOffering(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offerings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setFeedback({ type: 'success', text: 'Course section offering created successfully.' });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', text: err?.response?.data?.message || 'Failed to create course offering.' });
    },
  });

  const handleSaveOffering = async (payload: any) => {
    await createOfferingMutation.mutateAsync(payload);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Schedule &amp; Capacity
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Layers className="text-emerald-400" size={26} />
            Course Offerings &amp; Sections
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time section capacities, instructor assignments, and active schedules
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Section Offering</span>
          </button>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="status"
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
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

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by course code, title, or section..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar size={15} className="text-slate-400 shrink-0" />
          <select
            aria-label="Filter by Academic Term"
            value={selectedTermId || (activeTerm?.id ? String(activeTerm.id) : '')}
            onChange={(e) => setSelectedTermId(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
          >
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.academic_year} - {t.semester} {t.is_active ? '★ (Active)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Offerings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4 text-center">Units</th>
                <th className="py-3 px-4">Schedule &amp; Venue</th>
                <th className="py-3 px-4">Instructor</th>
                <th className="py-3 px-4 min-w-[160px]">Capacity &amp; Enrolled</th>
                <th className="py-3 px-4 text-right">Roster</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent" />
                      <span>Loading course offerings...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && offerings.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No course offerings found for this academic term.
                  </td>
                </tr>
              )}

              {!isLoading &&
                offerings.map((o) => {
                  const enrolled = o.enrolled_count ?? o._count?.enrollments ?? 0;
                  const capacity = o.capacity;
                  const pct = Math.min(100, Math.round((enrolled / capacity) * 100));
                  const isFull = enrolled >= capacity;
                  const isNearFull = !isFull && pct >= 70;

                  return (
                    <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        <span className="px-2 py-1 rounded-lg bg-slate-800 text-emerald-400 border border-slate-700">
                          {o.section}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200">
                          {o.course?.course_code || `Course #${o.course_id}`}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {o.course?.course_title}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-300">
                        {o.course?.units || 3}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Clock size={13} className="text-slate-500 shrink-0" />
                          <span>{o.schedule}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          <MapPin size={12} className="text-slate-600 shrink-0" />
                          <span>{o.room}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <UserCheck size={13} className="text-slate-500 shrink-0" />
                          <span>{o.instructor?.name || `Faculty #${o.instructor_id}`}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono text-slate-300">
                              {enrolled} / {capacity}
                            </span>
                            {isFull ? (
                              <span className="font-bold text-rose-400 uppercase text-[10px]">SECTION FULL</span>
                            ) : isNearFull ? (
                              <span className="font-semibold text-amber-400 text-[10px]">{pct}%</span>
                            ) : (
                              <span className="font-semibold text-emerald-400 text-[10px]">{pct}%</span>
                            )}
                          </div>
                          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isFull
                                  ? 'bg-rose-500'
                                  : isNearFull
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setRosterOffering(o)}
                          aria-label={`View Roster for ${o.section}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                        >
                          <Users size={13} />
                          <span>Roster</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Offering Create Modal */}
      <OfferingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveOffering}
        courses={courses}
        terms={terms}
      />

      {/* Roster View Modal */}
      <RosterModal offering={rosterOffering} onClose={() => setRosterOffering(null)} />
    </div>
  );
};

export default OfferingsPage;
