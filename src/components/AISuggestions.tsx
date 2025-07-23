'use client'

import React, { useRef, useEffect, useState } from 'react';
import { Property, Transaction } from '../types';
import { Brain, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AISuggestionsProps {
  properties: Property[];
  transactions: Transaction[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const recommendedQuestions = [
  '今月の家賃収入は？',
  '節税のコツは？',
  'おすすめ投資戦略は？',
  '空室リスクを減らすには？',
  '修繕費の目安は？',
];

const AISuggestions: React.FC<AISuggestionsProps> = ({ properties, transactions }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input, transactions }),
      });

      if (!response.body) {
        throw new Error('ReadableStream not available');
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: '' }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value, { stream: true });
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.content += chunk;
            return [...prev];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('ストリーミングエラー:', error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'エラーが発生しました。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-gray-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">AIアドバイザー</h2>
            <p className="text-sm text-gray-500">不動産投資に関するご質問に何でもお答えします。</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold">会話を始めましょう</h3>
            <p className="max-w-xs">下の質問例をクリックするか、自由に入力してください。</p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {recommendedQuestions.map(q => (
                <button
                  key={q}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm hover:bg-gray-100 transition-colors"
                  onClick={() => setInput(q)}
                >{q}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex items-start gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {m.role === 'assistant' && (
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 text-gray-600" />
              </div>
            )}
            <div className={`
              p-4 rounded-2xl max-w-[80%] text-gray-800
              ${m.role === 'user'
                ? 'bg-gray-200 rounded-br-none'
                : 'bg-white border border-gray-200 rounded-bl-none'
              }
            `}>
              <div className="prose prose-sm max-w-none break-words">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-gray-600" />
            </div>
            <div className="p-4 rounded-2xl bg-white border border-gray-200 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2 delay-150"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-300"></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            className="w-full pl-4 pr-20 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none bg-gray-50 transition-all"
            placeholder="メッセージを送信..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-blue-300 transition-colors flex items-center justify-center"
            disabled={isLoading || !input.trim()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AISuggestions;