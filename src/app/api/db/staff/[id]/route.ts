import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/apiAuth'

// PATCH /api/db/staff/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await getAuthenticatedUser()
  if (error) return error

  const { id } = await params
  const item = await req.json()

  const { error: dbError } = await supabaseAdmin
    .from('staff_master')
    .update({ data: item, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('org_id', user!.org_id)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(item)
}

// DELETE /api/db/staff/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await getAuthenticatedUser()
  if (error) return error

  const { id } = await params

  const { error: dbError } = await supabaseAdmin
    .from('staff_master')
    .delete()
    .eq('id', id)
    .eq('org_id', user!.org_id)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
