'use client'

import React, { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Download, Eye, Calendar, Search, Filter, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { Database } from '../types/supabase';
import { formatDate, formatFileSize } from '../utils/format';
import { Property } from '../types';

const supabase = createClient();

const DOCUMENT_BUCKET = 'documents';

const typeMap = {
  ledger: '帳簿',
  receipt: '領収書',
  contract: '契約書',
  tax_document: '税務書類',
  report: 'レポート',
  insurance: '保険',
  depreciation_schedule: '減価償却',
  other: 'その他',
};

// statusMapの型
const statusMap: Record<'processed' | 'pending' | 'error', { label: string; color: string }> = {
  processed: { label: '処理済み', color: 'bg-green-100 text-green-800' },
  pending: { label: '処理中', color: 'bg-yellow-100 text-yellow-800' },
  error: { label: 'エラー', color: 'bg-red-100 text-red-800' },
};

const getTypeLabel = (type: string) => typeMap[type as keyof typeof typeMap] || type;
const getStatusColor = (status: 'processed' | 'pending' | 'error') => statusMap[status].color;
const getStatusLabel = (status: 'processed' | 'pending' | 'error') => statusMap[status].label;

interface DocumentsProps {
  onPropertyAdded: (newProperty: Property) => void;
}

const Documents: React.FC<DocumentsProps> = ({ onPropertyAdded }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const [documents, setDocuments] = useState<Database['public']['Tables']['documents']['Row'][]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<'receipt' | 'contract' | 'tax_document' | 'insurance' | 'depreciation_schedule' | 'other'>('receipt');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);

  useEffect(() => {
    const fetchCurrentUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    };
    fetchCurrentUserId();
    debugger
  }, []);

  const PAGE_SIZE = 50;
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // 書類一覧取得
  const fetchDocuments = async () => {
    if (!userId) return;
    setLoading(true);
    // 件数取得
    const { count } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    setTotalCount(count || 0);
    // データ取得
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (!error && data) setDocuments(data);
    setLoading(false);
  };

  useEffect(() => {
    if (userId) {
      fetchDocuments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, page]);

  // アップロード処理
  const handleUpload = async () => {
    setUploadError(null);
    if (!file || !userId) return;
    setUploading(true);
    setOcrProcessing(false);

    try {
      // 1. 書類情報をDBとストレージに保存
      const filePath = `${userId}/${Date.now()}_${file.name}`;
      await supabase.storage.from(DOCUMENT_BUCKET).upload(filePath, file);
      const { data: urlData } = supabase.storage.from(DOCUMENT_BUCKET).getPublicUrl(filePath);
      if (!urlData?.publicUrl) throw new Error("URLの取得に失敗しました");

      const { data: document, error: dbError } = await supabase.from('documents').insert({
        user_id: userId,
        name: file.name,
        type: uploadType,
        file_url: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
      }).select().single();

      if (dbError) throw dbError;

      // 2. もし契約書ならOCR解析を実行
      if (uploadType === 'contract') {
        setOcrProcessing(true);

        // 2a. OCRでテキスト抽出
        const ocrResponse = await fetch('/api/ocr-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileUrl: urlData.publicUrl }),
        });
        if (!ocrResponse.ok) throw new Error('OCRでのテキスト抽出に失敗しました。');
        const { ocrText } = await ocrResponse.json();

        // 2b. テキストをAIで解析・物件登録
        const analyzeResponse = await fetch('/api/ocr-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ocrText, userId }),
        });
        if (!analyzeResponse.ok) throw new Error('物件情報の解析・登録に失敗しました。');
        const { property: newProperty } = await analyzeResponse.json();

        // 2c. 親コンポーネントの物件リストを更新
        if (newProperty) {
          onPropertyAdded(newProperty);
        }
      }
      
      setShowUpload(false);
      setFile(null);
      setUploadType('receipt');
      await fetchDocuments();

    } catch (e: any) {
      console.error(e);
      setUploadError(e.message || 'アップロード処理中にエラーが発生しました。');
    } finally {
      setUploading(false);
      setOcrProcessing(false);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      alert('ファイルのダウンロードに失敗しました。');
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name?.toLowerCase().includes(searchTerm.toLowerCase());
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
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={e => setFile(e.target.files?.[0] || null)}
            accept="*"
          />
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            ファイルを選択
          </button>
          {file && <div className="mt-2 text-sm text-gray-700">選択中: {file.name}</div>}
        </div>
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">書類タイプ</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={uploadType}
            onChange={e => setUploadType(e.target.value as any)}
          >
            <option value="receipt">領収書</option>
            <option value="contract">契約書 (OCRで物件を自動登録)</option>
            <option value="tax_document">税務書類</option>
            <option value="insurance">保険</option>
            <option value="depreciation_schedule">減価償却</option>
            <option value="other">その他</option>
          </select>
        </div>
        {uploadError && <div className="text-red-500 mt-2 text-sm">{uploadError}</div>}
        <div className="flex space-x-3 mt-6">
          <button
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            onClick={handleUpload}
            disabled={uploading || !file}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {ocrProcessing ? 'AIが解析中...' : 'アップロード中...'}
              </>
            ) : (
              'アップロード'
            )}
          </button>
          <button
            onClick={() => { setShowUpload(false); setFile(null); setUploadError(null); }}
            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={uploading}
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-8 flex flex-col sm:flex-row justify-between items-center mb-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <FileText className="w-7 h-7 text-white" /> 帳簿・書類管理
          </h2>
          <p className="text-blue-100 text-base">書類管理と帳簿の自動生成</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-5 py-3 bg-white text-blue-700 font-semibold rounded-xl shadow hover:bg-blue-50 transition-colors mt-6 sm:mt-0"
        >
          <Upload className="w-5 h-5" />
          書類をアップロード
        </button>
      </div>
      {/* Search and Filter */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
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
            className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">すべてのタイプ</option>
            <option value="receipt">領収書</option>
            <option value="contract">契約書</option>
            <option value="tax_document">税務書類</option>
            <option value="insurance">保険</option>
            <option value="depreciation_schedule">減価償却</option>
            <option value="other">その他</option>
          </select>
          <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <Filter className="w-5 h-5 mr-2" />
            フィルター
          </button>
        </div>
      </div>
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
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
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
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
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
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
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">書類一覧</h3>
          <div className="text-sm text-gray-500">{totalCount}件中 {page * PAGE_SIZE + 1}〜{Math.min((page + 1) * PAGE_SIZE, totalCount)}件表示</div>
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
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8">読み込み中...</td></tr>
              ) : filteredDocuments.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8">{totalCount === 0 ? '書類がありません。まずはアップロードしてください。' : '該当する書類がありません'}</td></tr>
              ) : filteredDocuments.map((doc) => (
                <tr key={doc.id} className="border-t border-gray-100 hover:bg-blue-50">
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
                    {doc.created_at ? formatDate(doc.created_at) : ''}
                  </td>
                  <td className="py-4 px-6 text-gray-600">{doc.file_size ? formatFileSize(doc.file_size) : '-'}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor('processed')}`}>
                      {getStatusLabel('processed')}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end space-x-2">
                      {doc.file_url && (
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                          <Eye className="w-4 h-4" />
                        </a>
                      )}
                      {doc.file_url && doc.name &&(
                        <button onClick={() => handleDownload(doc.file_url!, doc.name!)} className="p-1 text-gray-400 hover:text-green-600 transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* ページネーション */}
        <div className="flex justify-center items-center gap-2 py-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 bg-gray-200 rounded-lg font-semibold text-gray-600 hover:bg-gray-300 disabled:opacity-50 transition"
            aria-label="前のページ"
          >前へ</button>
          <span className="text-gray-700">{page + 1} / {Math.ceil(totalCount / PAGE_SIZE)}ページ</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={(page + 1) * PAGE_SIZE >= totalCount}
            className="px-4 py-2 bg-gray-200 rounded-lg font-semibold text-gray-600 hover:bg-gray-300 disabled:opacity-50 transition"
            aria-label="次のページ"
          >次へ</button>
        </div>
      </div>
      {showUpload && <UploadModal />}
    </div>
  );
};

export default Documents;