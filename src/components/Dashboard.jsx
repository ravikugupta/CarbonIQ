import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getUserData } from '../utils/storage';
import { Leaf, AlertCircle, ArrowRight, TrendingDown } from 'lucide-react';

const COLORS = ['#23A65C', '#10b981', '#34d399', '#6ee7b7'];

export default function Dashboard() {
  const userData = getUserData();
  const result = userData?.latestResult;

  const scoreData = useMemo(() => {
    if (!result) return null;
    const total = result.total * 12; // Annualize
    let grade = 'F';
    let color = 'text-red-500';
    if (total < 1000)      { grade = 'A+'; color = 'text-emerald-400'; }
    else if (total < 1900) { grade = 'A';  color = 'text-green-400'; }
    else if (total < 3000) { grade = 'B';  color = 'text-yellow-400'; }
    else if (total < 5000) { grade = 'C';  color = 'text-orange-400'; }
    else if (total < 8000) { grade = 'D';  color = 'text-red-400'; }

    return { total, grade, color };
  }, [result]);

  const pieData = useMemo(() => {
    if (!result) return [];
    return [
      { name: 'Transport', value: result.breakdown.transport },
      { name: 'Food', value: result.breakdown.food },
      { name: 'Energy', value: result.breakdown.energy },
      { name: 'Shopping', value: result.breakdown.shopping },
    ].filter(d => d.value > 0);
  }, [result]);

  // Mock historical data for the trend chart, placing the current result as the latest month
  const trendData = useMemo(() => {
    if (!result) return [];
    const base = result.total;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((m, i) => ({
      name: m,
      co2: i === 5 ? base : Math.round(base * (1 + (5 - i) * 0.05)), // fake downward trend
    }));
  }, [result]);

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="p-6 bg-gray-800 rounded-full">
          <Leaf size={48} className="text-gray-500" />
        </div>
        <h2 className="text-2xl font-bold">No data found</h2>
        <p className="text-gray-400">Complete the calculator to see your carbon dashboard.</p>
        <Link to="/calculator" className="flex items-center gap-2 px-6 py-3 bg-primaryGreen text-white rounded-lg font-medium hover:bg-green-600 transition-colors">
          Go to Calculator <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  const indiaAvg = 1900; // India's per-capita CO2 avg ~1.9 tonnes/year
  const diff = scoreData.total - indiaAvg;
  const isBelowAvg = diff < 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Your Dashboard</h1>
          <p className="text-gray-400">Here's a breakdown of your environmental impact.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score Card */}
        <div className="col-span-1 bg-[#0f1915] border border-gray-800 rounded-xl p-6 flex flex-col justify-center items-center relative overflow-hidden shadow-xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primaryGreen to-emerald-400" />
          <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Carbon Grade</h3>
          <div className={`text-7xl font-bold ${scoreData.color} drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] mb-2`}>
            {scoreData.grade}
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-white">{scoreData.total.toLocaleString()}</span>
            <span className="text-gray-400 ml-1">kg CO₂e/year</span>
          </div>
        </div>

        {/* Comparison Card */}
        <div className="col-span-1 md:col-span-2 bg-[#0f1915] border border-gray-800 rounded-xl p-6 shadow-xl flex items-center">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-4">India Comparison</h3>
            <p className="text-gray-300 text-lg leading-relaxed">
              You are emitting <span className={`font-bold ${isBelowAvg ? 'text-green-400' : 'text-red-400'}`}>{Math.abs(diff).toLocaleString()} kg</span> {isBelowAvg ? 'less' : 'more'} than India's average of 1,900 kg per year.
            </p>
            {isBelowAvg ? (
              <div className="mt-4 flex items-center gap-2 text-green-400 bg-green-400/10 px-4 py-2 rounded-lg inline-flex">
                <TrendingDown size={20} />
                <span className="font-medium">Great job! You're below average!</span>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2 text-yellow-400 bg-yellow-400/10 px-4 py-2 rounded-lg inline-flex">
                <AlertCircle size={20} />
                <span className="font-medium">Room for improvement! Check Insights.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className="bg-[#0f1915] border border-gray-800 rounded-xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6">6-Month Trend (kg CO₂e)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="co2" stroke="#23A65C" strokeWidth={3} dot={{ fill: '#23A65C', strokeWidth: 2 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Chart */}
        <div className="bg-[#0f1915] border border-gray-800 rounded-xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6">Monthly Breakdown</h3>
          <div className="h-64 flex">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value) => [`${value} kg`, 'Emissions']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col justify-center space-y-3 w-1/3">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-sm text-gray-300">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
