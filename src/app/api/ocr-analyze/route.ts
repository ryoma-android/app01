import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'langchain/llms/openai';
import { createClient } from '@supabase/supabase-js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export async function POST(req: NextRequest) {
  try {
    const { ocrText, userId } = await req.json();
    if (!ocrText || !userId) {
      return NextResponse.json({ error: 'OCRテキストまたはユーザーIDがありません' }, { status: 400 });
    }

    const model = new OpenAI({ openAIApiKey: OPENAI_API_KEY, temperature: 0 });
    const prompt = `
      以下は不動産関連の書類からOCRで読み取ったテキストです。
      このテキストから以下の情報を抽出し、JSON形式で出力してください。

      - 物件名 (property_name)
      - 住所 (address)
      - 物件種別 (property_type: e.g., 'マンション', 'アパート', '戸建て')
      - 構造 (structure: e.g., '鉄骨造', '木造')
      - 築年数 (year_built: 西暦年)
      - 総戸数 (total_units: 数値)
      
      テキストから情報が読み取れない場合は、該当する値に "不明" と設定してください。
      数値が読み取れない場合は null を設定してください。

      ---
      ${ocrText}
      ---

      JSON出力:
    `;
    const response = await model.call(prompt);

    let extractedData;
    try {
      extractedData = JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      return NextResponse.json({ error: 'AIからの応答を解析できませんでした。' }, { status: 500 });
    }

    // DBに物件情報を保存
    const { data: property, error: dbError } = await supabase
      .from('properties')
      .insert({
        user_id: userId,
        name: extractedData.property_name,
        address: extractedData.address,
        type: extractedData.property_type,
        structure: extractedData.structure,
        year_built: extractedData.year_built,
        total_units: extractedData.total_units,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Supabase insert error:', dbError);
      return NextResponse.json({ error: 'データベースへの保存に失敗しました。', details: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, property });
  } catch (e: any) {
    console.error('API Error:', e);
    return NextResponse.json({ error: e.message || 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}