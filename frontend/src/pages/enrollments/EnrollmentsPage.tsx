import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList,
  Search,
  PlusCircle,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { studentsApi } from '../../api/students.api';
import { enrollmentsApi } from '../../api/enrollments.api';
import { referenceApi } from '../../api/reference.api';
import type { Student } from '../../types/student.types';
import type { CourseOffering, Enrollment } from '../../types/academic.types';
import { LoadGauge } from './LoadGauge';
import { StudentSelectCombobox } from '../../components/common/StudentSelectCombobox';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api.types';

export const EnrollmentsPage: React.FC = () => {
  const { user } = useAuth();
  const canManageAll = user?.role === 'ADMIN' || user?.role === 'REGISTRAR';
  const queryClient = useQueryClient();

  // State
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [offeringSearch, setOfferingSearch] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reference Queries
  const { data: termsData } = useQuery({
    queryKey: ['reference', 'terms'],
    queryFn: () => referenceApi.getTerms(),
  });
  const terms = termsData?.data || [];
  const activeTerm = terms.find((t) => t.is_active) || terms[0];
  const currentTermId = selectedTermId ? Number(selectedTermId) : activeTerm?.id;

  // Students Query (for Admin / Registrar selection)
  const { data: studentsResponse, isLoading: loadingStudents } = useQuery({
    queryKey: ['students', 'all-for-enrollment'],
    queryFn: () => studentsApi.getAll({ per_page: 100 }),
    enabled: canManageAll,
  });
  const allStudents: Student[] = studentsResponse?.data || [];

  // Determine active student: authoritative from user.student if Student, or selected student for Admin/Registrar
  const activeStudent = useMemo<Student | null>(() => {
    if (!canManageAll && user?.student) {
      return user.student as Student;
    }
    if (selectedStudentId) {
      return allStudents.find((s) => s.id === Number(selectedStudentId)) || null;
    }
    return allStudents[0] || (user?.student as Student) || null;
  }, [canManageAll, user, selectedStudentId, allStudents]);

  // Fetch student's enrollments
  const { data: enrollmentsData, isLoading: loadingEnrollments } = useQuery({
    queryKey: ['enrollments', 'student', activeStudent?.id],
    queryFn: () => (activeStudent ? enrollmentsApi.getEnrollments({ student_id: activeStudent.id }) : null),
    enabled: !!activeStudent?.id,
  });
  const enrollments: Enrollment[] = enrollmentsData?.data || [];

  // Active (non-dropped) enrollments
  const activeEnrollments = useMemo(() => {
    return enrollments.filter((e) => e.status === 'ENROLLED');
  }, [enrollments]);

  // Calculate currently enrolled units
  const currentUnits = useMemo(() => {
    return activeEnrollments.reduce((sum, e) => {
      const units = e.courseOffering?.course?.units || 3;
      return sum + units;
    }, 0);
  }, [activeEnrollments]);

  // Fetch available offerings for selected term
  const { data: offeringsData, isLoading: loadingOfferings } = useQuery({
    queryKey: ['offerings', currentTermId],
    queryFn: () => enrollmentsApi.getOfferings({ academic_term_id: currentTermId }),
    enabled: !!currentTermId,
  });
  const offerings: CourseOffering[] = offeringsData?.data || [];

  // Filter offerings
  const filteredOfferings = useMemo(() => {
    return offerings.filter((o) => {
      if (!offeringSearch.trim()) return true;
      const q = offeringSearch.toLowerCase();
      const code = o.course?.course_code?.toLowerCase() || '';
      const title = o.course?.course_title?.toLowerCase() || '';
      const section = o.section.toLowerCase();
      return code.includes(q) || title.includes(q) || section.includes(q);
    });
  }, [offerings, offeringSearch]);

  // Mutations
  const enrollMutation = useMutation({
    mutationFn: (offeringId: number) => {
      if (!activeStudent) throw new Error('No student selected');
      return enrollmentsApi.enroll({
        student_id: activeStudent.id,
        course_offering_id: offeringId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['offerings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setFeedback({ type: 'success', text: 'Enrolled into course section successfully.' });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const msg = axiosError.response?.data?.message || 'Failed to enroll in section.';
      setFeedback({ type: 'error', text: msg });
    },
  });

  const dropMutation = useMutation({
    mutationFn: (enrollmentId: number) => enrollmentsApi.drop(enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['offerings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setFeedback({ type: 'success', text: 'Course dropped successfully.' });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setFeedback({ type: 'error', text: axiosError.response?.data?.message || 'Failed to drop course.' });
    },
  });

  const handleEnroll = (offering: CourseOffering) => {
    enrollMutation.mutate(offering.id);
  };

  const handleDrop = (enrollment: Enrollment) => {
    const courseName = enrollment.courseOffering?.course?.course_code || 'this course';
    if (window.confirm(`Are you sure you want to drop ${courseName}?`)) {
      dropMutation.mutate(enrollment.id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Registration Desk
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ClipboardList className="text-emerald-400" size={26} />
            Enrollment Console
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Section registration, real-time irregular unit limit enforcement, and add/drop management
          </p>
        </div>

        {/* Admin / Registrar Student Selector */}
        {canManageAll && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 shrink-0">Selected Student:</span>
            <StudentSelectCombobox
              students={allStudents}
              selectedId={activeStudent?.id}
              onSelect={(id) => setSelectedStudentId(String(id))}
              loading={loadingStudents}
              placeholder="Search student by ID, name..."
              ariaLabel="Select Enrolling Student"
            />
          </div>
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

      {/* Student Profile & Load Gauge */}
      {activeStudent && <LoadGauge student={activeStudent} currentUnits={currentUnits} />}

      {/* Enrolled Courses Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Currently Enrolled Courses ({activeEnrollments.length})
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            Total Enrolled: {currentUnits} Units
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4 text-center">Units</th>
                <th className="py-3 px-4">Schedule &amp; Room</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loadingEnrollments && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading enrolled course records...
                  </td>
                </tr>
              )}
              {!loadingEnrollments && activeEnrollments.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No active enrollments found for this student. Use the offerings catalog below to enroll.
                  </td>
                </tr>
              )}
              {!loadingEnrollments &&
                activeEnrollments.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-emerald-400">
                        {e.courseOffering?.course?.course_code || 'COURSE'}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">
                        {e.courseOffering?.course?.course_title}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-200">
                      {e.courseOffering?.section}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-white">
                      {e.courseOffering?.course?.units || 3}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>{e.courseOffering?.schedule}</div>
                      <div className="text-[11px] text-slate-500">{e.courseOffering?.room}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {e.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDrop(e)}
                        disabled={dropMutation.isPending}
                        title="Drop Course"
                        aria-label={`Drop course ${e.courseOffering?.course?.course_code}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-400 hover:text-white hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-xs transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                        <span>Drop</span>
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Available Offerings Catalog */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Available Sections for Registration
            </h2>
            <p className="text-xs text-slate-400">
              Enroll student into open sections. Exceeding max units ({activeStudent?.max_allowed_units || 23} max) is rejected.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-400 shrink-0" />
            <select
              aria-label="Academic Term Selector"
              value={selectedTermId || (activeTerm?.id ? String(activeTerm.id) : '')}
              onChange={(e) => setSelectedTermId(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
            >
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.academic_year} ({t.semester})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search size={15} />
          </div>
          <input
            type="text"
            value={offeringSearch}
            onChange={(e) => setOfferingSearch(e.target.value)}
            placeholder="Filter offerings by course code or section..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
          />
        </div>

        {/* Offerings Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">Course</th>
                <th className="py-2.5 px-3">Section</th>
                <th className="py-2.5 px-3 text-center">Units</th>
                <th className="py-2.5 px-3">Schedule &amp; Room</th>
                <th className="py-2.5 px-3">Capacity</th>
                <th className="py-2.5 px-3 text-right">Enroll Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loadingOfferings && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading course offerings...
                  </td>
                </tr>
              )}
              {!loadingOfferings && filteredOfferings.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No offerings found for registration.
                  </td>
                </tr>
              )}
              {!loadingOfferings &&
                filteredOfferings.map((o) => {
                  const enrolled = o.enrolled_count ?? o._count?.enrollments ?? 0;
                  const capacity = o.capacity;
                  const isFull = enrolled >= capacity;
                  const offeringUnits = o.course?.units || 3;

                  // Check if student is already enrolled in this offering or course
                  const isAlreadyEnrolled = activeEnrollments.some(
                    (e) => e.course_offering_id === o.id || e.courseOffering?.course_id === o.course_id
                  );

                  // Check unit limit overload
                  const maxAllowed = activeStudent?.max_allowed_units || 23;
                  const wouldExceedLimit = currentUnits + offeringUnits > maxAllowed;

                  return (
                    <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-white">
                          {o.course?.course_code}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {o.course?.course_title}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-emerald-400 font-semibold">{o.section}</td>
                      <td className="py-3 px-3 text-center font-mono font-semibold">{offeringUnits}</td>
                      <td className="py-3 px-3 text-slate-300">
                        <div>{o.schedule}</div>
                        <div className="text-[11px] text-slate-500">{o.room}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-slate-300">
                          {enrolled} / {capacity}
                        </span>
                        {isFull && (
                          <span className="ml-2 text-[10px] font-bold text-rose-400 uppercase">FULL</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {isAlreadyEnrolled ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800 text-slate-400 text-[11px] font-medium border border-slate-700 cursor-not-allowed">
                            <CheckCircle2 size={12} className="text-emerald-400" />
                            <span>Enrolled</span>
                          </span>
                        ) : isFull ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-lg bg-rose-500/10 text-rose-400 text-[11px] font-semibold border border-rose-500/20 cursor-not-allowed">
                            Section Full
                          </span>
                        ) : wouldExceedLimit ? (
                          <span
                            title={`Adding ${offeringUnits} units exceeds maximum allowed ${maxAllowed} units for this student.`}
                            className="inline-flex items-center px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-[11px] font-semibold border border-amber-500/20 cursor-not-allowed"
                          >
                            Exceeds Limit
                          </span>
                        ) : (
                          <button
                            onClick={() => handleEnroll(o)}
                            disabled={enrollMutation.isPending}
                            aria-label={`Enroll in section ${o.section}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                          >
                            <PlusCircle size={13} />
                            <span>Enroll</span>
                          </button>
                        )}
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

export default EnrollmentsPage;
