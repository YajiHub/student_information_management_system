import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  GraduationCap,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Pencil,
  Trash2,
} from 'lucide-react';
import { referenceApi } from '../../api/reference.api';
import type { Program, Course } from '../../types/academic.types';
import { useAuth } from '../../hooks/useAuth';

export const CoursesPage: React.FC = () => {
  const { user } = useAuth();
  const canManageCatalog = user?.role === 'ADMIN' || user?.role === 'REGISTRAR';
  // Backend DELETE endpoints for programs and courses are restricted to ADMIN
  const isAdmin = user?.role === 'ADMIN';
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'PROGRAMS' | 'COURSES'>('COURSES');
  const [courseSearch, setCourseSearch] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);

  // Edit tracking — null means "create mode"
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Program Form state
  const [progCode, setProgCode] = useState('');
  const [progName, setProgName] = useState('');
  const [progDesc, setProgDesc] = useState('');

  // Course Form state
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseUnits, setCourseUnits] = useState<number>(3);

  // Queries
  const { data: programsData, isLoading: loadingPrograms } = useQuery({
    queryKey: ['reference', 'programs'],
    queryFn: () => referenceApi.getPrograms(),
  });
  const programs: Program[] = programsData?.data || [];

  const { data: coursesData, isLoading: loadingCourses } = useQuery({
    queryKey: ['reference', 'courses', courseSearch],
    queryFn: () => referenceApi.getCourses({ search: courseSearch || undefined }),
  });
  const courses: Course[] = coursesData?.data || [];

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  // ── Program Mutations ──
  const createProgramMutation = useMutation({
    mutationFn: (payload: { code: string; name: string; description?: string }) =>
      referenceApi.createProgram(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference', 'programs'] });
      closeProgramModal();
      showFeedback('success', 'Program created successfully.');
    },
    onError: (err: any) => {
      showFeedback('error', err?.response?.data?.message || 'Failed to create program.');
    },
  });

  const updateProgramMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { code: string; name: string; description?: string } }) =>
      referenceApi.updateProgram(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference', 'programs'] });
      closeProgramModal();
      showFeedback('success', 'Program updated successfully.');
    },
    onError: (err: any) => {
      showFeedback('error', err?.response?.data?.message || 'Failed to update program.');
    },
  });

  const deleteProgramMutation = useMutation({
    mutationFn: (id: number) => referenceApi.deleteProgram(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference', 'programs'] });
      showFeedback('success', 'Program deleted.');
    },
    onError: (err: any) => {
      showFeedback('error', err?.response?.data?.message || 'Failed to delete program. It may have active students.');
    },
  });

  // ── Course Mutations ──
  const createCourseMutation = useMutation({
    mutationFn: (payload: { course_code: string; course_title: string; description?: string; units: number }) =>
      referenceApi.createCourse(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference', 'courses'] });
      closeCourseModal();
      showFeedback('success', 'Course added to catalog successfully.');
    },
    onError: (err: any) => {
      showFeedback('error', err?.response?.data?.message || 'Failed to add course.');
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { course_code: string; course_title: string; description?: string; units: number } }) =>
      referenceApi.updateCourse(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference', 'courses'] });
      closeCourseModal();
      showFeedback('success', 'Course updated successfully.');
    },
    onError: (err: any) => {
      showFeedback('error', err?.response?.data?.message || 'Failed to update course.');
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: (id: number) => referenceApi.deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference', 'courses'] });
      showFeedback('success', 'Course deleted from catalog.');
    },
    onError: (err: any) => {
      showFeedback('error', err?.response?.data?.message || 'Failed to delete course. It may have active offerings.');
    },
  });

  // ── Modal helpers ──
  const openProgramEdit = (p: Program) => {
    setEditingProgram(p);
    setProgCode(p.code);
    setProgName(p.name);
    setProgDesc(p.description || '');
    setIsProgramModalOpen(true);
  };

  const closeProgramModal = () => {
    setIsProgramModalOpen(false);
    setEditingProgram(null);
    setProgCode('');
    setProgName('');
    setProgDesc('');
  };

  const openCourseEdit = (c: Course) => {
    setEditingCourse(c);
    setCourseCode(c.course_code);
    setCourseTitle(c.course_title);
    setCourseDesc(c.description || '');
    setCourseUnits(c.units);
    setIsCourseModalOpen(true);
  };

  const closeCourseModal = () => {
    setIsCourseModalOpen(false);
    setEditingCourse(null);
    setCourseCode('');
    setCourseTitle('');
    setCourseDesc('');
    setCourseUnits(3);
  };

  const handleProgramSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { code: progCode, name: progName, description: progDesc || undefined };
    if (editingProgram) {
      updateProgramMutation.mutate({ id: editingProgram.id, payload });
    } else {
      createProgramMutation.mutate(payload);
    }
  };

  const handleCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      course_code: courseCode,
      course_title: courseTitle,
      description: courseDesc || undefined,
      units: Number(courseUnits),
    };
    if (editingCourse) {
      updateCourseMutation.mutate({ id: editingCourse.id, payload });
    } else {
      createCourseMutation.mutate(payload);
    }
  };

  const handleDeleteProgram = (p: Program) => {
    if (window.confirm(`Delete program "${p.code} — ${p.name}"? This cannot be undone.`)) {
      deleteProgramMutation.mutate(p.id);
    }
  };

  const handleDeleteCourse = (c: Course) => {
    if (window.confirm(`Delete course "${c.course_code} — ${c.course_title}"? This cannot be undone.`)) {
      deleteCourseMutation.mutate(c.id);
    }
  };

  const isMutating = createProgramMutation.isPending || updateProgramMutation.isPending || createCourseMutation.isPending || updateCourseMutation.isPending;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Curriculum Management
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BookOpen className="text-emerald-400" size={26} />
            Programs &amp; Course Catalog
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse institutional degree programs, standard subject offerings, and credit unit definitions
          </p>
        </div>

        {canManageCatalog && (
          <div className="flex items-center gap-2">
            {activeTab === 'PROGRAMS' ? (
              <button
                onClick={() => { setEditingProgram(null); setProgCode(''); setProgName(''); setProgDesc(''); setIsProgramModalOpen(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Plus size={16} />
                <span>New Program</span>
              </button>
            ) : (
              <button
                onClick={() => { setEditingCourse(null); setCourseCode(''); setCourseTitle(''); setCourseDesc(''); setCourseUnits(3); setIsCourseModalOpen(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Plus size={16} />
                <span>New Course</span>
              </button>
            )}
          </div>
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('COURSES')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'COURSES'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BookOpen size={16} />
          <span>Course Catalog ({courses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PROGRAMS')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'PROGRAMS'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <GraduationCap size={16} />
          <span>Academic Programs ({programs.length})</span>
        </button>
      </div>

      {/* Courses View */}
      {activeTab === 'COURSES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Search size={16} />
              </div>
              <input
                type="text"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder="Search courses by code or title (e.g. IT 312, Data Structures)..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              />
            </div>
            <div className="text-xs text-slate-500">
              Showing {courses.length} courses
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Course Code</th>
                  <th className="py-3 px-4">Course Title</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Units</th>
                  {canManageCatalog && <th className="py-3 px-4 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {loadingCourses && (
                  <tr>
                    <td colSpan={canManageCatalog ? 5 : 4} className="py-10 text-center text-slate-500">
                      Loading course catalog...
                    </td>
                  </tr>
                )}
                {!loadingCourses && courses.length === 0 && (
                  <tr>
                    <td colSpan={canManageCatalog ? 5 : 4} className="py-10 text-center text-slate-500">
                      No courses found matching search criteria.
                    </td>
                  </tr>
                )}
                {!loadingCourses &&
                  courses.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">{c.course_code}</td>
                      <td className="py-3.5 px-4 font-semibold text-white">{c.course_title}</td>
                      <td className="py-3.5 px-4 text-slate-400 max-w-md truncate">
                        {c.description || 'No description provided'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                          {c.units} {c.units === 1 ? 'unit' : 'units'}
                        </span>
                      </td>
                      {canManageCatalog && (
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openCourseEdit(c)}
                              title="Edit course"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                            >
                              <Pencil size={14} />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteCourse(c)}
                                title="Delete course"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Programs View */}
      {activeTab === 'PROGRAMS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Program Code</th>
                <th className="py-3 px-4">Degree Title</th>
                <th className="py-3 px-4">Description</th>
                {canManageCatalog && <th className="py-3 px-4 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loadingPrograms && (
                <tr>
                  <td colSpan={canManageCatalog ? 4 : 3} className="py-10 text-center text-slate-500">
                    Loading academic programs...
                  </td>
                </tr>
              )}
              {!loadingPrograms && programs.length === 0 && (
                <tr>
                  <td colSpan={canManageCatalog ? 4 : 3} className="py-10 text-center text-slate-500">
                    No programs registered in the database.
                  </td>
                </tr>
              )}
              {!loadingPrograms &&
                programs.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">{p.code}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">{p.name}</td>
                    <td className="py-3.5 px-4 text-slate-400">{p.description || 'Degree program'}</td>
                    {canManageCatalog && (
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openProgramEdit(p)}
                            title="Edit program"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                          >
                            <Pencil size={14} />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteProgram(p)}
                              title="Delete program"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Program Create/Edit Modal */}
      {isProgramModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">
                {editingProgram ? 'Edit Academic Program' : 'Create Academic Program'}
              </h2>
              <button
                onClick={closeProgramModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleProgramSubmit} className="space-y-4">
              <div>
                <label htmlFor="prog_code" className="block text-xs font-semibold text-slate-300 mb-1">
                  Program Code (e.g. BSIT)
                </label>
                <input
                  id="prog_code"
                  type="text"
                  required
                  value={progCode}
                  onChange={(e) => setProgCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                />
              </div>
              <div>
                <label htmlFor="prog_name" className="block text-xs font-semibold text-slate-300 mb-1">
                  Program Name
                </label>
                <input
                  id="prog_name"
                  type="text"
                  required
                  value={progName}
                  onChange={(e) => setProgName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                />
              </div>
              <div>
                <label htmlFor="prog_desc" className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  id="prog_desc"
                  value={progDesc}
                  onChange={(e) => setProgDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeProgramModal}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isMutating}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500"
                >
                  {isMutating
                    ? (editingProgram ? 'Saving...' : 'Creating...')
                    : (editingProgram ? 'Save Changes' : 'Save Program')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Create/Edit Modal */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">
                {editingCourse ? 'Edit Course' : 'Create Course Catalog Item'}
              </h2>
              <button
                onClick={closeCourseModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCourseSubmit} className="space-y-4">
              <div>
                <label htmlFor="course_code" className="block text-xs font-semibold text-slate-300 mb-1">
                  Course Code (e.g. IT 312)
                </label>
                <input
                  id="course_code"
                  type="text"
                  required
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 font-mono"
                />
              </div>
              <div>
                <label htmlFor="course_title" className="block text-xs font-semibold text-slate-300 mb-1">
                  Course Title
                </label>
                <input
                  id="course_title"
                  type="text"
                  required
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                />
              </div>
              <div>
                <label htmlFor="course_units" className="block text-xs font-semibold text-slate-300 mb-1">
                  Units (Credits)
                </label>
                <input
                  id="course_units"
                  type="number"
                  min={1}
                  max={6}
                  required
                  value={courseUnits}
                  onChange={(e) => setCourseUnits(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 font-mono"
                />
              </div>
              <div>
                <label htmlFor="course_desc" className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  id="course_desc"
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeCourseModal}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isMutating}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500"
                >
                  {isMutating
                    ? (editingCourse ? 'Saving...' : 'Adding...')
                    : (editingCourse ? 'Save Changes' : 'Add Course')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
