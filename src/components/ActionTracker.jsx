import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, Flame, Trophy, Share2 } from 'lucide-react';
import { saveUserData, getUserData } from '../utils/storage';

const ECO_ACTIONS = [
  { id: 1, title: 'Carpool to Work', co2Saved: 5, points: 10, category: 'Transport' },
  { id: 2, title: 'Meatless Monday', co2Saved: 3, points: 15, category: 'Food' },
  { id: 3, title: 'Line Dry Clothes', co2Saved: 2, points: 5, category: 'Energy' },
  { id: 4, title: 'Bike for Errands', co2Saved: 4, points: 12, category: 'Transport' },
  { id: 5, title: 'Unplug Devices', co2Saved: 1, points: 5, category: 'Energy' },
  { id: 6, title: 'Go Vegan for a Day', co2Saved: 4, points: 20, category: 'Food' },
  { id: 7, title: 'Use Reusable Bags', co2Saved: 0.5, points: 5, category: 'Shopping' },
  { id: 8, title: 'Turn Down Thermostat', co2Saved: 3, points: 10, category: 'Energy' },
  { id: 9, title: 'Buy Second-Hand', co2Saved: 5, points: 15, category: 'Shopping' },
  { id: 10, title: 'Public Transit', co2Saved: 6, points: 20, category: 'Transport' },
  { id: 11, title: 'Zero Food Waste Day', co2Saved: 2, points: 10, category: 'Food' },
  { id: 12, title: 'LED Bulb Swap', co2Saved: 1, points: 5, category: 'Energy' },
];

export default function ActionTracker() {
  const [stats, setStats] = useState({ totalPoints: 0, totalCo2Saved: 0, streak: 0, lastActionDate: null });
  const [commitments, setCommitments] = useState([]);
  const [completedActions, setCompletedActions] = useState([]);

  useEffect(() => {
    const data = getUserData()?.actions;
    if (data) {
      setStats(data.stats || { totalPoints: 0, totalCo2Saved: 0, streak: 0, lastActionDate: null });
      setCommitments(data.commitments || []);
      setCompletedActions(data.completedActions || []);
    }
  }, []);

  const saveState = (newStats, newCommitments, newCompleted) => {
    const data = getUserData() || {};
    saveUserData({
      ...data,
      actions: {
        stats: newStats,
        commitments: newCommitments,
        completedActions: newCompleted
      }
    });
  };

  const toggleCommitment = (id) => {
    let newCommits;
    if (commitments.includes(id)) {
      newCommits = commitments.filter(c => c !== id);
    } else {
      newCommits = [...commitments, id];
    }
    setCommitments(newCommits);
    saveState(stats, newCommits, completedActions);
  };

  const completeAction = (action) => {
    if (completedActions.includes(action.id)) return; // already done today

    const today = new Date().toISOString().split('T')[0];
    let newStreak = stats.streak;
    
    if (stats.lastActionDate) {
      const lastDate = new Date(stats.lastActionDate);
      const todayDate = new Date(today);
      const diffTime = Math.abs(todayDate - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1; // reset streak
      }
    } else {
      newStreak = 1;
    }

    const newStats = {
      totalPoints: stats.totalPoints + action.points,
      totalCo2Saved: stats.totalCo2Saved + action.co2Saved,
      streak: newStreak,
      lastActionDate: today
    };

    const newCompleted = [...completedActions, action.id];
    
    setStats(newStats);
    setCompletedActions(newCompleted);
    saveState(newStats, commitments, newCompleted);
  };

  const shareProgress = () => {
    const text = `I'm tracking my Carbon footprint on CarbonIQ! I've saved ${stats.totalCo2Saved}kg of CO2 and earned ${stats.totalPoints} points with a ${stats.streak} day streak! Join me!`;
    if (navigator.share) {
      navigator.share({ title: 'My CarbonIQ Progress', text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Progress copied to clipboard!');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn py-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Target className="text-primaryGreen" size={32} />
            Action Tracker
          </h1>
          <p className="text-gray-400">Commit to daily actions to reduce your footprint.</p>
        </div>
        <button onClick={shareProgress} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors">
          <Share2 size={18} /> Share
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0f1915] border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center shadow-xl">
          <Trophy className="text-yellow-400 mb-2" size={36} />
          <h3 className="text-gray-400 text-sm font-medium uppercase">Total Points</h3>
          <span className="text-4xl font-bold text-white">{stats.totalPoints}</span>
        </div>
        <div className="bg-[#0f1915] border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center shadow-xl">
          <Target className="text-green-400 mb-2" size={36} />
          <h3 className="text-gray-400 text-sm font-medium uppercase">CO₂ Saved</h3>
          <span className="text-4xl font-bold text-white">{stats.totalCo2Saved.toFixed(1)} <span className="text-xl text-gray-500">kg</span></span>
        </div>
        <div className="bg-[#0f1915] border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center shadow-xl">
          <Flame className="text-orange-400 mb-2" size={36} />
          <h3 className="text-gray-400 text-sm font-medium uppercase">Day Streak</h3>
          <span className="text-4xl font-bold text-white">{stats.streak}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ECO_ACTIONS.map(action => {
          const isCommitted = commitments.includes(action.id);
          const isCompleted = completedActions.includes(action.id);
          
          return (
            <div key={action.id} className={`p-5 rounded-xl border transition-all ${isCompleted ? 'bg-primaryGreen/10 border-primaryGreen/30' : 'bg-[#0f1915] border-gray-800 hover:border-gray-600'}`}>
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-semibold px-2 py-1 bg-gray-800 text-gray-300 rounded uppercase tracking-wider">{action.category}</span>
                <div className="text-right">
                  <span className="block text-green-400 font-bold text-sm">+{action.points} pts</span>
                  <span className="block text-gray-400 text-xs">-{action.co2Saved}kg CO₂</span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-4">{action.title}</h3>
              
              <div className="flex gap-2 mt-auto">
                {!isCompleted ? (
                  <>
                    <button 
                      onClick={() => toggleCommitment(action.id)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${isCommitted ? 'border-red-500/50 text-red-400 hover:bg-red-500/10' : 'border-gray-700 text-gray-300 hover:bg-gray-800'}`}
                    >
                      {isCommitted ? 'Uncommit' : 'Commit'}
                    </button>
                    {isCommitted && (
                      <button 
                        onClick={() => completeAction(action)}
                        className="flex-1 py-2 bg-primaryGreen hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={16} /> Done
                      </button>
                    )}
                  </>
                ) : (
                  <div className="w-full py-2 bg-primaryGreen/20 text-primaryGreen rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} /> Completed Today
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
