import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/apiAuth'

// PATCH /api/db/documents/[id] - ドキュメント更新
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await getAuthenticatedUser()
  if (error) return error

  const { id } = await params
  const doc = await req.json()

  const { error: dbError } = await supabaseAdmin
    .from('documents')
    .update({
      data: doc,
      status: doc.status ?? 'draft',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('org_id', user!.org_id)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(doc)
}

// DELETE /api/db/documents/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await getAuthenticatedUser()
  if (error) return error

  const { id } = await params

  const { error: dbError } = await supabaseAdmin
    .from('documents')
    .delete()
    .eq('id', id)
    .eq('org_id', user!.org_id)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
