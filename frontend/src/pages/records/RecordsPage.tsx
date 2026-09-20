import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileSpreadsheet,
  Printer,
  GraduationCap,
  Award,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { studentsApi } from '../../api/students.api';
import { StudentSelectCombobox } from '../../components/common/StudentSelectCombobox';
import type { Student } from '../../types/student.types';
import type { AcademicRecord } from '../../types/academic.types';

export const RecordsPage: React.FC = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';

  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Fetch all students if Admin / Registrar / Instructor
  const { data: studentsResponse, isLoading: loadingStudents } = useQuery({
    queryKey: ['students', 'for-records'],
    queryFn: () => studentsApi.getAll({ per_page: 100 }),
    enabled: !isStudent,
  });
  const allStudents: Student[] = studentsResponse?.data || [];

  // Active student ID: authoritative from user profile if Student, or selected for staff
  const activeStudentId = useMemo<number | null>(() => {
    if (isStudent) {
      return user?.student?.id || null;
    }
    if (selectedStudentId) {
      return Number(selectedStudentId);
    }
    return allStudents[0]?.id || null;
  }, [isStudent, user, selectedStudentId, allStudents]);

  // Fetch official academic record
  const { data: recordResponse, isLoading, isError } = useQuery({
    queryKey: ['academic-record', activeStudentId],
    queryFn: () => (activeStudentId ? studentsApi.getAcademicRecord(activeStudentId) : null),
    enabled: !!activeStudentId,
  });

  const record: AcademicRecord | null = recordResponse?.data || null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in print:p-0 print:m-0">
      {/* Header (hidden in print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Registrar Records
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileSpreadsheet className="text-emerald-400" size={26} />
            Official Academic Record &amp; Transcript
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Term-by-term enrolled courses, grade points, and cumulative General Weighted Average (GWA)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isStudent && (
            <StudentSelectCombobox
              students={allStudents}
              selectedId={selectedStudentId || (activeStudentId ? String(activeStudentId) : undefined)}
              onSelect={(id) => setSelectedStudentId(String(id))}
              loading={loadingStudents}
              placeholder="Search student by ID, name..."
              ariaLabel="Select Student for Transcript"
            />
          )}

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 shadow-sm transition-all cursor-pointer"
          >
            <Printer size={15} />
            <span>Print Transcript</span>
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="p-12 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="inline-flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-500 border-t-transparent" />
            <span>Generating official academic transcript from database...</span>
          </div>
        </div>
      )}

      {isError && (
        <div className="p-8 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-xs">
          Unable to retrieve academic record for the requested student. Please verify student enrollment.
        </div>
      )}

      {!isLoading && !isError && record && (
        <div className="space-y-6 print:space-y-4 print:text-black">
          {/* Official Document Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm print:bg-white print:border-slate-300 print:text-black">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 print:border-slate-300">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md print:bg-none print:text-black">
                  <GraduationCap size={32} />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-white print:text-black">
                    Apex Institute of Technology
                  </h2>
                  <p className="text-xs uppercase tracking-wider text-emerald-400 font-semibold print:text-slate-700">
                    Office of the University Registrar &bull; Official Transcript of Records
                  </p>
                  <p className="text-[11px] text-slate-500 print:text-slate-600">
                    Accredited Higher Education Institution &bull; Grading Scale: 1.00 (Highest) to 5.00 (Failed)
                  </p>
                </div>
              </div>

              {/* Cumulative GPA Badge */}
              <div className="text-right bg-slate-950/70 p-4 rounded-xl border border-slate-800 print:bg-slate-100 print:border-slate-300">
                <div className="flex items-center justify-end gap-1 text-slate-400 text-xs">
                  <Award size={14} className="text-amber-400" />
                  <span className="font-semibold uppercase tracking-wider">Cumulative GPA</span>
                </div>
                <div className="text-3xl font-extrabold text-emerald-400 font-mono print:text-black mt-1">
                  {record.summary?.cumulative_gpa !== null && record.summary?.cumulative_gpa !== undefined
                    ? Number(record.summary.cumulative_gpa).toFixed(2)
                    : 'N/A'}
                </div>
                <div className="text-[10px] text-slate-500">Official Weighted Standing</div>
              </div>
            </div>

            {/* Student Metadata Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs">
              <div>
                <span className="text-slate-500 block uppercase text-[10px] font-semibold">Student Name</span>
                <span className="font-bold text-white print:text-black text-sm">{record.student.full_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase text-[10px] font-semibold">Student Number</span>
                <span className="font-mono font-bold text-slate-200 print:text-black">{record.student.student_number}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase text-[10px] font-semibold">Degree Program</span>
                <span className="font-semibold text-slate-200 print:text-black">
                  {record.student.program} &bull; Year {record.student.year_level}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase text-[10px] font-semibold">Classification</span>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    record.student.student_type === 'IRREGULAR'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {record.student.student_type} LOAD
                </span>
              </div>
            </div>
          </div>

          {/* Academic Terms Breakdown */}
          {record.terms.length === 0 ? (
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-500 text-xs">
              No completed academic terms or recorded grades found for this student.
            </div>
          ) : (
            record.terms.map((term, termIdx) => (
              <div
                key={term.academic_term?.id || term.academic_term_id || termIdx}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm print:border-slate-300 print:bg-white"
              >
                {/* Term Header */}
                <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 print:bg-slate-100 print:border-slate-300">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-emerald-400" />
                    <span className="font-bold text-white text-sm print:text-black">
                      {term.academic_term?.academic_year || term.academic_year || 'AY 2026-2027'} &bull;{' '}
                      {term.academic_term?.semester || term.semester || 'FIRST_SEMESTER'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-slate-400">
                      Total Units: <strong className="text-slate-200 font-mono">{term.total_units ?? term.term_units ?? 0}</strong>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 font-mono font-bold border border-emerald-500/30 print:text-black print:border-slate-400">
                      Term GWA: {term.term_gwa ? Number(term.term_gwa).toFixed(2) : '—'}
                    </span>
                  </div>
                </div>

                {/* Term Courses Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase tracking-wider font-semibold print:border-slate-300 print:text-slate-700">
                        <th className="py-2.5 px-4">Course Code</th>
                        <th className="py-2.5 px-4">Course Title</th>
                        <th className="py-2.5 px-4 text-center">Units</th>
                        <th className="py-2.5 px-4">Section</th>
                        <th className="py-2.5 px-4 text-center">Midterm</th>
                        <th className="py-2.5 px-4 text-center">Final Grade</th>
                        <th className="py-2.5 px-4 text-center">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300 print:divide-slate-300 print:text-black">
                      {term.courses.map((c, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40 print:hover:bg-transparent">
                          <td className="py-3 px-4 font-mono font-bold text-white print:text-black">
                            {c.course_code}
                          </td>
                          <td className="py-3 px-4 font-medium">{c.course_title}</td>
                          <td className="py-3 px-4 text-center font-mono font-semibold">{c.units}</td>
                          <td className="py-3 px-4 font-mono text-slate-400">{c.section}</td>
                          <td className="py-3 px-4 text-center font-mono">
                            {c.midterm_grade ? Number(c.midterm_grade).toFixed(2) : '—'}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold">
                            {c.final_grade ? (
                              <span className={Number(c.final_grade) <= 3.0 ? 'text-emerald-400' : 'text-rose-400'}>
                                {Number(c.final_grade).toFixed(2)}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {c.remarks === 'PASSED' ? (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                PASSED
                              </span>
                            ) : c.remarks === 'FAILED' ? (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                FAILED
                              </span>
                            ) : (
                              <span className="text-slate-500">{c.remarks || 'IN PROGRESS'}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}

          {/* Transcript Footer */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4 print:border-slate-300 print:bg-white print:text-black">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-400" />
              <span>
                Total Credited Units: <strong className="text-white font-mono">{record.summary?.total_credited_units ?? record.summary?.total_units_passed ?? 0}</strong> &bull;{' '}
                Total Enrolled Courses: <strong className="text-slate-200 font-mono">{record.summary?.total_enrolled_courses ?? record.terms.reduce((acc, t) => acc + t.courses.length, 0)}</strong>
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Official SIMS Electronic Record &bull; Generated {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordsPage;
