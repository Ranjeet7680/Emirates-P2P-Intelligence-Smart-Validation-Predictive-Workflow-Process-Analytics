import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import type { UserSession } from './Header';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isEmergency?: boolean;
  emergencyGuidance?: any;
  citations?: any[];
  uncertainty?: string;
  followUps?: string[];
  disclaimer?: string;
  timestamp: string;
}

export function AiAssistantView({ currentUser }: { currentUser: UserSession }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        `Hello ${currentUser.full_name}, I am your evidence-grounded AI Medical Assistant. ` +
        'You can ask me questions about disease mechanisms, laboratory measurements, medical terminology, and peer-reviewed research guidelines.\n\n' +
        'How can I assist your health inquiry today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      citations: [
        {
          title: 'WHO Medical Nomenclature & Healthcare Information Standards',
          source: 'World Health Organization',
          year: 2023,
          url: 'https://www.who.int/publications',
          evidence_level: 'International Consensus',
        },
      ],
      disclaimer:
        'MediPredict AI provides educational decision support and does not replace in-person physician evaluation.',
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getTopics().then((res) => setTopics(res.topics || [])).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: Message = {
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.chat(
        {
          message: query,
          conversation_history: messages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
        },
        currentUser.token
      );

      const botMsg: Message = {
        role: 'assistant',
        content: res.answer,
        isEmergency: res.is_emergency,
        emergencyGuidance: res.emergency_guidance,
        citations: res.citations,
        uncertainty: res.uncertainty_level,
        followUps: res.follow_up_suggestions,
        disclaimer: res.medical_disclaimer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Unable to complete medical inference: ${err.message}. Please check your connection and retry.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const exportConversation = () => {
    const text = messages
      .map((m) => `[${m.timestamp}] ${m.role.toUpperCase()}:\n${m.content}\n`)
      .join('\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medipredict_conversation_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto">
      {/* Top Controls Strip */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-600">psychology</span>
            AI Medical Science Assistant
          </h1>
          <p className="text-xs text-slate-500">
            Evidence-grounded clinical information retrieval &amp; research terminology explanations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportConversation}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Export Chat</span>
          </button>
        </div>
      </div>

      {/* Suggested Topics Pills */}
      {messages.length <= 2 && topics.length > 0 && (
        <div className="py-2 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Suggested Queries:
          </span>
          {topics.flatMap((t) => t.prompts).slice(0, 4).map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(p)}
              className="text-xs bg-slate-100 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 text-slate-700 px-3 py-1 rounded-full border border-slate-200 shrink-0 transition-colors cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-1`}
          >
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 px-1">
              <span>{msg.role === 'user' ? currentUser.full_name : 'MediPredict AI'}</span>
              <span>•</span>
              <span>{msg.timestamp}</span>
            </div>

            <div
              className={`max-w-3xl rounded-2xl p-4 shadow-xs text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-teal-700 text-white rounded-br-none'
                  : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none'
              }`}
            >
              {/* Emergency Alert Banner */}
              {msg.isEmergency && msg.emergencyGuidance && (
                <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-300 text-red-900 text-xs">
                  <div className="flex items-center gap-2 font-bold text-red-800 mb-1">
                    <span className="material-symbols-outlined text-[18px] text-red-600">emergency</span>
                    CRITICAL EMERGENCY DETECTED
                  </div>
                  <p className="leading-relaxed">{msg.emergencyGuidance.guidance_message}</p>
                  <div className="mt-2 pt-2 border-t border-red-200 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-red-700">Immediate Action Required: Call Emergency</span>
                    <a
                      href="tel:911"
                      className="px-3 py-1 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors inline-flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">phone</span>
                      Dial 911 / 999
                    </a>
                  </div>
                </div>
              )}

              {/* Message Content with Markdown Formatting */}
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* Citations Section */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="font-bold text-[11px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-teal-600">verified</span>
                    Evidence-Grounded Citations &amp; References
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                    {msg.citations.map((c, ci) => (
                      <a
                        key={ci}
                        href={c.url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 transition-colors block text-left"
                      >
                        <div className="font-semibold text-slate-800 truncate">{c.title}</div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                          <span>{c.source} ({c.year || 2023})</span>
                          <span className="text-[10px] font-bold text-teal-700 bg-teal-100/70 px-1.5 py-0.2 rounded">
                            {c.evidence_level || 'Peer-Reviewed'}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up Suggestions */}
              {msg.followUps && msg.followUps.length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] font-bold text-slate-400">Related Questions:</span>
                  {msg.followUps.map((fu, fui) => (
                    <button
                      key={fui}
                      type="button"
                      onClick={() => handleSend(fu)}
                      className="text-xs bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 cursor-pointer transition-colors"
                    >
                      {fu}
                    </button>
                  ))}
                </div>
              )}

              {/* Non-Diagnostic Disclaimer */}
              {msg.disclaimer && (
                <div className="mt-2 text-[10px] text-slate-400 italic">
                  * {msg.disclaimer}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-slate-500 text-xs p-3 bg-white rounded-xl border border-slate-200 w-fit">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
            <span>Consulting clinical evidence and generating response...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="pt-2 border-t border-slate-200 flex items-center gap-2"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a medical science question or enter laboratory results (e.g., 'What causes elevated fasting glucose?')..."
            className="w-full h-11 pl-4 pr-10 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="h-11 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <span>Send</span>
          <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
        </button>
      </form>
    </div>
  );
}
