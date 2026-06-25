import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// 🔥 IMPORTUL CORECT PENTRU VITE
import CryptoJS from 'crypto-js'; 

ChartJS.register( CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const AdminDashboard = ({ onExit }) => {
  const [dbUsers, setDbUsers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [logs, setLogs] = useState([]);

  const [activeTab, setActiveTab] = useState('analytics');
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });
  const [selectedCampaign, setSelectedCampaign] = useState(null); 
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, type: 'single' });

  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMission, setGeneratedMission] = useState(null);
  const [simulatingId, setSimulatingId] = useState(null);
  const [trafficData, setTrafficData] = useState([]);

  // STATE PENTRU SCANNER-UL DE INTEGRITATE
  const [integrityState, setIntegrityState] = useState({ status: 'idle', message: 'Sistem pregătit pentru scanare.', brokenId: null });

  const adminHeaders = { 
    'Content-Type': 'application/json',
    'x-role': 'ADMIN' 
  };

  useEffect(() => {
    if (statusMsg.text) {
      const timer = setTimeout(() => setStatusMsg({ text: "", type: "" }), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMsg]);

  const syncData = async () => {
    try {
      const [resU, resC, resL] = await Promise.all([
        fetch('http://localhost:5000/api/leaderboard', { headers: adminHeaders }),
        fetch('http://localhost:5000/api/campaigns', { headers: adminHeaders }),
        fetch('http://localhost:5000/api/logs', { headers: adminHeaders })
      ]);
      
      setDbUsers(resU.ok ? await resU.json() : []);
      setCampaigns(resC.ok ? await resC.json() : []);
      setLogs(resL.ok ? await resL.json() : []);
      
    } catch (e) { console.error("Sync error:", e); }
  };

  useEffect(() => {
    syncData();
    const interval = setInterval(syncData, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const generateInitialData = () => {
      const initialPoints = [...Array(30)].map(() => Math.floor(Math.random() * 80) + 20);
      setTrafficData(initialPoints);
    };
    generateInitialData();

    const interval = setInterval(() => {
      setTrafficData(prev => {
        const newData = [...prev.slice(1)];
        newData.push(Math.floor(Math.random() * 80) + 20);
        return newData;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // 🔥 FUNCȚIA MAGICĂ: BLOCKCHAIN VALIDATOR
  const runIntegrityCheck = () => {
    setIntegrityState({ status: 'checking', message: 'Se analizează lanțul criptografic...', brokenId: null });

    setTimeout(() => {
      if (logs.length === 0) {
        setIntegrityState({ status: 'valid', message: 'Niciun log de validat.', brokenId: null });
        return;
      }

      const sortedLogs = [...logs].reverse();
      let isValid = true;
      let brokenLogId = null;

      for (let i = 0; i < sortedLogs.length; i++) {
        const log = sortedLogs[i];
        
        const expectedPrevHash = i === 0 ? "GENESIS_BLOCK_0000" : sortedLogs[i-1].currentHash;
        if (log.prevHash !== expectedPrevHash) {
          isValid = false;
          brokenLogId = log._id;
          break; 
        }

        const ip = log.ip || 'INTERNAL_SYS';
        const ua = log.userAgent || 'SECURE_CORE';
        const logString = log.action + log.userName + log.details + log.prevHash + ip + ua;
        
        // FOLOSIM LIBRĂRIA IMPORTATĂ CORECT
        const calculatedHash = CryptoJS.SHA256(logString).toString(CryptoJS.enc.Hex);

        if (calculatedHash !== log.currentHash) {
          isValid = false;
          brokenLogId = log._id;
          break; 
        }
      }

      if (isValid) {
        setIntegrityState({ status: 'valid', message: 'Lanț valid. 0 manipulări detectate.', brokenId: null });
      } else {
        setIntegrityState({ status: 'invalid', message: 'ALERTA: Manipulare a bazei de date detectată!', brokenId: brokenLogId });
      }
    }, 1500); 
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setGeneratedMission(null);
    try {
      const res = await fetch('http://localhost:5000/api/generate-threat', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ prompt: aiPrompt })
      });
      if (res.ok) setGeneratedMission(await res.json());
    } catch (e) { setStatusMsg({ text: "AI Engine Offline", type: "error" }); }
    finally { setIsGenerating(false); }
  };

  const handleDeploy = async () => {
    if (!generatedMission) return;
    const targets = dbUsers.map((u, i) => {
      const willBeCompromised = (u.integrity || 0) < 70 ? Math.random() > 0.2 : Math.random() > 0.8;
      return {
        name: u.name,
        dept: ["Marketing", "HR", "Finance", "IT Operations"][i % 4],
        currentStatus: 'Pending',
        finalStatus: willBeCompromised ? 'Compromised' : 'Safe'
      };
    });
    try {
      const res = await fetch('http://localhost:5000/api/campaigns', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ title: generatedMission.title, domain: generatedMission.domain, targets, status: 'In Progress' })
      });
      if (res.ok) {
        const saved = await res.json();
        setCampaigns([saved, ...campaigns]);
        setSimulatingId(saved._id);
        setGeneratedMission(null);
        setActiveTab('campaigns');
        setStatusMsg({ text: "Simulare injectată în rețea!", type: "success" });
      }
    } catch (e) { console.error(e); }
  };

  const handleExecuteDelete = async () => {
    const { id, type } = deleteModal;
    const url = type === 'all' ? 'http://localhost:5000/api/campaigns' : `http://localhost:5000/api/campaigns/${id}`;
    try {
      const res = await fetch(url, { method: 'DELETE', headers: adminHeaders });
      if (res.ok) {
        setStatusMsg({ text: type === 'all' ? "Seif central curățat." : "Misiune eliminată.", type: "success" });
        await syncData();
      }
    } catch (e) { setStatusMsg({ text: "Eroare ștergere.", type: "error" }); }
    setDeleteModal({ show: false, id: null, type: 'single' });
  };

  useEffect(() => {
    if (!simulatingId) return;
    const interval = setInterval(() => {
      setCampaigns(prev => {
        let finishedCamp = null;
        const newState = prev.map(camp => {
          if (camp._id !== simulatingId) return camp;
          let allDone = true;
          const updatedTargets = camp.targets.map(t => {
            let nextStatus = t.currentStatus;
            if (t.currentStatus !== t.finalStatus) {
              allDone = false;
              if (Math.random() > 0.4) {
                if (t.currentStatus === 'Pending') nextStatus = 'Delivered';
                else if (t.currentStatus === 'Delivered') nextStatus = 'Opened';
                else if (t.currentStatus === 'Opened') nextStatus = t.finalStatus;
              }
            }
            return { ...t, currentStatus: nextStatus };
          });
          const updated = { ...camp, targets: updatedTargets, status: allDone ? 'Completed' : 'In Progress' };
          if (allDone) { setSimulatingId(null); finishedCamp = updated; }
          return updated;
        });
        if (finishedCamp) {
          fetch(`http://localhost:5000/api/campaigns/${finishedCamp._id}`, {
            method: 'PATCH',
            headers: adminHeaders,
            body: JSON.stringify({ targets: finishedCamp.targets, status: 'Completed' })
          });
        }
        return newState;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [simulatingId]);

  const calculatePenetration = (targets) => {
    if (!targets || targets.length === 0) return 0;
    const compromised = targets.filter(t => t.currentStatus === 'Compromised').length;
    return Math.round((compromised / targets.length) * 100);
  };

  const globalIntegrity = (() => {
    const total = dbUsers.length || 1;
    return Math.round((dbUsers.filter(u => u.integrity === 100).length / total) * 100);
  })();

  const handleExportPDF = (camp) => {
    try {
      const doc = new jsPDF();
      const penetration = calculatePenetration(camp.targets);
      const currentDate = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

      const cleanText = (str) => {
        return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
      };

      doc.setFontSize(24);
      doc.setTextColor(6, 182, 212); 
      doc.text("SECURECORE", 14, 22);
      
      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139); 
      doc.text("FORENSIC AUDIT REPORT", 14, 30);

      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42); 
      doc.text(`Mission Intel: ${cleanText(camp.title)}`, 14, 45);
      doc.text(`Target Domain: ${cleanText(camp.domain)}`, 14, 52);
      doc.text(`Network Penetration Rate: ${penetration}%`, 14, 59);
      doc.text(`Audit Date: ${currentDate}`, 14, 66);

      doc.setDrawColor(226, 232, 240);
      doc.line(14, 72, 196, 72);

      const tableColumn = ["Target Identity", "Department", "Security Status"];
      const tableRows = [];

      if (camp.targets && camp.targets.length > 0) {
        camp.targets.forEach(t => {
          tableRows.push([
            cleanText(t.name) || 'Unknown',
            cleanText(t.dept) || 'N/A',
            t.currentStatus || 'Pending'
          ]);
        });
      }

      autoTable(doc, {
        startY: 80,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [6, 182, 212], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 4 },
        didParseCell: function(data) {
          if (data.section === 'body' && data.column.index === 2) {
            if (data.cell.raw === 'Compromised') {
               data.cell.styles.textColor = [239, 68, 68]; 
               data.cell.styles.fontStyle = 'bold';
            } else if (data.cell.raw === 'Safe') {
               data.cell.styles.textColor = [16, 185, 129]; 
            }
          }
        }
      });

      const safeId = String(camp._id).substring(0, 6);
      doc.save(`SecureCore_Audit_${safeId}.pdf`);
      
      setStatusMsg({ text: "Raport de audit PDF generat cu succes.", type: "success" });

    } catch (error) {
      console.error("Eroare la generarea PDF-ului:", error);
      setStatusMsg({ text: "Eroare la generarea documentului PDF.", type: "error" });
    }
  };

  const navItems = [
    { id: 'analytics', label: 'Overview', icon: '📊' },
    { id: 'ai-generator', label: 'AI Synthesis', icon: '🧠' },
    { id: 'campaigns', label: 'Active Missions', icon: '🎯' },
    { id: 'logs', label: 'Security Logs', icon: '📜' }
  ];

  const trafficChartData = {
    labels: [...Array(30)].map((_, i) => `${30 - i}s ago`),
    datasets: [
      {
        label: 'Traffic Node 77',
        data: trafficData,
        borderColor: '#06b6d4', 
        backgroundColor: 'rgba(6, 182, 212, 0.15)', 
        fill: true, 
        tension: 0.4,
        pointRadius: 0, 
        borderWidth: 2,
      },
    ],
  };

  const trafficChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: true, mode: 'index', intersect: false } },
    scales: { x: { display: false }, y: { display: false, min: 0, max: 110 } },
    animation: { duration: 800 }
  };

  const departments = [
    { name: 'Finance', risk: 24, status: 'Stable' },
    { name: 'Human Res.', risk: 42, status: 'Alert' },
    { name: 'Marketing', risk: 68, status: 'Warning' },
    { name: 'IT Infra', risk: 12, status: 'Hardened' }
  ];

  return (
    <div className="bg-[#020617] min-h-screen text-slate-300 flex font-sans overflow-hidden selection:bg-cyan-500/30">
      
      <aside className="w-72 bg-slate-900/40 border-r border-white/5 backdrop-blur-2xl flex flex-col h-screen">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <span className="text-white text-xl">🛡️</span>
            </div>
            <h1 className="text-white font-black tracking-tighter text-xl uppercase">Secure<span className="text-cyan-500">Core</span></h1>
          </div>
          <nav className="space-y-3">
            {navItems.map(item => (
              <button 
                key={item.id} 
                onClick={() => setActiveTab(item.id)} 
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${activeTab === item.id ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.05)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <button onClick={onExit} className="m-8 mt-auto py-4 bg-red-500/5 border border-red-500/10 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Sign Out Terminal</button>
      </aside>

      <main className="flex-1 p-10 max-w-[1600px] mx-auto overflow-y-auto h-screen custom-scrollbar relative">
        
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-white text-4xl font-black italic uppercase tracking-tight">{activeTab.replace('-', ' ')}</h2>
          <div className="flex items-center gap-4">
            {activeTab === 'campaigns' && campaigns.length > 0 && (
              <button 
                onClick={() => setDeleteModal({ show: true, id: null, type: 'all' })}
                className="px-6 py-2.5 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg"
              >
                Wipe Vault
              </button>
            )}
            <div className="flex items-center gap-4 bg-slate-900/40 p-2 rounded-2xl border border-white/5 shadow-xl">
               <div className="px-5 py-2 border-r border-white/5 text-right">
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Global Status</p>
                  <p className="text-emerald-400 font-mono text-xs font-black uppercase tracking-tighter italic">Optimized</p>
               </div>
               <div className="flex items-center gap-3 px-4">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></span>
                  <span className="text-[10px] font-black uppercase tracking-widest italic text-slate-300">Live Intel</span>
               </div>
            </div>
          </div>
        </div>

        {statusMsg.text && (
          <div className={`mb-8 p-5 rounded-2xl border text-[11px] font-black uppercase tracking-[0.2em] animate-in slide-in-from-top-4 shadow-2xl ${statusMsg.type === 'error' ? 'bg-red-900/80 border-red-500/50 text-red-400' : 'bg-slate-900/80 border-cyan-500/30 text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.1)]'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-2 h-2 rounded-full animate-pulse ${statusMsg.type === 'error' ? 'bg-red-500' : 'bg-cyan-500'}`}></div>
              {statusMsg.text}
            </div>
          </div>
        )}

        {/* ANALYTICS / OVERVIEW */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 animate-in fade-in duration-700">
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Network Identities', val: dbUsers.length, trend: 'Synced', color: 'cyan' },
                { label: 'Active Threat Sims', val: campaigns.filter(c => c.status === 'In Progress').length, trend: 'Live', color: 'yellow' },
                { label: 'Logs Indexed', val: logs.length, trend: 'Active', color: 'blue' },
                { label: 'System Uptime', val: '99.98%', trend: 'Stable', color: 'emerald' },
              ].map((stat, i) => (
                <div key={i} className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-md hover:border-cyan-500/20 transition-all group">
                  <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-2 italic">{stat.label}</p>
                  <div className="flex justify-between items-end">
                    <h3 className="text-3xl font-black text-white italic tracking-tighter">{stat.val}</h3>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg bg-white/5 text-${stat.color}-400`}>{stat.trend}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-12 gap-8">
              
              <div className="col-span-12 lg:col-span-5 bg-gradient-to-br from-cyan-600 to-blue-800 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <p className="text-white/60 text-xs font-black uppercase tracking-widest mb-2 italic">Global Integrity Index</p>
                    <h3 className="text-9xl font-black text-white italic tracking-tighter leading-none">{globalIntegrity}<span className="text-4xl text-cyan-300">%</span></h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-white/80 tracking-widest"><span>System Health</span><span className="text-emerald-300 font-black">Excellent</span></div>
                    <div className="h-2 w-full bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/10">
                       <div className="h-full bg-white rounded-full shadow-[0_0_15px_white] transition-all duration-1000" style={{width: `${globalIntegrity}%`}}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-7 bg-slate-900/40 border border-white/5 rounded-[3rem] p-10 backdrop-blur-sm relative overflow-hidden">
                <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-10 flex justify-between">
                  <span>Network Pulse / Real-time Analytics</span>
                  <span className="text-cyan-500 animate-pulse font-mono tracking-tighter">NODE_77_ACTIVE</span>
                </h4>
                
                <div className="h-40 relative">
                  <Line data={trafficChartData} options={trafficChartOptions} />
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-3 text-center">
                   <div><p className="text-[8px] text-slate-500 uppercase font-black mb-1 tracking-widest">Encrypted</p><p className="text-white font-black italic">1.4 TB</p></div>
                   <div className="border-x border-white/5"><p className="text-[8px] text-slate-500 uppercase font-black mb-1 tracking-widest">Threat Detect</p><p className="text-cyan-400 font-black italic">0.02%</p></div>
                   <div><p className="text-[8px] text-slate-500 uppercase font-black mb-1 tracking-widest">Active Nodes</p><p className="text-white font-black italic">12 / 12</p></div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/20 border border-white/5 p-10 rounded-[3rem] shadow-2xl relative">
               <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mb-10 text-center italic">Departmental Threat Matrix</h3>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                 {departments.map(d => (
                   <div key={d.name} className="p-6 bg-black/20 rounded-[2rem] border border-white/5 hover:border-cyan-500/30 transition-all duration-500 group relative overflow-hidden">
                      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${d.risk > 50 ? 'bg-gradient-to-br from-red-600/10 to-red-900/30' : 'bg-gradient-to-br from-cyan-600/10 to-blue-900/30'}`}></div>
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                          <span className="text-white font-black italic text-xs uppercase tracking-tighter">{d.name}</span>
                          <span className={`text-[8px] px-2 py-0.5 rounded font-black uppercase ${d.risk > 50 ? 'bg-red-500/10 text-red-400' : 'bg-cyan-500/10 text-cyan-400'}`}>{d.status}</span>
                        </div>
                        <div className="flex justify-between items-end mb-2">
                          <span className={`text-2xl font-black italic ${d.risk > 50 ? 'text-red-400' : 'text-white'}`}>{d.risk}%</span>
                          <span className="text-[9px] font-bold text-slate-500 uppercase">Risk Lvl</span>
                        </div>
                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-1000 ${d.risk > 50 ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-cyan-500 shadow-[0_0_10px_#06b6d4]'}`} style={{ width: `${d.risk}%` }}></div>
                        </div>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {/* AI GENERATOR */}
        {activeTab === 'ai-generator' && (
          <div className="max-w-3xl mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-700">
            <div className="bg-slate-900/40 border border-white/5 p-16 rounded-[4rem] text-center shadow-2xl backdrop-blur-md">
              <div className="w-24 h-24 bg-cyan-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-cyan-500/20"><span className="text-4xl">🤖</span></div>
              <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Adversary Synthesis</h3>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-10 opacity-70">Utilize AI core to generate high-fidelity scenarios.</p>
              <div className="relative group max-w-2xl mx-auto">
                <input type="text" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Introduceți contextul simulării..." className="w-full bg-slate-950 border-2 border-slate-800 p-7 rounded-[2rem] text-white focus:border-cyan-500 outline-none transition-all placeholder:text-slate-700 italic font-medium" />
                <button onClick={handleGenerateAI} disabled={isGenerating} className="absolute right-3 top-3 bottom-3 bg-cyan-500 text-black px-10 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest hover:bg-cyan-400 disabled:opacity-20 transition-all active:scale-95 shadow-xl shadow-cyan-500/20">{isGenerating ? 'Analyzing...' : 'Generate'}</button>
              </div>
            </div>
            {generatedMission && (
              <div className="bg-slate-900/80 border border-cyan-500/30 p-12 rounded-[3.5rem] space-y-10 animate-in zoom-in-95 shadow-2xl">
                <div className="flex justify-between items-center border-b border-white/5 pb-8">
                  <div><p className="text-[10px] font-black text-cyan-500 uppercase italic mb-2 tracking-widest">Threat Intel Ready</p><h4 className="text-4xl font-black text-white italic tracking-tighter leading-tight">{generatedMission.title}</h4></div>
                  <span className="bg-slate-800 px-5 py-2 rounded-2xl text-[10px] text-white font-black uppercase border border-white/10">{generatedMission.tone}</span>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="bg-black/40 p-8 rounded-[2rem] border border-white/5"><p className="text-[9px] text-slate-500 uppercase font-black mb-3 italic tracking-widest">Spoofed Origin</p><p className="text-red-400 font-mono text-sm font-bold">{generatedMission.domain}</p></div>
                  <div className="bg-black/40 p-8 rounded-[2rem] border border-white/5"><p className="text-[9px] text-slate-500 uppercase font-black mb-3 italic tracking-widest">Attack Vector</p><p className="text-cyan-400 font-mono text-sm font-bold">{generatedMission.link}</p></div>
                </div>
                <button onClick={handleDeploy} className="w-full py-7 bg-white text-black rounded-[2.5rem] font-black uppercase text-xs tracking-[0.4em] hover:bg-cyan-500 transition-all shadow-2xl active:scale-95">Deploy Attack</button>
              </div>
            )}
          </div>
        )}

        {/* CAMPAIGNS */}
        {activeTab === 'campaigns' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-700">
            {campaigns.map(camp => {
              const penetration = calculatePenetration(camp.targets);
              return (
                <div key={camp._id} className="bg-slate-900/40 border border-white/5 p-10 rounded-[3.5rem] relative group hover:border-cyan-500/30 transition-all shadow-2xl">
                  <button onClick={() => setDeleteModal({ show: true, id: camp._id, type: 'single' })} className="absolute top-8 right-8 w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white">×</button>
                  <div className="mb-10"><h4 className="text-white font-black text-2xl italic uppercase tracking-tighter mb-2 leading-tight pr-8">{camp.title}</h4><p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{camp.domain}</p></div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase italic"><span>Attack Conversion</span><span className="text-white">{penetration}%</span></div>
                    <div className="h-2 w-full bg-black rounded-full overflow-hidden p-0.5 border border-white/5">
                      <div className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-cyan-500 rounded-full transition-all duration-1000" style={{width: `${penetration}%`}}></div>
                    </div>
                  </div>
                  <div className="pt-10 flex gap-4">
                    <button onClick={() => setSelectedCampaign(camp)} className="flex-1 py-4 bg-slate-800 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">Details</button>
                    <button onClick={() => handleExportPDF(camp)} className="flex-1 py-4 bg-cyan-600/10 border border-cyan-500/20 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all flex items-center justify-center gap-2">
                      <span>📄</span> Report PDF
                    </button>
                  </div>
                </div>
              );
            })}
            {campaigns.length === 0 && <div className="col-span-2 py-40 text-center text-slate-600 font-black uppercase tracking-[0.4em] italic opacity-50">Empty Mission Archive</div>}
          </div>
        )}

        {/* LOGS CU VALIDATOR DE INTEGRITATE */}
        {activeTab === 'logs' && (
          <div className="animate-in slide-in-from-bottom-5 duration-700 space-y-6">
             
             {/* HEADER PANOU SCANARE */}
             <div className="bg-slate-900/60 border border-white/5 p-8 rounded-[2.5rem] flex items-center justify-between shadow-xl backdrop-blur-md">
                <div>
                  <h3 className="text-white font-black uppercase tracking-widest text-sm mb-1 italic">Blockchain Validator</h3>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Verifică integritatea logurilor contra manipulărilor SQL Injection / Manuale.</p>
                </div>
                <div className="flex items-center gap-6">
                  {integrityState.status !== 'idle' && (
                    <span className={`text-[10px] font-black uppercase tracking-widest italic border px-4 py-2 rounded-xl ${
                      integrityState.status === 'checking' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10 animate-pulse' :
                      integrityState.status === 'valid' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                      'text-red-400 border-red-500/30 bg-red-500/10'
                    }`}>
                      {integrityState.message}
                    </span>
                  )}
                  <button 
                    onClick={runIntegrityCheck}
                    disabled={integrityState.status === 'checking'}
                    className="bg-cyan-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-cyan-500 transition-all disabled:opacity-50 disabled:cursor-wait shadow-lg shadow-cyan-600/20"
                  >
                    {integrityState.status === 'checking' ? 'Scanning...' : 'Run Integrity Check'}
                  </button>
                </div>
             </div>

             <div className="bg-slate-900/40 border border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl">
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar italic font-medium">
                  <table className="w-full text-left text-xs uppercase">
                    <thead className="bg-black/60 text-slate-500 font-black tracking-widest sticky top-0 backdrop-blur-md z-10">
                      <tr>
                        <th className="p-8">Date & Time</th>
                        <th className="p-8">Status</th>
                        <th className="p-8">Entity</th>
                        <th className="p-8">Fingerprint (Hash / IP)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {logs.map((l, i) => (
                        <tr key={i} className={`transition-all duration-300 ${integrityState.brokenId === l._id ? 'bg-red-500/20 border-l-4 border-red-500 shadow-[inset_0_0_20px_rgba(239,68,68,0.2)]' : 'hover:bg-white/[0.02]'}`}>
                          <td className="p-8 text-slate-400 font-mono italic text-[10px]">
                            {new Date(l.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="p-8">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black border ${l.action.includes('FAIL') || l.action.includes('ERROR') || l.action.includes('VIOLATION') || l.action.includes('LOCKED') || l.action.includes('SUSPICIOUS') ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'}`}>
                              {l.action}
                            </span>
                          </td>
                          <td className="p-8 text-white font-black">{l.userName}</td>
                          <td className="p-8">
                             <div className="flex flex-col gap-1">
                                <span className="text-slate-500 text-[9px] lowercase italic">-- {l.details}</span>
                                <span className="text-cyan-600/50 font-mono text-[8px] uppercase tracking-wider mt-1">Hash: {l.currentHash ? l.currentHash.substring(0, 15) + '...' : 'N/A'} | IP: {l.ip || 'INTERNAL'}</span>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* MODAL DETALII */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-[#0f172a] border border-cyan-500/30 w-full max-w-3xl rounded-[4rem] p-12 shadow-2xl relative overflow-hidden">
            <button onClick={() => setSelectedCampaign(null)} className="absolute top-10 right-10 text-slate-500 hover:text-white text-3xl font-black transition-all">×</button>
            <h3 className="text-white text-3xl font-black uppercase italic mb-8 tracking-tighter">Forensic Intel</h3>
            <div className="max-h-[400px] overflow-y-auto pr-6 custom-scrollbar">
              <table className="w-full text-[11px] font-bold text-left uppercase italic">
                <thead className="text-slate-500 border-b border-white/10 italic"><tr><th className="py-4">Target Identity</th><th className="py-4">Unit</th><th className="py-4 text-right">Status</th></tr></thead>
                <tbody className="divide-y divide-white/5 font-bold italic">{selectedCampaign.targets.map((t, idx) => (<tr key={idx}><td className="py-5 text-white italic">{t.name}</td><td className="py-5 text-slate-500 font-mono text-[10px]">{t.dept}</td><td className="py-5 text-right"><span className={`px-3 py-1 rounded-lg text-[9px] font-black ${t.currentStatus === 'Compromised' ? 'bg-red-500 text-white animate-pulse shadow-[0_0_10px_red]' : 'bg-emerald-500/10 text-emerald-400'}`}>{t.currentStatus}</span></td></tr>))}</tbody>
              </table>
            </div>
            <button onClick={() => setSelectedCampaign(null)} className="mt-12 w-full py-5 bg-cyan-600 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-cyan-500 transition-all italic shadow-xl shadow-cyan-600/20">Close Forensics</button>
          </div>
        </div>
      )}

      {/* MODAL ȘTERGERE */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[200] flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-slate-900 border border-red-500/30 max-w-md w-full rounded-[3.5rem] p-12 text-center shadow-[0_0_100px_rgba(239,68,68,0.15)] relative overflow-hidden">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20 animate-pulse"><span className="text-red-500 text-3xl font-black">!</span></div>
            <h3 className="text-white text-2xl font-black uppercase italic mb-4 tracking-tighter">Database Warning</h3>
            <p className="text-slate-500 text-xs mb-10 leading-relaxed font-bold uppercase tracking-widest italic">Confirmarea va duce la eliminarea permanentă a vectorilor de atac selectați.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteModal({ show: false, id: null, type: 'single' })} className="flex-1 py-5 bg-slate-800 text-slate-400 rounded-3xl font-black uppercase text-[10px] hover:bg-white hover:text-black transition-all">Abandonează</button>
              <button onClick={handleExecuteDelete} className="flex-1 py-5 bg-red-600 text-white rounded-3xl font-black uppercase text-[10px] hover:bg-red-500 transition-all italic">Wipe Data</button>
            </div>
          </div>
        </div>
      )}

      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 20px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #06b6d4; } @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } .animate-in { animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }`}</style>
    </div>
  );
};

export default AdminDashboard;