-- ============================================================
-- av-planner Supabase Schema
-- Supabase SQL Editorで実行してください
-- ============================================================

-- ============================================================
-- 1. 組織テーブル（会社・チーム単位）
-- ============================================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. ユーザーテーブル（NextAuthと連携）
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  org_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. 機材マスター（JSONB: 複雑なネスト構造をそのまま保存）
-- ============================================================
CREATE TABLE IF NOT EXISTS equipment (
  id TEXT PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. スタッフマスター（JSONB）
-- ============================================================
CREATE TABLE IF NOT EXISTS staff_master (
  id TEXT PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. プロジェクト一覧（個別カラム: 日付フィルタ・可用性チェック用）
-- ============================================================
CREATE TABLE IF NOT EXISTS project_registry (
  id TEXT PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  owner_id UUID REFERENCES users(id),
  drive_file_id TEXT,
  drive_folder_id TEXT,
  drive_folder_name TEXT,
  name TEXT NOT NULL,
  client_name TEXT,
  venue TEXT,
  start_date DATE,
  end_date DATE,
  setup_date DATE,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'confirmed', 'completed', 'cancelled')),
  equipment_usage JSONB DEFAULT '[]',
  member_emails TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. 見積書・請求書（JSONB: sections等の深いネスト構造を保存）
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES project_registry(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id),
  type TEXT NOT NULL CHECK (type IN ('quotation', 'invoice')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'accepted', 'rejected', 'paid', 'overdue')),
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. ユーザー設定（JSONB）
-- ============================================================
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- インデックス
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_equipment_org_id ON equipment(org_id);
CREATE INDEX IF NOT EXISTS idx_staff_master_org_id ON staff_master(org_id);
CREATE INDEX IF NOT EXISTS idx_project_registry_org_id ON project_registry(org_id);
CREATE INDEX IF NOT EXISTS idx_project_registry_dates ON project_registry(org_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_org_id ON documents(org_id);

-- ============================================================
-- RLS無効（APIルート側 + NextAuthでアクセス制御）
-- ============================================================
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE equipment DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_master DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_registry DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 初期データ: fleeeet.com 組織
-- ============================================================
INSERT INTO organizations (name, domain)
VALUES ('Fleeeet', 'fleeeet.com')
ON CONFLICT (domain) DO NOTHING;
