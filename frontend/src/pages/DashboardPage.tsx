import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  Award,
  Sparkles,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { studentsApi } from '../api/students.api';
import { referenceApi } from '../api/reference.api';
import { enrollmentsApi } from '../api/enrollments.api';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'STUDENT';

  // Fetch summary data for Admin / Registrar
  const canViewMetrics = role === 'ADMIN' || role === 'REGISTRAR';

  const { data: studentsData, isLoading: loadingStudents } = useQuery({
    queryKey: ['dashboard', 'students-count'],
    queryFn: () => studentsApi.getAll({ per_page: 1 }),
    enabled: canViewMetrics,
  });

  const { data: irregularData } = useQuery({
    queryKey: ['dashboard', 'irregular-count'],
    queryFn: () => studentsApi.getAll({ student_type: 'IRREGULAR', per_page: 1 }),
    enabled: canViewMetrics,
  });

  const { data: termsData, isLoading: loadingTerms } = useQuery({
    queryKey: ['dashboard', 'terms'],
    queryFn: () => referenceApi.getTerms(),
  });

  const { data: offeringsData, isLoading: loadingOfferings } = useQuery({
    queryKey: ['dashboard', 'offerings'],
    queryFn: () => enrollmentsApi.getOfferings(),
  });

  // Student-specific real academic record query
  const studentProfile = user?.student;
  const studentId = studentProfile?.id;

  const { data: recordData } = useQuery({
    queryKey: ['dashboard', 'student-record', studentId],
    queryFn: () => (studentId ? studentsApi.getAcademicRecord(studentId) : null),
    enabled: role === 'STUDENT' && !!studentId,
  });
  const studentRecord = recordData?.data;

  const activeTerm = termsData?.data?.find((t) => t.is_active) || termsData?.data?.[0];
  const totalStudents = studentsData?.meta?.total_records ?? 0;
  const irregularCount = irregularData?.meta?.total_records ?? 0;
  const regularCount = Math.max(0, totalStudents - irregularCount);
  const totalOfferings = offeringsData?.data?.length ?? 0;

  // Student metrics
  const studentType = studentProfile?.student_type || 'REGULAR';
  const isIrregular = studentType === 'IRREGULAR';
  const maxAllowedUnits = studentProfile?.max_allowed_units || (isIrregular ? 18 : 24);
  const latestTerm = studentRecord?.terms?.[studentRecord.terms.length - 1];
  const currentEnrolledUnits = latestTerm?.total_units || latestTerm?.term_units || 0;
  const loadPercentage = Math.min(100, Math.round((currentEnrolledUnits / maxAllowedUnits) * 100));
  const studentGpa = studentRecord?.summary?.cumulative_gpa != null
    ? Number(studentRecord.summary.cumulative_gpa).toFixed(2)
    : '—';
  const totalCredited = studentRecord?.summary?.total_credited_units ?? 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {role} Portal
            </span>
            <span className="text-xs text-slate-500">&bull;</span>
            <span className="text-xs text-slate-400">Activity III: Client Framework</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Welcome back, {user?.name || 'User'}!
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Student Information Management System &bull; Live REST API connected to NestJS 11 backend
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-500 block">Active Academic Term</span>
            <span className="font-semibold text-slate-200">
              {activeTerm ? `${activeTerm.academic_year} (${activeTerm.semester})` : 'Loading term...'}
            </span>
          </div>
        </div>
      </div>

      {/* Admin / Registrar / Instructor Metric Cards */}
      {(role === 'ADMIN' || role === 'REGISTRAR' || role === 'INSTRUCTOR') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Students */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Enrolled
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Users size={20} />
              </div>
            </div>
            <div className="text-3xl font-bold text-white tracking-tight">
              {loadingStudents ? '...' : totalStudents}
            </div>
            <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
              <span className="text-emerald-400 font-medium">{regularCount} Regular</span>
              <span>&bull;</span>
              <span className="text-amber-400 font-medium">{irregularCount} Irregular</span>
            </div>
          </div>

          {/* Card 2: Active Offerings */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Course Sections
              </span>
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                <Layers size={20} />
              </div>
            </div>
            <div className="text-3xl font-bold text-white tracking-tight">
              {loadingOfferings ? '...' : totalOfferings}
            </div>
            <div className="mt-2 text-xs text-slate-400">
              Active offerings across terms
            </div>
          </div>

          {/* Card 3: Academic Term */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Current Term
              </span>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <Calendar size={20} />
              </div>
            </div>
            <div className="text-xl font-bold text-white truncate">
              {loadingTerms ? '...' : activeTerm?.semester || 'Term Active'}
            </div>
            <div className="mt-2 text-xs text-slate-400 truncate">
              {activeTerm?.academic_year || 'AY 2026-2027'}
            </div>
          </div>

          {/* Card 4: System Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                API Status
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
            </div>
            <div className="text-xl font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 size={20} />
              <span>Healthy</span>
            </div>
            <div className="mt-2 text-xs text-slate-400 font-mono truncate">
              v1.0 &bull; JWT Bearer Active
            </div>
          </div>
        </div>
      )}

      {/* Student Specific Metric Cards */}
      {role === 'STUDENT' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Student Card 1: Cumulative GWA */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Cumulative GWA
                </span>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Award size={20} />
                </div>
              </div>
              <div className="text-3xl font-bold text-white tracking-tight font-mono">
                {studentGpa}
              </div>
              <div className="mt-2 text-xs text-emerald-400 font-medium">
                Official General Weighted Average
              </div>
            </div>

            {/* Student Card 2: Enrolled Load */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Current Term Load
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Layers size={20} />
                </div>
              </div>
              <div className="text-3xl font-bold text-white tracking-tight font-mono">
                {currentEnrolledUnits} / {maxAllowedUnits} <span className="text-sm font-normal text-slate-400">units</span>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                {loadPercentage}% of maximum prescribed capacity
              </div>
            </div>

            {/* Student Card 3: Credited Units */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Completed Units
                </span>
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                  <BookOpen size={20} />
                </div>
              </div>
              <div className="text-3xl font-bold text-white tracking-tight font-mono">
                {totalCredited} <span className="text-sm font-normal text-slate-400">units</span>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Credited towards graduation
              </div>
            </div>

            {/* Student Card 4: Academic Standing */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Classification
                </span>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                  <GraduationCap size={20} />
                </div>
              </div>
              <div className="text-lg font-bold text-white truncate">
                {studentProfile?.program?.code || 'BSIT'} &bull; Year {studentProfile?.year_level || 4}
              </div>
              <div className="mt-2 text-xs">
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isIrregular
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {studentType} LOAD
                </span>
              </div>
            </div>
          </div>

          {/* Student Specific Card: Irregular Load Limit & Standing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Academic Load &amp; Enrollment Standing</h3>
                  <p className="text-xs text-slate-400">
                    Unit capacity governed by student classification ({studentProfile?.student_number || 'Enrolled Student'})
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    isIrregular
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}
                >
                  {studentType} LOAD (Max {maxAllowedUnits} Units)
                </span>
              </div>

              {/* Load Gauge */}
              <div className="space-y-3 mt-6">
                <div className="flex justify-between text-xs text-slate-300">
                  <span className="font-semibold">Current Enrolled Load</span>
                  <span className={`font-mono font-bold ${isIrregular ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {currentEnrolledUnits} / {maxAllowedUnits} units ({loadPercentage}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isIrregular
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    }`}
                    style={{ width: `${loadPercentage}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  {isIrregular
                    ? `* Irregular student enrollment standing: strict institutional cap at ${maxAllowedUnits} units. System rejects enrollment requests exceeding prescribed maximum.`
                    : `* Regular student enrollment standing: standard prescribed load capped at ${maxAllowedUnits} units.`}
                </p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <Award size={18} className="text-amber-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Academic Performance</span>
                </div>
                <div className="text-3xl font-extrabold text-white mt-1 font-mono">{studentGpa}</div>
                <div className="text-xs text-emerald-400 font-medium mt-1">General Weighted Average (GWA)</div>
                <p className="text-xs text-slate-500 mt-2">
                  Calculated across completed enrolled courses using official formula: &sum;(Grade &times; Units) / &sum;Units.
                </p>
              </div>

              <button
                onClick={() => navigate('/records')}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 cursor-pointer transition-colors"
              >
                <FileSpreadsheet size={14} />
                <span>View Full Transcript</span>
              </button>
            </div>
          </div>

          {/* Current Semester Enrolled Classes Schedule */}
          {latestTerm && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-emerald-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Current Semester Schedule ({latestTerm.academic_term?.academic_year || latestTerm.academic_year || 'AY 2026-2027'} &bull; {latestTerm.academic_term?.semester || latestTerm.semester})
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  {latestTerm.courses?.length || 0} Registered Sections
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Course</th>
                      <th className="py-3 px-4">Section</th>
                      <th className="py-3 px-4 text-center">Units</th>
                      <th className="py-3 px-4 text-center">Midterm</th>
                      <th className="py-3 px-4 text-center">Final</th>
                      <th className="py-3 px-4 text-center">Status / Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {latestTerm.courses?.map((c, i) => (
                      <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-white">{c.course_code}</div>
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">{c.course_title}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">{c.section}</td>
                        <td className="py-3 px-4 text-center font-mono font-semibold text-white">{c.units}</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-300">
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
                            <span className="text-slate-400 font-mono text-[11px]">{c.remarks || 'ENROLLED'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Quick Action Cards */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
          <Sparkles size={16} className="text-emerald-400" />
          Quick Actions &amp; Workflows
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(role === 'ADMIN' || role === 'REGISTRAR') && (
            <>
              <button
                onClick={() => navigate('/students')}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-900 transition-all text-left group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                    Manage Students
                  </div>
                  <div className="text-[11px] text-slate-500">Add, filter, or update students</div>
                </div>
                <ArrowRight size={16} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
              </button>

              <button
                onClick={() => navigate('/offerings')}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-900 transition-all text-left group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                    Course Offerings
                  </div>
                  <div className="text-[11px] text-slate-500">Configure sections &amp; capacity</div>
                </div>
                <ArrowRight size={16} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
              </button>
            </>
          )}

          <button
            onClick={() => navigate('/enrollments')}
            className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-900 transition-all text-left group cursor-pointer"
          >
            <div>
              <div className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                Enrollment Console
              </div>
              <div className="text-[11px] text-slate-500">Enroll student with load validation</div>
            </div>
            <ArrowRight size={16} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
          </button>

          {(role === 'ADMIN' || role === 'REGISTRAR' || role === 'INSTRUCTOR') && (
            <button
              onClick={() => navigate('/grades')}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-900 transition-all text-left group cursor-pointer"
            >
              <div>
                <div className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  Grades Entry
                </div>
                <div className="text-[11px] text-slate-500">Encode midterm &amp; final marks</div>
              </div>
              <ArrowRight size={16} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
            </button>
          )}

          <button
            onClick={() => navigate('/records')}
            className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-900 transition-all text-left group cursor-pointer"
          >
            <div>
              <div className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                Academic Transcript
              </div>
              <div className="text-[11px] text-slate-500">Review cumulative GWA &amp; history</div>
            </div>
            <ArrowRight size={16} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};
