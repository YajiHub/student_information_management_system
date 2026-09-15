import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
        <div className="mx-auto w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center mb-6 text-rose-400">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">403 - Access Forbidden</h1>
        <p className="text-sm text-slate-400 mb-6">
          Your account role (<span className="font-semibold text-emerald-400">{user?.role ?? 'GUEST'}</span>) does not have permission to view this resource.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium transition-colors border border-slate-700 hover:border-slate-600 text-slate-200"
        >
          <ArrowLeft size={16} />
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};
