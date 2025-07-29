import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OpenAIEmbeddings } from '@langchain/openai';

// 物件情報を整形してテキスト化する関数
function formatPropertyForEmbedding(property: any): string {
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

export async function POST(req: NextRequest) {
  // 環境変数を関数スコープ内で取得
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
    console.error('APIキーなどの環境変数が設定されていません。');
    return NextResponse.json({ error: 'サーバーの設定エラーです。管理者にお問い合わせください。' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const embeddings = new OpenAIEmbeddings({ openAIApiKey: openaiApiKey });

  try {
    const { propertyId } = await req.json();

    if (!propertyId) {
      return NextResponse.json({ error: '物件IDが必要です。' }, { status: 400 });
    }

    // 1. 指定されたIDの物件データを取得
    const { data: property, error: selectError } = await supabase
      .from('properties')
      .select('id, name, address, property_type, purchase_price, monthly_rent, building_structure, building_year')
      .eq('id', propertyId)
      .single();

    if (selectError) {
      throw new Error(`物件(ID: ${propertyId})の取得に失敗しました: ${selectError.message}`);
    }

    if (!property) {
      return NextResponse.json({ error: `物件(ID: ${propertyId})が見つかりません。` }, { status: 404 });
    }

    // 2. 物件情報をベクトル化
    const inputText = formatPropertyForEmbedding(property);
    const embedding = await embeddings.embedQuery(inputText);

    // 3. データベースを更新
    const { error: updateError } = await supabase
      .from('properties')
      .update({ embedding: embedding, updated_at: new Date().toISOString() }) // updated_atも手動で更新
      .eq('id', property.id);

    if (updateError) {
      throw new Error(`物件(ID: ${propertyId})のベクトル情報更新に失敗しました: ${updateError.message}`);
    }

    return NextResponse.json({
      message: `物件「${property.name}」のベクトル情報が正常に更新されました。`,
      propertyId: property.id,
    });

  } catch (e: any) {
    console.error('[Generate Embedding API Error]', e);
    return NextResponse.json({ error: e.message || 'サーバーで予期せぬエラーが発生しました。' }, { status: 500 });
  }
} 