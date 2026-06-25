import { useGame } from '../context/GameContext';

const SkillMatrix = () => {
  const { missions, passedIds } = useGame();
  
  const categories = [
    { name: "Phishing Defense", color: "bg-yellow-500", glow: "shadow-yellow-500/20" },
    { name: "Safe Browsing", color: "bg-amber-400", glow: "shadow-amber-400/20" },
    { name: "Password Hygiene", color: "bg-orange-400", glow: "shadow-orange-400/20" },
    { name: "Social Engineering", color: "bg-yellow-600", glow: "shadow-yellow-600/20" },
  ];

  const getProgress = (catName) => {
    const totalMissionsInCategory = missions.filter(m => m.category === catName);
    if (totalMissionsInCategory.length === 0) return 0;
    const passedInCategory = totalMissionsInCategory.filter(m => passedIds.includes(m.id));
    return Math.round((passedInCategory.length / totalMissionsInCategory.length) * 100);
  };

  return (
    <div className="bg-[#1e293b]/40 p-6 rounded-[2rem] border border-slate-800 backdrop-blur-xl shadow-2xl">
      <h3 className="text-[10px] font-black text-slate-500 uppercase mb-6 tracking-[0.3em] border-b border-slate-800 pb-3">
        Matrice Competențe
      </h3>
      
      <div className="space-y-6">
        {categories.map((cat, i) => {
          const progressValue = getProgress(cat.name);
          const isMastered = progressValue === 100;
          
          return (
            <div key={i} className="group">
              <div className="flex justify-between text-[10px] font-bold mb-2 uppercase tracking-tighter">
                <span className="text-slate-400 group-hover:text-slate-200 transition-colors">
                  {cat.name}
                </span>
                {isMastered ? (
                  <span className="text-amber-400 font-black animate-pulse tracking-widest drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">
                    ★ MASTERED
                  </span>
                ) : (
                  <span className={`${progressValue > 0 ? 'text-yellow-500' : 'text-slate-600'} font-mono`}>
                    {progressValue}%
                  </span>
                )}
              </div>

              <div className="w-full bg-slate-800/60 h-2 rounded-full border border-white/5 relative overflow-hidden">
                <div 
                  className={`h-full ${isMastered ? 'bg-amber-400' : cat.color} transition-all duration-1000 ease-out relative ${isMastered ? 'shadow-[0_0_15px_rgba(251,191,36,0.5)]' : cat.glow + ' shadow-[0_0_12px]'}`}
                  style={{ width: `${progressValue}%` }}
                >
                  <div className="absolute top-0 left-0 w-full h-[40%] bg-white/20 rounded-full"></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SkillMatrix;