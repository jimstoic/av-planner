import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// クライアントサイド用（読み取り専用操作）
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// サーバーサイド用（APIルート内でのみ使用）
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
