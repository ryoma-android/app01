import React from 'react';
import { Home, FileText, BarChart3, Brain, Settings, HelpCircle, X } from 'lucide-react';

interface UsageGuideProps {
  onClose: () => void;
}

const steps = [
  {
    icon: <Home className="w-8 h-8 text-blue-500" />,
    title: '1. 物件・取引の登録',
    description: '「物件管理」から、所有する物件情報や家賃収入、経費などの取引を登録します。すべての分析はここから始まります。',
  },
  {
    icon: <BarChart3 className="w-8 h-8 text-green-500" />,
    title: '2. 収支の可視化と分析',
    description: '「ダッシュボード」や「分析」で、登録したデータをもとに収益や利益率をグラフで確認。物件ごとのパフォーマンス比較も簡単です。',
  },
  {
    icon: <FileText className="w-8 h-8 text-purple-500" />,
    title: '3. 書類の管理とOCR機能',
    description: '「書類」に領収書や契約書をアップロードして一元管理。OCR機能を使えば、画像からテキストを自動で読み取り、取引登録の手間を省けます。',
  },
  {
    icon: <Brain className="w-8 h-8 text-pink-500" />,
    title: '4. AIによるアドバイス',
    description: '「AI相談」で、不動産投資の戦略や節税対策についてAIに質問できます。データに基づいた客観的なアドバイスを得られます。',
  },
  {
    icon: <Settings className="w-8 h-8 text-gray-500" />,
    title: '5. プロフィールの設定',
    description: '「設定」画面で、ご自身のプロフィール情報や通知設定をいつでも変更できます。',
  },
];

export const UsageGuide: React.FC<UsageGuideProps> = ({ onClose }) => (
  <div 
    className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4 transition-opacity duration-300"
    onClick={onClose}
  >
    <div 
      className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8 relative transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
      onClick={(e) => e.stopPropagation()}
    >
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all"
        aria-label="ガイドを閉じる"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-shrink-0 bg-blue-100 rounded-full p-2">
          <HelpCircle className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">
          使い方ガイド
        </h2>
      </div>

      <div className="space-y-6 pr-4">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-start gap-5 p-5 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all">
            <div className="flex-shrink-0 mt-1">{step.icon}</div>
            <div className='flex flex-col gap-1'>
              <h3 className="text-lg font-semibold text-gray-800">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-5 text-sm text-blue-900">
        <h4 className="font-bold text-base mb-2">よくある質問</h4>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <b>データは自動保存されますか？</b><br/>
            はい、入力や変更を行うとリアルタイムで自動的に保存されるため、保存ボタンを押す必要はありません。
          </li>
          <li>
            <b>AI相談は無料ですか？</b><br/>
            はい、現在はβ版としてすべての機能を無料でご利用いただけます。
          </li>
          <li>
            <b>サポートはどこから？</b><br/>
            画面右下のサポートボタン、または設定画面のお問い合わせフォームからいつでもご連絡ください。
          </li>
        </ul>
      </div>
    </div>
  </div>
);

export default UsageGuide; 