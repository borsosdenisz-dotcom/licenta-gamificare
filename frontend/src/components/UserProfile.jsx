import { useGame } from '../context/GameContext';

const UserProfile = () => {
  const { user, resetGame } = useGame();
  if (!user) return null;
  const progress = Math.min((user.xp / user.maxXp) * 100, 100);

  return (
    <div className="bg-[#0f172a]/80 p-8 rounded-[2.5rem] border border-yellow-500/20 backdrop-blur-xl relative overflow-hidden shadow-2xl">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-600/5 rounded-full blur-[60px]"></div>
      <div className="flex items-center gap-6 mb-8 relative z-10">
        <div className="w-16 h-16 bg-slate-900 border-2 border-yellow-500/20 rounded-2xl flex items-center justify-center text-3xl font-black italic text-white shadow-[0_0_15px_rgba(234,179,8,0.1)]">{user.name[0]}</div>
        <div>
          <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-1">{user.name}</h2>
          <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest leading-none">Rank: Level {user.level} Analyst</p>
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-tighter mt-1 italic">Total Score: {user.score}</p>
        </div>
      </div>
      {/* Power Meter Galben */}
      <div className="mb-8 relative z-10">
        <div className="flex justify-between text-[10px] font-black uppercase mb-3 text-slate-500">
          <span>System Integration</span>
          <span className="text-yellow-500 font-mono font-bold">{user.xp} / {user.maxXp} XP</span>
        </div>
        <div className="w-full bg-slate-800/40 h-4 rounded-full border border-yellow-500/20 p-[2px] relative overflow-hidden ring-1 ring-white/5">
          <div className="h-full rounded-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-amber-300 shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
      {/* Badge-uri */}
      <div className="space-y-4 relative z-10">
        <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-widest border-b border-slate-800 pb-2">Certificări</h3>
        <div className="flex flex-wrap gap-2">
          {user.badges.map((b, i) => (
            <div key={i} className="bg-yellow-500/5 border border-yellow-500/10 px-3 py-1 rounded-lg"><span className="text-[10px] font-bold text-yellow-600 uppercase">{b}</span></div>
          ))}
        </div>
      </div>
      <button onClick={resetGame} className="mt-8 w-full border border-slate-800 text-slate-700 hover:text-red-500 py-2 rounded-xl text-[8px] font-black uppercase transition-all">☢ Reset Protocol</button>
    </div>
  );
};

export default UserProfile;