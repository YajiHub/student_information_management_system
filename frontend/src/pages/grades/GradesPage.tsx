import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Save,
  Award,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { enrollmentsApi } from '../../api/enrollments.api';
import { gradesApi } from '../../api/grades.api';
import type { CourseOffering, Enrollment } from '../../types/academic.types';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api.types';

export const GradesPage: React.FC = () => {
  const { user } = useAuth();
  const isInstructor = user?.role === 'INSTRUCTOR';
  const queryClient = useQueryClient();

  const [selectedOfferingId, setSelectedOfferingId] = useState<string>('');
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

  // Active offering
  const activeOffering =
    offerings.find((o) => o.id === Number(selectedOfferingId)) || offerings[0] || null;

  // Fetch enrollments for the active offering
  const { data: enrollmentsData, isLoading: loadingEnrollments } = useQuery({
    queryKey: ['enrollments', 'by-offering', activeOffering?.id],
    queryFn: () =>
      activeOffering ? enrollmentsApi.getEnrollments({ course_offering_id: activeOffering.id }) : null,
    enabled: !!activeOffering?.id,
  });
  const enrollments: Enrollment[] = enrollmentsData?.data || [];

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
        : e.grade?.midterm_grade ?? undefined;

    const finalVal =
      input?.final !== undefined
        ? input.final === '' ? undefined : Number(input.final)
        : e.grade?.final_grade ?? undefined;

    if (midtermVal !== undefined && (midtermVal < 1.0 || midtermVal > 5.0)) {
      setFeedback({ type: 'error', text: 'Midterm grade must be between 1.00 and 5.00.' });
      return;
    }
    if (finalVal !== undefined && (finalVal < 1.0 || finalVal > 5.0)) {
      setFeedback({ type: 'error', text: 'Final grade must be between 1.00 and 5.00.' });
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
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Award className="text-emerald-400" size={26} />
            Grades Entry &amp; Encoding
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Encode midterm and final marks on official 1.00 - 5.00 academic scale
          </p>
        </div>

        {/* Section Selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 shrink-0">Assigned Section:</span>
          <select
            aria-label="Select Course Section"
            value={activeOffering?.id ? String(activeOffering.id) : ''}
            onChange={(e) => setSelectedOfferingId(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 font-semibold focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
          >
            {loadingOfferings ? (
              <option>Loading offerings...</option>
            ) : offerings.length === 0 ? (
              <option>No assigned offerings</option>
            ) : (
              offerings.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.section} &bull; {o.course?.course_code} - {o.course?.course_title}
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

      {/* Active Section Info Card */}
      {activeOffering && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
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
            </div>
          </div>

          <div className="text-right text-xs">
            <span className="text-slate-400">Class Size:</span>
            <div className="font-mono text-base font-bold text-white">
              {enrollments.length} / {activeOffering.capacity} Students
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
                <th className="py-3 px-4 text-center">Midterm (1.0 - 5.0)</th>
                <th className="py-3 px-4 text-center">Final (1.0 - 5.0)</th>
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
                    No enrolled students in this section.
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
                      ? String(e.grade.midterm_grade)
                      : '';

                  const currentFinal =
                    gradeInputs[e.id]?.final !== undefined
                      ? gradeInputs[e.id].final
                      : e.grade?.final_grade !== null && e.grade?.final_grade !== undefined
                      ? String(e.grade.final_grade)
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

                      {/* Midterm Grade Input */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          step="0.25"
                          min="1.00"
                          max="5.00"
                          aria-label={`Midterm grade for ${student?.first_name} ${student?.last_name}`}
                          placeholder="—"
                          value={currentMidterm}
                          onChange={(ev) => handleInputChange(e.id, 'midterm', ev.target.value)}
                          className="w-20 px-2 py-1 text-center bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                        />
                      </td>

                      {/* Final Grade Input */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          step="0.25"
                          min="1.00"
                          max="5.00"
                          aria-label={`Final grade for ${student?.first_name} ${student?.last_name}`}
                          placeholder="—"
                          value={currentFinal}
                          onChange={(ev) => handleInputChange(e.id, 'final', ev.target.value)}
                          className="w-20 px-2 py-1 text-center bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                        />
                      </td>

                      {/* Computed Numerical Grade */}
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        {numerical !== null && numerical !== undefined ? (
                          <span className={numerical <= 3.0 ? 'text-emerald-400' : 'text-rose-400'}>
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
