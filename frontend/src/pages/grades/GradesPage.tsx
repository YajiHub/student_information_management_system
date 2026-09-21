import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Save,
  Award,
  Search,
  Users,
  Filter,
  Layers,
  GraduationCap,
  TrendingUp,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { enrollmentsApi } from '../../api/enrollments.api';
import { gradesApi } from '../../api/grades.api';
import type { CourseOffering, Enrollment } from '../../types/academic.types';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api.types';

// Philippine standard discrete collegiate grading scale
export const VALID_GRADE_VALUES = [1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0, 5.0];
export const VALID_GRADE_OPTIONS = [
  { value: '1.00', label: '1.00 (Excellent)' },
  { value: '1.25', label: '1.25 (Superior)' },
  { value: '1.50', label: '1.50 (Very Good)' },
  { value: '1.75', label: '1.75 (Good)' },
  { value: '2.00', label: '2.00 (Satisfactory)' },
  { value: '2.25', label: '2.25 (Fair)' },
  { value: '2.50', label: '2.50 (Average)' },
  { value: '2.75', label: '2.75 (Below Average)' },
  { value: '3.00', label: '3.00 (Passing)' },
  { value: '5.00', label: '5.00 (Failed)' },
];

const STORAGE_KEY = 'sims_selected_grade_offering';

export const GradesPage: React.FC = () => {
  const { user } = useAuth();
  const isInstructor = user?.role === 'INSTRUCTOR';
  const queryClient = useQueryClient();

  // Restore saved section from sessionStorage so navigating back retains context
  const [selectedOfferingId, setSelectedOfferingId] = useState<string>(() => {
    return sessionStorage.getItem(STORAGE_KEY) || '';
  });

  const [sectionSearch, setSectionSearch] = useState('');
  const [onlyWithStudents, setOnlyWithStudents] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Row state for editable grades: enrollmentId -> { midterm, final }
  const [gradeInputs, setGradeInputs] = useState<
    Record<number, { midterm?: string; final?: string }>
  >({});

  // Fetch offerings
  const { data: offeringsData, isLoading: loadingOfferings } = useQuery({
    queryKey: ['offerings', 'for-grades', user?.id],
    queryFn: () =>
      enrollmentsApi.getOfferings({
        instructor_id: isInstructor && user ? user.id : undefined,
      }),
  });
  const offerings: CourseOffering[] = offeringsData?.data || [];

  // Active offering: match stored ID or fallback to first
  const activeOffering =
    offerings.find((o) => String(o.id) === String(selectedOfferingId)) ||
    offerings[0] ||
    null;

  // Keep sessionStorage in sync
  useEffect(() => {
    if (activeOffering && String(activeOffering.id) !== selectedOfferingId) {
      setSelectedOfferingId(String(activeOffering.id));
      sessionStorage.setItem(STORAGE_KEY, String(activeOffering.id));
    }
  }, [activeOffering, selectedOfferingId]);

  const handleSelectOffering = (id: string | number) => {
    const strId = String(id);
    setSelectedOfferingId(strId);
    sessionStorage.setItem(STORAGE_KEY, strId);
  };

  // Filtered offerings based on search bar & toggle
  const filteredOfferings = useMemo(() => {
    const q = sectionSearch.trim().toLowerCase();
    return offerings.filter((o) => {
      const studentCount = o._count?.enrollments ?? 0;
      if (onlyWithStudents && studentCount === 0) return false;
      if (!q) return true;

      const code = o.course?.course_code?.toLowerCase() || '';
      const title = o.course?.course_title?.toLowerCase() || '';
      const section = o.section?.toLowerCase() || '';
      const room = o.room?.toLowerCase() || '';
      const schedule = o.schedule?.toLowerCase() || '';

      return (
        code.includes(q) ||
        title.includes(q) ||
        section.includes(q) ||
        room.includes(q) ||
        schedule.includes(q)
      );
    });
  }, [offerings, sectionSearch, onlyWithStudents]);

  // Fetch enrollments for the active offering
  const { data: enrollmentsData, isLoading: loadingEnrollments } = useQuery({
    queryKey: ['enrollments', 'by-offering', activeOffering?.id],
    queryFn: () =>
      activeOffering ? enrollmentsApi.getEnrollments({ course_offering_id: activeOffering.id }) : null,
    enabled: !!activeOffering?.id,
  });
  const enrollments: Enrollment[] = enrollmentsData?.data || [];

  // Section summary statistics
  const gradedEnrollments = enrollments.filter(
    (e) => e.grade?.numerical_grade !== null && e.grade?.numerical_grade !== undefined
  );
  const classGwa =
    gradedEnrollments.length > 0
      ? (
          gradedEnrollments.reduce((sum, e) => sum + Number(e.grade!.numerical_grade), 0) /
          gradedEnrollments.length
        ).toFixed(2)
      : '—';
  const passedCount = enrollments.filter((e) => e.grade?.remarks === 'PASSED').length;
  const failedCount = enrollments.filter((e) => e.grade?.remarks === 'FAILED').length;
  const passingRate =
    gradedEnrollments.length > 0
      ? Math.round((passedCount / gradedEnrollments.length) * 100)
      : null;

  // Mutations
  const saveGradeMutation = useMutation({
    mutationFn: async ({
      enrollmentId,
      gradeId,
      midterm,
      finalGrade,
    }: {
      enrollmentId: number;
      gradeId?: number;
      midterm?: number;
      finalGrade?: number;
    }) => {
      if (gradeId) {
        return gradesApi.updateGrade(gradeId, {
          midterm_grade: midterm,
          final_grade: finalGrade,
        });
      } else {
        return gradesApi.encodeGrade({
          enrollment_id: enrollmentId,
          midterm_grade: midterm,
          final_grade: finalGrade,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', 'by-offering'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setFeedback({ type: 'success', text: 'Grade encoded and recorded successfully.' });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setFeedback({
        type: 'error',
        text: axiosError.response?.data?.message || 'Failed to encode grade.',
      });
    },
  });

  const handleInputChange = (
    enrollmentId: number,
    field: 'midterm' | 'final',
    value: string
  ) => {
    setGradeInputs((prev) => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        [field]: value,
      },
    }));
  };

  const handleSaveRow = (e: Enrollment) => {
    const input = gradeInputs[e.id];
    const midtermVal =
      input?.midterm !== undefined
        ? input.midterm === '' ? undefined : Number(input.midterm)
        : e.grade?.midterm_grade !== null && e.grade?.midterm_grade !== undefined
        ? Number(e.grade.midterm_grade)
        : undefined;

    const finalVal =
      input?.final !== undefined
        ? input.final === '' ? undefined : Number(input.final)
        : e.grade?.final_grade !== null && e.grade?.final_grade !== undefined
        ? Number(e.grade.final_grade)
        : undefined;

    // Strict validation on official discrete collegiate scale
    if (midtermVal !== undefined && !VALID_GRADE_VALUES.includes(midtermVal)) {
      setFeedback({
        type: 'error',
        text: 'Midterm grade must be a valid standard collegiate mark (1.00, 1.25, 1.50, 1.75, 2.00, 2.25, 2.50, 2.75, 3.00, or 5.00).',
      });
      return;
    }
    if (finalVal !== undefined && !VALID_GRADE_VALUES.includes(finalVal)) {
      setFeedback({
        type: 'error',
        text: 'Final grade must be a valid standard collegiate mark (1.00, 1.25, 1.50, 1.75, 2.00, 2.25, 2.50, 2.75, 3.00, or 5.00).',
      });
      return;
    }

    saveGradeMutation.mutate({
      enrollmentId: e.id,
      gradeId: e.grade?.id,
      midterm: midtermVal,
      finalGrade: finalVal,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Grading Portal
            </span>
            <span className="text-xs text-slate-500">&bull;</span>
            <span className="text-xs text-slate-400">Official Philippine Collegiate Scale</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Award className="text-emerald-400" size={26} />
            Grades Entry &amp; Encoding
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Encode midterm and final marks on official discrete scale (1.00 - 5.00 in 0.25 increments; failing mark 5.00)
          </p>
        </div>

        {/* Section Dropdown Selector (Synchronized with Quick Access Cards) */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 shrink-0">Assigned Section:</span>
          <select
            aria-label="Select Course Section"
            value={activeOffering?.id ? String(activeOffering.id) : ''}
            onChange={(e) => handleSelectOffering(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 font-semibold focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
          >
            {loadingOfferings ? (
              <option>Loading offerings...</option>
            ) : offerings.length === 0 ? (
              <option>No assigned offerings</option>
            ) : (
              offerings.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.section} &bull; {o.course?.course_code} - {o.course?.course_title} ({o._count?.enrollments ?? 0} students)
                </option>
              ))
            )}
          </select>
        </div>
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

      {/* Quick-Access Assigned Sections Panel */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Assigned Sections Quick-Access ({offerings.length})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search code, title, section, room..."
                value={sectionSearch}
                onChange={(e) => setSectionSearch(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {sectionSearch && (
                <button
                  onClick={() => setSectionSearch('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Filter Toggle: Only with enrolled students */}
            <button
              onClick={() => setOnlyWithStudents((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                onlyWithStudents
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Filter size={12} />
              <span>With Students Only</span>
            </button>
          </div>
        </div>

        {/* Section Cards Strip / Grid */}
        {loadingOfferings ? (
          <div className="py-4 text-center text-xs text-slate-500">Loading assigned sections...</div>
        ) : filteredOfferings.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
            No course sections match &ldquo;{sectionSearch}&rdquo;.
            {sectionSearch && (
              <button
                onClick={() => setSectionSearch('')}
                className="ml-2 text-emerald-400 hover:underline cursor-pointer"
              >
                Clear filter
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
            {filteredOfferings.map((o) => {
              const isSelected = activeOffering?.id === o.id;
              const count = o._count?.enrollments ?? 0;
              return (
                <button
                  key={o.id}
                  onClick={() => handleSelectOffering(o.id)}
                  type="button"
                  className={`p-3 rounded-xl text-left transition-all border cursor-pointer group ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/40'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300 group-hover:text-emerald-400'
                        }`}
                      >
                        {o.section}
                      </span>
                      <span className="font-mono font-bold text-xs text-white truncate">
                        {o.course?.course_code}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        count > 0
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-800/50 text-slate-500 border-slate-800'
                      }`}
                    >
                      {count} {count === 1 ? 'student' : 'students'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-300 font-medium truncate">
                    {o.course?.course_title}
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="truncate">{o.schedule || 'TBA'}</span>
                    <span className="shrink-0 ml-1 font-mono">{o.room || 'TBA'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Section Info Card & Class Statistics */}
      {activeOffering && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-emerald-400 font-mono font-bold text-xs border border-slate-700">
                  {activeOffering.section}
                </span>
                <span className="text-xs text-slate-500">&bull;</span>
                <span className="font-semibold text-white text-sm">
                  {activeOffering.course?.course_code} - {activeOffering.course?.course_title}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                <div className="flex items-center gap-1">
                  <Clock size={13} className="text-slate-500" />
                  <span>{activeOffering.schedule}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin size={13} className="text-slate-500" />
                  <span>{activeOffering.room}</span>
                </div>
                <div>
                  Units: <span className="font-mono text-slate-200">{activeOffering.course?.units || 3}</span>
                </div>
                <div>
                  Capacity: <span className="font-mono text-slate-200">{enrollments.length} / {activeOffering.capacity}</span>
                </div>
              </div>
            </div>

            {/* Quick Section Analytics */}
            <div className="flex items-center gap-3">
              <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Class GWA</span>
                <span className="text-base font-bold font-mono text-emerald-400">{classGwa}</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Graded</span>
                <span className="text-base font-bold font-mono text-white">
                  {gradedEnrollments.length}/{enrollments.length}
                </span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Passing Rate</span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  {passingRate !== null ? `${passingRate}%` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grades Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Student Number</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-center">Midterm (Scale 1.00 - 5.00)</th>
                <th className="py-3 px-4 text-center">Final (Scale 1.00 - 5.00)</th>
                <th className="py-3 px-4 text-center">Numerical Grade</th>
                <th className="py-3 px-4 text-center">Remarks</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loadingEnrollments && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    Loading student roster for grading...
                  </td>
                </tr>
              )}
              {!loadingEnrollments && enrollments.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    <div className="max-w-sm mx-auto text-center space-y-2">
                      <Users size={28} className="mx-auto text-slate-600" />
                      <div className="font-semibold text-slate-300">No enrolled students in this section</div>
                      <p className="text-[11px] text-slate-500">
                        Use the Quick-Access bar above to switch to another assigned section or check back once the Registrar has enrolled students.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {!loadingEnrollments &&
                enrollments.map((e) => {
                  const student = e.student;
                  const currentMidterm =
                    gradeInputs[e.id]?.midterm !== undefined
                      ? gradeInputs[e.id].midterm
                      : e.grade?.midterm_grade !== null && e.grade?.midterm_grade !== undefined
                      ? Number(e.grade.midterm_grade).toFixed(2)
                      : '';

                  const currentFinal =
                    gradeInputs[e.id]?.final !== undefined
                      ? gradeInputs[e.id].final
                      : e.grade?.final_grade !== null && e.grade?.final_grade !== undefined
                      ? Number(e.grade.final_grade).toFixed(2)
                      : '';

                  const numerical = e.grade?.numerical_grade;
                  const remarks = e.grade?.remarks;

                  return (
                    <tr key={e.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-200">
                        {student?.student_number || 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-medium text-white">
                        {student?.first_name} {student?.last_name}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            student?.student_type === 'IRREGULAR'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {student?.student_type || 'REGULAR'}
                        </span>
                      </td>

                      {/* Discrete Midterm Grade Select Picker */}
                      <td className="py-3 px-4 text-center">
                        <select
                          aria-label={`Midterm grade for ${student?.first_name} ${student?.last_name}`}
                          value={currentMidterm}
                          onChange={(ev) => handleInputChange(e.id, 'midterm', ev.target.value)}
                          className="w-28 px-2 py-1.5 text-center bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="">— Select —</option>
                          {VALID_GRADE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.value}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Discrete Final Grade Select Picker */}
                      <td className="py-3 px-4 text-center">
                        <select
                          aria-label={`Final grade for ${student?.first_name} ${student?.last_name}`}
                          value={currentFinal}
                          onChange={(ev) => handleInputChange(e.id, 'final', ev.target.value)}
                          className="w-28 px-2 py-1.5 text-center bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="">— Select —</option>
                          {VALID_GRADE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.value}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Computed Numerical Grade */}
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        {numerical !== null && numerical !== undefined ? (
                          <span className={Number(numerical) <= 3.0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {Number(numerical).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Remarks Badge */}
                      <td className="py-3 px-4 text-center">
                        {remarks === 'PASSED' ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            PASSED
                          </span>
                        ) : remarks === 'FAILED' ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            FAILED
                          </span>
                        ) : remarks === 'INCOMPLETE' ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            INCOMPLETE
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Save Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleSaveRow(e)}
                          disabled={saveGradeMutation.isPending}
                          aria-label={`Save grade for ${student?.first_name} ${student?.last_name}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Save size={13} />
                          <span>Save</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GradesPage;
