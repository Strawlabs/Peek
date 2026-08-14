import React, { useState, useRef, useEffect } from 'react';
import { useAppState } from '../context/StateContext';

interface Message {
  sender: 'ai' | 'user';
  text: string;
  timestamp: Date;
  modelInfo?: string;
  logStatus?: string;
}

interface AskPeekDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const MODEL_OPTIONS = [
  { providerId: 'gemini', providerName: 'Google Gemini (API)', model: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  { providerId: 'gemini', providerName: 'Google Gemini (API)', model: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  { providerId: 'openai', providerName: 'ChatGPT (OpenAI)', model: 'gpt-4o', label: 'ChatGPT (GPT-4o)' },
  { providerId: 'openai', providerName: 'ChatGPT (OpenAI)', model: 'gpt-3.5-turbo', label: 'ChatGPT (GPT-3.5)' },
  { providerId: 'local', providerName: 'Gemini Locally (Ollama/Local)', model: 'llama-3-local', label: 'Gemini Locally (Local Node)' },
];

export const AskPeekDrawer: React.FC<AskPeekDrawerProps> = ({ isOpen, onClose }) => {
  const { requests, recommendations, policies, providers, routeGatewayRequest, authSession, users } = useAppState();

  const userEmail = authSession?.email?.toLowerCase() || '';
  const userRecord = users.find(u => u.email.toLowerCase() === userEmail);
  const accountDisplayName = userRecord?.name || userEmail || 'aswini m (ammu2406sm@gmail.com)';

  const [selectedModelIdx, setSelectedModelIdx] = useState<number>(0);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: 'Welcome to **Peek AI Copilot**. I can help you analyze your organization\'s AI spend, check governance risks, explore budget compliance, and get custom recommendations.\n\nAll tasks and prompts submitted here are automatically routed and logged in your Peek Dashboard telemetry.',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeModelConfig = MODEL_OPTIONS[selectedModelIdx];

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isSending) return;

    const userMsg: Message = {
      sender: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsSending(true);

    try {
      // 1. Route & Log through Peek Gateway with user account attribution
      const routeRes = await routeGatewayRequest(
        text,
        activeModelConfig.providerId,
        activeModelConfig.model,
        'Engineering',
        'production',
        'Ask Peek Copilot',
        accountDisplayName
      );

      // 2. Generate response payload
      let aiResponseText = '';
      const query = text.toLowerCase();

      // Check if user has connected a real API key for the provider
      const provObj = providers.find(p => p.id === activeModelConfig.providerId);
      const hasRealKey = provObj?.apiKey && !provObj.apiKey.includes('••••') && provObj.apiKey.length > 10;

      if (!routeRes.success) {
        aiResponseText = `⚠️ **Gateway Security Alert**: Request blocked by Peek policy guardrails.\n\n${routeRes.trace.find(t => t.includes('[BLOCK]') || t.includes('[WARNING]')) || 'Policy violation detected.'}\n\n*Logged to Dashboard Audit Trail for account: ${accountDisplayName}*`;
      } else if (hasRealKey && activeModelConfig.providerId === 'openai') {
        try {
          const apiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${provObj!.apiKey}`
            },
            body: JSON.stringify({
              model: activeModelConfig.model,
              messages: [{ role: 'user', content: text }],
              max_tokens: 350
            })
          });
          if (apiRes.ok) {
            const apiData = await apiRes.json();
            aiResponseText = apiData.choices?.[0]?.message?.content || 'Received response from ChatGPT.';
          } else {
            const errText = await apiRes.text();
            aiResponseText = `ChatGPT API returned HTTP ${apiRes.status}: ${errText.substring(0, 150)}`;
          }
        } catch {
          aiResponseText = `Network error contacting ChatGPT endpoint. Request was captured in local telemetry.`;
        }
      } else if (hasRealKey && activeModelConfig.providerId === 'gemini') {
        try {
          const apiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${activeModelConfig.model}:generateContent?key=${provObj!.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text }] }] })
          });
          if (apiRes.ok) {
            const apiData = await apiRes.json();
            aiResponseText = apiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Received response from Google Gemini API.';
          } else {
            const errText = await apiRes.text();
            aiResponseText = `Gemini API returned HTTP ${apiRes.status}: ${errText.substring(0, 150)}`;
          }
        } catch {
          aiResponseText = `Network error contacting Google Gemini API. Request captured in local telemetry.`;
        }
      } else {
        // Intelligence analytical fallback response
        if (query.includes('spend') || query.includes('cost') || query.includes('increase')) {
          const totalCost = requests.reduce((sum, r) => sum + r.cost, 0);
          const flaggedCount = requests.filter(r => r.status.includes('Flagged')).length;
          aiResponseText = `Based on latest telemetry for account **${accountDisplayName}**, total analyzed AI spend is **$${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}**. We noticed **${flaggedCount}** policy flags. Spend is primarily driven by Engineering and Customer Success teams.`;
        } else if (query.includes('policy') || query.includes('violation') || query.includes('leak')) {
          const piiCount = requests.filter(r => r.status.includes('PII')).length;
          const policyCount = requests.filter(r => r.status === 'Policy Flagged' || r.status === 'Policy Blocked').length;
          const activePolicies = policies.filter(p => p.active).map(p => p.name).join(', ');
          aiResponseText = `Currently active policies: **${activePolicies}**.\n\nTelemetry Logs Summary:\n- **${piiCount}** PII leaks flagged/blocked.\n- **${policyCount}** model restriction violations logged.\n\nView details in **Governance Center → Compliance Audit Logs**.`;
        } else if (query.includes('reduce') || query.includes('save') || query.includes('optimize')) {
          const activeRecs = recommendations.filter(r => r.status === 'active');
          if (activeRecs.length > 0) {
            const savings = activeRecs.reduce((sum, r) => sum + r.savings, 0);
            aiResponseText = `We identified **${activeRecs.length}** optimization opportunities saving **$${savings.toLocaleString()}/month**:\n\n` + 
              activeRecs.map(r => `* **${r.title}**: Savings of **$${r.savings}** (Confidence: ${r.confidence}%).`).join('\n') +
              `\n\nApprove in **Intelligence Center**.`;
          } else {
            aiResponseText = "All identified optimization recommendations have been applied or dismissed.";
          }
        } else {
          aiResponseText = `Task processed using **${activeModelConfig.providerName} (${activeModelConfig.label})**.\n\nQuery: "${text}"\n\n- Account: ${accountDisplayName}\n- Latency: ${routeRes.latency}s\n- Cost: $${routeRes.cost.toFixed(5)}\n- Tokens: ${routeRes.tokens}\n\n*This interaction has been logged to your Dashboard Telemetry & Audit Logs.*`;
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: aiResponseText,
          timestamp: new Date(),
          modelInfo: `${activeModelConfig.providerName} • ${activeModelConfig.label}`,
          logStatus: routeRes.success ? 'Logged ✓' : 'Blocked 🛑'
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className={`fixed right-0 top-16 bottom-0 w-full max-w-[520px] bg-surface-container-lowest border-l border-outline-variant z-50 flex flex-col transition-transform duration-300 transform ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-outline-variant flex flex-col gap-3 bg-surface-container-lowest/90 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">smart_toy</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Ask Peek AI Copilot</h3>
              <p className="text-[11px] text-on-surface-variant font-mono">
                Account: <span className="text-primary font-bold">{accountDisplayName}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                setMessages([
                  {
                    sender: 'ai',
                    text: 'Chat history cleared. How can I help you analyze your AI operations today?',
                    timestamp: new Date(),
                  },
                ])
              }
              className="p-1.5 hover:bg-surface-variant rounded-lg transition-colors text-on-surface-variant"
              title="Clear Chat"
            >
              <span className="material-symbols-outlined text-[20px]">delete</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-surface-variant rounded-lg transition-colors text-on-surface-variant"
              title="Close"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Model Selector Bar */}
        <div className="flex items-center justify-between bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/40">
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-bold">
            <span className="material-symbols-outlined text-[16px] text-sky-400">tune</span>
            <span>Active Model:</span>
          </div>
          <select
            value={selectedModelIdx}
            onChange={(e) => setSelectedModelIdx(Number(e.target.value))}
            className="bg-transparent border-none text-xs text-primary font-bold focus:outline-none cursor-pointer"
          >
            {MODEL_OPTIONS.map((opt, idx) => (
              <option key={idx} value={idx} className="bg-surface-container text-on-surface">
                {opt.label} ({opt.providerName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Conversation Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className={`flex gap-2 max-w-[90%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div
                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-1 text-xs ${
                  msg.sender === 'user' ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary text-on-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {msg.sender === 'user' ? 'person' : 'smart_toy'}
                </span>
              </div>
              <div className="space-y-1 w-full">
                <div
                  className={`p-3.5 rounded-2xl text-body-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-primary text-on-primary rounded-tr-none'
                      : 'bg-surface-container border border-outline-variant rounded-tl-none text-on-surface'
                  }`}
                >
                  <p className="whitespace-pre-line">
                    {msg.text}
                  </p>
                  {msg.modelInfo && (
                    <div className="mt-2 pt-2 border-t border-outline-variant/30 flex items-center justify-between text-[10px] text-on-surface-variant font-mono">
                      <span>{msg.modelInfo}</span>
                      <span className="text-emerald-400 font-bold">{msg.logStatus}</span>
                    </div>
                  )}
                  {msg.sender === 'ai' && index === 0 && (
                    <div className="mt-3 space-y-1.5 pt-2 border-t border-outline-variant/20">
                      <div className="text-[10px] text-outline font-bold uppercase">Suggested Prompts:</div>
                      <button
                        onClick={() => handleSend('why did AI spend increase last week?')}
                        className="block text-left text-xs text-primary hover:underline"
                      >
                        "Why did AI spend increase last week?"
                      </button>
                      <button
                        onClick={() => handleSend('show policy violations')}
                        className="block text-left text-xs text-primary hover:underline"
                      >
                        "Show policy violations"
                      </button>
                      <button
                        onClick={() => handleSend('where can we reduce AI costs?')}
                        className="block text-left text-xs text-primary hover:underline"
                      >
                        "Where can we reduce AI costs?"
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex items-center gap-2 text-xs text-on-surface-variant font-mono p-2">
            <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
            <span>Routing task via {activeModelConfig.label} & logging telemetry...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Chat Input Area */}
      <div className="p-4 bg-surface-container-lowest border-t border-outline-variant">
        <div className="relative flex items-center">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(inputValue);
              }
            }}
            disabled={isSending}
            className="w-full bg-surface-container-high border border-outline-variant rounded-xl pl-3.5 pr-11 py-2.5 text-body-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none resize-none placeholder:text-outline disabled:opacity-60"
            placeholder={`Ask ${activeModelConfig.label} & log to dashboard...`}
            rows={2}
          />
          <button
            onClick={() => handleSend(inputValue)}
            disabled={isSending}
            className="absolute right-2.5 bottom-2.5 bg-primary text-on-primary p-1.5 rounded-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </div>
        <p className="text-center font-label-sm text-[11px] text-outline mt-2 flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-[14px]">shield</span>
          <span>Logged to Dashboard Telemetry for account: <strong>{accountDisplayName}</strong></span>
        </p>
      </div>
    </div>
  );
};

