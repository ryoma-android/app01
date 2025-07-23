import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import os from 'os';

export const runtime = 'nodejs';

// gcloud-key.jsonを読み込んで認証情報を設定
const keyFilePath = path.join(process.cwd(), 'gcloud-key.json');
const visionClient = new ImageAnnotatorClient({
  keyFilename: keyFilePath,
});

export async function POST(req: NextRequest) {
  try {
    const { fileUrl } = await req.json();
    if (!fileUrl) {
      return NextResponse.json({ error: 'ファイルURLがありません' }, { status: 400 });
    }

    // URLからファイルをダウンロード
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`ファイルのダウンロードに失敗しました: ${response.statusText}`);
    }
    
    // 一時ファイルとして保存
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const tempFilePath = path.join(os.tmpdir(), uuidv4());
    await fs.writeFile(tempFilePath, buffer);

    // Vision APIでOCR
    const [result] = await visionClient.textDetection(tempFilePath);
    const detections = result.textAnnotations;
    // `description` が存在しない場合を考慮して空文字をデフォルトに
    const text = detections && detections.length > 0 && detections[0].description ? detections[0].description : '';

    // 一時ファイル削除
    await fs.unlink(tempFilePath);

    return NextResponse.json({ ocrText: text });
  } catch (e: any) {
    console.error('OCR API error:', e);
    return NextResponse.json({ error: e.message || 'サーバーエラー' }, { status: 500 });
  }
} 