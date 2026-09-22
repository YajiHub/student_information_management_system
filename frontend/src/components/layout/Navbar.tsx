import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut, User as UserIcon, Shield, Sparkles, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import type { Role } from '../../types/auth.types';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

const roleBadgeStyles: Record<Role, string> = {
  ADMIN: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  REGISTRAR: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  INSTRUCTOR: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  STUDENT: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
};

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 hidden sm:inline-block">
            Apex Institute &bull; Production API Connected
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <Link
              to="/profile"
              title="View my profile"
              className="flex items-center gap-3 hover:opacity-85 transition-opacity group cursor-pointer"
            >
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-white leading-tight flex items-center justify-end gap-1.5 group-hover:text-emerald-400 transition-colors">
                  {user.name}
                </div>
                <div className="text-xs text-slate-400 truncate max-w-[180px]">{user.email}</div>
              </div>

              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide border uppercase ${
                  roleBadgeStyles[user.role] || 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {user.role === 'ADMIN' && <Shield size={12} />}
                {user.role === 'REGISTRAR' && <Shield size={12} />}
                {user.role === 'INSTRUCTOR' && <Sparkles size={12} />}
                {user.role === 'STUDENT' && <UserIcon size={12} />}
                {user.role}
              </span>
            </Link>

            <button
              onClick={logout}
              title="Sign out of your session"
              aria-label="Sign out"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
