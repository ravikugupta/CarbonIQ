import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateFootprint } from '../utils/carbonCalculator';
import { saveUserData, getUserData } from '../utils/storage';
import { Car, Plane, Utensils, Zap, Flame, ShoppingBag, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

const MAX_VALUES = {
  carKm: 10000,
  flights: 365,
  electricityKwh: 5000,
  gasBillInr: 100000,
  shoppingSpendInr: 1000000,
};

export default function Calculator() {
  const navigate = useNavigate();
  const headingRef = useRef(null);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
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

  // Move focus to the step heading when the step changes
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const validateField = (name, value) => {
    // diet is a controlled select — always valid, no numeric validation needed
    if (name === 'diet') return null;
    if (value === '' || value === null) return null; // optional fields
    const num = Number(value);
    if (isNaN(num) || num < 0) return 'Please enter a non-negative number.';
    if (MAX_VALUES[name] && num > MAX_VALUES[name]) return `Value seems too high (max ${MAX_VALUES[name].toLocaleString()}).`;
    return null;
  };

  // Fields visible per step — only block Next if the current step has errors
  const STEP_FIELDS = {
    1: ['carKm', 'flights'],
    2: ['diet'],
    3: ['electricityKwh', 'gasBillInr'],
    4: ['shoppingSpendInr'],
    5: [],
  };

  const hasErrors = (STEP_FIELDS[step] || []).some(f => errors[f]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    const err = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: err }));
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 5));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleComplete = () => {
    const result = calculateFootprint(formData);
    const existing = getUserData() || {};
    // Append to history so the Dashboard trend chart has real data
    const historyEntry = { date: new Date().toISOString(), total: result.total, breakdown: result.breakdown };
    const history = [...(existing.history || []), historyEntry].slice(-12); // keep last 12 months
    saveUserData({
      ...existing,
      inputs: formData,
      latestResult: result,
      lastCalculated: new Date().toISOString(),
      history,
    });
    navigate('/');
  };

  const inputClass = "w-full bg-darkGreen border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primaryGreen outline-none";
  const errorClass = "mt-1 text-sm text-red-400";

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Carbon Calculator</h1>
        {/* Progress bar */}
        <div
          className="flex items-center gap-2"
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={5}
          aria-label={`Step ${step} of 5`}
        >
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`h-2 flex-1 rounded-full ${step >= i ? 'bg-primaryGreen' : 'bg-gray-700'}`} />
          ))}
        </div>
        <p className="text-gray-400 text-sm mt-2" aria-live="polite">Step {step} of 5</p>
      </div>

      <div className="bg-[#0f1915] border border-gray-800 rounded-xl p-6 shadow-xl">
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="text-xl font-semibold flex items-center gap-2 outline-none"
            >
              <Car className="text-primaryGreen" aria-hidden="true" /> Transport
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="carKm" className="block text-sm font-medium mb-1">
                  Car Kilometers Driven (Monthly)
                </label>
                <input
                  id="carKm"
                  type="number"
                  name="carKm"
                  value={formData.carKm}
                  onChange={handleChange}
                  min="0"
                  max={MAX_VALUES.carKm}
                  aria-describedby={errors.carKm ? 'carKm-error' : undefined}
                  className={inputClass}
                  placeholder="e.g. 500"
                />
                {errors.carKm && <p id="carKm-error" className={errorClass} role="alert">{errors.carKm}</p>}
              </div>
              <div>
                <label htmlFor="flights" className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <Plane size={16} aria-hidden="true" /> Short/Medium Flights (Monthly)
                </label>
                <input
                  id="flights"
                  type="number"
                  name="flights"
                  value={formData.flights}
                  onChange={handleChange}
                  min="0"
                  max={MAX_VALUES.flights}
                  aria-describedby={errors.flights ? 'flights-error' : undefined}
                  className={inputClass}
                  placeholder="e.g. 0"
                />
                {errors.flights && <p id="flights-error" className={errorClass} role="alert">{errors.flights}</p>}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="text-xl font-semibold flex items-center gap-2 outline-none"
            >
              <Utensils className="text-primaryGreen" aria-hidden="true" /> Food &amp; Diet
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="diet" className="block text-sm font-medium mb-2">Diet Type</label>
                <select
                  id="diet"
                  name="diet"
                  value={formData.diet}
                  onChange={handleChange}
                  className={inputClass}
                >
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
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="text-xl font-semibold flex items-center gap-2 outline-none"
            >
              <Zap className="text-primaryGreen" aria-hidden="true" /> Home Energy
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="electricityKwh" className="block text-sm font-medium mb-1">
                  Electricity Usage (kWh/month)
                </label>
                <input
                  id="electricityKwh"
                  type="number"
                  name="electricityKwh"
                  value={formData.electricityKwh}
                  onChange={handleChange}
                  min="0"
                  max={MAX_VALUES.electricityKwh}
                  aria-describedby={errors.electricityKwh ? 'electricityKwh-error' : undefined}
                  className={inputClass}
                  placeholder="e.g. 300"
                />
                {errors.electricityKwh && <p id="electricityKwh-error" className={errorClass} role="alert">{errors.electricityKwh}</p>}
              </div>
              <div>
                <label htmlFor="gasBillInr" className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <Flame size={16} aria-hidden="true" /> Cooking Gas/PNG Bill (₹/month)
                </label>
                <input
                  id="gasBillInr"
                  type="number"
                  name="gasBillInr"
                  value={formData.gasBillInr}
                  onChange={handleChange}
                  min="0"
                  max={MAX_VALUES.gasBillInr}
                  aria-describedby={errors.gasBillInr ? 'gasBillInr-error' : undefined}
                  className={inputClass}
                  placeholder="e.g. 1000"
                />
                {errors.gasBillInr && <p id="gasBillInr-error" className={errorClass} role="alert">{errors.gasBillInr}</p>}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="text-xl font-semibold flex items-center gap-2 outline-none"
            >
              <ShoppingBag className="text-primaryGreen" aria-hidden="true" /> Shopping
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="shoppingSpendInr" className="block text-sm font-medium mb-1">
                  Monthly Spending on Clothes/Electronics (₹)
                </label>
                <input
                  id="shoppingSpendInr"
                  type="number"
                  name="shoppingSpendInr"
                  value={formData.shoppingSpendInr}
                  onChange={handleChange}
                  min="0"
                  max={MAX_VALUES.shoppingSpendInr}
                  aria-describedby={errors.shoppingSpendInr ? 'shoppingSpendInr-error' : undefined}
                  className={inputClass}
                  placeholder="e.g. 2000"
                />
                {errors.shoppingSpendInr && <p id="shoppingSpendInr-error" className={errorClass} role="alert">{errors.shoppingSpendInr}</p>}
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 animate-fadeIn text-center">
            <CheckCircle
              ref={headingRef}
              tabIndex={-1}
              className="mx-auto text-primaryGreen mb-4 outline-none"
              size={48}
              aria-hidden="true"
            />
            <h2 className="text-2xl font-bold">Ready to Calculate!</h2>
            <p className="text-gray-400">Click finish to calculate your carbon footprint and see your personalized dashboard.</p>
          </div>
        )}

        <div className="mt-8 flex justify-between pt-6 border-t border-gray-800">
          <button
            onClick={prevStep}
            disabled={step === 1}
            aria-disabled={step === 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${step === 1 ? 'opacity-50 cursor-not-allowed text-gray-500' : 'text-gray-300 hover:bg-gray-800'}`}
          >
            <ArrowLeft size={18} aria-hidden="true" /> Back
          </button>

          {step < 5 ? (
            <button
              onClick={nextStep}
              disabled={hasErrors}
              aria-disabled={hasErrors}
              className={`flex items-center gap-2 px-6 py-2 bg-primaryGreen text-white rounded-lg font-medium hover:bg-green-600 transition-colors ${hasErrors ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Next <ArrowRight size={18} aria-hidden="true" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 px-6 py-2 bg-primaryGreen text-white rounded-lg font-medium hover:bg-green-600 transition-colors shadow-[0_0_15px_rgba(35,166,92,0.4)]"
            >
              Finish &amp; Calculate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
