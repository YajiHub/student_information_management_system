import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  Layers,
  ClipboardList,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import type { Role } from '../../types/auth.types';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  allowedRoles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: LayoutDashboard,
    allowedRoles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'],
  },
  {
    label: 'Students Directory',
    to: '/students',
    icon: Users,
    allowedRoles: ['ADMIN'],
  },
  {
    label: 'Programs & Courses',
    to: '/academic/courses',
    icon: BookOpen,
    allowedRoles: ['ADMIN', 'INSTRUCTOR'],
  },
  {
    label: 'Academic Terms',
    to: '/academic/terms',
    icon: Calendar,
    allowedRoles: ['ADMIN'],
  },
  {
    label: 'Course Offerings',
    to: '/offerings',
    icon: Layers,
    allowedRoles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'],
  },
  {
    label: 'Enrollment Console',
    to: '/enrollments',
    icon: ClipboardList,
    allowedRoles: ['ADMIN', 'STUDENT'],
  },
  {
    label: 'Grades Entry',
    to: '/grades',
    icon: CheckCircle2,
    allowedRoles: ['ADMIN', 'INSTRUCTOR'],
  },
  {
    label: 'Academic Records',
    to: '/records',
    icon: FileSpreadsheet,
    allowedRoles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.role || 'STUDENT';

  const visibleItems = NAV_ITEMS.filter((item) => item.allowedRoles.includes(role));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed md:sticky top-0 z-40 shrink-0 select-none transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white shrink-0">
              <GraduationCap size={20} />
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-bold tracking-tight text-white truncate">Apex Institute</div>
              <div className="text-[11px] font-mono text-emerald-400 truncate">SIMS v1.0 Client</div>
            </div>
          </div>
        </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Navigation
        </div>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500">
        <div className="flex items-center justify-between">
          <span>Backend Port</span>
          <span className="font-mono text-slate-400">:3000</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span>Role Scope</span>
          <span className="font-mono text-emerald-400">{role}</span>
        </div>
      </div>
      </aside>
    </>
  );
};
