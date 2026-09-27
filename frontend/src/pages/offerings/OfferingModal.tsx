import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { Course, AcademicTerm, CourseOffering } from '../../types/academic.types';
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
  instructors?: { id: number; name: string; email: string }[];
  /** When provided the modal opens in edit mode, prefilled with this offering. */
  offering?: CourseOffering | null;
}

export const OfferingModal: React.FC<OfferingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  courses,
  terms,
  instructors,
  offering,
}) => {
  const isEdit = !!offering;
  const defaultInstId = instructors && instructors.length > 0 ? instructors[0].id : 3;
  const [courseId, setCourseId] = useState<number>(offering?.course_id ?? courses[0]?.id ?? 1);
  const [termId, setTermId] = useState<number>(
    offering?.academic_term_id ?? terms.find((t) => t.is_active)?.id ?? terms[0]?.id ?? 1,
  );
  const [instructorId, setInstructorId] = useState<number>(offering?.instructor_id ?? defaultInstId);
  const [section, setSection] = useState(offering?.section ?? '1A');
  const [schedule, setSchedule] = useState(offering?.schedule ?? 'MW 09:00 - 10:30 AM');
  const [room, setRoom] = useState(offering?.room ?? 'Lab 302');
  const [capacity, setCapacity] = useState<number>(offering?.capacity ?? 40);

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
      setErrorMsg(
        axiosError.response?.data?.message ||
          (isEdit ? 'Failed to update the course section offering.' : 'Failed to create course section offering.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">
              {isEdit ? 'Edit Section Offering' : 'Create Section Offering'}
            </h2>
            <p className="text-xs text-slate-400">
              {isEdit
                ? 'Update the section schedule, venue, instructor, or capacity limit'
                : 'Add a course offering with section capacity, schedule, and instructor'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
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
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 cursor-pointer"
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
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 cursor-pointer"
              >
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.academic_year} ({t.semester})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="instructor_id" className="block text-xs font-semibold text-slate-300 mb-1">
                Assigned Instructor <span className="text-rose-400">*</span>
              </label>
              <select
                id="instructor_id"
                value={instructorId}
                onChange={(e) => setInstructorId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 cursor-pointer"
              >
                {instructors && instructors.length > 0 ? (
                  instructors.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.email})
                    </option>
                  ))
                ) : (
                  <option value={3}>Prof. Juan Cruz (prof.cruz@sims.edu)</option>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
                placeholder="e.g. 1A"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="capacity" className="block text-xs font-semibold text-slate-300 mb-1">
                Maximum Capacity <span className="text-rose-400">*</span>
              </label>
              <input
                id="capacity"
                type="number"
                min="1"
                max="200"
                required
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
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
                placeholder="MW 09:00 - 10:30 AM"
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
                placeholder="Lab 302"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting
                ? (isEdit ? 'Saving...' : 'Creating...')
                : (isEdit ? 'Save Changes' : 'Create Section')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
