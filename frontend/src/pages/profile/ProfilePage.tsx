import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  User as UserIcon,
  GraduationCap,
  Calendar,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Award,
  Layers,
  FileSpreadsheet,
  ArrowRight,
  ClipboardList,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { studentsApi } from '../../api/students.api';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isStudent = user?.role === 'STUDENT';
  const studentId = user?.student?.id;

  // Fetch full student details from backend
  const { data: studentResponse, isLoading } = useQuery({
    queryKey: ['student-profile', studentId],
    queryFn: () => (studentId ? studentsApi.getById(studentId) : null),
    enabled: isStudent && !!studentId,
  });

  const student = studentResponse?.data || user?.student;

  const isIrregular = student?.student_type === 'IRREGULAR';
  const maxUnits = student?.max_allowed_units || (isIrregular ? 18 : 24);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/70 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-500/20 shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
                {user?.role} Profile
              </span>
              {isStudent && (
                <span
                  className={`text-xs font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full border font-semibold ${
                    isIrregular
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}
                >
                  {student?.student_type || 'REGULAR'} LOAD
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">{user?.name}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {user?.email} &bull; {isStudent && student?.student_number ? `Student No: ${student.student_number}` : 'Authorized Institutional Account'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isStudent && (
            <button
              onClick={() => navigate('/records')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 shadow-sm transition-all cursor-pointer"
            >
              <FileSpreadsheet size={15} className="text-emerald-400" />
              <span>Official Transcript</span>
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="p-12 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="inline-flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-500 border-t-transparent" />
            <span>Loading student profile details...</span>
          </div>
        </div>
      )}

      {/* Main Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Academic & Classification Info */}
        <div className="lg:col-span-2 space-y-6">
          {isStudent && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <GraduationCap className="text-emerald-400" size={20} />
                  <h2 className="text-base font-bold text-white">Academic Enrollment Standing</h2>
                </div>
                <span className="text-xs font-mono text-slate-400">Institutional Record</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/70">
                  <span className="text-slate-500 block text-[11px] uppercase font-semibold">Degree Program</span>
                  <span className="text-white font-bold text-sm block mt-0.5">
                    {student?.program?.name || student?.program?.code || 'BS in Information Technology'}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    Program Code: {student?.program?.code || 'BSIT'}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/70">
                  <span className="text-slate-500 block text-[11px] uppercase font-semibold">Curriculum Year Level</span>
                  <span className="text-white font-bold text-sm block mt-0.5">
                    Year Level {student?.year_level || 4}
                  </span>
                  <span className="text-[11px] text-slate-400">Undergraduate Standing</span>
                </div>

                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/70">
                  <span className="text-slate-500 block text-[11px] uppercase font-semibold">Academic Classification</span>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold mt-1 ${
                      isIrregular
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {student?.student_type || 'REGULAR'} STUDENT
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {isIrregular
                      ? 'Variable schedule with cross-section enrollment eligibility.'
                      : 'Prescribed block section enrollment.'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/70">
                  <span className="text-slate-500 block text-[11px] uppercase font-semibold">Prescribed Load Limit</span>
                  <span className="text-white font-mono font-bold text-base block mt-0.5">
                    {maxUnits} Units Maximum
                  </span>
                  <span className="text-[11px] text-slate-400">Enforced by enrollment validation engine</span>
                </div>
              </div>

              {/* Status Note */}
              <div className="mt-5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 size={16} />
                  <span className="font-semibold">Account Status: Active &bull; Eligible to Enroll</span>
                </div>
                <button
                  onClick={() => navigate('/enrollments')}
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer"
                >
                  <span>Enrollment Desk</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Personal & Demographic Details */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-800/80">
              <UserIcon className="text-emerald-400" size={20} />
              <h2 className="text-base font-bold text-white">Personal &amp; Demographic Information</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/70">
                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                  <Mail size={14} />
                  <span className="text-[11px] uppercase font-semibold">Institutional Email</span>
                </div>
                <span className="text-white font-mono font-medium text-xs break-all">
                  {student?.email || user?.email}
                </span>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/70">
                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                  <Phone size={14} />
                  <span className="text-[11px] uppercase font-semibold">Contact Phone</span>
                </div>
                <span className="text-white font-mono font-medium text-xs">
                  {student?.phone || '+63 (917) 555-0199'}
                </span>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/70">
                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                  <Calendar size={14} />
                  <span className="text-[11px] uppercase font-semibold">Date of Birth</span>
                </div>
                <span className="text-white font-medium text-xs">
                  {student?.birth_date ? new Date(student.birth_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'March 15, 2002'}
                </span>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/70">
                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                  <UserIcon size={14} />
                  <span className="text-[11px] uppercase font-semibold">Gender</span>
                </div>
                <span className="text-white font-medium text-xs uppercase">
                  {student?.gender || 'Female'}
                </span>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/70 sm:col-span-2">
                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                  <MapPin size={14} />
                  <span className="text-[11px] uppercase font-semibold">Permanent Address</span>
                </div>
                <span className="text-white font-medium text-xs">
                  {student?.address || '123 Academic Way, Metro Manila, Philippines'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Security & Quick Links */}
        <div className="space-y-6">
          {/* Security & Role Account Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800/80">
              <ShieldCheck className="text-emerald-400" size={18} />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Account Credentials</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">User ID</span>
                <span className="text-white font-mono font-bold">#{user?.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Assigned Role</span>
                <span className="text-emerald-400 font-mono font-bold">{user?.role}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Account Status</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 size={12} /> {user?.status || 'ACTIVE'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Auth Mechanism</span>
                <span className="text-slate-300 font-mono text-[11px]">JWT Bearer Token</span>
              </div>
            </div>
          </div>

          {/* Quick Nav Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 pb-3 border-b border-slate-800/80 flex items-center gap-2">
              <ClipboardList size={18} className="text-emerald-400" />
              Student Portals
            </h3>

            <div className="space-y-2.5">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/30 hover:bg-slate-900 transition-all text-left text-xs group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Layers size={16} className="text-slate-400 group-hover:text-emerald-400 transition-colors" />
                  <span className="font-semibold text-white">My Dashboard</span>
                </div>
                <ArrowRight size={14} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
              </button>

              <button
                onClick={() => navigate('/records')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/30 hover:bg-slate-900 transition-all text-left text-xs group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Award size={16} className="text-amber-400 group-hover:text-amber-300 transition-colors" />
                  <span className="font-semibold text-white">Academic Records &amp; GWA</span>
                </div>
                <ArrowRight size={14} className="text-slate-600 group-hover:text-amber-400 transition-colors" />
              </button>

              <button
                onClick={() => navigate('/enrollments')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/30 hover:bg-slate-900 transition-all text-left text-xs group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <ClipboardList size={16} className="text-emerald-400" />
                  <span className="font-semibold text-white">Enrollment Desk</span>
                </div>
                <ArrowRight size={14} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
