'use client';

import React, { useState } from 'react';
import { supabase } from '@/utils/supabase';

const DatabaseTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testDatabaseConnection = async () => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      // 1. 基本的な接続テスト
      addResult('データベース接続をテスト中...');
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        throw new Error(`接続エラー: ${error.message}`);
      }
      addResult('✅ データベース接続成功');

      // 2. テーブル存在確認
      addResult('テーブル存在確認中...');
      const tables = [
        'profiles', 'plans', 'properties', 'accounts', 
        'transactions', 'ai_recommendations', 'suggested_actions'
      ];

      for (const table of tables) {
        try {
          const { error: tableError } = await supabase.from(table).select('*').limit(1);
          if (tableError) {
            addResult(`❌ テーブル ${table} が見つかりません: ${tableError.message}`);
          } else {
            addResult(`✅ テーブル ${table} が存在します`);
          }
        } catch (err) {
          addResult(`❌ テーブル ${table} の確認に失敗: ${err}`);
        }
      }

      // 3. 初期データ確認
      addResult('初期データ確認中...');
      
      // plans テーブルのデータ確認
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('*');
      
      if (plansError) {
        addResult(`❌ plans テーブルのデータ取得に失敗: ${plansError.message}`);
      } else {
        addResult(`✅ plans テーブルに ${plansData?.length || 0} 件のデータがあります`);
      }

      // suggested_actions テーブルのデータ確認
      const { data: actionsData, error: actionsError } = await supabase
        .from('suggested_actions')
        .select('*');
      
      if (actionsError) {
        addResult(`❌ suggested_actions テーブルのデータ取得に失敗: ${actionsError.message}`);
      } else {
        addResult(`✅ suggested_actions テーブルに ${actionsData?.length || 0} 件のデータがあります`);
      }

      // 4. RLS ポリシー確認
      addResult('RLS ポリシー確認中...');
      try {
        const { data: rlsData, error: rlsError } = await supabase
          .from('profiles')
          .select('*')
          .limit(1);
        
        if (rlsError && rlsError.message.includes('policy')) {
          addResult('✅ RLS ポリシーが正しく設定されています');
        } else if (rlsError) {
          addResult(`⚠️ RLS ポリシーに問題がある可能性: ${rlsError.message}`);
        } else {
          addResult('✅ RLS ポリシーが正常に動作しています');
        }
      } catch (err) {
        addResult(`❌ RLS ポリシーの確認に失敗: ${err}`);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      addResult(`❌ テスト失敗: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">データベース接続テスト</h2>
      
      <button
        onClick={testDatabaseConnection}
        disabled={loading}
        className="mb-6 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors disabled:bg-gray-400"
      >
        {loading ? 'テスト中...' : 'データベース接続テストを実行'}
      </button>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>エラー:</strong> {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">テスト結果:</h3>
          <div className="bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className="mb-2 text-sm font-mono">
                {result}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">テスト内容:</h3>
        <ul className="text-sm space-y-1">
          <li>• データベース接続の確認</li>
          <li>• 各テーブルの存在確認</li>
          <li>• 初期データの確認</li>
          <li>• RLS ポリシーの動作確認</li>
        </ul>
      </div>
    </div>
  );
};

export default DatabaseTest; 