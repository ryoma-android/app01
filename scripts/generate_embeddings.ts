import { createClient } from '@supabase/supabase-js';
import { OpenAIEmbeddings } from '@langchain/openai';
import dotenv from 'dotenv';
import path from 'path';

// .env.local ファイルを明示的に読み込むように修正
// スクリプトはプロジェクトルートから実行されることを想定
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });


// 環境変数からSupabaseとOpenAIのキーを取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Service Role Keyを使用
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
  console.error('必要な環境変数が設定されていません。');
  process.exit(1);
}

// Supabaseクライアントを初期化（Service Role Keyを使用）
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const embeddings = new OpenAIEmbeddings({ openAIApiKey: openaiApiKey });

// 物件情報を整形してテキスト化する関数
function formatPropertyForEmbedding(property: any): string {
  // AIが物件の特徴を捉えやすいように、重要な情報をテキストとして結合
  const details = [
    `物件名: ${property.name || '名称不明'}`,
    `住所: ${property.address || '住所不明'}`,
    `物件種別: ${property.property_type || '種別不明'}`,
    property.building_structure ? `構造: ${property.building_structure}` : '',
    property.building_year ? `建築年: ${property.building_year}年` : '',
    property.purchase_price ? `購入価格: ${Number(property.purchase_price).toLocaleString()}円` : '',
    property.monthly_rent ? `月額家賃: ${Number(property.monthly_rent).toLocaleString()}円` : '',
  ];
  return details.filter(Boolean).join('。 ');
}

async function generateAndUpdateEmbeddings() {
  console.log('処理を開始します...');

  try {
    // 1. embeddingが未設定の物件を取得
    const { data: properties, error: selectError } = await supabase
      .from('properties')
      .select('id, name, address, property_type, purchase_price, monthly_rent, building_structure, building_year')
      .is('embedding', null); // embeddingカラムがNULLの物件のみを対象

    if (selectError) {
      throw new Error(`物件の取得に失敗しました: ${selectError.message}`);
    }

    if (!properties || properties.length === 0) {
      console.log('ベクトル化が必要な物件はありませんでした。');
      return;
    }

    console.log(`${properties.length}件の物件をベクトル化します...`);

    // 2. 各物件をベクトル化してDBを更新
    for (const property of properties) {
      try {
        const inputText = formatPropertyForEmbedding(property);
        console.log(`\n[${property.name}] の情報をベクトル化中...`);
        console.log(`  入力テキスト: "${inputText}"`);

        const embedding = await embeddings.embedQuery(inputText);

        const { error: updateError } = await supabase
          .from('properties')
          .update({ embedding: embedding })
          .eq('id', property.id);

        if (updateError) {
          console.error(`  [${property.name}] (ID: ${property.id}) の更新に失敗しました:`, updateError.message);
        } else {
          console.log(`  [${property.name}] (ID: ${property.id}) のベクトル情報を更新しました。`);
        }
      } catch (e: any) {
        console.error(`  [${property.name}] (ID: ${property.id}) の処理中にエラーが発生しました:`, e.message);
      }
    }

    console.log('\n全ての処理が完了しました。');

  } catch (e: any) {
    console.error('全体の処理でエラーが発生しました:', e.message);
    process.exit(1);
  }
}

// スクリプトを実行
generateAndUpdateEmbeddings(); 