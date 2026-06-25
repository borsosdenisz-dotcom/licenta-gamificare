import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { playSound } from '../utils/sounds';

const Terminal = ({ onAction }) => {
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState(['[SYSTEM]: Terminal link established.']);
  const { updateQuest } = useGame();

  const handleCommand = (e) => {
    if (e.key === 'Enter') {
      const cmd = input.toLowerCase().trim();
      let res = `> ${cmd}`;
      
      if (cmd === 'scan') {
        res = '> Scanning network... Vulnerabilities found. XP +20';
        onAction(20); // Folosim funcția primită de la părinte
        updateQuest('SCAN');
        playSound('click');
      } else if (cmd === 'help') {
        res = '> Commands: scan, clear, status';
      } else if (cmd === 'clear') {
        setLogs([]); setInput(''); return;
      } else {
        res = `> Error: Unknown command.`;
        playSound('error');
      }

      setLogs(prev => [...prev.slice(-3), res]);
      setInput('');
    }
  };

  return (
    <div className="bg-black/80 p-5 rounded-2xl border border-slate-800 font-mono text-[11px] w-full">
      <div className="h-20 overflow-y-auto mb-3 text-blue-400 opacity-80">
        {logs.map((l, i) => <div key={i}>{l}</div>)}
      </div>
      <div className="flex items-center text-green-500 border-t border-slate-900 pt-2">
        <span className="mr-2">denis@root:~$</span>
        <input autoFocus className="bg-transparent outline-none flex-1" value={input} 
          onChange={e => setInput(e.target.value)} onKeyDown={handleCommand} />
      </div>
    </div>
  );
};
export default Terminal;