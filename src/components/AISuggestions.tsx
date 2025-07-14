'use client'

import React, { useState, useRef } from 'react';
import { Property, Transaction, AIRecommendation } from '../types';
import { formatCurrency } from '../utils/mockData';
import { Brain, Lightbulb, TrendingUp, DollarSign, Wrench, FileText, ChevronRight, X, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import ClientProviders from '@/components/ClientProviders';

interface AISuggestionsProps {
  properties: Property[];
  transactions: Transaction[];
}

const AISuggestions: React.FC<AISuggestionsProps> = ({ properties, transactions }) => {
  const [selectedSuggestion, setSelectedSuggestion] = useState<AIRecommendation | null>(null);
  const [showModal, setShowModal] = useState(false);

  // --- AIチャットUI用 state ---
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // データから統計を計算
  const calculateStats = () => {
    const recentTransactions = (transactions || []).filter((t: Transaction) => {
      const transactionDate = new Date(t.date ?? '');
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return transactionDate >= threeMonthsAgo;
    });

    const totalIncome = recentTransactions
      .filter((t: Transaction) => t.type === 'income')
      .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

    const totalExpenses = recentTransactions
      .filter((t: Transaction) => t.type === 'expense')
      .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

    const repairExpenses = recentTransactions
      .filter((t: Transaction) => t.type === 'expense' && t.category.includes('修繕'))
      .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

    const consumableExpenses = recentTransactions
      .filter((t: Transaction) => t.type === 'expense' && (
        t.category.includes('消耗') || 
        t.category.includes('清掃') || 
        t.category.includes('管理')
      ))
      .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      repairExpenses,
      consumableExpenses
    };
  };

  const stats = calculateStats();

  // ダミーのAI提案を生成
  const generateAISuggestions = (): AIRecommendation[] => {
    return [
      {
        id: '1',
        property_id: '1',
        type: 'maintenance',
        title: '修繕費の最適化提案',
        description: `直近の修繕費が${formatCurrency(stats.repairExpenses)}かかっています。費用対効果の高いリフォームを検討しましょう。`,
        impact: 'high',
        priority: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        estimated_savings: 50000,
        implementation_cost: 200000,
        timeline: '3ヶ月以内',
        status: 'pending'
      },
      {
        id: '2',
        property_id: '2',
        type: 'revenue_improvement',
        title: '家賃収入の最適化',
        description: `今月の家賃収入は${formatCurrency(stats.totalIncome)}でした。近隣物件の相場と比較し、家賃の見直しを検討できます。`,
        impact: 'medium',
        priority: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        estimated_savings: 120000,
        implementation_cost: 0,
        timeline: '即座に実施可能',
        status: 'pending'
      },
      {
        id: '3',
        property_id: '3',
        type: 'tax_saving',
        title: '確定申告の節税対策',
        description: `消耗品費として計上できる項目が${formatCurrency(stats.consumableExpenses)}分見られます。確定申告時の節税効果を最大化するために、レシートを整理しましょう。`,
        impact: 'high',
        priority: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        estimated_savings: 25000,
        implementation_cost: 0,
        timeline: '1ヶ月以内',
        status: 'pending'
      },
      {
        id: '4',
        property_id: '1',
        type: 'investment',
        title: 'エネルギー効率の改善',
        description: '断熱改修により光熱費削減と家賃競争力向上が期待できます。投資回収期間は約3年と試算されます。',
        impact: 'medium',
        priority: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        estimated_savings: 300000,
        implementation_cost: 2000000,
        timeline: '6ヶ月以内',
        status: 'pending'
      },
      {
        id: '5',
        property_id: '2',
        type: 'risk_management',
        title: '保険見直しの提案',
        description: '現在の火災保険の補償内容を確認し、適切な保険料に調整することで年間の支出削減が可能です。',
        impact: 'medium',
        priority: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        estimated_savings: 15000,
        implementation_cost: 0,
        timeline: '2ヶ月以内',
        status: 'pending'
      }
    ];
  };

  const suggestions = generateAISuggestions();

  const handleSuggestionClick = (suggestion: AIRecommendation) => {
    setSelectedSuggestion(suggestion);
    setShowModal(true);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getImpactLabel = (impact: string) => {
    switch (impact) {
      case 'high':
        return '重要';
      case 'medium':
        return '中程度';
      case 'low':
        return '低';
      default:
        return '不明';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'maintenance':
        return <Wrench className="w-5 h-5" />;
      case 'revenue_improvement':
        return <TrendingUp className="w-5 h-5" />;
      case 'tax_saving':
        return <DollarSign className="w-5 h-5" />;
      case 'investment':
        return <Lightbulb className="w-5 h-5" />;
      case 'risk_management':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Brain className="w-5 h-5" />;
    }
  };

  // チャット送信ハンドラ
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMessage = chatInput.trim();
    setChatHistory((prev) => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage,
          properties,
          transactions,
        }),
      });
      const data = await res.json();
      setChatHistory((prev) => [...prev, { role: 'ai', content: data.answer || data.error || 'エラーが発生しました' }]);
    } catch (err) {
      setChatHistory((prev) => [...prev, { role: 'ai', content: 'サーバーエラーが発生しました' }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Brain className="w-8 h-8 text-purple-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI示唆・アドバイス</h1>
            <p className="text-gray-600">あなたの不動産投資を最適化するためのAI提案</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-purple-600 font-medium">総収入</p>
            <p className="text-2xl font-bold text-purple-700">{formatCurrency(stats.totalIncome)}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <p className="text-red-600 font-medium">総支出</p>
            <p className="text-2xl font-bold text-red-700">{formatCurrency(stats.totalExpenses)}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-green-600 font-medium">純利益</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(stats.totalIncome - stats.totalExpenses)}</p>
          </div>
        </div>
      </div>

      {/* AI提案一覧 */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">推奨事項 ({suggestions.length}件)</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    {getTypeIcon(suggestion.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                      {suggestion.title}
                    </h3>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full border ${getImpactColor(suggestion.impact)}`}>
                      {getImpactLabel(suggestion.impact)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </div>
              
              <p className="text-gray-600 mb-4 line-clamp-3">
                {suggestion.description}
              </p>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  {suggestion.estimated_savings && (
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-green-600 font-medium">
                        節約: {formatCurrency(suggestion.estimated_savings)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-gray-400 mr-1" />
                    <span className="text-gray-500">{suggestion.timeline}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-xs text-gray-400">優先度 {suggestion.priority}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- AIチャットUI --- */}
      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Brain className="w-6 h-6 text-purple-600 mr-2" />AIチャット相談
        </h2>
        <div className="h-64 overflow-y-auto bg-gray-50 rounded-lg p-4 mb-4 flex flex-col space-y-2" style={{ maxHeight: 320 }}>
          {chatHistory.length === 0 && (
            <div className="text-gray-400 text-sm">AIに自由に質問できます。例:「今月の家賃収入は？」「節税のコツは？」</div>
          )}
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-4 py-2 rounded-lg max-w-[80%] text-sm whitespace-pre-line ${msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-900'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={handleChatSubmit} className="flex items-center space-x-2">
          <input
            type="text"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="AIに質問する..."
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            disabled={chatLoading}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            disabled={chatLoading || !chatInput.trim()}
          >
            送信
          </button>
        </form>
        {chatLoading && <div className="text-xs text-gray-400 mt-2">AIが考え中...</div>}
      </div>
      {/* --- 既存のAI提案UI --- */}
      {/* 詳細モーダル */}
      {showModal && selectedSuggestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    {getTypeIcon(selectedSuggestion.type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedSuggestion.title}</h3>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full border ${getImpactColor(selectedSuggestion.impact)}`}>
                      {getImpactLabel(selectedSuggestion.impact)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">提案内容</h4>
                <p className="text-gray-600">{selectedSuggestion.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedSuggestion.estimated_savings && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h5 className="font-medium text-green-800 mb-1">予想節約額</h5>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedSuggestion.estimated_savings)}
                    </p>
                  </div>
                )}
                
                {selectedSuggestion.implementation_cost && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h5 className="font-medium text-blue-800 mb-1">実装コスト</h5>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(selectedSuggestion.implementation_cost)}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">{selectedSuggestion.timeline}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600">優先度 {selectedSuggestion.priority}</span>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    後で検討
                  </button>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    実装する
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISuggestions;