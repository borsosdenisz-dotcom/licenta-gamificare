import React, { useState } from 'react';

const Auth = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [step, setStep] = useState(1); // 1 = Login/Reg, 2 = Introduce Cod MFA
  const [formData, setFormData] = useState({ name: '', password: '', email: '' });
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState('');
  
  // 🔥 STAT NOU: Controlăm ecranul de succes
  const [regSuccess, setRegSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // CAZUL 1: ÎNREGISTRARE
      if (isRegister) {
        const res = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        if (res.ok) {
          // ✅ ÎN LOC DE ALERT: Activăm ecranul de succes
          setRegSuccess(true);
          
          // Așteptăm 3.5 secunde (timpul animației) înainte de redirect
          setTimeout(() => {
            setRegSuccess(false);
            setIsRegister(false);
            setStep(1);
          }, 3500);
        } else {
          const d = await res.json(); setError(d.error);
        }
        return;
      }

      // CAZUL 2: LOGIN PASUL 1
      if (step === 1) {
        const res = await fetch('http://localhost:5000/api/auth/login-step1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formData.name, password: formData.password })
        });
        const data = await res.json();
        if (res.ok && data.requiresMFA) {
          setStep(2); 
        } else {
          setError(data.error);
        }
        return;
      }

      // CAZUL 3: VERIFICARE COD MFA (PASUL 2)
      if (step === 2) {
        const res = await fetch('http://localhost:5000/api/auth/verify-mfa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formData.name, code: mfaCode })
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('userName', data.user.name);
          onLoginSuccess(data.user);
        } else {
          setError(data.error);
        }
      }
    } catch (err) {
      setError("Eroare conexiune server.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6 font-sans">
      <div className="w-full max-w-md bg-slate-900/50 border border-slate-800 p-10 rounded-[2.5rem] backdrop-blur-xl shadow-2xl relative overflow-hidden">
        
        {/* Decorare Vizuală */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-3xl rounded-full -mr-16 -mt-16"></div>

        {/* 🛡️ CONDITIONARE ECRAN SUCCES */}
        {regSuccess ? (
          <div className="py-10 flex flex-col items-center justify-center space-y-6 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 rounded-full border-2 border-emerald-500 flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping"></div>
              <span className="text-3xl">✔️</span>
            </div>
            <div className="text-center">
              <h2 className="text-emerald-500 font-black text-2xl italic uppercase tracking-tighter">Identity Verified</h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-2 font-mono">Database Entry: SECURE</p>
            </div>
            
            {/* Bara de progres care folosește animația din index.css */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full animate-loading"></div>
            </div>
            
            <p className="text-slate-600 text-[9px] uppercase font-bold italic animate-pulse">Initializing terminal login...</p>
          </div>
        ) : (
          <>
            <h2 className="text-3xl font-black text-white mb-2 text-center italic uppercase tracking-tighter">
              {step === 2 ? 'Verificare 2FA' : isRegister ? 'Creare Profil' : 'Acces Securizat'}
            </h2>
            <p className="text-slate-500 text-center text-[10px] mb-8 uppercase tracking-[0.3em] font-bold font-mono">
              {step === 2 ? 'Introduceți codul primit' : 'Protocol de Identificare v4.0'}
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 1 ? (
                <>
                  <input 
                    type="text" placeholder="Nume Utilizator" required
                    className="w-full bg-slate-800/50 border border-slate-700 p-4 rounded-2xl text-white focus:border-yellow-500 outline-none transition-all placeholder:text-slate-600 text-sm"
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                  {isRegister && (
                    <input 
                      type="email" placeholder="Adresă Email (pentru 2FA)" required
                      className="w-full bg-slate-800/50 border border-slate-700 p-4 rounded-2xl text-white focus:border-yellow-500 outline-none transition-all placeholder:text-slate-600 text-sm"
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  )}
                  <input 
                    type="password" placeholder="Parolă" required
                    className="w-full bg-slate-800/50 border border-slate-700 p-4 rounded-2xl text-white focus:border-yellow-500 outline-none transition-all placeholder:text-slate-600 text-sm"
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </>
              ) : (
                <div className="space-y-6">
                  <input 
                    type="text" placeholder="Ex: 123456" maxLength="6" required
                    className="w-full bg-slate-900 border-2 border-yellow-500/30 p-5 rounded-2xl text-white text-center text-2xl font-black tracking-[0.5em] focus:border-yellow-500 outline-none transition-all"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-500 text-center uppercase font-bold font-mono">Codul expiră în 5 minute</p>
                </div>
              )}

              {error && <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 text-[11px] font-bold text-center italic animate-bounce">{error}</div>}
              
              <button className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black py-4 rounded-2xl transition-all uppercase text-xs tracking-widest shadow-lg active:scale-95">
                {step === 2 ? 'Validare Cod' : isRegister ? 'Finalizare Înregistrare' : 'Autentificare'}
              </button>
            </form>
            
            {step === 1 && (
              <button 
                onClick={() => { setIsRegister(!isRegister); setError(''); }}
                className="w-full mt-6 text-slate-500 text-[10px] uppercase font-bold hover:text-yellow-500 transition-all tracking-widest"
              >
                {isRegister ? '← Înapoi la Logare' : 'Nu ai cont? Protocol Înregistrare'}
              </button>
            )}

            {step === 2 && (
              <button 
                onClick={() => setStep(1)}
                className="w-full mt-6 text-slate-500 text-[10px] uppercase font-bold hover:text-white transition-all tracking-widest"
              >
                ← Încearcă alt cont
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Auth;