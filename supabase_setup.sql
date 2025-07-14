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

-- 2. properties テーブルの修正（owner_id を UUID に変更し、外部キー制約を追加）
ALTER TABLE IF EXISTS public.properties 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. transactions テーブルの修正（user_id を UUID に変更し、外部キー制約を追加）
ALTER TABLE IF EXISTS public.transactions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. accounts テーブルの修正（user_id を UUID に変更し、外部キー制約を追加）
ALTER TABLE IF EXISTS public.accounts 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. RLS (Row Level Security) の有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- 6. profiles テーブルのRLSポリシー
-- SELECT ポリシー
CREATE POLICY "enable_select_for_authenticated_users" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- INSERT ポリシー
CREATE POLICY "enable_insert_for_authenticated_users" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- UPDATE ポリシー
CREATE POLICY "enable_update_for_authenticated_users" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- DELETE ポリシー
CREATE POLICY "enable_delete_for_authenticated_users" ON public.profiles
    FOR DELETE USING (auth.uid() = id);

-- 7. properties テーブルのRLSポリシー
-- SELECT ポリシー
CREATE POLICY "enable_select_for_authenticated_users" ON public.properties
    FOR SELECT USING (auth.uid() = owner_id);

-- INSERT ポリシー
CREATE POLICY "enable_insert_for_authenticated_users" ON public.properties
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- UPDATE ポリシー
CREATE POLICY "enable_update_for_authenticated_users" ON public.properties
    FOR UPDATE USING (auth.uid() = owner_id);

-- DELETE ポリシー
CREATE POLICY "enable_delete_for_authenticated_users" ON public.properties
    FOR DELETE USING (auth.uid() = owner_id);

-- 8. transactions テーブルのRLSポリシー
-- SELECT ポリシー
CREATE POLICY "enable_select_for_authenticated_users" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

-- INSERT ポリシー
CREATE POLICY "enable_insert_for_authenticated_users" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE ポリシー
CREATE POLICY "enable_update_for_authenticated_users" ON public.transactions
    FOR UPDATE USING (auth.uid() = user_id);

-- DELETE ポリシー
CREATE POLICY "enable_delete_for_authenticated_users" ON public.transactions
    FOR DELETE USING (auth.uid() = user_id);

-- 9. accounts テーブルのRLSポリシー
-- SELECT ポリシー
CREATE POLICY "enable_select_for_authenticated_users" ON public.accounts
    FOR SELECT USING (auth.uid() = user_id);

-- INSERT ポリシー
CREATE POLICY "enable_insert_for_authenticated_users" ON public.accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE ポリシー
CREATE POLICY "enable_update_for_authenticated_users" ON public.accounts
    FOR UPDATE USING (auth.uid() = user_id);

-- DELETE ポリシー
CREATE POLICY "enable_delete_for_authenticated_users" ON public.accounts
    FOR DELETE USING (auth.uid() = user_id);

-- 10. 新しいユーザーがサインアップした時にプロフィールを作成する関数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. トリガーの作成
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 