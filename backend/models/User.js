const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  integrity: { type: Number, default: 100 },
  badges: { type: [String], default: ["🛡️ Recruit"] },
  completedMissions: { type: [Number], default: [] },
  passedMissions: { type: [Number], default: [] },
  reactionTimes: { type: [Number], default: [] },
  failedCategories: { type: [String], default: [] }
});

module.exports = mongoose.model('User', UserSchema);