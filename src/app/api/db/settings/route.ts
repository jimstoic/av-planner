import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/apiAuth'

// GET /api/db/settings
export async function GET() {
  const { user, error } = await getAuthenticatedUser()
  if (error) return error

  const { data, error: dbError } = await supabaseAdmin
    .from('user_settings')
    .select('data')
    .eq('user_id', user!.id)
    .single()

  if (dbError && dbError.code !== 'PGRST116') {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json(data?.data ?? null)
}

// PUT /api/db/settings
export async function PUT(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser()
  if (error) return error

  const settings = await req.json()

  const { error: dbError } = await supabaseAdmin
    .from('user_settings')
    .upsert(
      { user_id: user!.id, data: settings, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(settings)
}
