-- organizations テーブルに組織共通設定カラムを追加
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
