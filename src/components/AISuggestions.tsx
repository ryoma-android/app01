'use client'

import React, { useState, useRef, useEffect } from 'react';
import useSWR from 'swr';
import { Property, Transaction } from '../types';
import { createClient } from '@/utils/supabase/client';
import { Brain, MessageSquare, History, Plus, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const supabase = createClient();

interface AISuggestionsProps {
  properties: Property[];
  transactions: Transaction[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatHistory {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

const recommendedQuestions = [
  '今月の家賃収入は？',
  '節税のコツは？',
  'おすすめ投資戦略は？',
  '空室リスクを減らすには？',
  '修繕費の目安は？',
];

// --- デモ用の会話データを追加 ---
const demoConversation: Message[] = [
  {
    id: 'demo-1',
    role: 'user',
    content: '私が所有している物件の中で、最も収益改善のポテンシャルが高いのはどれですか？具体的な数字を交えて、その理由と改善策を提案してください。'
  },
  {
    id: 'demo-2',
    role: 'assistant',
    content: 'お問い合わせありがとうございます。\n\nお客様のポートフォリオを分析した結果、**「スカイビューアパートメント」**が最も収益改善のポテンシャルが高いと考えられます。\n\n**【分析結果】**\n- **現在の表面利回り**: 4.2%（全物件平均: 5.5%）\n- **過去1年の支出**: 450,000円（うち修繕費が250,000円と突出）\n- **近隣の家賃相場**: 約135,000円（現在の家賃: 120,000円）\n\n**【改善のご提案】**\n1.  **コスト削減**: 突出している修繕費の内訳を精査し、業者選定の見直しや相見積もりによってコストを削減できる可能性があります。\n2.  **家賃の増額**: 近隣相場との差額を踏まえ、次の更新時に130,000円への家賃増額を検討してみてはいかがでしょうか。実行できれば、年間120,000円の収益増が見込めます。\n\nより詳細な分析をご希望の場合は、特定の項目についてご質問ください。'
  }
];

const AISuggestions: React.FC = () => {
  const { data: properties, error: propertiesError, isLoading: isPropertiesLoading } = useSWR<Property[]>('/api/properties');
  const { data: transactions, error: transactionsError, isLoading: isTransactionsLoading } = useSWR<Transaction[]>('/api/transactions');

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false); // This is for the AI response loading
  
  // --- 履歴機能用のStateを追加 ---
  const [showHistory, setShowHistory] = useState(false);
  const [savedHistories, setSavedHistories] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);


  const chatEndRef = React.useRef<HTMLDivElement>(null);
  const wasLoading = React.useRef(false);

  // --- 履歴機能のロジックを追加 ---

  // ローカルストレージから履歴を読み込む
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('ai-chat-histories');
      if (saved) {
        const histories: ChatHistory[] = JSON.parse(saved).map((h: any) => ({
          ...h,
          messages: h.messages || [],
          createdAt: new Date(h.createdAt),
          updatedAt: new Date(h.updatedAt),
        }));
        setSavedHistories(histories);
      }
    } catch (e) {
      console.error('チャット履歴の読み込みに失敗しました:', e);
      localStorage.removeItem('ai-chat-histories');
    }
  }, []);
  
  // 履歴をローカルストレージに保存するヘルパー関数
  const saveHistoriesToLocalStorage = (histories: ChatHistory[]) => {
    try {
      localStorage.setItem('ai-chat-histories', JSON.stringify(histories));
    } catch (e) {
      console.error('チャット履歴の保存に失敗しました:', e);
    }
  };

  // 現在のチャットを保存する関数
  const saveCurrentChat = () => {
    if (messages.length === 0) return;

    const title = messages[0]?.content.slice(0, 30) + (messages[0]?.content.length > 30 ? '...' : '');
    const newHistoryEntry: ChatHistory = {
      id: currentChatId || Date.now().toString(),
      title,
      messages,
      createdAt: currentChatId ? savedHistories.find(h => h.id === currentChatId)?.createdAt || new Date() : new Date(),
      updatedAt: new Date(),
    };

    let newHistories: ChatHistory[];
    if (currentChatId) {
      // 既存の履歴を更新
      newHistories = savedHistories.map(h => h.id === currentChatId ? newHistoryEntry : h);
    } else {
      // 新しい履歴として追加
      newHistories = [newHistoryEntry, ...savedHistories];
    }
    
    setSavedHistories(newHistories);
    setCurrentChatId(newHistoryEntry.id); // 新しいIDをセット
    saveHistoriesToLocalStorage(newHistories);
  };

  // ストリーミング完了時に会話を保存する
  React.useEffect(() => {
    if (wasLoading.current && !isLoading && messages.length > 0) {
      saveCurrentChat();
    }
    wasLoading.current = isLoading;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  // 新しい会話を開始
  const startNewChat = () => {
    setMessages([]);
    setInput('');
    setCurrentChatId(null);
    setShowHistory(false); // スマホ表示の場合、サイドバーを閉じる
  };

  // 履歴から会話を読み込む
  const loadChat = (history: ChatHistory) => {
    setMessages(history.messages);
    setCurrentChatId(history.id);
    setShowHistory(false); // スマホ表示の場合、サイドバーを閉じる
  };

  // --- デモ会話を表示する関数を追加 ---
  const showDemo = () => {
    startNewChat(); // 現在のチャットをリセット
    setMessages(demoConversation);
  };
  
  // 履歴を削除
  const deleteHistory = (idToDelete: string) => {
    const newHistories = savedHistories.filter(h => h.id !== idToDelete);
    setSavedHistories(newHistories);
    saveHistoriesToLocalStorage(newHistories);
    if (currentChatId === idToDelete) {
      startNewChat();
    }
  };

  React.useEffect(() => {
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
          if (lastMessage?.role === 'assistant') {
            return [
              ...prev.slice(0, -1),
              { ...lastMessage, content: lastMessage.content + chunk }
            ];
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

  const isDataLoading = isPropertiesLoading || isTransactionsLoading;
  const swrError = propertiesError || transactionsError;

  if (swrError) return <div>Failed to load data</div>;
  if (isDataLoading) return <div>Loading...</div>;

  return (
    <div className="flex h-[calc(100vh-120px)] bg-gray-50">
      {/* --- 履歴サイドバーを追加 --- */}
      <div className={`
        w-full md:w-80 bg-white border-r border-gray-200 flex-col transition-all duration-300
        ${showHistory || window.innerWidth >= 768 ? 'flex' : 'hidden'}
      `}>
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">会話履歴</h2>
          <button
            onClick={startNewChat}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-semibold"
            title="新しい会話"
          >
            <Plus className="w-4 h-4" />
            新規
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {savedHistories.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              会話履歴はありません。
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {savedHistories.map(history => (
                <div key={history.id} className="group relative">
                  <button
                    onClick={() => loadChat(history)}
                    className={`w-full text-left p-3 rounded-lg truncate text-sm transition-colors ${
                      currentChatId === history.id
                        ? 'bg-blue-100 text-blue-800 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {history.title}
                  </button>
                  <button
                    onClick={() => deleteHistory(history.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
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
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="md:hidden p-2 text-gray-500 hover:text-blue-500"
          >
            <History className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
              <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold">会話を始めましょう</h3>
              
              {/* --- 質問のコツとデモ表示ボタンを追加 --- */}
              <div className="mt-6 max-w-md bg-white p-6 rounded-xl border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-3">良い回答を得るための質問のコツ</h4>
                <ul className="text-sm text-left text-gray-600 space-y-2 list-disc list-inside">
                  <li>**具体的に**質問する（例：「渋谷の物件」ではなく「渋谷レジデンス」）</li>
                  <li>**目的を明確に**する（例：「節税したい」「空室を埋めたい」）</li>
                  <li>**数値を交えて**尋ねる（例：「利回りを5%にするには？」）</li>
                </ul>
                <button
                  onClick={showDemo}
                  className="mt-5 w-full px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-lg text-sm hover:bg-blue-200 transition-colors"
                >
                  デモ会話を見てみる
                </button>
              </div>

              <p className="mt-8">または、下の質問例をクリックするか、自由に入力してください。</p>
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
                p-4 rounded-2xl max-w-[80%] text-gray-800 text-black
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
              className="w-full pl-4 pr-20 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none bg-gray-50 transition-all text-black"
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
    </div>
  );
};

export default AISuggestions;