import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';

const SecurityLab = () => {
  const { 
    missions, completedIds, completeMission, user, resetGame, 
    isSimulationActive, setIsSimulationActive, 
    showLevelUp 
  } = useGame();
  
  const [wrongId, setWrongId] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [timeLeft, setTimeLeft] = useState(15); 

  const current = missions.find(m => !completedIds.includes(m.id));

  // 🔥 FRÂNA ABSOLUTĂ: Jocul e pe pauză dacă avem Pop-up de LevelUp SAU mesaj de eroare
  const isPaused = showLevelUp || feedback !== "";

  // ⏱️ Logica de Timer (CU ÎNGHEȚARE TIMP)
  useEffect(() => {
    // Dacă jocul e pe pauză, oprim complet cronometrul (timpul nu mai trece!)
    if (isPaused) return;

    if (isSimulationActive && current && timeLeft > 0 && user.integrity > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isSimulationActive && timeLeft === 0 && current && user.integrity > 0) {
      handleSelect(current.id, false, null); 
    }
  }, [timeLeft, current, user.integrity, isSimulationActive, isPaused]); // Am adăugat isPaused la dependențe

  useEffect(() => {
    if (current) {
      setTimeLeft(15);
      setFeedback("");
      setWrongId(null);
    }
  }, [current]);

  const handleSelect = (missionId, isCorrect, optionId) => {
    if (user.integrity <= 0) return;

    const timeSpent = 15 - timeLeft; 
    const result = completeMission(missionId, isCorrect, timeSpent);
    
    if (!result.success) {
      if (optionId) setWrongId(optionId);
      setFeedback(`🚨 ALERTĂ SECURITATE: Eroare de protocol detectată! Se aplică măsuri de penalizare.`);
      
      setTimeout(() => {
        setWrongId(null);
        setFeedback("");
      }, 3000);

      setTimeLeft(15); 
    }
  };

  if (!isSimulationActive) return (
    <div className="bg-[#0f172a]/90 p-12 rounded-[3rem] border border-slate-800 text-center backdrop-blur-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[500px] shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 to-transparent"></div>
      <div className="w-20 h-20 bg-yellow-500/10 border border-yellow-500/20 rounded-3xl flex items-center justify-center mb-8 animate-pulse shadow-[0_0_30px_rgba(234,179,8,0.1)]">
        <span className="text-4xl">🛡️</span>
      </div>
      <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4">
        Pregătit pentru Simulare?
      </h2>
      <p className="text-slate-400 text-sm max-w-md mx-auto mb-12 leading-relaxed">
        Sistemul va iniția vectori de atac simulați. 
        <br/><br/>
        <span className="text-yellow-500 font-bold">Atenție:</span> Fiecare misiune are un timer critic. Deciziile incorecte vor corupe integritatea sistemului și vor penaliza scorul.
      </p>
      <button 
        onClick={() => setIsSimulationActive(true)}
        className="group relative px-10 py-5 bg-yellow-500 text-slate-900 font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-yellow-400 transition-all duration-300 shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_40px_rgba(234,179,8,0.5)] scale-100 hover:scale-105"
      >
        <span className="relative z-10 flex items-center gap-3">
          Inițiază Protocolul <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
        </span>
      </button>
    </div>
  );

  if (!current) return (
    <div className="bg-[#0f172a]/90 p-12 rounded-[3rem] border border-yellow-500/20 text-center backdrop-blur-2xl animate-in zoom-in duration-700">
      <div className="inline-block p-5 rounded-3xl bg-yellow-500/10 mb-8 border border-yellow-500/20"><span className="text-5xl">🏆</span></div>
      <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">Verdict: ELITE ANALYST</h2>
      <div className="grid grid-cols-2 gap-6 text-left my-10">
        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5">
          <p className="text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">Scor Final</p>
          <p className="text-3xl font-black text-white">{user.score.toLocaleString()} PTS</p>
        </div>
        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5">
          <p className="text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">Integritate Finală</p>
          <p className={`text-3xl font-black ${user.integrity > 70 ? 'text-green-400' : 'text-yellow-400'}`}>{user.integrity}%</p>
        </div>
      </div>
    </div>
  );

  const isCritical = timeLeft <= 5 && user.integrity > 0;

  return (
    <div className={`bg-[#0f172a]/90 p-10 rounded-[2.5rem] border transition-all duration-500 relative overflow-hidden 
      ${user.integrity <= 0 ? 'border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.2)]' : 
        isCritical ? 'border-red-500/60 shadow-[0_0_50px_rgba(239,68,68,0.15)] animate-pulse' : 'border-slate-800'}`}>
      
      {isCritical && (
        <div className="absolute top-0 left-0 w-full bg-red-600/90 text-white text-[9px] font-black uppercase tracking-[0.4em] py-1.5 text-center animate-pulse z-50">
          ⚠️ Critical Time: Immediate Action Required
        </div>
      )}

      <div className={`flex justify-between items-end mb-10 border-b border-white/5 pb-8 ${isCritical ? 'mt-4' : ''}`}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className={`rounded-full transition-all duration-300 ${isCritical ? 'w-4 h-4 bg-red-500 shadow-[0_0_15px_red] animate-ping' : 'w-3 h-3 bg-yellow-500 animate-pulse'}`}></div>
            <span className={`text-[10px] font-mono font-black uppercase tracking-widest transition-colors ${isCritical ? 'text-red-400' : 'text-slate-400'}`}>
              Decision Window: {timeLeft}s
            </span>
          </div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">{current.title}</h2>
        </div>

        <div className="flex flex-col items-end gap-2 min-w-[180px]">
          <div className="flex justify-between w-full mb-1 items-baseline px-1">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">System Integrity</span>
            <span className={`text-xs font-mono font-black transition-colors duration-500 ${
              user.integrity > 60 ? 'text-green-400' : 
              user.integrity > 30 ? 'text-yellow-400' : 'text-red-500 animate-pulse'
            }`}>
              {user.integrity}%
            </span>
          </div>
          <div className="w-full bg-slate-900 h-3 rounded-full border border-white/5 overflow-hidden p-[2px] ring-1 ring-white/5 shadow-inner">
             <div 
               className={`h-full transition-all duration-700 rounded-full shadow-[0_0_15px] relative ${
                 user.integrity > 60 ? 'bg-gradient-to-r from-green-500 to-emerald-400 shadow-green-500/40' : 
                 user.integrity > 30 ? 'bg-gradient-to-r from-yellow-500 to-amber-400 shadow-yellow-500/40' : 
                 'bg-gradient-to-r from-red-600 to-red-400 shadow-red-500/60'
               }`} 
               style={{ width: `${user.integrity}%` }}
             >
               <div className="absolute top-0 left-0 w-full h-[30%] bg-white/20 rounded-full"></div>
             </div>
          </div>
        </div>
      </div>

      <div className={`bg-black/40 p-8 rounded-3xl border transition-colors duration-300 mb-8 relative ${isCritical ? 'border-red-500/30' : 'border-yellow-500/10'}`}>
        <p className="text-slate-300 text-lg font-medium leading-relaxed">
           <span className="text-yellow-500 font-mono mr-2">{">"}</span>
           {current.description}
        </p>
        
        {feedback && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-in fade-in slide-in-from-top-2">
            <p className="text-red-400 text-[10px] font-black uppercase leading-tight tracking-widest">{feedback}</p>
          </div>
        )}
      </div>

      {user.integrity > 0 ? (
        <div className="grid gap-4">
          {current.options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleSelect(current.id, opt.correct, opt.id)}
              className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 font-bold flex justify-between items-center group relative overflow-hidden ${
                wrongId === opt.id ? 'border-red-500 bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-slate-800 bg-slate-900/40 hover:border-yellow-500 hover:bg-yellow-500/10 hover:shadow-[0_0_20px_rgba(234,179,8,0.1)] hover:-translate-y-1'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              
              <span className={`relative z-10 transition-colors ${wrongId === opt.id ? 'text-red-400' : 'text-slate-300 group-hover:text-white'}`}>{opt.text}</span>
              <span className="relative z-10 text-[8px] font-black text-yellow-500 opacity-0 group-hover:opacity-100 uppercase tracking-widest transition-opacity">Execute →</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="p-10 bg-red-600/10 border border-red-500 rounded-3xl text-center animate-pulse">
          <p className="text-red-500 font-black uppercase text-xs tracking-[0.3em] mb-4">Sistem Compromis - Acces Blocat</p>
          <button onClick={resetGame} className="px-8 py-3 bg-red-600 text-white font-black text-[10px] uppercase rounded-lg hover:bg-red-500 transition-all shadow-lg hover:scale-105">Reinițializează Protocol de Urgență</button>
        </div>
      )}
    </div>
  );
};

export default SecurityLab;