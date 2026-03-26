/**
 * ユーザー・組織の同期ユーティリティ
 * NextAuthセッション情報を元にSupabaseのusers/organizationsテーブルを同期する
 */
import { supabaseAdmin } from './supabase'

export async function syncUserToSupabase(email: string, name?: string | null) {
  // メールドメインから組織を特定
  const domain = email.split('@')[1]

  // 組織を取得または作成
  let { data: org } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('domain', domain)
    .single()

  if (!org) {
    const { data: newOrg } = await supabaseAdmin
      .from('organizations')
      .insert({ name: domain, domain })
      .select('id')
      .single()
    org = newOrg
  }

  if (!org) throw new Error('Organization sync failed')

  // ユーザーを取得または作成（upsert）
  const { data: user } = await supabaseAdmin
    .from('users')
    .upsert(
      { email, name: name ?? email, org_id: org.id, updated_at: new Date().toISOString() },
      { onConflict: 'email' }
    )
    .select('id, org_id')
    .single()

  return user
}

export async function getUserByEmail(email: string) {
  const { data } = await supabaseAdmin
    .from('users')
    .select('id, org_id, email, name')
    .eq('email', email)
    .single()
  return data
}
