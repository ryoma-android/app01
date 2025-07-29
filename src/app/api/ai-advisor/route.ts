import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// よくある質問・不動産投資の基礎知識
const FAQ_KNOWLEDGE = [
  '利回りとは、年間の家賃収入を物件の購入価格で割り、100を掛けたものです。計算式: 利回り(%) = 年間家賃収入 ÷ 購入価格 × 100',
  '管理費とは、物件の維持管理にかかる費用です。マンションの場合は共用部分の清掃や修繕などに使われます。',
  '修繕費は、物件の設備や建物の修理・交換にかかる費用です。',
  '節税対策として、減価償却や必要経費の計上が有効です。',
  '空室リスクを下げるには、立地や設備の充実、適切な家賃設定が重要です。',
  '不動産投資のリスクには、空室、家賃下落、修繕費の増加、災害リスクなどがあります。',
  '家賃収入は毎月の安定収入となりますが、固定資産税や管理費などの支出も考慮しましょう。',
  '物件の選び方は、立地、築年数、利回り、管理状況、周辺環境などを総合的に判断します。',
  'ローン返済額は、借入金額、金利、返済期間によって決まります。',
  '不動産投資の出口戦略には、売却、賃貸継続、リフォーム後の再賃貸などがあります。',
];

const MARKET_NEWS_LAW = [
  '【市場データ】2024年7月現在、全国の平均家賃は8.2万円、空室率は12.5%です。東京都心部では家賃上昇傾向が続いています。',
  '【市場データ】2024年の不動産投資市場は、低金利とインフレ期待を背景に活発化しています。',
  '【不動産ニュース】「賃貸住宅の省エネ義務化、2025年から段階的に導入へ」(2024/06/30)',
  '【不動産ニュース】「サブリース規制強化、オーナー保護策が拡充」(2024/07/10)',
  '【不動産ニュース】「空き家対策特別措置法の改正案が成立」(2024/05/15)',
  '【法令】宅地建物取引業法では、重要事項説明書の交付が義務付けられています。',
  '【法令】賃貸借契約における敷金・礼金の取り扱いは、民法第622条等に基づきます。',
  '【法令】2024年4月施行の改正民法により、原状回復義務の範囲が明確化されました。',
];


function summarizeTransactions(transactions: any[]): string {
  if (!transactions || transactions.length === 0) return '取引データはありません。';
  
  const byCategory: Record<string, number> = {};
  transactions.forEach((t) => {
    const category = t.category || 'カテゴリなし';
    if (!byCategory[category]) byCategory[category] = 0;
    byCategory[category] += t.amount || 0;
  });

  if (Object.keys(byCategory).length === 0) return '集計可能な取引データがありません。';

  return (
    '【取引サマリー】\n' +
    Object.entries(byCategory)
      .map(([cat, sum]) => `${cat}: 合計${sum.toLocaleString()}円`)
      .join(' / ')
  );
}

export async function POST(req: NextRequest) {
  // Supabaseクライアントを関数スコープで初期化
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Supabaseの環境変数が設定されていません。' }, { status: 500 });
  }
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { question, transactions } = await req.json();

    if (!question) {
      return NextResponse.json({ error: '質問がありません' }, { status: 400 });
    }

    // LangChainStreamは古い形式のため、新しいストリーミング方式に切り替えます
    // const { stream, handlers } = LangChainStream();

    // 1. ユーザーの質問をベクトル化
    const embeddings = new OpenAIEmbeddings({ openAIApiKey: OPENAI_API_KEY });
    const queryEmbedding = await embeddings.embedQuery(question);

    // 2. Supabase RPCで類似物件を検索
    const { data: matchedProperties, error: rpcError } = await supabase.rpc('match_properties', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7, // 類似度の閾値（0.0〜1.0）。0.7以上ならかなり関連性が高いと判断
      match_count: 5        // 最大で5件の関連物件情報を取得
    });

    if (rpcError) {
      console.error('Supabase RPC Error:', rpcError);
      throw new Error(`ベクトル検索に失敗しました: ${rpcError.message}`);
    }

    // 3. AIに渡すコンテキスト（背景情報）を構築
    const propertyContext = matchedProperties && matchedProperties.length > 0
      ? matchedProperties.map((p: {
          // pに型を定義してanyエラーを修正
          name: string;
          address: string;
          property_type: string;
          purchase_price: number | null;
          monthly_rent: number | null;
          purchase_date: string;
          similarity: number;
        }) => 
          `【関連物件情報】\n・物件名: ${p.name}\n・住所: ${p.address}\n・タイプ: ${p.property_type}\n・購入価格: ${p.purchase_price?.toLocaleString()}円\n・月額家賃: ${p.monthly_rent?.toLocaleString()}円\n・購入日: ${p.purchase_date}\n・質問との関連度スコア: ${p.similarity.toFixed(2)}`
        ).join('\n\n')
      : '関連する物件情報は見つかりませんでした。';
    
    const transactionSummary = summarizeTransactions(transactions || []);
    
    const staticKnowledge = [...FAQ_KNOWLEDGE, ...MARKET_NEWS_LAW].join('\n');

    const context = [propertyContext, transactionSummary, staticKnowledge].join('\n\n---\n\n');

    // 4. プロンプトを作成してAIに質問
    const model = new ChatOpenAI({ 
      openAIApiKey: OPENAI_API_KEY, 
      modelName: "gpt-4-turbo", // 高性能なモデルを指定
      temperature: 0.2, // 回答の多様性を抑え、より事実に即した回答を促す
      streaming: true, // ストリーミングを有効化
    });
    
    const promptTemplate = PromptTemplate.fromTemplate(
      `あなたは優秀な不動産投資アドバイザーAI「次の一手」です。以下の【参考情報】を基に、ユーザーの【質問】に対して、専門的かつ具体的に回答してください。回答を作成する際は、以下のルールを厳守してください。

ルール:
- 必ず日本語で回答してください。
- 回答には、どの【参考情報】を基にしたのかを明確に示してください。例えば、「【関連物件情報】の〇〇によると〜」のように記述します。
- 物件情報がない場合や、参考情報から回答が困難な場合は、正直に「情報が不足しているため、正確な回答ができません。」と伝えてください。
- あなた自身の意見ではなく、提供された情報に基づいて客観的な事実を述べてください。

---
【参考情報】
{context}
---
【質問】
{question}
---
【回答】
`
    );

    const chain = promptTemplate.pipe(model).pipe(new StringOutputParser());

    // chain.invokeからchain.streamに変更し、新しいストリーミング方式に修正
    const stream = await chain.stream({
      question: question,
      context: context,
    });

    // TransformStreamを使用してLangChainの出力をレスポンスストリームに変換
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        controller.enqueue(new TextEncoder().encode(chunk));
      },
    });

    // 5. ストリーミングレスポンスを返す
    return new NextResponse(stream.pipeThrough(transformStream), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });

  } catch (e: any) {
    console.error('AI Advisor API Error:', e);
    return NextResponse.json({ error: e.message || 'サーバーで予期せぬエラーが発生しました。' }, { status: 500 });
  }
} 