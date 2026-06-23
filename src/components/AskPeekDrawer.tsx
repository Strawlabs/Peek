import React, { useState, useRef, useEffect } from 'react';
import { useAppState } from '../context/StateContext';

interface Message {
  sender: 'ai' | 'user';
  text: string;
  timestamp: Date;
}

interface AskPeekDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AskPeekDrawer: React.FC<AskPeekDrawerProps> = ({ isOpen, onClose }) => {
  const { requests, recommendations, policies } = useAppState();
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: 'Welcome to **Peek AI Copilot**. I can help you analyze your organization\'s AI spend, check governance risks, explore budget compliance, and get custom recommendations.',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      sender: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');

    // Simulate AI response
    setTimeout(() => {
      let aiResponseText = '';
      const query = text.toLowerCase();

      if (query.includes('spend') || query.includes('cost') || query.includes('increase')) {
        const totalCost = requests.reduce((sum, r) => sum + r.cost, 0);
        const flaggedCount = requests.filter(r => r.status.includes('Flagged')).length;
        aiResponseText = `Based on the latest telemetry, total analyzed AI spend is **$${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}**. We noticed **${flaggedCount}** policy flags. The largest expenditure comes from **Engineering** ($${(totalCost * 0.43).toLocaleString(undefined, { maximumFractionDigits: 0 })}), followed by **Customer Success** ($${(totalCost * 0.26).toLocaleString(undefined, { maximumFractionDigits: 0 })}). Spend increased primarily due to high prompt volume on premium models like GPT-4o and Claude 3.5 Sonnet.`;
      } else if (query.includes('policy') || query.includes('violation') || query.includes('leak')) {
        const piiCount = requests.filter(r => r.status.includes('PII')).length;
        const policyCount = requests.filter(r => r.status === 'Policy Flagged' || r.status === 'Policy Blocked').length;
        const activePolicies = policies.filter(p => p.active).map(p => p.name).join(', ');
        aiResponseText = `Currently, we have **${policies.filter(p => p.active).length}** active policies: **${activePolicies}**. \n\nOur telemetry logs show:\n- **${piiCount}** PII leaks flagged/blocked.\n- **${policyCount}** model restriction violations (e.g. Marketing team calling GPT-4o).\n\nYou can review specific alerts in the **Governance Center** or test routing live in the **Proxy Playground**.`;
      } else if (query.includes('reduce') || query.includes('save') || query.includes('optimize')) {
        const activeRecs = recommendations.filter(r => r.status === 'active');
        if (activeRecs.length > 0) {
          const savings = activeRecs.reduce((sum, r) => sum + r.savings, 0);
          aiResponseText = `We identified **${activeRecs.length}** actionable optimization opportunities with total estimated savings of **$${savings.toLocaleString()}/month**:\n\n` + 
            activeRecs.map(r => `* **${r.title}**: Estimated savings of **$${r.savings}** (Confidence: ${r.confidence}%).`).join('\n') +
            `\n\nYou can approve these savings immediately inside the **Intelligence Center**.`;
        } else {
          aiResponseText = "All identified optimization recommendations have been applied or dismissed. No further cost reductions are flagged at this time.";
        }
      } else {
        aiResponseText = `I received your query: "${text}". I can help you with cost summaries, policy violations, and recommendations. Try asking:
- "Why did AI spend increase?"
- "Show policy violations"
- "Where can we reduce AI costs?"`;
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: aiResponseText,
          timestamp: new Date(),
        },
      ]);
    }, 800);
  };

  return (
    <div
      className={`fixed right-0 top-16 bottom-0 w-[500px] bg-surface-container-lowest border-l border-outline-variant z-50 flex flex-col transition-transform duration-300 transform ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="p-stack-lg border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest/80 backdrop-blur-md">
        <div className="flex items-center gap-stack-md">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center animate-pulse">
            <span className="material-symbols-outlined text-on-primary-container text-[24px]">smart_toy</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Ask Peek</h3>
            <div className="flex items-center gap-unit">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Model: Claude 3.5 Sonnet (Enterprise Analyst)</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-stack-sm">
          <button
            onClick={() =>
              setMessages([
                {
                  sender: 'ai',
                  text: 'Chat history cleared. How can I help you analyze your organization\'s AI telemetry today?',
                  timestamp: new Date(),
                },
              ])
            }
            className="p-2 hover:bg-surface-variant rounded-lg transition-colors text-on-surface-variant"
            title="Clear Chat"
          >
            <span className="material-symbols-outlined">delete</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-variant rounded-lg transition-colors text-on-surface-variant"
            title="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>

      {/* Conversation Feed */}
      <div className="flex-1 overflow-y-auto p-stack-lg space-y-stack-lg custom-scrollbar">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className={`flex gap-stack-sm max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
                  msg.sender === 'user' ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary text-on-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {msg.sender === 'user' ? 'person' : 'smart_toy'}
                </span>
              </div>
              <div className="space-y-stack-md w-full">
                <div
                  className={`p-stack-lg rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-primary-container text-on-primary-container rounded-tr-none'
                      : 'bg-surface-container border border-outline-variant rounded-tl-none'
                  }`}
                >
                  <p className="font-body-md text-body-md leading-relaxed whitespace-pre-line text-on-surface">
                    {msg.text}
                  </p>
                  {msg.sender === 'ai' && index === 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="text-xs text-outline font-bold">SUGGESTED QUESTIONS:</div>
                      <button
                        onClick={() => handleSend('why did AI spend increase last week?')}
                        className="block text-left text-xs text-primary hover:underline"
                      >
                        "@peek why did AI spend increase last week?"
                      </button>
                      <button
                        onClick={() => handleSend('show policy violations')}
                        className="block text-left text-xs text-primary hover:underline"
                      >
                        "@peek show policy violations"
                      </button>
                      <button
                        onClick={() => handleSend('where can we reduce AI costs?')}
                        className="block text-left text-xs text-primary hover:underline"
                      >
                        "@peek where can we reduce AI costs?"
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Chat Input Area */}
      <div className="p-stack-lg bg-surface-container-lowest border-t border-outline-variant">
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
            className="w-full bg-surface-container-high border border-outline-variant rounded-xl pl-4 pr-12 py-3 text-body-md text-on-surface focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none resize-none placeholder:text-outline"
            placeholder="Ask anything about your AI operations..."
            rows={2}
          />
          <button
            onClick={() => handleSend(inputValue)}
            className="absolute right-3 bottom-3 bg-primary text-on-primary p-2 rounded-lg hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
        <p className="text-center font-label-sm text-label-sm text-outline mt-stack-md">
          Peek AI can make mistakes. Verify critical governance actions.
        </p>
      </div>
    </div>
  );
};
