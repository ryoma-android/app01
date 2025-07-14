-- =====================================================
-- 不動産投資管理アプリ「次の一手」データベース設定
-- =====================================================

-- 1. profiles テーブルの作成
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- updated_at を自動更新するためのトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. properties テーブルの作成
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    property_type TEXT NOT NULL CHECK (property_type IN ('apartment', 'house', 'commercial', 'land')),
    purchase_price DECIMAL(15,2) NOT NULL,
    purchase_date DATE NOT NULL,
    current_value DECIMAL(15,2),
    monthly_rent DECIMAL(10,2),
    property_tax DECIMAL(10,2),
    insurance_cost DECIMAL(10,2),
    management_fee DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_properties_updated_at 
    BEFORE UPDATE ON public.properties 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. transactions テーブルの作成
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    category TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON public.transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. accounts テーブルの作成
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('bank', 'credit_card', 'cash', 'investment')),
    balance DECIMAL(15,2) DEFAULT 0,
    currency TEXT DEFAULT 'JPY',
    account_number TEXT,
    institution TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_accounts_updated_at 
    BEFORE UPDATE ON public.accounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. ai_recommendations テーブルの作成
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('cost_reduction', 'revenue_increase', 'investment_opportunity', 'risk_management')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    estimated_impact DECIMAL(12,2),
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'implemented', 'rejected', 'in_progress')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_ai_recommendations_updated_at 
    BEFORE UPDATE ON public.ai_recommendations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. property_financials テーブルの作成
CREATE TABLE IF NOT EXISTS public.property_financials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    total_income DECIMAL(12,2) DEFAULT 0,
    total_expenses DECIMAL(12,2) DEFAULT 0,
    net_income DECIMAL(12,2) DEFAULT 0,
    roi DECIMAL(5,2),
    cap_rate DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, year, month)
);

CREATE TRIGGER update_property_financials_updated_at 
    BEFORE UPDATE ON public.property_financials 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. documents テーブルの作成
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('receipt', 'contract', 'tax_document', 'insurance', 'other')),
    file_url TEXT,
    file_size INTEGER,
    mime_type TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON public.documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS (Row Level Security) の設定
-- =====================================================

-- RLS の有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS ポリシーの設定
-- =====================================================

-- profiles テーブルのポリシー
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_delete_policy" ON public.profiles
    FOR DELETE USING (auth.uid() = id);

-- properties テーブルのポリシー
CREATE POLICY "properties_select_policy" ON public.properties
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "properties_insert_policy" ON public.properties
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "properties_update_policy" ON public.properties
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "properties_delete_policy" ON public.properties
    FOR DELETE USING (auth.uid() = owner_id);

-- transactions テーブルのポリシー
CREATE POLICY "transactions_select_policy" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "transactions_insert_policy" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_update_policy" ON public.transactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "transactions_delete_policy" ON public.transactions
    FOR DELETE USING (auth.uid() = user_id);

-- accounts テーブルのポリシー
CREATE POLICY "accounts_select_policy" ON public.accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "accounts_insert_policy" ON public.accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "accounts_update_policy" ON public.accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "accounts_delete_policy" ON public.accounts
    FOR DELETE USING (auth.uid() = user_id);

-- ai_recommendations テーブルのポリシー
CREATE POLICY "ai_recommendations_select_policy" ON public.ai_recommendations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ai_recommendations_insert_policy" ON public.ai_recommendations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_recommendations_update_policy" ON public.ai_recommendations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "ai_recommendations_delete_policy" ON public.ai_recommendations
    FOR DELETE USING (auth.uid() = user_id);

-- property_financials テーブルのポリシー
CREATE POLICY "property_financials_select_policy" ON public.property_financials
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.properties 
            WHERE properties.id = property_financials.property_id 
            AND properties.owner_id = auth.uid()
        )
    );

CREATE POLICY "property_financials_insert_policy" ON public.property_financials
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.properties 
            WHERE properties.id = property_financials.property_id 
            AND properties.owner_id = auth.uid()
        )
    );

CREATE POLICY "property_financials_update_policy" ON public.property_financials
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.properties 
            WHERE properties.id = property_financials.property_id 
            AND properties.owner_id = auth.uid()
        )
    );

CREATE POLICY "property_financials_delete_policy" ON public.property_financials
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.properties 
            WHERE properties.id = property_financials.property_id 
            AND properties.owner_id = auth.uid()
        )
    );

-- documents テーブルのポリシー
CREATE POLICY "documents_select_policy" ON public.documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "documents_insert_policy" ON public.documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "documents_update_policy" ON public.documents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "documents_delete_policy" ON public.documents
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- トリガーと関数の設定
-- =====================================================

-- 新しいユーザーがサインアップした時にプロフィールを作成する関数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーの作成
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- インデックスの作成（パフォーマンス向上）
-- =====================================================

-- properties テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON public.properties(property_type);

-- transactions テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_property_id ON public.transactions(property_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_date ON public.transactions(transaction_date);

-- accounts テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON public.accounts(type);

-- ai_recommendations テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user_id ON public.ai_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_property_id ON public.ai_recommendations(property_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_type ON public.ai_recommendations(type);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_status ON public.ai_recommendations(status);

-- property_financials テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_property_financials_property_id ON public.property_financials(property_id);
CREATE INDEX IF NOT EXISTS idx_property_financials_year_month ON public.property_financials(year, month);

-- documents テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_property_id ON public.documents(property_id);
CREATE INDEX IF NOT EXISTS idx_documents_transaction_id ON public.documents(transaction_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(type);

-- =====================================================
-- サンプルデータの挿入（開発用）
-- =====================================================

-- 注意: 本番環境では以下のサンプルデータは削除してください

-- サンプル物件データ（認証後に手動で挿入）
-- INSERT INTO public.properties (owner_id, name, address, property_type, purchase_price, purchase_date, current_value, monthly_rent, property_tax, insurance_cost, management_fee)
-- VALUES 
-- ('ユーザーID', 'サンプルマンション', '東京都渋谷区1-1-1', 'apartment', 50000000, '2023-01-15', 52000000, 180000, 50000, 30000, 15000),
-- ('ユーザーID', 'サンプル一戸建て', '東京都世田谷区2-2-2', 'house', 80000000, '2022-06-20', 85000000, 250000, 80000, 50000, 20000);

-- サンプル口座データ（認証後に手動で挿入）
-- INSERT INTO public.accounts (user_id, name, type, balance, currency, institution)
-- VALUES 
-- ('ユーザーID', 'メインバンク', 'bank', 1000000, 'JPY', 'サンプル銀行'),
-- ('ユーザーID', 'クレジットカード', 'credit_card', -50000, 'JPY', 'サンプルカード');

-- =====================================================
-- 完了メッセージ
-- =====================================================

-- このSQLファイルの実行が完了したら、以下の手順で確認してください：
-- 1. Supabase Dashboardでテーブルが正しく作成されているか確認
-- 2. RLSポリシーが有効になっているか確認
-- 3. アプリケーションでユーザー登録・ログインができるかテスト
-- 4. データの挿入・取得が正常に動作するかテスト 