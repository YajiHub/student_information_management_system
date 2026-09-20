import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  UserPlus,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Filter,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { studentsApi } from '../../api/students.api';
import { referenceApi } from '../../api/reference.api';
import type { Student, StudentQueryParams, CreateStudentDto, UpdateStudentDto, StudentType } from '../../types/student.types';
import { StudentModal } from './StudentModal';

export const StudentsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Search and Filter States
  const [search, setSearch] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch reference programs
  const { data: programsData } = useQuery({
    queryKey: ['reference', 'programs'],
    queryFn: () => referenceApi.getPrograms(),
  });
  const programs = programsData?.data || [];

  // Query parameters
  const queryParams = useMemo<StudentQueryParams>(() => {
    const p: StudentQueryParams = {
      page,
      per_page: perPage,
      sort: 'student_number',
      order: 'asc',
    };
    if (search.trim()) p.search = search.trim();
    if (selectedProgram) p.program_id = Number(selectedProgram);
    if (selectedType) p.student_type = selectedType as StudentType;
    if (selectedYear) p.year_level = Number(selectedYear);
    if (selectedStatus) p.status = selectedStatus as any;
    return p;
  }, [page, perPage, search, selectedProgram, selectedType, selectedYear, selectedStatus]);

  // Fetch students
  const { data: studentsResponse, isLoading, isError, error } = useQuery({
    queryKey: ['students', queryParams],
    queryFn: () => studentsApi.getAll(queryParams),
  });

  const students = studentsResponse?.data || [];
  const meta = studentsResponse?.meta;

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newStudent: CreateStudentDto) => studentsApi.create(newStudent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setFeedbackMsg({ type: 'success', text: 'Student record created successfully.' });
      setTimeout(() => setFeedbackMsg(null), 4000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateStudentDto }) =>
      studentsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setFeedbackMsg({ type: 'success', text: 'Student record updated successfully.' });
      setTimeout(() => setFeedbackMsg(null), 4000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => studentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setFeedbackMsg({ type: 'success', text: 'Student record deleted successfully.' });
      setTimeout(() => setFeedbackMsg(null), 4000);
    },
  });

  const handleOpenCreate = () => {
    setEditingStudent(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Student) => {
    setEditingStudent(s);
    setIsModalOpen(true);
  };

  const handleDelete = async (s: Student) => {
    if (window.confirm(`Are you sure you want to delete student ${s.student_number} (${s.first_name} ${s.last_name})?`)) {
      await deleteMutation.mutateAsync(s.id);
    }
  };

  const handleSaveStudent = async (data: CreateStudentDto | UpdateStudentDto) => {
    if (editingStudent) {
      await updateMutation.mutateAsync({ id: editingStudent.id, payload: data as UpdateStudentDto });
    } else {
      await createMutation.mutateAsync(data as CreateStudentDto);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Admin Console
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="text-emerald-400" size={26} />
            Students Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage enrolled students, academic classifications, and irregular unit ceilings
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <UserPlus size={16} />
          <span>Register New Student</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          role="status"
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 animate-fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by student number, name, or institutional email..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 pr-1">
              <Filter size={14} />
              <span className="hidden lg:inline">Filters:</span>
            </div>

            {/* Program Filter */}
            <select
              aria-label="Filter by Academic Program"
              value={selectedProgram}
              onChange={(e) => {
                setSelectedProgram(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            >
              <option value="">All Programs</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code}
                </option>
              ))}
            </select>

            {/* Student Type Filter */}
            <select
              aria-label="Filter by Student Classification"
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            >
              <option value="">All Types</option>
              <option value="REGULAR">Regular (23 Units)</option>
              <option value="IRREGULAR">Irregular (15 Units)</option>
            </select>

            {/* Year Level Filter */}
            <select
              aria-label="Filter by Year Level"
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            >
              <option value="">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>

            {/* Status Filter */}
            <select
              aria-label="Filter by Status"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="GRADUATED">Graduated</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Student No.</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Program</th>
                <th className="py-3 px-4">Year</th>
                <th className="py-3 px-4">Load Classification</th>
                <th className="py-3 px-4">Max Units</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent" />
                      <span>Loading student roster from API...</span>
                    </div>
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-rose-400">
                    <div className="inline-flex items-center gap-2">
                      <AlertCircle size={16} />
                      <span>Failed to load students: {(error as Error)?.message || 'Network error'}</span>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && !isError && students.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No students found matching current query parameters.
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-200">{s.student_number}</td>
                    <td className="py-3 px-4 font-medium text-white">
                      {s.first_name} {s.middle_name ? `${s.middle_name[0]}. ` : ''}
                      {s.last_name}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{s.email}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-200">
                        {s.program?.code || `Program #${s.program_id}`}
                      </span>
                    </td>
                    <td className="py-3 px-4">Year {s.year_level}</td>
                    <td className="py-3 px-4">
                      {s.student_type === 'IRREGULAR' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          IRREGULAR
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          REGULAR
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-300">
                      {s.max_allowed_units} units
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                          s.status === 'ACTIVE' ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            s.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-slate-600'
                          }`}
                        />
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          title="Edit Student"
                          aria-label={`Edit ${s.first_name} ${s.last_name}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          title="Delete Student"
                          aria-label={`Delete ${s.first_name} ${s.last_name}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {meta && (
          <div className="px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 bg-slate-950/40">
            <div className="flex items-center gap-4">
              <span>
                Showing Page <span className="font-semibold text-white">{meta.page}</span> of{' '}
                <span className="font-semibold text-white">{meta.total_pages || 1}</span> (
                {meta.total_records} total records)
              </span>
              <div className="flex items-center gap-1.5">
                <span>Per Page:</span>
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={!meta.has_prev}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs text-slate-300 transition-colors cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>
              <button
                disabled={!meta.has_next}
                onClick={() => setPage((prev) => prev + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs text-slate-300 transition-colors cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <StudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveStudent}
        student={editingStudent}
        programs={programs}
      />
    </div>
  );
};

export default StudentsPage;
