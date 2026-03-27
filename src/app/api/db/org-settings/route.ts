import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/apiAuth'

// GET /api/db/org-settings
export async function GET() {
  const { user, error } = await getAuthenticatedUser()
  if (error) return error

  const { data, error: dbError } = await supabaseAdmin
    .from('organizations')
    .select('settings')
    .eq('id', user!.org_id)
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data?.settings ?? {})
}

// PUT /api/db/org-settings
export async function PUT(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser()
  if (error) return error

  const settings = await req.json()

  const { error: dbError } = await supabaseAdmin
    .from('organizations')
    .update({ settings })
    .eq('id', user!.org_id)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(settings)
}
