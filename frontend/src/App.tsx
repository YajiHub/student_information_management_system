export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 mb-5 font-extrabold text-2xl">
          S
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
          SIMS Frontend Client
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          Special Topics Laboratory Activity III &bull; React 19 + Tailwind v4 + NestJS REST API
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Ready for Module Integration
        </div>
      </div>
    </div>
  );
}
