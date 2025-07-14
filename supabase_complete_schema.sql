-- =====================================================
-- 不動産投資管理アプリ「次の一手」完全データベーススキーマ
-- 核となる機能: AI提案、自動仕訳、収支見える化、確定申告支援
-- =====================================================

-- =====================================================
-- 1. 料金プラン管理（最初に作成）
-- =====================================================

-- plans テーブルの作成
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'JPY',
    billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    features JSONB DEFAULT '{}',
    stripe_product_id TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. ユーザー管理と認証
-- =====================================================

-- profiles テーブルの作成（拡張版）
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    plan_id UUID REFERENCES public.plans(id),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'trialing', 'canceled', 'past_due')),
    stripe_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. 物件管理（拡張版）
-- =====================================================

-- properties テーブルの作成（減価償却計算対応）
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    property_type TEXT NOT NULL CHECK (property_type IN ('apartment', 'house', 'commercial', 'land')),
    purchase_price DECIMAL(15,2) NOT NULL,
    land_cost DECIMAL(15,2), -- 土地分の価格（減価償却計算用）
    building_cost DECIMAL(15,2), -- 建物分の価格（減価償却計算用）
    purchase_date DATE NOT NULL,
    current_value DECIMAL(15,2),
    monthly_rent DECIMAL(10,2),
    property_tax DECIMAL(10,2),
    insurance_cost DECIMAL(10,2),
    management_fee DECIMAL(10,2),
    building_structure TEXT CHECK (building_structure IN ('RC', 'SRC', 'S', '木造', '鉄骨造', 'その他')),
    useful_life INTEGER, -- 法定耐用年数
    sqm_area DECIMAL(8,2), -- 面積（㎡）
    building_year INTEGER, -- 建築年
    floors INTEGER, -- 階数
    rooms INTEGER, -- 部屋数
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. 口座管理（金融連携対応）
-- =====================================================

-- accounts テーブルの作成（金融連携対応）
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('bank', 'credit_card', 'cash', 'investment')),
    balance DECIMAL(15,2) DEFAULT 0,
    currency TEXT DEFAULT 'JPY',
    account_number TEXT,
    institution TEXT,
    integration_provider TEXT CHECK (integration_provider IN ('plaid', 'freee_api', 'moneyforward_api', 'manual')),
    provider_account_id TEXT,
    access_token TEXT, -- 暗号化して保存（Supabase Vault推奨）
    last_sync_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. 自動仕訳ルール管理
-- =====================================================

-- categorization_rules テーブルの作成
CREATE TABLE IF NOT EXISTS public.categorization_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    rule_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. 取引管理（自動仕訳対応）
-- =====================================================

-- transactions テーブルの作成（自動仕訳対応）
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    category TEXT NOT NULL,
    subcategory TEXT,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    original_description TEXT, -- 銀行明細の元の摘要
    transaction_date DATE NOT NULL,
    is_manual_entry BOOLEAN DEFAULT false,
    categorized_by TEXT CHECK (categorized_by IN ('AI', 'Manual', 'Rule')),
    rule_id UUID REFERENCES public.categorization_rules(id),
    reconciliation_status TEXT DEFAULT 'unreconciled' CHECK (reconciliation_status IN ('unreconciled', 'reconciled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. 収益性分析（見える化）
-- =====================================================

-- property_financials テーブルの作成（詳細収支対応）
CREATE TABLE IF NOT EXISTS public.property_financials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    total_income DECIMAL(12,2) DEFAULT 0,
    rent_income DECIMAL(12,2) DEFAULT 0,
    other_income DECIMAL(12,2) DEFAULT 0,
    total_expenses DECIMAL(12,2) DEFAULT 0,
    operating_expenses DECIMAL(12,2) DEFAULT 0,
    property_tax_expense DECIMAL(12,2) DEFAULT 0,
    insurance_expense DECIMAL(12,2) DEFAULT 0,
    management_fee_expense DECIMAL(12,2) DEFAULT 0,
    maintenance_expense DECIMAL(12,2) DEFAULT 0,
    utility_expense DECIMAL(12,2) DEFAULT 0,
    debt_service DECIMAL(12,2) DEFAULT 0,
    net_income DECIMAL(12,2) DEFAULT 0,
    cash_flow DECIMAL(12,2) DEFAULT 0,
    roi DECIMAL(5,2),
    cap_rate DECIMAL(5,2),
    occupancy_rate DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, year, month)
);

-- =====================================================
-- 8. AI提案テンプレート
-- =====================================================

-- suggested_actions テーブルの作成
CREATE TABLE IF NOT EXISTS public.suggested_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description_template TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('cost_reduction', 'revenue_increase', 'investment_opportunity', 'risk_management', 'tax_optimization')),
    impact_type TEXT CHECK (impact_type IN ('immediate', 'short_term', 'long_term')),
    estimated_effort TEXT CHECK (estimated_effort IN ('low', 'medium', 'high')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. AI提案管理（拡張版）
-- =====================================================

-- ai_recommendations テーブルの作成（拡張版）
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    suggested_action_id UUID REFERENCES public.suggested_actions(id),
    type TEXT NOT NULL CHECK (type IN ('cost_reduction', 'revenue_increase', 'investment_opportunity', 'risk_management', 'tax_optimization')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    estimated_impact DECIMAL(12,2),
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'implemented', 'rejected', 'in_progress')),
    feedback TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    reasoning TEXT, -- AIがその提案に至った根拠
    reference_data JSONB, -- 提案の根拠となった具体的なデータポイント
    implementation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. 減価償却計算
-- =====================================================

-- depreciation_schedules テーブルの作成
CREATE TABLE IF NOT EXISTS public.depreciation_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    depreciation_amount DECIMAL(12,2) NOT NULL,
    accumulated_depreciation DECIMAL(12,2) NOT NULL,
    remaining_value DECIMAL(12,2) NOT NULL,
    method TEXT DEFAULT 'straight_line' CHECK (method IN ('straight_line', 'declining_balance')),
    useful_life INTEGER NOT NULL,
    salvage_value DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, year)
);

-- =====================================================
-- 11. 書類管理（確定申告支援）
-- =====================================================

-- documents テーブルの作成（確定申告対応）
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('receipt', 'contract', 'tax_document', 'insurance', 'depreciation_schedule', 'other')),
    file_url TEXT,
    file_size INTEGER,
    mime_type TEXT,
    description TEXT,
    ocr_text TEXT, -- 画像から抽出したテキスト
    is_reconciled_with_transaction BOOLEAN DEFAULT false,
    tax_year INTEGER, -- 確定申告年度
    document_category TEXT, -- 税務書類の分類
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 12. 税務計算支援
-- =====================================================

-- tax_calculations テーブルの作成
CREATE TABLE IF NOT EXISTS public.tax_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tax_year INTEGER NOT NULL,
    total_rental_income DECIMAL(12,2) DEFAULT 0,
    total_rental_expenses DECIMAL(12,2) DEFAULT 0,
    net_rental_income DECIMAL(12,2) DEFAULT 0,
    total_depreciation DECIMAL(12,2) DEFAULT 0,
    taxable_income DECIMAL(12,2) DEFAULT 0,
    estimated_tax DECIMAL(12,2) DEFAULT 0,
    calculation_status TEXT DEFAULT 'draft' CHECK (calculation_status IN ('draft', 'finalized')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, tax_year)
);

-- =====================================================
-- 13. 市場データ（AI提案の根拠）
-- =====================================================

-- market_data テーブルの作成
CREATE TABLE IF NOT EXISTS public.market_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region TEXT NOT NULL,
    property_type TEXT NOT NULL,
    data_type TEXT NOT NULL CHECK (data_type IN ('rent', 'price', 'vacancy_rate', 'market_trend')),
    value DECIMAL(12,2),
    unit TEXT,
    date DATE NOT NULL,
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- トリガー関数の作成
-- =====================================================

-- updated_at を自動更新するためのトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 新しいユーザーがサインアップした時にプロフィールを作成する関数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 減価償却計算を自動実行する関数
CREATE OR REPLACE FUNCTION calculate_depreciation()
RETURNS TRIGGER AS $$
DECLARE
    building_cost DECIMAL(15,2);
    useful_life INTEGER;
    depreciation_amount DECIMAL(12,2);
    accumulated_depreciation DECIMAL(12,2);
    remaining_value DECIMAL(12,2);
BEGIN
    -- 建物価格と耐用年数を取得
    SELECT p.building_cost, p.useful_life 
    INTO building_cost, useful_life
    FROM public.properties p
    WHERE p.id = NEW.property_id;
    
    IF building_cost IS NOT NULL AND useful_life IS NOT NULL THEN
        -- 定額法で減価償却を計算
        depreciation_amount := building_cost / useful_life;
        
        -- 累積減価償却費を計算
        SELECT COALESCE(SUM(ds.depreciation_amount), 0)
        INTO accumulated_depreciation
        FROM public.depreciation_schedules ds
        WHERE ds.property_id = NEW.property_id AND ds.year < NEW.year;
        
        -- 残存価額を計算
        remaining_value := building_cost - accumulated_depreciation - depreciation_amount;
        
        -- 減価償却スケジュールを更新
        INSERT INTO public.depreciation_schedules (
            property_id, year, depreciation_amount, 
            accumulated_depreciation, remaining_value, useful_life
        ) VALUES (
            NEW.property_id, NEW.year, depreciation_amount,
            accumulated_depreciation + depreciation_amount, remaining_value, useful_life
        )
        ON CONFLICT (property_id, year) DO UPDATE SET
            depreciation_amount = EXCLUDED.depreciation_amount,
            accumulated_depreciation = EXCLUDED.accumulated_depreciation,
            remaining_value = EXCLUDED.remaining_value,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- トリガーの作成
-- =====================================================

-- 各テーブルのupdated_at自動更新トリガー
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categorization_rules_updated_at BEFORE UPDATE ON public.categorization_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_property_financials_updated_at BEFORE UPDATE ON public.property_financials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suggested_actions_updated_at BEFORE UPDATE ON public.suggested_actions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_recommendations_updated_at BEFORE UPDATE ON public.ai_recommendations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_depreciation_schedules_updated_at BEFORE UPDATE ON public.depreciation_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tax_calculations_updated_at BEFORE UPDATE ON public.tax_calculations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ユーザー作成時のプロフィール作成トリガー
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 物件財務データ作成時の減価償却計算トリガー
CREATE TRIGGER calculate_depreciation_trigger AFTER INSERT ON public.property_financials FOR EACH ROW EXECUTE FUNCTION calculate_depreciation();

-- =====================================================
-- RLS (Row Level Security) の設定
-- =====================================================

-- RLS の有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggested_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depreciation_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS ポリシーの設定
-- =====================================================

-- profiles テーブルのポリシー
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_policy" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_policy" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- plans テーブルのポリシー（読み取り専用）
CREATE POLICY "plans_select_policy" ON public.plans FOR SELECT USING (true);

-- properties テーブルのポリシー
CREATE POLICY "properties_select_policy" ON public.properties FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "properties_insert_policy" ON public.properties FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "properties_update_policy" ON public.properties FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "properties_delete_policy" ON public.properties FOR DELETE USING (auth.uid() = owner_id);

-- accounts テーブルのポリシー
CREATE POLICY "accounts_select_policy" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "accounts_insert_policy" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "accounts_update_policy" ON public.accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "accounts_delete_policy" ON public.accounts FOR DELETE USING (auth.uid() = user_id);

-- categorization_rules テーブルのポリシー
CREATE POLICY "categorization_rules_select_policy" ON public.categorization_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "categorization_rules_insert_policy" ON public.categorization_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categorization_rules_update_policy" ON public.categorization_rules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "categorization_rules_delete_policy" ON public.categorization_rules FOR DELETE USING (auth.uid() = user_id);

-- transactions テーブルのポリシー
CREATE POLICY "transactions_select_policy" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert_policy" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_update_policy" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "transactions_delete_policy" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- property_financials テーブルのポリシー
CREATE POLICY "property_financials_select_policy" ON public.property_financials FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.properties WHERE properties.id = property_financials.property_id AND properties.owner_id = auth.uid())
);
CREATE POLICY "property_financials_insert_policy" ON public.property_financials FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.properties WHERE properties.id = property_financials.property_id AND properties.owner_id = auth.uid())
);
CREATE POLICY "property_financials_update_policy" ON public.property_financials FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.properties WHERE properties.id = property_financials.property_id AND properties.owner_id = auth.uid())
);
CREATE POLICY "property_financials_delete_policy" ON public.property_financials FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.properties WHERE properties.id = property_financials.property_id AND properties.owner_id = auth.uid())
);

-- suggested_actions テーブルのポリシー（読み取り専用）
CREATE POLICY "suggested_actions_select_policy" ON public.suggested_actions FOR SELECT USING (true);

-- ai_recommendations テーブルのポリシー
CREATE POLICY "ai_recommendations_select_policy" ON public.ai_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ai_recommendations_insert_policy" ON public.ai_recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_recommendations_update_policy" ON public.ai_recommendations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ai_recommendations_delete_policy" ON public.ai_recommendations FOR DELETE USING (auth.uid() = user_id);

-- depreciation_schedules テーブルのポリシー
CREATE POLICY "depreciation_schedules_select_policy" ON public.depreciation_schedules FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.properties WHERE properties.id = depreciation_schedules.property_id AND properties.owner_id = auth.uid())
);
CREATE POLICY "depreciation_schedules_insert_policy" ON public.depreciation_schedules FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.properties WHERE properties.id = depreciation_schedules.property_id AND properties.owner_id = auth.uid())
);
CREATE POLICY "depreciation_schedules_update_policy" ON public.depreciation_schedules FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.properties WHERE properties.id = depreciation_schedules.property_id AND properties.owner_id = auth.uid())
);
CREATE POLICY "depreciation_schedules_delete_policy" ON public.depreciation_schedules FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.properties WHERE properties.id = depreciation_schedules.property_id AND properties.owner_id = auth.uid())
);

-- documents テーブルのポリシー
CREATE POLICY "documents_select_policy" ON public.documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "documents_insert_policy" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "documents_update_policy" ON public.documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "documents_delete_policy" ON public.documents FOR DELETE USING (auth.uid() = user_id);

-- tax_calculations テーブルのポリシー
CREATE POLICY "tax_calculations_select_policy" ON public.tax_calculations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tax_calculations_insert_policy" ON public.tax_calculations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tax_calculations_update_policy" ON public.tax_calculations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tax_calculations_delete_policy" ON public.tax_calculations FOR DELETE USING (auth.uid() = user_id);

-- market_data テーブルのポリシー（読み取り専用）
CREATE POLICY "market_data_select_policy" ON public.market_data FOR SELECT USING (true);

-- =====================================================
-- インデックスの作成（パフォーマンス向上）
-- =====================================================

-- profiles テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_profiles_plan_id ON public.profiles(plan_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);

-- properties テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON public.properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_purchase_date ON public.properties(purchase_date);

-- accounts テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON public.accounts(type);
CREATE INDEX IF NOT EXISTS idx_accounts_integration_provider ON public.accounts(integration_provider);

-- categorization_rules テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_categorization_rules_user_id ON public.categorization_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_categorization_rules_keyword ON public.categorization_rules(keyword);
CREATE INDEX IF NOT EXISTS idx_categorization_rules_category ON public.categorization_rules(category);

-- transactions テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_property_id ON public.transactions(property_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_date ON public.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_categorized_by ON public.transactions(categorized_by);

-- property_financials テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_property_financials_property_id ON public.property_financials(property_id);
CREATE INDEX IF NOT EXISTS idx_property_financials_year_month ON public.property_financials(year, month);

-- ai_recommendations テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user_id ON public.ai_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_property_id ON public.ai_recommendations(property_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_type ON public.ai_recommendations(type);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_status ON public.ai_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_priority ON public.ai_recommendations(priority);

-- depreciation_schedules テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_depreciation_schedules_property_id ON public.depreciation_schedules(property_id);
CREATE INDEX IF NOT EXISTS idx_depreciation_schedules_year ON public.depreciation_schedules(year);

-- documents テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_property_id ON public.documents(property_id);
CREATE INDEX IF NOT EXISTS idx_documents_transaction_id ON public.documents(transaction_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_tax_year ON public.documents(tax_year);

-- tax_calculations テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_tax_calculations_user_id ON public.tax_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_calculations_tax_year ON public.tax_calculations(tax_year);

-- market_data テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_market_data_region ON public.market_data(region);
CREATE INDEX IF NOT EXISTS idx_market_data_property_type ON public.market_data(property_type);
CREATE INDEX IF NOT EXISTS idx_market_data_date ON public.market_data(date);

-- =====================================================
-- 初期データの挿入
-- =====================================================

-- 料金プランの初期データ
INSERT INTO public.plans (name, description, price, currency, billing_cycle, features) VALUES
('フリープラン', '基本的な機能を無料で利用', 0, 'JPY', 'monthly', '{"max_properties": 1, "max_transactions": 100, "ai_recommendations": false, "tax_support": false}'),
('スタンダードプラン', '個人投資家向けの標準プラン', 2980, 'JPY', 'monthly', '{"max_properties": 5, "max_transactions": 1000, "ai_recommendations": true, "tax_support": true}'),
('プロプラン', '本格的な投資家向けプラン', 5980, 'JPY', 'monthly', '{"max_properties": -1, "max_transactions": -1, "ai_recommendations": true, "tax_support": true, "priority_support": true}');

-- AI提案テンプレートの初期データ
INSERT INTO public.suggested_actions (title, description_template, category, impact_type, estimated_effort) VALUES
('家賃の見直し', '現在の家賃{current_rent}円を市場相場{market_rate}円に調整することで、年間{estimated_impact}円の収益増加が期待できます。', 'revenue_increase', 'short_term', 'medium'),
('管理費の見直し', '現在の管理費{current_fee}円を{new_fee}円に変更することで、年間{estimated_impact}円のコスト削減が可能です。', 'cost_reduction', 'immediate', 'low'),
('リフォーム投資', 'リフォーム投資{investment_amount}円により、家賃を{rent_increase}円増額でき、投資回収期間は{payback_period}年です。', 'investment_opportunity', 'long_term', 'high'),
('保険の見直し', '現在の保険料{current_insurance}円を{new_insurance}円に変更することで、年間{estimated_impact}円のコスト削減が可能です。', 'cost_reduction', 'immediate', 'low'),
('減価償却の活用', '減価償却費{depreciation_amount}円を活用することで、税負担を{tax_savings}円軽減できます。', 'tax_optimization', 'immediate', 'medium');

-- 市場データのサンプル（東京地区）
INSERT INTO public.market_data (region, property_type, data_type, value, unit, date, source) VALUES
('東京都', 'apartment', 'rent', 180000, 'JPY', CURRENT_DATE, '国土交通省'),
('東京都', 'house', 'rent', 250000, 'JPY', CURRENT_DATE, '国土交通省'),
('東京都', 'apartment', 'price', 50000000, 'JPY', CURRENT_DATE, '国土交通省'),
('東京都', 'house', 'price', 80000000, 'JPY', CURRENT_DATE, '国土交通省');

-- =====================================================
-- 完了メッセージ
-- =====================================================

-- このSQLファイルの実行が完了したら、以下の手順で確認してください：
-- 1. Supabase Dashboardでテーブルが正しく作成されているか確認
-- 2. RLSポリシーが有効になっているか確認
-- 3. 初期データが正しく挿入されているか確認
-- 4. アプリケーションでユーザー登録・ログインができるかテスト
-- 5. 各機能（物件管理、取引記録、AI提案など）が正常に動作するかテスト 