import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
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
  const supabase = createClient();
  const body = await req.json();
  const { propertyId } = body;

  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    console.error('OpenAI APIキーが設定されていません。');
    return NextResponse.json({ error: 'サーバーの設定エラーです。管理者にお問い合わせください。' }, { status: 500 });
  }

  const embeddings = new OpenAIEmbeddings({ openAIApiKey: openaiApiKey });

  try {
    if (!propertyId) {
      return NextResponse.json({ error: '物件IDが必要です。' }, { status: 400 });
    }
    
    // Check if the user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
    }

    // 1. Fetch property data (RLS will be applied)
    const { data: property, error: selectError } = await supabase
      .from('properties')
      .select('id, name, address, property_type, purchase_price, monthly_rent, building_structure, building_year')
      .eq('id', propertyId)
      .eq('owner_id', user.id) // Ensure the user owns the property
      .single();

    if (selectError) {
      throw new Error(`物件(ID: ${propertyId})の取得に失敗しました: ${selectError.message}`);
    }

    if (!property) {
      return NextResponse.json({ error: `物件(ID: ${propertyId})が見つからないか、アクセス権がありません。` }, { status: 404 });
    }

    // 2. Vectorize property information
    const inputText = formatPropertyForEmbedding(property);
    const embedding = await embeddings.embedQuery(inputText);

    // 3. Update the database
    const { error: updateError } = await supabase
      .from('properties')
      .update({ embedding: embedding, updated_at: new Date().toISOString() })
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