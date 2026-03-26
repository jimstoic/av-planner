/**
 * APIルート用の認証ヘルパー
 * NextAuthセッションを検証してSupabaseのユーザー情報を返す
 */
import { getServerSession } from 'next-auth'
import { authOptions } from './authOptions'
import { getUserByEmail, syncUserToSupabase } from './userSync'
import { NextResponse } from 'next/server'

export async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  let user = await getUserByEmail(session.user.email)
  if (!user) {
    // 初回ログイン時にSupabaseへ同期
    const synced = await syncUserToSupabase(session.user.email, session.user.name)
    if (synced) user = await getUserByEmail(session.user.email)
  }

  if (!user) {
    return { user: null, error: NextResponse.json({ error: 'User sync failed' }, { status: 500 }) }
  }

  return { user, error: null }
}
