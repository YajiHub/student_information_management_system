import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { Course, AcademicTerm } from '../../types/academic.types';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api.types';

interface OfferingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: {
    course_id: number;
    academic_term_id: number;
    instructor_id: number;
    section: string;
    schedule: string;
    room: string;
    capacity: number;
  }) => Promise<void>;
  courses: Course[];
  terms: AcademicTerm[];
}

export const OfferingModal: React.FC<OfferingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  courses,
  terms,
}) => {
  const [courseId, setCourseId] = useState<number>(courses[0]?.id || 1);
  const [termId, setTermId] = useState<number>(terms.find((t) => t.is_active)?.id || terms[0]?.id || 1);
  const [instructorId, setInstructorId] = useState<number>(2); // Default instructor ID
  const [section, setSection] = useState('BSIT-3A');
  const [schedule, setSchedule] = useState('MWF 09:00 - 10:30 AM');
  const [room, setRoom] = useState('Lab 302');
  const [capacity, setCapacity] = useState<number>(30);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!courseId || !termId || !instructorId || !section || !schedule || !room || !capacity) {
      setErrorMsg('Please fill in all mandatory offering fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        course_id: Number(courseId),
        academic_term_id: Number(termId),
        instructor_id: Number(instructorId),
        section: section.trim(),
        schedule: schedule.trim(),
        room: room.trim(),
        capacity: Number(capacity),
      });
      onClose();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setErrorMsg(axiosError.response?.data?.message || 'Failed to create course section offering.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">Create Section Offering</h2>
            <p className="text-xs text-slate-400">Add a course offering with section capacity and schedule</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} id="offering-form" className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div role="alert" className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label htmlFor="course_id" className="block text-xs font-semibold text-slate-300 mb-1">
              Course <span className="text-rose-400">*</span>
            </label>
            <select
              id="course_id"
              value={courseId}
              onChange={(e) => setCourseId(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.course_code} - {c.course_title} ({c.units} units)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="academic_term_id" className="block text-xs font-semibold text-slate-300 mb-1">
                Academic Term <span className="text-rose-400">*</span>
              </label>
              <select
                id="academic_term_id"
                value={termId}
                onChange={(e) => setTermId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              >
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.academic_year} ({t.semester})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="section" className="block text-xs font-semibold text-slate-300 mb-1">
                Section Name <span className="text-rose-400">*</span>
              </label>
              <input
                id="section"
                type="text"
                required
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. BSIT-3A"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="schedule" className="block text-xs font-semibold text-slate-300 mb-1">
                Schedule <span className="text-rose-400">*</span>
              </label>
              <input
                id="schedule"
                type="text"
                required
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                placeholder="MWF 09:00 - 10:30 AM"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="room" className="block text-xs font-semibold text-slate-300 mb-1">
                Room / Venue <span className="text-rose-400">*</span>
              </label>
              <input
                id="room"
                type="text"
                required
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="CL-302"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="capacity" className="block text-xs font-semibold text-slate-300 mb-1">
                Maximum Capacity <span className="text-rose-400">*</span>
              </label>
              <input
                id="capacity"
                type="number"
                min={1}
                max={100}
                required
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="instructor_id" className="block text-xs font-semibold text-slate-300 mb-1">
                Faculty Instructor ID <span className="text-rose-400">*</span>
              </label>
              <input
                id="instructor_id"
                type="number"
                required
                value={instructorId}
                onChange={(e) => setInstructorId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              />
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-800 bg-slate-900/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="offering-form"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />}
            <span>Create Section Offering</span>
          </button>
        </div>
      </div>
    </div>
  );
};
