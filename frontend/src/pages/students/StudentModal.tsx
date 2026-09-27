import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { Student, CreateStudentDto, UpdateStudentDto, StudentType, StudentStatus } from '../../types/student.types';
import type { Program } from '../../types/academic.types';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api.types';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateStudentDto | UpdateStudentDto) => Promise<void>;
  student?: Student | null;
  programs: Program[];
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  student,
  programs,
}) => {
  const isEditing = !!student;

  const [studentNumber, setStudentNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('2004-01-01');
  const [programId, setProgramId] = useState<number>(programs[0]?.id || 1);
  const [yearLevel, setYearLevel] = useState<number>(1);
  const [studentType, setStudentType] = useState<StudentType>('REGULAR');
  const [maxUnits, setMaxUnits] = useState<number>(23);
  const [status, setStatus] = useState<StudentStatus>('ACTIVE');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (student) {
      setStudentNumber(student.student_number);
      setFirstName(student.first_name);
      setLastName(student.last_name);
      setMiddleName(student.middle_name || '');
      setEmail(student.email);
      setBirthDate(student.birth_date ? student.birth_date.split('T')[0] : '2004-01-01');
      setProgramId(student.program_id);
      setYearLevel(student.year_level);
      setStudentType(student.student_type);
      setMaxUnits(student.max_allowed_units);
      setStatus(student.status);
    } else {
      setStudentNumber(`2026-${Math.floor(10000 + Math.random() * 90000)}`);
      setFirstName('');
      setLastName('');
      setMiddleName('');
      setEmail('');
      setBirthDate('2004-01-01');
      setProgramId(programs[0]?.id || 1);
      setYearLevel(1);
      setStudentType('REGULAR');
      setMaxUnits(23);
      setStatus('ACTIVE');
    }
    setErrorMsg(null);
    setFieldErrors({});
  }, [student, programs, isOpen]);

  const handleTypeChange = (newType: StudentType) => {
    setStudentType(newType);
    if (newType === 'IRREGULAR') {
      setMaxUnits(15);
    } else {
      setMaxUnits(23);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});

    if (!studentNumber || !firstName || !lastName || !email || !birthDate || !programId) {
      setErrorMsg('Please fill in all mandatory student fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        const updatePayload: UpdateStudentDto = {
          student_number: studentNumber,
          first_name: firstName,
          last_name: lastName,
          middle_name: middleName || undefined,
          email,
          birth_date: birthDate,
          program_id: Number(programId),
          year_level: Number(yearLevel),
          student_type: studentType,
          max_allowed_units: Number(maxUnits),
          status,
        };
        await onSave(updatePayload);
      } else {
        const createPayload: CreateStudentDto = {
          student_number: studentNumber,
          first_name: firstName,
          last_name: lastName,
          middle_name: middleName || undefined,
          email,
          birth_date: birthDate,
          program_id: Number(programId),
          year_level: Number(yearLevel),
          student_type: studentType,
          max_allowed_units: Number(maxUnits),
        };
        await onSave(createPayload);
      }
      onClose();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const respData = axiosError.response?.data;
      if (respData?.message) {
        setErrorMsg(respData.message);
      } else {
        setErrorMsg('Failed to save student record. Please verify entries.');
      }
      if (respData?.errors) {
        const mapped: Record<string, string> = {};
        Object.entries(respData.errors).forEach(([k, v]) => {
          mapped[k] = Array.isArray(v) ? v[0] : String(v);
        });
        setFieldErrors(mapped);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-fade-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">
              {isEditing ? `Edit Student: ${student?.first_name} ${student?.last_name}` : 'Register New Student'}
            </h2>
            <p className="text-xs text-slate-400">
              {isEditing ? 'Update student classification and enrollment parameters' : 'Enrolls a new student into the active program catalog'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form id="student-form" onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div role="alert" className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="student_number" className="block text-xs font-semibold text-slate-300 mb-1">
                Student Number <span className="text-rose-400">*</span>
              </label>
              <input
                id="student_number"
                type="text"
                required
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                placeholder="2026-00001"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 font-mono"
              />
              {fieldErrors.student_number && <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.student_number}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-1">
                Institutional Email <span className="text-rose-400">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@student.edu"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              />
              {fieldErrors.email && <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="first_name" className="block text-xs font-semibold text-slate-300 mb-1">
                First Name <span className="text-rose-400">*</span>
              </label>
              <input
                id="first_name"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              />
              {fieldErrors.first_name && <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.first_name}</p>}
            </div>

            <div>
              <label htmlFor="last_name" className="block text-xs font-semibold text-slate-300 mb-1">
                Last Name <span className="text-rose-400">*</span>
              </label>
              <input
                id="last_name"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              />
              {fieldErrors.last_name && <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.last_name}</p>}
            </div>

            <div>
              <label htmlFor="middle_name" className="block text-xs font-semibold text-slate-300 mb-1">
                Middle Name (Optional)
              </label>
              <input
                id="middle_name"
                type="text"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="birth_date" className="block text-xs font-semibold text-slate-300 mb-1">
                Birth Date <span className="text-rose-400">*</span>
              </label>
              <input
                id="birth_date"
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              />
              {fieldErrors.birth_date && <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.birth_date}</p>}
            </div>

            <div>
              <label htmlFor="program_id" className="block text-xs font-semibold text-slate-300 mb-1">
                Academic Program <span className="text-rose-400">*</span>
              </label>
              <select
                id="program_id"
                value={programId}
                onChange={(e) => setProgramId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              >
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="year_level" className="block text-xs font-semibold text-slate-300 mb-1">
                Year Level <span className="text-rose-400">*</span>
              </label>
              <select
                id="year_level"
                value={yearLevel}
                onChange={(e) => setYearLevel(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              >
                <option value={1}>1st Year</option>
                <option value={2}>2nd Year</option>
                <option value={3}>3rd Year</option>
                <option value={4}>4th Year</option>
              </select>
            </div>

            <div>
              <label htmlFor="student_type" className="block text-xs font-semibold text-slate-300 mb-1">
                Classification / Load Type <span className="text-rose-400">*</span>
              </label>
              <select
                id="student_type"
                value={studentType}
                onChange={(e) => handleTypeChange(e.target.value as StudentType)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 font-semibold"
              >
                <option value="REGULAR">REGULAR (Standard Load - 23 Max)</option>
                <option value="IRREGULAR">IRREGULAR (Special Load - 15 Max)</option>
              </select>
            </div>

            <div>
              <label htmlFor="max_allowed_units" className="block text-xs font-semibold text-slate-300 mb-1">
                Max Allowed Units <span className="text-rose-400">*</span>
              </label>
              <input
                id="max_allowed_units"
                type="number"
                min={1}
                max={30}
                required
                value={maxUnits}
                onChange={(e) => setMaxUnits(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Prescribed: 23 units (Regular), 15 units (Irregular).
              </p>
            </div>

            {isEditing && (
              <div>
                <label htmlFor="status" className="block text-xs font-semibold text-slate-300 mb-1">
                  Enrollment Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StudentStatus)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="GRADUATED">GRADUATED</option>
                  <option value="DROPPED">DROPPED</option>
                </select>
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="student-form"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-2"
          >
            {isSubmitting && <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />}
            <span>{isEditing ? 'Save Changes' : 'Register Student'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
