import { NextRequest, NextResponse } from 'next/server';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAI } from 'langchain/llms/openai';
import { RetrievalQAChain } from 'langchain/chains';

// 環境変数からAPIキー取得
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// サンプル: 物件・取引データや外部知識をテキスト化
function buildDocuments(userData: any) {
  // userData: { properties: Property[], transactions: Transaction[] }
  // ここでデータをテキスト化し、配列で返す
  const docs: string[] = [];
  if (userData?.properties) {
    userData.properties.forEach((p: any) => {
      docs.push(`物件: ${p.name}, 住所: ${p.address}, タイプ: ${p.property_type}, 家賃: ${p.monthly_rent}`);
    });
  }
  if (userData?.transactions) {
    userData.transactions.forEach((t: any) => {
      docs.push(`取引: ${t.date}, 種別: ${t.type}, 金額: ${t.amount}, カテゴリ: ${t.category}, 説明: ${t.description}`);
    });
  }
  // TODO: 外部知識もここで追加可能
  return docs;
}

export async function POST(req: NextRequest) {
  try {
    const { question, properties, transactions } = await req.json();
    if (!question) {
      return NextResponse.json({ error: '質問がありません' }, { status: 400 });
    }
    // ユーザーデータをテキスト化
    const docs = buildDocuments({ properties, transactions });

    // ベクトルストア作成
    const embeddings = new OpenAIEmbeddings({ openAIApiKey: OPENAI_API_KEY });
    const vectorStore = await MemoryVectorStore.fromTexts(docs, docs, embeddings);

    // LLMインスタンス
    const model = new OpenAI({ openAIApiKey: OPENAI_API_KEY });

    // RAGチェーン
    const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

    // 回答生成
    const response = await chain.call({ query: question });
    return NextResponse.json({ answer: response.text });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'サーバーエラー' }, { status: 500 });
  }
} 