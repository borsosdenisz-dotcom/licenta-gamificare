import { createContext, useState, useContext, useEffect } from 'react';
import AchievementPopup from '../components/AchievementPopup'; 

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

  const initialState = {
    name: storedUser.name || "Anonim",
    level: 1, 
    xp: 0, 
    maxXp: 100,
    score: 0,
    integrity: 100, 
    badges: ["🛡️ Recruit"],
    reactionTimes: [],     
    failedCategories: []   
  };

  const [user, setUser] = useState(initialState);
  const [completedIds, setCompletedIds] = useState([]);
  const [passedIds, setPassedIds] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false); 
  
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [lastBadge, setLastBadge] = useState("");
  const [isSimulationActive, setIsSimulationActive] = useState(false);

  const [staticMissions] = useState([
    { id: 1, category: "Phishing Defense", title: "Email Suspect IT", description: "Primești un email de la 'admin-portal@company-security.com' care spune că parola ta expiră. Conține un link de 'Quick Reset'. Ce faci?", options: [{ id: '1a', text: "Accesez link-ul pentru a nu pierde accesul.", correct: false }, { id: '1b', text: "Verific adresa reală și raportez email-ul.", correct: true }], xp: 25 },
    { id: 2, category: "Social Engineering", title: "Intrusul Politicos", description: "Un curier cu mâinile ocupate te roagă să-i ții ușa de la intrarea securizată deschisă. Nu are badge vizibil.", options: [{ id: '2a', text: "Îi țin ușa, este politicos să ajut.", correct: false }, { id: '2b', text: "Îl rog să folosească interfonul pentru acces.", correct: true }], xp: 25 },
    { id: 3, category: "Safe Browsing", title: "Wi-Fi Public", description: "Ești la aeroport și trebuie să te loghezi în portalul companiei. Există o rețea deschisă 'Free_Airport_WiFi'.", options: [{ id: '3a', text: "Mă conectez și pornesc imediat VPN-ul oficial.", correct: true }, { id: '3b', text: "Mă conectez direct, site-ul are HTTPS.", correct: false }], xp: 25 },
    { id: 4, category: "Password Hygiene", title: "Pauza de Masă", description: "Pleci la prânz. Laptopul rămâne pe birou într-un spațiu de tip open-office.", options: [{ id: '4a', text: "Îl las deschis, biroul este supravegheat video.", correct: false }, { id: '4b', text: "Blochez ecranul (Win + L).", correct: true }], xp: 25 },
    { id: 5, category: "Password Hygiene", title: "Partajarea Parolei", description: "Managerul tău îți cere parola de la un cont de test prin mesaj privat pe Slack.", options: [{ id: '5a', text: "I-o trimit, este managerul meu.", correct: false }, { id: '5b', text: "Refuz și îi propun un Password Manager.", correct: true }], xp: 25 },
    { id: 6, category: "Social Engineering", title: "Apel de la 'CEO'", description: "Cineva care pretinde că e CEO-ul îți cere să transferi niste date pe WhatsApp.", options: [{ id: '6a', text: "Execut imediat.", correct: false }, { id: '6b', text: "Verific pe canalul oficial.", correct: true }], xp: 25 },
    { id: 7, category: "Social Engineering", title: "Documente Imprimate", description: "Găsești un raport salarial lăsat nesupravegheat la imprimantă.", options: [{ id: '7a', text: "Îl las acolo.", correct: false }, { id: '7b', text: "Îl predau la HR.", correct: true }], xp: 25 },
    { id: 8, category: "Phishing Defense", title: "Mesaj SMS (Smishing)", description: "Primești un SMS: 'Pachetul tău a fost reținut. Plătește aici: bit.ly/posta'.", options: [{ id: '8a', text: "Plătesc rapid.", correct: false }, { id: '8b', text: "Șterg și blochez.", correct: true }], xp: 25 },
    { id: 9, category: "Safe Browsing", title: "USB-ul 'Norocos'", description: "Găsești un stick USB în parcarea firmei pe care scrie 'Lista Bonusuri'.", options: [{ id: '9a', text: "Îl duc la Security IT.", correct: true }, { id: '9b', text: "Îl verific pe laptop.", correct: false }], xp: 25 },
    { id: 10, category: "Social Engineering", title: "Shoulder Surfing", description: "În tren, cineva se uită atent la ecranul tău în timp ce lucrezi.", options: [{ id: '10a', text: "Închid laptopul.", correct: true }, { id: '10b', text: "Continui, e în siguranță.", correct: false }], xp: 25 },
    { id: 11, category: "Password Hygiene", title: "Autentificare MFA", description: "Care este cea mai sigură metodă de recepționare a codului MFA?", options: [{ id: '11a', text: "SMS.", correct: false }, { id: '11b', text: "Aplicație de autentificare.", correct: true }], xp: 25 },
    { id: 12, category: "Phishing Defense", title: "Echipament Pierdut", description: "Ai pierdut laptopul de muncă. Ce faci prima dată?", options: [{ id: '12a', text: "Anunț imediat echipa de securitate IT.", correct: true }, { id: '12b', text: "Îl caut singur prin Cloud.", correct: false }], xp: 25 }
  ]);

  const [missions, setMissions] = useState(staticMissions);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    const fetchData = async () => {
      try {
        const profileRes = await fetch(`http://localhost:5000/api/user/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (profileRes.ok) {
            const data = await profileRes.json();
            setUser({
                name: data.name || storedUser.name,
                level: data.level || 1,
                xp: data.xp || 0,
                maxXp: 100,
                score: data.score || 0,
                integrity: data.integrity !== undefined ? data.integrity : 100,
                badges: data.badges && data.badges.length ? data.badges : ["🛡️ Recruit"],
                reactionTimes: data.reactionTimes || [],     
                failedCategories: data.failedCategories || [] 
            });
            setCompletedIds(data.completedMissions || []);
            setPassedIds(data.passedMissions || []);
            if (data.completedMissions && data.completedMissions.length > 0) {
                setIsSimulationActive(true);
            }
        }

        const campaignsRes = await fetch(`http://localhost:5000/api/campaigns/active`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (campaignsRes.ok) {
            const aiCampaigns = await campaignsRes.json();
            const formattedAiMissions = aiCampaigns.map(camp => ({
                id: camp._id,
                category: "AI Threat Intel",
                title: camp.title,
                description: `Sistemul a interceptat o amenințare de la domeniul: ${camp.domain}. Cum procedezi?`,
                options: [
                    { id: `${camp._id}a`, text: "Pare legitim, îl accesez.", correct: false }, 
                    { id: `${camp._id}b`, text: "Raportez atacatorul către SOC.", correct: true }
                ],
                xp: 50
            }));
            setMissions([...staticMissions, ...formattedAiMissions]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const syncToBackend = async () => {
      try {
        await fetch('http://localhost:5000/api/user/sync', {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            level: user.level,
            xp: user.xp,
            score: user.score,
            integrity: user.integrity,
            badges: user.badges,
            reactionTimes: user.reactionTimes,      
            failedCategories: user.failedCategories, 
            completedMissions: completedIds,
            passedMissions: passedIds
          })
        });
      } catch (err) { console.error(err); }
    };
    
    syncToBackend();
  }, [user, completedIds, passedIds, isLoaded]);

  const resetGame = () => {
    setUser({ ...initialState, name: user.name });
    setCompletedIds([]);
    setPassedIds([]);
    setShowLevelUp(false);
    setIsSimulationActive(false); 
  };

  const completeMission = (id, isCorrect, timeSpent = 0) => {
    if (completedIds.includes(id)) return { success: true };

    const mission = missions.find(m => m.id === id);
    if (!mission) return { success: false };
    
    const punctajMisiune = mission.xp * 10;
    let noileCategoriiPicate = [...(user.failedCategories || [])];
    
    if (!isCorrect) {
      noileCategoriiPicate.push(mission.category); 
    }

    let noiiTimpiDeReactie = [...(user.reactionTimes || []), timeSpent]; 

    if (!isCorrect) {
      setUser(prev => ({ 
        ...prev, 
        integrity: Math.max(0, (prev.integrity || 100) - 20),
        score: prev.score - punctajMisiune,
        failedCategories: noileCategoriiPicate, 
        reactionTimes: noiiTimpiDeReactie
      }));
      setCompletedIds(prev => [...prev, id]); 
      return { success: false };
    }

    let nXp = user.xp + mission.xp;
    let nLvl = user.level;
    let nScore = user.score + punctajMisiune; 
    let nBadges = [...user.badges];
    let didLevelUp = false;

    if (nXp >= user.maxXp) {
      nLvl++;
      nXp -= user.maxXp;
      didLevelUp = true;
      let newBadge = nLvl === 2 ? "⚔️ Specialist" : nLvl === 3 ? "🛡️ Analyst" : nLvl === 4 ? "🎖️ Sentinel" : "";
      
      if (newBadge && !nBadges.includes(newBadge)) {
        nBadges.push(newBadge);
        setLastBadge(newBadge);
      } else {
        setLastBadge("");
      }
    }

    setUser(prev => ({ 
      ...prev, xp: nXp, level: nLvl, score: nScore, badges: nBadges, 
      integrity: prev.integrity, failedCategories: noileCategoriiPicate, reactionTimes: noiiTimpiDeReactie
    }));
    
    setCompletedIds(prev => [...prev, id]);
    setPassedIds(prev => [...prev, id]);
    
    if (didLevelUp) setShowLevelUp(true);
    
    return { success: true };
  };

  return (
    <GameContext.Provider value={{ user, missions, completedIds, passedIds, completeMission, resetGame, showLevelUp, setShowLevelUp, lastBadge, isSimulationActive, setIsSimulationActive }}>
      {children}
      {showLevelUp && (
        <AchievementPopup 
          type={lastBadge ? 'badge' : 'level'}
          title={lastBadge ? 'BADGE OBȚINUT!' : 'LEVEL UP!'}
          message={lastBadge ? `Felicitări! Ai obținut rank-ul de ${lastBadge}.` : `Felicitări! Ai atins Nivelul ${user.level}. Continuați tot așa!`}
          onClose={() => setShowLevelUp(false)}
        />
      )}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);