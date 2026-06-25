import { useGame } from '../context/GameContext';

const Certificate = () => {
  const { user } = useGame();
  
  return (
    <div className="bg-slate-900/80 p-12 rounded-3xl border-4 border-double border-blue-500/30 text-center relative overflow-hidden backdrop-blur-xl">
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      <div className="border-2 border-blue-500/20 p-8">
        <h1 className="text-blue-500 font-black text-4xl mb-2 italic tracking-tighter">CERTIFICATE OF EXCELLENCE</h1>
        <p className="text-slate-500 text-[10px] tracking-[0.5em] uppercase mb-12">Cyber Security Operations Center</p>
        
        <p className="text-slate-400 font-medium mb-2 uppercase text-xs">This is to certify that agent</p>
        <h2 className="text-white text-5xl font-black italic mb-6 tracking-tight underline decoration-blue-500/50">{user.name.toUpperCase()}</h2>
        
        <p className="text-slate-400 max-w-md mx-auto mb-10 text-sm leading-relaxed">
          Has successfully completed all tactical simulations and achieved the rank of 
          <span className="text-blue-400 font-bold"> Level {user.level} Special Operative</span>.
          Expertise verified in Network, Web, and Social Engineering defenses.
        </p>

        <div className="flex justify-between items-end mt-12">
          <div className="text-left">
            <p className="text-blue-500 font-mono text-[10px]">ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
            <p className="text-slate-600 text-[8px] uppercase">Issue Date: {new Date().toLocaleDateString()}</p>
          </div>
          <div className="text-right">
             <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/40 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">🛡️</span>
             </div>
             <p className="text-slate-500 font-black italic text-[10px]">VERIFIED ENCRYPTED</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Certificate;