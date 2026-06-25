import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';

const Leaderboard = () => {
  const { user } = useGame();
  const [players, setPlayers] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/leaderboard');
        let realPlayers = [];
        
        if (response.ok) {
          const data = await response.json();
          realPlayers = data.map(p => {
            const isCurrentUser = p.name === user.name;
            return {
              id: p._id || p.name,
              name: p.name,
              score: isCurrentUser ? user.score : p.score,
              integrity: isCurrentUser ? user.integrity : (p.integrity || 100),
              rank: `LEVEL ${isCurrentUser ? user.level : p.level} ANALYST`,
              isUser: isCurrentUser
            };
          });
        }

        const bots = [
          { id: 'b1', name: "Alex Storm", score: 18450, integrity: 95, rank: "ELITE", isUser: false },
          { id: 'b2', name: "Elena Crypto", score: 15200, integrity: 80, rank: "EXPERT", isUser: false },
          { id: 'b3', name: "Victor Prime", score: 12100, integrity: 100, rank: "SENIOR", isUser: false },
          { id: 'b4', name: "Sarah Cyber", score: 9400, integrity: 60, rank: "SPECIALIST", isUser: false },
        ];

        let combined = [...bots, ...realPlayers];

        if (user.name && !combined.some(p => p.name === user.name)) {
            combined.push({
                id: 'local_user',
                name: user.name,
                score: user.score,
                integrity: user.integrity,
                rank: `LEVEL ${user.level} ANALYST`,
                isUser: true
            });
        }

        combined = combined
          .filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i)
          .sort((a, b) => {
            if (b.score === a.score) {
              return b.integrity - a.integrity; 
            }
            return b.score - a.score;
          });

        setPlayers(combined);
      } catch (error) {
        console.error("Eroare la încărcarea clasamentului:", error);
      }
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 3000); 
    return () => clearInterval(interval);

  }, [user]);

  const displayedPlayers = isExpanded ? players : players.slice(0, 5);

  return (
    <div className="bg-[#1e293b]/40 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl backdrop-blur-xl relative flex flex-col max-h-[85vh] transition-all duration-500">
      
      <h3 className="text-[10px] font-black text-slate-500 uppercase mb-6 tracking-[0.3em] border-b border-slate-800 pb-4 flex justify-between items-center shrink-0">
        <span>Global Leaderboard</span>
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></span>
          <span className="text-yellow-500 font-bold tracking-widest">LIVE FEED</span>
        </span>
      </h3>
      
      <div className={`space-y-3 pr-2 overflow-y-auto custom-scrollbar transition-all duration-500 ${isExpanded ? 'flex-1' : ''}`}>
        {displayedPlayers.map((player, i) => {
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
          
          return (
            <div 
              key={player.id} 
              className={`flex justify-between items-center p-4 rounded-2xl transition-all duration-500 ${
                player.isUser 
                  ? 'bg-yellow-600/10 border border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.05)] scale-[1.02] z-10 relative' 
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-8 flex justify-center">
                  {medal ? (
                    <span className="text-xl drop-shadow-md">{medal}</span>
                  ) : (
                    <span className="text-xs font-black text-slate-600">0{i + 1}</span>
                  )}
                </div>

                <div className="flex flex-col">
                  <span className={`text-sm font-black tracking-tight ${player.isUser ? 'text-yellow-500' : 'text-slate-200'}`}>
                    {player.isUser ? `${player.name} (TU)` : player.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
                      {player.rank}
                    </span>
                    <span className="text-[7px] font-mono text-slate-500 opacity-50">HP: {player.integrity}%</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-xs font-mono font-black ${i < 3 ? 'text-white' : 'text-slate-400'}`}>
                  {player.score.toLocaleString()}
                </span>
                <span className="text-[8px] font-black text-yellow-500/50 block uppercase">Points</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800/50 flex justify-between items-center shrink-0">
        <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.2em]">
          Season: Q1 2026
        </p>
        
        {players.length > 5 && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[9px] font-black text-yellow-500 uppercase tracking-widest hover:text-yellow-400 transition-colors bg-yellow-500/10 px-3 py-1.5 rounded-lg border border-yellow-500/20"
          >
            {isExpanded ? 'Show Top 5' : 'View Full Roster'}
          </button>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;