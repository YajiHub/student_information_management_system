import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../types/api.types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const locationState = location.state as { from?: { pathname?: string } } | null;
  const from = locationState?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      if (axiosError.response?.data?.message) {
        setErrorMsg(axiosError.response.data.message);
      } else if (axiosError.response?.status === 401) {
        setErrorMsg('Invalid credentials. Please verify email and password.');
      } else {
        setErrorMsg('Unable to connect to authentication server. Please try again.');
      }
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      {/* Background subtle radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
            <GraduationCap size={28} />
          </div>
        </div>
        <h1 className="text-center text-3xl font-bold tracking-tight text-white font-sans">
          Apex Institute of Technology
        </h1>
        <p className="mt-2 text-center text-sm text-slate-400">
          Student Information Management System (SIMS)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {errorMsg && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3 animate-fade-in"
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                University Email
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Quick-fill Demo Evaluator Credentials */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              <Sparkles size={14} className="text-amber-400" />
              <span>Evaluator Demo Logins</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@sims.edu', 'Password123!')}
                className="text-left p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800/60 hover:border-slate-700 transition-all text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                <div className="font-semibold text-emerald-400">Admin</div>
                <div className="text-[11px] text-slate-500 truncate">admin@sims.edu</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('registrar@sims.edu', 'Password123!')}
                className="text-left p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800/60 hover:border-slate-700 transition-all text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                <div className="font-semibold text-amber-400">Registrar</div>
                <div className="text-[11px] text-slate-500 truncate">registrar@sims.edu</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('prof.cruz@sims.edu', 'Password123!')}
                className="text-left p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800/60 hover:border-slate-700 transition-all text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                <div className="font-semibold text-sky-400">Instructor</div>
                <div className="text-[11px] text-slate-500 truncate">prof.cruz@sims.edu</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('student1@sims.edu', 'Password123!')}
                className="text-left p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800/60 hover:border-slate-700 transition-all text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                <div className="font-semibold text-purple-400">Student (Regular)</div>
                <div className="text-[11px] text-slate-500 truncate">student1@sims.edu</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('student2@sims.edu', 'Password123!')}
                className="text-left p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800/60 hover:border-slate-700 transition-all text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                <div className="font-semibold text-amber-400">Student (Irregular)</div>
                <div className="text-[11px] text-slate-500 truncate">student2@sims.edu</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
