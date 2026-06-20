import React, { useState, useEffect } from 'react';
import { getUserData } from '../utils/storage';
import { Lightbulb, Settings, Key, Zap, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

const SYSTEM_PROMPT = `You are an expert environmental consultant advising users in India. Analyze the provided carbon footprint data and respond with ONLY a valid JSON object — no explanation, no preamble, no <think> blocks, no markdown fences.

Return this exact JSON shape:
{
  "tips": ["tip1", "tip2", "tip3"],
  "motivation": "A short motivational sentence.",
  "challenge": "A specific, actionable weekly challenge."
}

Rules:
- Use kilometres (km) for distance, never miles.
- Use Indian Rupees (₹) for costs, never dollars.
- Reference India-specific options like BEST buses, DTC, Metro Rail, Indian Railways, CNG autos, or local produce markets.
- Keep each tip to 1-2 sentences, practical and specific.
- Your ENTIRE output must be parseable JSON. Nothing else.`;

export default function AIInsights() {
  const [provider, setProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState('');

  const userData = getUserData();
  const result = userData?.latestResult;

  // Load saved config
  useEffect(() => {
    const savedConfig = localStorage.getItem('carboniq_ai_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      if (parsed.provider) setProvider(parsed.provider);
      if (parsed.apiKeys) setApiKey(parsed.apiKeys[parsed.provider] || '');
      if (parsed.ollamaUrl) setOllamaUrl(parsed.ollamaUrl);
    }
  }, []);

  const saveConfig = (newProvider, newKey, newUrl) => {
    const savedConfig = JSON.parse(localStorage.getItem('carboniq_ai_config') || '{"apiKeys":{}}');
    savedConfig.provider = newProvider;
    if (newProvider !== 'ollama') {
      savedConfig.apiKeys[newProvider] = newKey;
    }
    savedConfig.ollamaUrl = newUrl;
    localStorage.setItem('carboniq_ai_config', JSON.stringify(savedConfig));
  };

  const handleProviderChange = (e) => {
    const newProv = e.target.value;
    setProvider(newProv);
    const savedConfig = JSON.parse(localStorage.getItem('carboniq_ai_config') || '{"apiKeys":{}}');
    setApiKey(savedConfig.apiKeys[newProv] || '');
  };

  const fetchInsights = async () => {
    if (!result) {
      setError("Please complete the calculator first.");
      return;
    }
    if (provider !== 'ollama' && !apiKey) {
      setError(`API Key is required for ${provider}.`);
      return;
    }

    setLoading(true);
    setError('');
    setInsights(null);
    saveConfig(provider, apiKey, ollamaUrl);

    const prompt = `Here is the user's carbon footprint data: ${JSON.stringify(result)}`;

    try {
      let aiResponseText = '';

      if (provider === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ parts: [{ text: prompt }] }]
          })
        });
        if (!res.ok) throw new Error("Gemini API error");
        const data = await res.json();
        aiResponseText = data.candidates[0].content.parts[0].text;
      } 
      else if (provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: prompt }
            ]
          })
        });
        if (!res.ok) throw new Error("OpenAI API error");
        const data = await res.json();
        aiResponseText = data.choices[0].message.content;
      }
      else if (provider === 'claude') {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: JSON.stringify({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages: [{ role: "user", content: prompt }]
          })
        });
        if (!res.ok) throw new Error("Claude API error");
        const data = await res.json();
        aiResponseText = data.content[0].text;
      }
      else if (provider === 'ollama') {
        const res = await fetch(`${ollamaUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: "deepseek-r1:1.5b", // User's local model
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: prompt }
            ],
            stream: false
          })
        });
        if (!res.ok) throw new Error("Ollama API error. Ensure it is running and CORS is enabled.");
        const data = await res.json();
        aiResponseText = data.message.content;
      }

      // Step 1: Strip any <think>...</think> reasoning blocks (deepseek-r1 emits these)
      let cleaned = aiResponseText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

      // Step 2: Strip markdown fences if present
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

      // Step 3: Extract the last JSON object (models sometimes prepend explanation)
      const allMatches = [...cleaned.matchAll(/\{[\s\S]*?\}/g)];
      let parsed = null;
      for (let i = allMatches.length - 1; i >= 0; i--) {
        try {
          const candidate = JSON.parse(allMatches[i][0]);
          if (candidate.tips && candidate.motivation && candidate.challenge) {
            parsed = candidate;
            break;
          }
        } catch (_) { /* try next */ }
      }
      // Step 4: Try parsing the whole cleaned string as a fallback
      if (!parsed) {
        try { parsed = JSON.parse(cleaned); } catch (_) {}
      }
      if (!parsed || !parsed.tips) {
        throw new Error("The AI returned an unexpected format. Please try again.");
      }
      setInsights(parsed);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch insights. Check your API key or CORS settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Lightbulb className="text-yellow-400" size={32} />
            AI Insights
          </h1>
          <p className="text-gray-400">Get personalized, actionable advice to reduce your footprint.</p>
        </div>
        <button 
          onClick={() => setIsConfiguring(!isConfiguring)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          <Settings size={18} /> Configure AI
        </button>
      </div>

      {isConfiguring && (
        <div className="bg-[#0f1915] border border-gray-800 rounded-xl p-6 shadow-xl animate-fadeIn">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Settings size={20} className="text-primaryGreen" /> AI Provider Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Select Provider</label>
              <select value={provider} onChange={handleProviderChange} className="w-full bg-darkGreen border border-gray-700 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primaryGreen">
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI</option>
                <option value="claude">Anthropic Claude</option>
                <option value="ollama">Ollama (Local)</option>
              </select>
            </div>
            {provider !== 'ollama' ? (
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2"><Key size={16}/> API Key (Saved Locally)</label>
                <input 
                  type="password" 
                  value={apiKey} 
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`Enter ${provider} API Key`}
                  className="w-full bg-darkGreen border border-gray-700 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primaryGreen"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2">Ollama Base URL</label>
                <input 
                  type="text" 
                  value={ollamaUrl} 
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  className="w-full bg-darkGreen border border-gray-700 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primaryGreen"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-center gap-3">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {!insights && !loading && (
        <div className="bg-[#0f1915] border border-gray-800 rounded-xl p-12 text-center shadow-xl">
          <Zap size={48} className="mx-auto text-primaryGreen mb-4 opacity-50" />
          <h2 className="text-2xl font-bold text-white mb-2">Ready to Analyze</h2>
          <p className="text-gray-400 mb-6">We will securely process your emissions data to generate custom advice.</p>
          <button 
            onClick={fetchInsights}
            className="px-6 py-3 bg-primaryGreen hover:bg-green-600 text-white font-medium rounded-lg shadow-[0_0_15px_rgba(35,166,92,0.4)] transition-all flex items-center gap-2 mx-auto"
          >
            <Zap size={20} /> Generate Insights
          </button>
        </div>
      )}

      {loading && (
        <div className="bg-[#0f1915] border border-gray-800 rounded-xl p-12 text-center shadow-xl">
          <Loader2 size={48} className="mx-auto text-primaryGreen mb-4 animate-spin" />
          <h2 className="text-xl font-bold text-white mb-2">Analyzing Data...</h2>
          <p className="text-gray-400">Consulting {provider.charAt(0).toUpperCase() + provider.slice(1)} models.</p>
        </div>
      )}

      {insights && !loading && (
        <div className="space-y-6 animate-fadeIn">
          {/* Motivation Card */}
          <div className="bg-gradient-to-br from-primaryGreen/20 to-emerald-900/20 border border-primaryGreen/30 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10">
              <Lightbulb size={120} />
            </div>
            <h3 className="text-xl font-bold text-green-400 mb-2">Motivation</h3>
            <p className="text-lg text-white relative z-10">{insights.motivation}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tips Card */}
            <div className="bg-[#0f1915] border border-gray-800 rounded-xl p-6 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="text-primaryGreen" /> Top 3 Reduction Tips
              </h3>
              <ul className="space-y-4">
                {insights.tips?.map((tip, idx) => (
                  <li key={idx} className="flex gap-3 text-gray-300">
                    <span className="bg-gray-800 text-primaryGreen rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">{idx + 1}</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Challenge Card */}
            <div className="bg-[#0f1915] border border-gray-800 rounded-xl p-6 shadow-xl flex flex-col justify-center text-center">
              <Zap className="text-yellow-400 mx-auto mb-4" size={40} />
              <h3 className="text-xl font-bold text-white mb-2">Weekly Challenge</h3>
              <p className="text-gray-300 text-lg mb-6">{insights.challenge}</p>
              <button onClick={fetchInsights} className="text-sm text-gray-400 hover:text-white transition-colors">
                Generate New Insights
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
