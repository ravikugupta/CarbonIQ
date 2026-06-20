import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateFootprint } from '../utils/carbonCalculator';
import { saveUserData, getUserData } from '../utils/storage';
import { Car, Plane, Utensils, Zap, Flame, ShoppingBag, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

export default function Calculator() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(() => {
    const existing = getUserData();
    return existing?.inputs || {
      carKm: '',
      flights: '',
      diet: 'average',
      electricityKwh: '',
      gasBillInr: '',
      shoppingSpendInr: ''
    };
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 5));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleComplete = () => {
    const result = calculateFootprint(formData);
    const existing = getUserData() || {};
    
    // Save new data, preserving history or other fields if any
    saveUserData({
      ...existing,
      inputs: formData,
      latestResult: result,
      lastCalculated: new Date().toISOString()
    });
    
    navigate('/');
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Carbon Calculator</h1>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`h-2 flex-1 rounded-full ${step >= i ? 'bg-primaryGreen' : 'bg-gray-700'}`} />
          ))}
        </div>
      </div>

      <div className="bg-[#0f1915] border border-gray-800 rounded-xl p-6 shadow-xl">
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-xl font-semibold flex items-center gap-2"><Car className="text-primaryGreen"/> Transport</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Car Kilometers Driven (Monthly)</label>
                <input type="number" name="carKm" value={formData.carKm} onChange={handleChange}
                  className="w-full bg-darkGreen border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primaryGreen outline-none" placeholder="e.g. 500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2"><Plane size={16}/> Short/Medium Flights (Monthly)</label>
                <input type="number" name="flights" value={formData.flights} onChange={handleChange}
                  className="w-full bg-darkGreen border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primaryGreen outline-none" placeholder="e.g. 0" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-xl font-semibold flex items-center gap-2"><Utensils className="text-primaryGreen"/> Food & Diet</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Diet Type</label>
                <select name="diet" value={formData.diet} onChange={handleChange}
                  className="w-full bg-darkGreen border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primaryGreen outline-none">
                  <option value="meat_heavy">Meat Heavy</option>
                  <option value="average">Average</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-xl font-semibold flex items-center gap-2"><Zap className="text-primaryGreen"/> Home Energy</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Electricity Usage (kWh/month)</label>
                <input type="number" name="electricityKwh" value={formData.electricityKwh} onChange={handleChange}
                  className="w-full bg-darkGreen border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primaryGreen outline-none" placeholder="e.g. 300" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2"><Flame size={16}/> Cooking Gas/PNG Bill (₹/month)</label>
                <input type="number" name="gasBillInr" value={formData.gasBillInr} onChange={handleChange}
                  className="w-full bg-darkGreen border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primaryGreen outline-none" placeholder="e.g. 1000" />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-xl font-semibold flex items-center gap-2"><ShoppingBag className="text-primaryGreen"/> Shopping</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Monthly Spending on Clothes/Electronics (₹)</label>
                <input type="number" name="shoppingSpendInr" value={formData.shoppingSpendInr} onChange={handleChange}
                  className="w-full bg-darkGreen border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primaryGreen outline-none" placeholder="e.g. 2000" />
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 animate-fadeIn text-center">
            <CheckCircle className="mx-auto text-primaryGreen mb-4" size={48} />
            <h2 className="text-2xl font-bold">Ready to Calculate!</h2>
            <p className="text-gray-400">Click finish to calculate your carbon footprint and see your personalized dashboard.</p>
          </div>
        )}

        <div className="mt-8 flex justify-between pt-6 border-t border-gray-800">
          <button 
            onClick={prevStep} 
            disabled={step === 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${step === 1 ? 'opacity-50 cursor-not-allowed text-gray-500' : 'text-gray-300 hover:bg-gray-800'}`}
          >
            <ArrowLeft size={18} /> Back
          </button>
          
          {step < 5 ? (
            <button 
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-2 bg-primaryGreen text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
            >
              Next <ArrowRight size={18} />
            </button>
          ) : (
            <button 
              onClick={handleComplete}
              className="flex items-center gap-2 px-6 py-2 bg-primaryGreen text-white rounded-lg font-medium hover:bg-green-600 transition-colors shadow-[0_0_15px_rgba(35,166,92,0.4)]"
            >
              Finish & Calculate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
