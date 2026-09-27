import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { ManagedUser, ManagedUserStatus } from '../../types/admin.types';
import type { Role } from '../../types/auth.types';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../types/api.types';

const ROLES: Role[] = ['ADMIN', 'REGISTRAR', 'INSTRUCTOR', 'STUDENT'];

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: Record<string, any>) => Promise<void>;
  user?: ManagedUser | null;
  currentUserId?: number;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  user,
  currentUserId,
}) => {
  const isEditing = !!user;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('INSTRUCTOR');
  const [status, setStatus] = useState<ManagedUserStatus>('ACTIVE');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setStatus(user.status);
      setPassword('');
    } else {
      setName('');
      setEmail('');
      setPassword('');
      setRole('INSTRUCTOR');
      setStatus('ACTIVE');
    }
    setErrorMsg(null);
    setFieldErrors({});
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});

    if (!name || !email || (!isEditing && password.length < 8)) {
      setErrorMsg(
        isEditing
          ? 'Name and email are required.'
          : 'Name, email, and a password of at least 8 characters are required.',
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, any> = { name, email };
      if (password) payload.password = password;
      payload.role = role;
      payload.status = status;
      await onSave(payload);
      onClose();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const respData = axiosError.response?.data;
      setErrorMsg(respData?.message || 'Failed to save the user account.');
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

  const lockRoleStatus = isEditing && user.id === currentUserId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">
              {isEditing ? `Edit Account: ${user.name}` : 'Create User Account'}
            </h2>
            <p className="text-xs text-slate-400">
              {isEditing
                ? 'Update credentials, role, or account status'
                : 'Provision a new system account with an assigned role'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close user form"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div role="alert" className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label htmlFor="user_name" className="block text-xs font-semibold text-slate-300 mb-1">
              Full Name <span className="text-rose-400">*</span>
            </label>
            <input
              id="user_name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            />
            {fieldErrors.name && <p className="text-[10px] text-rose-400 mt-1">{fieldErrors.name}</p>}
          </div>

          <div>
            <label htmlFor="user_email" className="block text-xs font-semibold text-slate-300 mb-1">
              Email <span className="text-rose-400">*</span>
            </label>
            <input
              id="user_email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            />
            {fieldErrors.email && <p className="text-[10px] text-rose-400 mt-1">{fieldErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="user_password" className="block text-xs font-semibold text-slate-300 mb-1">
              {isEditing ? 'New Password (leave blank to keep current)' : 'Password'}
              {!isEditing && <span className="text-rose-400"> *</span>}
            </label>
            <input
              id="user_password"
              type="password"
              required={!isEditing}
              minLength={isEditing ? undefined : 8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            />
            {fieldErrors.password && (
              <p className="text-[10px] text-rose-400 mt-1">{fieldErrors.password}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="user_role" className="block text-xs font-semibold text-slate-300 mb-1">
                Role
              </label>
              <select
                id="user_role"
                value={role}
                disabled={lockRoleStatus}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 disabled:opacity-50 cursor-pointer"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="user_status" className="block text-xs font-semibold text-slate-300 mb-1">
                Account Status
              </label>
              <select
                id="user_status"
                value={status}
                disabled={lockRoleStatus}
                onChange={(e) => setStatus(e.target.value as ManagedUserStatus)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 disabled:opacity-50 cursor-pointer"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
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
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
