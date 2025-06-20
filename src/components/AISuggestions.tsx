import React, { useState } from 'react';
import { Brain, TrendingUp, DollarSign, Wrench, Target, ChevronRight, MessageSquare, Send, Lightbulb, Info, HelpCircle } from 'lucide-react';
import { mockRecommendations, mockProperties, generatePropertyFinancials } from '../utils/mockData';

const AISuggestions: React.FC = () => {
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{id: string, type: 'user' | 'ai', message: string, timestamp: Date}>>([]);

  const filteredRecommendations = selectedProperty === 'all' 
    ? mockRecommendations 
    : mockRecommendations.filter(rec => rec.property_id === selectedProperty);

  const getIcon = (type: string) => {
    switch (type) {
      case 'revenue_improvement': return TrendingUp;
      case 'tax_saving': return DollarSign;
      case 'maintenance': return Wrench;
      case 'investment': return Target;
      default: return Brain;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'revenue_improvement': return '収益改善';
      case 'tax_saving': return '節税対策';
      case 'maintenance': return 'メンテナンス';
      case 'investment': return '投資提案';
      default: return 'その他';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImpactLabel = (impact: string) => {
    switch (impact) {
      case 'high': return '重要度：高';
      case 'medium': return '重要度：中';
      case 'low': return '重要度：低';
      default: return '重要度：不明';
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      message: chatMessage,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setChatMessage('');

    // AIの返答をシミュレート
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        type: 'ai' as const,
        message: generateAIResponse(chatMessage),
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const generateAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('家賃') || message.includes('収入')) {
      return 'あなたの物件の家賃についてですが、現在の市場価格と比較すると、アパートAは5-8%程度の増額余地があります。近隣の類似物件の家賃相場を調査し、必要に応じて小規模なリノベーションを行うことで、家賃アップが期待できます。具体的には、水回りの改修や内装のリフレッシュが効果的です。';
    }
    
    if (message.includes('税金') || message.includes('節税')) {
      return '節税対策として、以下の点を検討してください：\n\n1）修繕費と資本的支出の適切な区分\n2）減価償却の最適化\n3）青色申告特別控除の活用\n\n特に今期は修繕費が多いため、適切な計上により税負担を軽減できます。領収書の整理も忘れずに行ってください。';
    }
    
    if (message.includes('修繕') || message.includes('メンテナンス')) {
      return '予防的メンテナンスは長期的な収益性向上に重要です。築年数を考慮すると、定期点検により大規模修繕を避けることができ、結果的にコストを抑制できます。年間予算の5-8%をメンテナンス費用として確保することをお勧めします。特に水回りと外壁の点検は重要です。';
    }
    
    return 'ご質問いただきありがとうございます。より具体的なアドバイスのため、どの物件について、どのような観点でのご相談かお聞かせください。収益改善、節税対策、メンテナンス計画など、様々な角度からサポートさせていただきます。お気軽にご相談ください。';
  };

  const suggestedQuestions = [
    "家賃を上げるにはどうすればいいですか？",
    "節税のためにできることはありますか？",
    "物件のリフォームは必要ですか？",
    "維持費を安くする方法はありますか？"
  ];

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">AI投資アドバイザー</h2>
            <p className="text-purple-100">あなたの不動産投資を最適化するための提案をします</p>
          </div>
        </div>
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center">
            <Lightbulb className="w-4 h-4 mr-2" />
            {filteredRecommendations.length}件の提案があります
          </div>
          <div className="flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            収益改善の可能性を発見
          </div>
        </div>
      </div>

      {/* フィルター */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">提案を絞り込む</h3>
            <p className="text-gray-500 text-sm">特定の物件の提案だけを見ることができます</p>
          </div>
          <select 
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">すべての物件</option>
            {mockProperties.map(property => (
              <option key={property.id} value={property.id}>{property.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 提案一覧 */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">AIからの提案</h3>
            <span className="text-sm text-gray-500">{filteredRecommendations.length}件の提案</span>
          </div>
          
          {filteredRecommendations.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 text-center">
              <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">提案がありません</h4>
              <p className="text-gray-500 text-sm">選択した物件には現在提案がありません。</p>
            </div>
          ) : (
            filteredRecommendations.map((recommendation) => {
              const Icon = getIcon(recommendation.type);
              const property = mockProperties.find(p => p.id === recommendation.property_id);
              
              return (
                <div key={recommendation.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{recommendation.title}</h4>
                        <p className="text-sm text-gray-500">{property?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getImpactColor(recommendation.impact)}`}>
                        {getImpactLabel(recommendation.impact)}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                        {getTypeLabel(recommendation.type)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4 leading-relaxed">{recommendation.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {new Date(recommendation.created_at).toLocaleDateString('ja-JP')}
                    </span>
                    <button className="flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
                      詳しく見る
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* AI相談チャット */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col" style={{ height: '700px' }}>
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">AI相談チャット</h3>
                <p className="text-sm text-gray-500">不動産投資について何でもお聞きください</p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {chatHistory.length === 0 ? (
              <div className="text-center mt-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">AIに相談してみましょう</h4>
                <p className="text-sm text-gray-500 mb-6">
                  不動産投資の疑問や悩みを気軽にご相談ください。<br />
                  家賃設定、節税対策、物件管理など、なんでもお答えします。
                </p>
                
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">よくある質問</p>
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => setChatMessage(question)}
                      className="block w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {chatHistory.map((chat) => (
                  <div key={chat.id} className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                      chat.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-line">{chat.message}</p>
                      <p className={`text-xs mt-2 ${
                        chat.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {chat.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-100">
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="不動産投資について質問してください..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!chatMessage.trim()}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 flex items-center">
              <Info className="w-3 h-3 mr-1" />
              AIの回答は参考情報です。重要な判断は専門家にご相談ください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISuggestions;