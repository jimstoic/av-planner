import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserByEmail, syncUserToSupabase } from '@/lib/userSync'
import { masterDataService } from '@/services/masterDataService'

/**
 * POST /api/db/import-from-drive
 * Google Driveの _master-data.json から機材・スタッフ・設定をSupabaseに一括インポート
 */
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const accessToken = (session as any).accessToken as string | undefined
  if (!accessToken) {
    return NextResponse.json({ error: 'Google Drive access token not available' }, { status: 400 })
  }

  // ユーザー取得（なければ同期）
  let user = await getUserByEmail(session.user.email)
  if (!user) {
    await syncUserToSupabase(session.user.email, session.user.name)
    user = await getUserByEmail(session.user.email)
  }
  if (!user) return NextResponse.json({ error: 'User sync failed' }, { status: 500 })

  // Google Driveからマスターデータを読み込み
  const result = await masterDataService.load(accessToken)
  if (!result) {
    return NextResponse.json({ error: '_master-data.json がGoogle Driveに見つかりませんでした' }, { status: 404 })
  }

  const { data } = result
  const orgId = user.org_id
  let importedEquipment = 0
  let importedStaff = 0

  // 機材インポート
  if (Array.isArray(data.equipment) && data.equipment.length > 0) {
    await supabaseAdmin.from('equipment').delete().eq('org_id', orgId)
    const { error } = await supabaseAdmin.from('equipment').insert(
      data.equipment.map((item: any) => ({ id: item.id, org_id: orgId, data: item }))
    )
    if (!error) importedEquipment = data.equipment.length
  }

  // スタッフインポート
  if (Array.isArray(data.masterStaff) && data.masterStaff.length > 0) {
    await supabaseAdmin.from('staff_master').delete().eq('org_id', orgId)
    const { error } = await supabaseAdmin.from('staff_master').insert(
      data.masterStaff.map((item: any) => ({ id: item.id, org_id: orgId, data: item }))
    )
    if (!error) importedStaff = data.masterStaff.length
  }

  // 設定インポート（companyInfo, taxRate, currency）
  const settingsData: Record<string, any> = {}
  if (data.companyInfo) settingsData.companyInfo = data.companyInfo
  if (typeof data.taxRate === 'number') settingsData.taxRate = data.taxRate
  if (data.currency) settingsData.currency = data.currency

  if (Object.keys(settingsData).length > 0) {
    await supabaseAdmin
      .from('user_settings')
      .upsert(
        { user_id: user.id, data: settingsData, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
  }

  return NextResponse.json({
    success: true,
    importedEquipment,
    importedStaff,
  })
}
