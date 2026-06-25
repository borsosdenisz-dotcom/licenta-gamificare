import React, { useState, useEffect } from 'react'
import { GameProvider } from './context/GameContext'
import UserProfile from './components/UserProfile'
import SecurityLab from './components/SecurityLab'
import Leaderboard from './components/Leaderboard'
import SkillMatrix from './components/SkillMatrix'
import QuestLog from './components/QuestLog'
import AdminDashboard from './components/AdminDashboard'
import Auth from './components/Auth'

// ==========================================
// 📊 COMPONENTA DASHBOARD (PANOU ANGAJAT)
// ==========================================
function Dashboard({ onAdminEnter, onLogout, user }) {
  return (
    <div className="min-h-screen p-6 md:p-10 relative bg-[#020617] selection:bg-yellow-500/30">
      
      <div className="max-w-[1600px] mx-auto relative">
        <div className="absolute -top-4 right-0 z-50 flex gap-4">
          {/* BUTON LOGOUT - DISPONIBIL PENTRU TOȚI */}
          <button 
            onClick={onLogout} 
            className="px-4 py-2 bg-red-500/10 text-red-500 text-[9px] font-black uppercase rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all backdrop-blur-md"
          >
            [ Terminate Session ]
          </button>

          {/* 🔥 BUTON ADMIN - REPARAT (AM ȘTERS COMENTARIILE) */}
          {user?.role === 'ADMIN' && (
            <button 
              onClick={onAdminEnter} 
              className="px-4 py-2 bg-slate-900/80 text-slate-500 text-[9px] font-black uppercase rounded-xl border border-slate-800 hover:text-yellow-500 hover:border-yellow-500/30 transition-all backdrop-blur-md"
            >
              [ Admin Console ]
            </button>
          )}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-8 mt-10 items-start">
        <div className="col-span-12 lg:col-span-3 space-y-8">
          <UserProfile user={user} />
          <SkillMatrix />
        </div>
        <div className="col-span-12 lg:col-span-6 space-y-8">
          <SecurityLab />
          <Leaderboard />
        </div>
        <div className="col-span-12 lg:col-span-3">
          <QuestLog />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 🚀 COMPONENTA PRINCIPALĂ (APP)
// ==========================================
function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // 🔄 Verificăm dacă există o sesiune activă la încărcare
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // 🚪 Funcție de Login
  const handleLoginSuccess = (userData) => {
    // Presupunem că Auth.jsx salvează tokenul separat
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  // 🚪 Funcție de Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <>
      {!user ? (
        // 🔐 Dacă nu e logat, arătăm ecranul de Auth
        <Auth onLoginSuccess={handleLoginSuccess} />
      ) : (
        // ✅ Dacă e logat, pornim GameProvider și rândăm panoul corect
        <GameProvider>
          {isAdmin ? (
            <AdminDashboard onExit={() => setIsAdmin(false)} />
          ) : (
            <Dashboard 
              user={user} 
              onAdminEnter={() => setIsAdmin(true)} 
              onLogout={handleLogout}
            />
          )}
        </GameProvider>
      )}
    </>
  )
}

export default App;