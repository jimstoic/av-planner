import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/apiAuth'

// GET /api/db/staff
export async function GET() {
  const { user, error } = await getAuthenticatedUser()
  if (error) return error

  const { data, error: dbError } = await supabaseAdmin
    .from('staff_master')
    .select('data')
    .eq('org_id', user!.org_id)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data.map((row) => row.data))
}

// POST /api/db/staff - 1件追加
export async function POST(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser()
  if (error) return error

  const item = await req.json()
  const { error: dbError } = await supabaseAdmin
    .from('staff_master')
    .insert({ id: item.id, org_id: user!.org_id, data: item })

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(item, { status: 201 })
}

// PUT /api/db/staff - 全件一括保存
export async function PUT(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser()
  if (error) return error

  const items: any[] = await req.json()

  await supabaseAdmin.from('staff_master').delete().eq('org_id', user!.org_id)

  if (items.length > 0) {
    const { error: dbError } = await supabaseAdmin
      .from('staff_master')
      .insert(items.map((item) => ({ id: item.id, org_id: user!.org_id, data: item })))
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json(items)
}
