require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto'); 

const app = express();
app.use(cors());
app.use(express.json());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Sistem de securitate: Acces blocat temporar (IP suspect)." },
  standardHeaders: true,
  legacyHeaders: false,
});

mongoose.connect('mongodb://127.0.0.1:27017/gamificare_db')
  .then(() => console.log("🔥 DB: CONECTAT LOCAL MONGODB"))
  .catch(err => console.error("❌ EROARE CONEXIUNE DB:", err));

const AuditLog = mongoose.model('AuditLog', new mongoose.Schema({
  action: String,   
  userName: String,
  details: String,
  ip: String,          
  userAgent: String,   
  timestamp: { type: Date, default: Date.now },
  prevHash: String,    
  currentHash: String  
}));

const User = mongoose.model('User', new mongoose.Schema({
  name: { type: String, unique: true, required: true }, 
  password: { type: String, required: true }, 
  email: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['EMPLOYEE', 'ANALYST', 'ADMIN'], 
    default: 'EMPLOYEE' 
  },
  isBlocked: { type: Boolean, default: false },
  mfaCode: String,      
  mfaExpires: Date,     
  level: { type: Number, default: 1 }, 
  xp: { type: Number, default: 0 }, 
  score: { type: Number, default: 0 }, 
  integrity: { type: Number, default: 100 }, 
  badges: [String], 
  completedMissions: [Number],
  passedMissions: [Number],
  reactionTimes: [Number],
  failedCategories: [String],
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date }
}));

const Campaign = mongoose.model('Campaign', new mongoose.Schema({
  title: String, 
  domain: String, 
  status: { type: String, default: 'In Progress' },
  createdAt: { type: Date, default: Date.now },
  targets: [{ 
    name: String, 
    dept: String, 
    currentStatus: String, 
    finalStatus: String 
  }]
}));

const logSecurityEvent = async (action, userName, details, req = null) => {
  try {
    const lastLog = await AuditLog.findOne().sort({ timestamp: -1 });
    const prevHash = lastLog ? lastLog.currentHash : "GENESIS_BLOCK_0000";

    const ip = req ? req.ip : 'INTERNAL_SYS';
    const ua = req ? req.headers['user-agent'] : 'SECURE_CORE';

    const logString = action + userName + details + prevHash + ip + ua;
    const currentHash = crypto.createHash('sha256').update(logString).digest('hex');

    await new AuditLog({
      action, userName, details, ip, userAgent: ua, prevHash, currentHash
    }).save();
    
    console.log(`[AUDIT]: ${action} | Hash: ${currentHash.substring(0, 8)}`);
  } catch (e) { console.error("Eroare Audit:", e); }
};

const authorize = (roles = []) => {
  return (req, res, next) => {
    const userRole = req.headers['x-role'] || 'EMPLOYEE'; 
    
    if (roles.length && !roles.includes(userRole)) {
      logSecurityEvent('RBAC_VIOLATION', 'Unknown', `Acces refuzat la rută. Rol necesar: ${roles}`, req);
      return res.status(403).json({ error: "Acces interzis: Rol insuficient." });
    }
    next();
  };
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET || 'secret_key', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, password, email, role } = req.body;
    const existingUser = await User.findOne({ name });
    if (existingUser) return res.status(400).json({ error: "Utilizatorul există deja!" });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ 
        name, 
        password: hashedPassword, 
        email, 
        role: role || 'EMPLOYEE' 
    });
    
    await newUser.save();
    await logSecurityEvent('REGISTER', name, `Creat cu rol: ${role || 'EMPLOYEE'}`, req);
    res.status(201).json({ message: "Utilizator înregistrat" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/login-step1', loginLimiter, async (req, res) => {
  try {
    const { name, password } = req.body;
    const user = await User.findOne({ name });

    if (!user) return res.status(400).json({ error: "Utilizator inexistent" });
    if (user.isBlocked) return res.status(403).json({ error: "Cont suspendat manual." });

    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(403).json({ error: `Cont blocat anti-brute. Reîncearcă în ${minutesLeft} min.` });
    }

    if (await bcrypt.compare(password, user.password)) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      user.mfaCode = code;
      user.mfaExpires = Date.now() + 5 * 60 * 1000; 
      await user.save();
      
      await logSecurityEvent('MFA_TRIGGERED', name, 'Parolă corectă, emis cod 2FA.', req);
      console.log(`\n[🔒 MFA] Cod pentru ${name}: ${code}\n`);
      return res.json({ requiresMFA: true });
    }

    user.loginAttempts += 1;
    if (user.loginAttempts >= 5) {
      user.lockUntil = Date.now() + 15 * 60 * 1000;
      await logSecurityEvent('ACCOUNT_LOCKED', name, 'Blocat după 5 încercări eșuate.', req);
    } else {
      await logSecurityEvent('LOGIN_FAIL', name, `Tentativă eșuată (${user.loginAttempts}/5)`, req);
    }
    
    await user.save();
    res.status(400).json({ error: `Date incorecte. Mai ai ${5 - user.loginAttempts} încercări.` });

  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/verify-mfa', async (req, res) => {
  try {
    const { name, code } = req.body;
    const user = await User.findOne({ name, mfaCode: code, mfaExpires: { $gt: Date.now() } });
    
    if (!user) {
      await logSecurityEvent('MFA_ERROR', name, 'Cod 2FA invalid sau expirat', req);
      return res.status(400).json({ error: "Cod invalid" });
    }

    user.mfaCode = null;
    await user.save();
    
    const token = jwt.sign(
        { id: user._id, name: user.name, role: user.role }, 
        process.env.JWT_SECRET || 'secret_key', 
        { expiresIn: '2h' }
    );
    
    await logSecurityEvent('LOGIN_SUCCESS', name, 'Sesiune activată.', req);
    res.json({ token, user: { name: user.name, role: user.role } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "Utilizator negăsit" });
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/user/sync', authenticateToken, async (req, res) => {
  try {
    const { 
      level, xp, score, integrity, badges, 
      reactionTimes, failedCategories, completedMissions, passedMissions 
    } = req.body;
    
    await User.findByIdAndUpdate(req.user.id, {
      level, xp, score, integrity, badges, 
      reactionTimes, failedCategories, completedMissions, passedMissions
    });
    
    res.json({ success: true, message: "Progres salvat cu succes!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/logs', authorize(['ADMIN', 'ANALYST']), async (req, res) => {
  const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
  res.json(logs);
});

app.get('/api/leaderboard', async (req, res) => {
  const users = await User.find().sort({ score: -1 });
  res.json(users);
});

app.get('/api/campaigns', authorize(['ADMIN', 'ANALYST']), async (req, res) => {
  const camps = await Campaign.find().sort({ createdAt: -1 });
  res.json(camps);
});

app.post('/api/campaigns', authorize(['ADMIN']), async (req, res) => {
  const camp = new Campaign(req.body); 
  await camp.save();
  await logSecurityEvent('CAMPAIGN_CREATE', 'ADMIN', `Creat: ${camp.title}`, req);
  res.status(201).json(camp);
});

app.delete('/api/campaigns', authorize(['ADMIN']), async (req, res) => {
  await Campaign.deleteMany({});
  await logSecurityEvent('DATABASE_WIPE', 'ADMIN', 'Toate campaniile șterse.', req);
  res.json({ success: true });
});

app.post('/api/generate-threat', async (req, res) => {
  try {
    const { prompt } = req.body;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Expert SOC. Generează phishing JSON pentru: "${prompt}". Structură: {"title":"", "domain":"", "link":"", "tone":""}` }] }]
      })
    });
    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    res.json(JSON.parse(text.match(/\{[\s\S]*\}/)[0]));
  } catch (err) { res.status(500).json({ error: "AI Error" }); }
});

app.listen(5000, () => {
  console.log(`\n🚀 FORTRESS SERVER ACTIV PE 5000`);
  console.log(`🛡️  PROTECȚII: ANTI-BRUTE, RBAC, HASH-CHAIN LOGS\n`);
});