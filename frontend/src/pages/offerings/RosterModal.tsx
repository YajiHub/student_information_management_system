import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Users } from 'lucide-react';
import { enrollmentsApi } from '../../api/enrollments.api';
import type { CourseOffering } from '../../types/academic.types';

interface RosterModalProps {
  offering: CourseOffering | null;
  onClose: () => void;
}

export const RosterModal: React.FC<RosterModalProps> = ({ offering, onClose }) => {
  const isOpen = !!offering;

  const { data: studentsResponse, isLoading } = useQuery({
    queryKey: ['offerings', offering?.id, 'students'],
    queryFn: () => (offering ? enrollmentsApi.getOfferingStudents(offering.id) : null),
    enabled: isOpen && !!offering?.id,
  });

  const students = studentsResponse?.data || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl animate-fade-in flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users size={18} className="text-emerald-400" />
              <span>Section Roster: {offering?.section}</span>
            </h2>
            <p className="text-xs text-slate-400">
              {offering?.course?.course_code} - {offering?.course?.course_title} &bull; Room: {offering?.room}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="inline-flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent" />
                <span>Loading enrolled student roster...</span>
              </div>
            </div>
          ) : students.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <p>No students enrolled in this section yet.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Student Number</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-200">{s.student_number}</td>
                    <td className="py-2.5 px-3 font-medium text-white">
                      {s.first_name} {s.last_name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{s.email}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          s.student_type === 'IRREGULAR'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {s.student_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[11px] text-emerald-400 font-medium">{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
          <span>
            Total Enrolled: <strong className="text-white">{students.length}</strong> /{' '}
            <span className="font-mono">{offering?.capacity}</span> seats
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
