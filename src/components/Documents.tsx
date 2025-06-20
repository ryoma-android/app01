import React, { useState } from 'react';
import { FileText, Upload, Download, Eye, Calendar, Search, Filter } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  type: 'ledger' | 'receipt' | 'contract' | 'tax' | 'report';
  date: string;
  size: string;
  status: 'processed' | 'pending' | 'error';
}

const Documents: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [showUpload, setShowUpload] = useState(false);

  const mockDocuments: Document[] = [
    {
      id: '1',
      name: '2024年1月_アパートA_家賃収入',
      type: 'ledger',
      date: '2024-01-31',
      size: '245KB',
      status: 'processed'
    },
    {
      id: '2',
      name: '修繕費領収書_水道工事',
      type: 'receipt',
      date: '2024-01-15',
      size: '1.2MB',
      status: 'processed'
    },
    {
      id: '3',
      name: 'アパートA_賃貸契約書',
      type: 'contract',
      date: '2024-01-01',
      size: '3.5MB',
      status: 'processed'
    },
    {
      id: '4',
      name: '確定申告書_2023年度',
      type: 'tax',
      date: '2024-03-15',
      size: '890KB',
      status: 'processed'
    },
    {
      id: '5',
      name: '月次収支レポート_2024年1月',
      type: 'report',
      date: '2024-02-01',
      size: '567KB',
      status: 'processed'
    },
    {
      id: '6',
      name: 'CSVインポート_取引履歴',
      type: 'ledger',
      date: '2024-01-25',
      size: '123KB',
      status: 'pending'
    }
  ];

  const getTypeLabel = (type: string) => {
    const typeMap = {
      ledger: '帳簿',
      receipt: '領収書',
      contract: '契約書',
      tax: '税務書類',
      report: 'レポート'
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'processed': return '処理済み';
      case 'pending': return '処理中';
      case 'error': return 'エラー';
      default: return '不明';
    }
  };

  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || doc.type === selectedType;
    return matchesSearch && matchesType;
  });

  const UploadModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">書類をアップロード</h3>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">ファイルをドラッグ&ドロップ</p>
          <p className="text-sm text-gray-500 mb-4">または</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            ファイルを選択
          </button>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">書類タイプ</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="ledger">帳簿</option>
            <option value="receipt">領収書</option>
            <option value="contract">契約書</option>
            <option value="tax">税務書類</option>
            <option value="report">レポート</option>
          </select>
        </div>

        <div className="flex space-x-3 mt-6">
          <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
            アップロード
          </button>
          <button 
            onClick={() => setShowUpload(false)}
            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">帳簿・書類</h2>
          <p className="text-gray-500 mt-1">書類管理と帳簿の自動生成</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Upload className="w-5 h-5 mr-2" />
          書類をアップロード
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="書類を検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">すべてのタイプ</option>
            <option value="ledger">帳簿</option>
            <option value="receipt">領収書</option>
            <option value="contract">契約書</option>
            <option value="tax">税務書類</option>
            <option value="report">レポート</option>
          </select>

          <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <Filter className="w-5 h-5 mr-2" />
            フィルター
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">CSV取込</h3>
              <p className="text-sm text-gray-500">銀行データの一括取込</p>
            </div>
          </div>
          <button className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
            CSVファイルを選択
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Download className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">帳簿出力</h3>
              <p className="text-sm text-gray-500">確定申告用帳簿の生成</p>
            </div>
          </div>
          <button className="w-full px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
            帳簿をダウンロード
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">月次レポート</h3>
              <p className="text-sm text-gray-500">自動レポート生成</p>
            </div>
          </div>
          <button className="w-full px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
            レポート生成
          </button>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">書類一覧</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-500">書類名</th>
                <th className="text-left py-3 px-6 font-medium text-gray-500">タイプ</th>
                <th className="text-left py-3 px-6 font-medium text-gray-500">日付</th>
                <th className="text-left py-3 px-6 font-medium text-gray-500">サイズ</th>
                <th className="text-left py-3 px-6 font-medium text-gray-500">ステータス</th>
                <th className="text-right py-3 px-6 font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((doc) => (
                <tr key={doc.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-gray-900">{doc.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                      {getTypeLabel(doc.type)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    {new Date(doc.date).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="py-4 px-6 text-gray-600">{doc.size}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(doc.status)}`}>
                      {getStatusLabel(doc.status)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-green-600 transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showUpload && <UploadModal />}
    </div>
  );
};

export default Documents;