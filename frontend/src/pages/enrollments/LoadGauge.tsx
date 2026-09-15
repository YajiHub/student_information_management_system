import React from 'react';
import { ShieldAlert, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import type { Student } from '../../types/student.types';

interface LoadGaugeProps {
  student: Student;
  currentUnits: number;
}

export const LoadGauge: React.FC<LoadGaugeProps> = ({ student, currentUnits }) => {
  const isIrregular = student.student_type === 'IRREGULAR';
  const maxUnits = student.max_allowed_units || (isIrregular ? 15 : 23);
  const remainingUnits = Math.max(0, maxUnits - currentUnits);
  const percentage = Math.min(100, Math.round((currentUnits / maxUnits) * 100));

  const isAtLimit = currentUnits >= maxUnits;
  const isNearLimit = !isAtLimit && percentage >= 70;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isIrregular
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}
          >
            <Zap size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Academic Load Gauge
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                  isIrregular
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}
              >
                {student.student_type} &bull; MAX {maxUnits} UNITS
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isIrregular
                ? 'Irregular students are capped at 15 units. Overload enrollment attempts will be blocked.'
                : 'Standard regular load ceiling is 23 units.'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xl font-mono font-bold text-white">
            <span
              className={
                isAtLimit ? 'text-rose-400' : isNearLimit ? 'text-amber-400' : 'text-emerald-400'
              }
            >
              {currentUnits}
            </span>
            <span className="text-slate-500"> / </span>
            <span className="text-slate-300">{maxUnits}</span>
            <span className="text-xs text-slate-400 ml-1">Units</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {remainingUnits > 0 ? (
              <span>
                Capacity left: <strong className="text-slate-200">{remainingUnits} units</strong>
              </span>
            ) : (
              <span className="text-rose-400 font-semibold flex items-center justify-end gap-1">
                <ShieldAlert size={12} />
                Maximum Load Reached
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="space-y-1.5">
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isAtLimit
                ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                : isNearLimit
                ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                : 'bg-gradient-to-r from-emerald-500 to-teal-400'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>0 Units</span>
          <span
            className={
              isAtLimit ? 'text-rose-400 font-bold' : isNearLimit ? 'text-amber-400' : 'text-emerald-400'
            }
          >
            {percentage}% utilized
          </span>
          <span>{maxUnits} Units</span>
        </div>
      </div>

      {/* Advisory Message */}
      {isAtLimit && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2"
        >
          <AlertCircle size={15} className="shrink-0 text-rose-400" />
          <span>
            Unit ceiling met! Additional enrollments will be rejected by backend business rules.
          </span>
        </div>
      )}
      {!isAtLimit && isNearLimit && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0 text-amber-400" />
          <span>
            Approaching prescribed load limit ({remainingUnits} units remaining).
          </span>
        </div>
      )}
      {!isAtLimit && !isNearLimit && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
          <span>Academic load standing within allowable limits.</span>
        </div>
      )}
    </div>
  );
};
