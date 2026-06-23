import React, { useState, useEffect, useId } from 'react';
import { getUserData } from '../utils/storage';
import { Lightbulb, Settings, Key, Zap, CheckCircle, AlertTriangle, Loader2, Info } from 'lucide-react';

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

/** Validates that an Ollama URL is local only (localhost / 127.0.0.1) to prevent SSRF */
const isValidOllamaUrl = (url) => {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'http:' &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
    );
  } catch {
    return false;
  }
};

const getSafeAiConfig = () => {
  try {
    const raw = localStorage.getItem('carboniq_ai_config');
    return raw ? JSON.parse(raw) : { apiKeys: {} };
  } catch {
    return { apiKeys: {} };
  }
};

export default function AIInsights() {
  const formId = useId();
  const [provider, setProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaUrlError, setOllamaUrlError] = useState('');
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState('');

  const userData = getUserData();
  const result = userData?.latestResult;

  // Load saved config
  useEffect(() => {
    const parsed = getSafeAiConfig();
    if (parsed.provider) setProvider(parsed.provider);
    if (parsed.apiKeys) setApiKey(parsed.apiKeys[parsed.provider] || '');
    if (parsed.ollamaUrl) setOllamaUrl(parsed.ollamaUrl);
  }, []);

  const saveConfig = (newProvider, newKey, newUrl) => {
    const savedConfig = getSafeAiConfig();
    savedConfig.provider = newProvider;
    if (newProvider !== 'ollama') {
      savedConfig.apiKeys[newProvider] = newKey;
    }
    savedConfig.ollamaUrl = newUrl;
    try {
      localStorage.setItem('carboniq_ai_config', JSON.stringify(savedConfig));
    } catch (e) {
      console.error('Failed to save AI config:', e);
    }
  };

  const handleProviderChange = (e) => {
    const newProv = e.target.value;
    setProvider(newProv);
    const savedConfig = getSafeAiConfig();
    setApiKey(savedConfig.apiKeys[newProv] || '');
  };

  const handleOllamaUrlChange = (e) => {
    const val = e.target.value;
    setOllamaUrl(val);
    setOllamaUrlError(
      isValidOllamaUrl(val) ? '' : 'URL must be http://localhost or http://127.0.0.1 for security reasons.'
    );
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
    if (provider === 'ollama' && !isValidOllamaUrl(ollamaUrl)) {
      setError('Invalid Ollama URL. Only http://localhost or http://127.0.0.1 is allowed.');
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
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ parts: [{ text: prompt }] }]
          })
        });
        if (!res.ok) throw new Error(`Gemini API error (${res.status})`);
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
        if (!res.ok) throw new Error(`OpenAI API error (${res.status})`);
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
        if (!res.ok) throw new Error(`Claude API error (${res.status})`);
        const data = await res.json();
        aiResponseText = data.content[0].text;
      }
      else if (provider === 'ollama') {
        const res = await fetch(`${ollamaUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: "deepseek-r1:1.5b",
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

      // Strip <think>...</think> reasoning blocks (deepseek-r1 emits these)
      let cleaned = aiResponseText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      // Strip markdown fences if present
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

      // Extract the last valid JSON object
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
            <Lightbulb className="text-yellow-400" size={32} aria-hidden="true" />
            AI Insights
          </h1>
          <p className="text-gray-400">Get personalized, actionable advice to reduce your footprint.</p>
        </div>
        <button
          onClick={() => setIsConfiguring(!isConfiguring)}
          aria-expanded={isConfiguring}
          aria-controls="ai-config-panel"
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          <Settings size={18} aria-hidden="true" /> Configure AI
        </button>
      </div>

      {isConfiguring && (
        <div
          id="ai-config-panel"
          className="bg-[#0f1915] border border-gray-800 rounded-xl p-6 shadow-xl animate-fadeIn"
          role="region"
          aria-label="AI Provider Settings"
        >
          <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
            <Settings size={20} className="text-primaryGreen" aria-hidden="true" /> AI Provider Settings
          </h2>

          {/* Security notice */}
          <div className="mb-4 flex items-start gap-2 text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-4 py-3 text-sm" role="note">
            <Info size={16} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              API keys are stored only in your browser's local storage. They are not sent to any server other than the selected AI provider. Do not use this app on shared or public devices.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor={`${formId}-provider`} className="block text-sm font-medium mb-2">Select Provider</label>
              <select
                id={`${formId}-provider`}
                value={provider}
                onChange={handleProviderChange}
                className="w-full bg-darkGreen border border-gray-700 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primaryGreen"
              >
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI</option>
                <option value="claude">Anthropic Claude</option>
                <option value="ollama">Ollama (Local)</option>
              </select>
            </div>

            {provider !== 'ollama' ? (
              <div>
                <label htmlFor={`${formId}-apikey`} className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Key size={16} aria-hidden="true" /> API Key
                </label>
                <input
                  id={`${formId}-apikey`}
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`Enter ${provider} API Key`}
                  autoComplete="off"
                  className="w-full bg-darkGreen border border-gray-700 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primaryGreen"
                />
              </div>
            ) : (
              <div>
                <label htmlFor={`${formId}-ollamaurl`} className="block text-sm font-medium mb-2">
                  Ollama Base URL
                  <span className="text-gray-500 font-normal ml-1">(localhost only)</span>
                </label>
                <input
                  id={`${formId}-ollamaurl`}
                  type="text"
                  value={ollamaUrl}
                  onChange={handleOllamaUrlChange}
                  aria-describedby={ollamaUrlError ? `${formId}-ollamaurl-error` : undefined}
                  className={`w-full bg-darkGreen border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primaryGreen ${ollamaUrlError ? 'border-red-500' : 'border-gray-700'}`}
                />
                {ollamaUrlError && (
                  <p id={`${formId}-ollamaurl-error`} className="mt-1 text-sm text-red-400" role="alert">
                    {ollamaUrlError}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-center gap-3" role="alert">
          <AlertTriangle size={20} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {!insights && !loading && (
        <div className="bg-[#0f1915] border border-gray-800 rounded-xl p-12 text-center shadow-xl">
          <Zap size={48} className="mx-auto text-primaryGreen mb-4 opacity-50" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-white mb-2">Ready to Analyze</h2>
          <p className="text-gray-400 mb-6">We will securely process your emissions data to generate custom advice.</p>
          <button
            onClick={fetchInsights}
            className="px-6 py-3 bg-primaryGreen hover:bg-green-600 text-white font-medium rounded-lg shadow-[0_0_15px_rgba(35,166,92,0.4)] transition-all flex items-center gap-2 mx-auto"
          >
            <Zap size={20} aria-hidden="true" /> Generate Insights
          </button>
        </div>
      )}

      {loading && (
        <div className="bg-[#0f1915] border border-gray-800 rounded-xl p-12 text-center shadow-xl" aria-live="polite" aria-busy="true">
          <Loader2 size={48} className="mx-auto text-primaryGreen mb-4 animate-spin" aria-hidden="true" />
          <h2 className="text-xl font-bold text-white mb-2">Analyzing Data...</h2>
          <p className="text-gray-400">Consulting {provider.charAt(0).toUpperCase() + provider.slice(1)} models.</p>
        </div>
      )}

      {insights && !loading && (
        <div className="space-y-6 animate-fadeIn" aria-live="polite">
          {/* Motivation Card */}
          <div className="bg-gradient-to-br from-primaryGreen/20 to-emerald-900/20 border border-primaryGreen/30 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10" aria-hidden="true">
              <Lightbulb size={120} />
            </div>
            <h3 className="text-xl font-bold text-green-400 mb-2">Motivation</h3>
            <p className="text-lg text-white relative z-10">{insights.motivation}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tips Card */}
            <div className="bg-[#0f1915] border border-gray-800 rounded-xl p-6 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="text-primaryGreen" aria-hidden="true" /> Top 3 Reduction Tips
              </h3>
              <ol className="space-y-4" aria-label="Reduction tips">
                {insights.tips?.map((tip, idx) => (
                  <li key={idx} className="flex gap-3 text-gray-300">
                    <span className="bg-gray-800 text-primaryGreen rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold" aria-hidden="true">
                      {idx + 1}
                    </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Challenge Card */}
            <div className="bg-[#0f1915] border border-gray-800 rounded-xl p-6 shadow-xl flex flex-col justify-center text-center">
              <Zap className="text-yellow-400 mx-auto mb-4" size={40} aria-hidden="true" />
              <h3 className="text-xl font-bold text-white mb-2">Weekly Challenge</h3>
              <p className="text-gray-300 text-lg mb-6">{insights.challenge}</p>
              <button
                onClick={fetchInsights}
                className="text-sm text-gray-400 hover:text-white transition-colors underline underline-offset-2"
              >
                Generate New Insights
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
