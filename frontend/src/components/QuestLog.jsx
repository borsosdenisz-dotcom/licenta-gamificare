import { useGame } from '../context/GameContext';

const QuestLog = () => {
  const { missions, completedIds } = useGame();

  return (
    <div className="bg-[#0f172a]/60 border border-slate-800 rounded-[2.5rem] p-8 backdrop-blur-xl shadow-2xl h-full max-h-[85vh] overflow-hidden flex flex-col">
      
      {/* Header Jurnal */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
          Jurnal Activități
        </h3>
        <div className="flex gap-1">
          <div className="w-1 h-1 bg-yellow-500 rounded-full animate-ping"></div>
          <div className="w-1 h-1 bg-yellow-500/50 rounded-full"></div>
        </div>
      </div>

      {/* Lista de Misiuni */}
      <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
        {missions.map((m) => {
          const isDone = completedIds.includes(m.id);
          
          return (
            <div 
              key={m.id} 
              className={`group relative p-4 rounded-2xl border transition-all duration-500 ${
                isDone 
                  ? 'bg-yellow-500/5 border-yellow-500/20 opacity-100' 
                  : 'bg-black/20 border-white/5 opacity-40'
              }`}
            >
              {/* Indicator Lateral pentru misiune activă/terminată */}
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-8 rounded-full transition-all duration-500 ${
                isDone ? 'bg-yellow-500 shadow-[0_0_10px_#eab308]' : 'bg-transparent'
              }`}></div>

              <div className="flex items-center gap-4 pl-2">
                {/* Iconița de Status */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${
                  isDone 
                    ? 'border-yellow-500/30 bg-yellow-500/10' 
                    : 'border-slate-800 bg-slate-900'
                }`}>
                  {isDone ? (
                    <span className="text-yellow-500 text-xs">✔</span>
                  ) : (
                    <span className="text-slate-700 text-[10px] font-black">!</span>
                  )}
                </div>

                <div className="flex flex-col">
                  <span className={`text-[11px] font-bold tracking-tight transition-colors ${
                    isDone ? 'text-slate-200' : 'text-slate-500'
                  }`}>
                    {m.title}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[7px] font-black uppercase tracking-[0.2em] ${
                      isDone ? 'text-yellow-600' : 'text-slate-700'
                    }`}>
                      {isDone ? 'Identitate Verificată' : 'În Așteptare'}
                    </span>
                    {isDone && (
                      <span className="w-1 h-1 bg-yellow-600 rounded-full opacity-50"></span>
                    )}
                  </div>
                </div>
              </div>

              {/* Timestamp Fictiv - Adaugă realism de log */}
              {isDone && (
                <div className="absolute top-4 right-4 text-[7px] font-mono text-slate-700">
                  SEC_LOG_{m.id}0:26
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Jurnal */}
      <div className="mt-auto pt-6 border-t border-slate-800/50 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Integritate Sistem</span>
          <span className="text-[8px] font-mono text-yellow-500/70">SECURED_BY_DENIS</span>
        </div>
        <div className="w-full bg-slate-900 h-[2px] rounded-full overflow-hidden">
          <div 
            className="h-full bg-yellow-500/30 transition-all duration-1000"
            style={{ width: `${(completedIds.length / missions.length) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default QuestLog;