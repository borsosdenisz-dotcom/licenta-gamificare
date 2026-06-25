import { useEffect } from 'react';

const AchievementPopup = ({ title, message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 7000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] bg-[#0f172a]/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#1e293b] border-2 border-yellow-500 rounded-[2rem] p-8 max-w-sm w-full text-center shadow-[0_0_40px_rgba(234,179,8,0.2)] animate-in zoom-in-90 duration-500">
        
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center border border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.4)]">
            <span className="text-4xl">
              {type === 'badge' ? '🎖️' : '🏆'}
            </span>
          </div>
        </div>
        
        <h2 className="text-xl font-black text-white italic mb-2 uppercase tracking-widest">
          {title}
        </h2>
        <p className="text-slate-300 text-sm mb-6">
          {message}
        </p>
        
        <button 
          onClick={onClose}
          className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-[0_0_15px_rgba(234,179,8,0.4)]"
        >
          Continuă
        </button>
      </div>
    </div>
  );
};

export default AchievementPopup;