import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/apiAuth'

// GET /api/db/documents?projectId=xxx
export async function GET(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  let query = supabaseAdmin
    .from('documents')
    .select('data')
    .eq('org_id', user!.org_id)
    .order('created_at', { ascending: false })

  if (projectId) query = query.eq('project_id', projectId)

  const { data, error: dbError } = await query
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data.map((row) => row.data))
}

// POST /api/db/documents - 作成
export async function POST(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser()
  if (error) return error

  const doc = await req.json()
  const { error: dbError } = await supabaseAdmin.from('documents').insert({
    id: doc.id,
    project_id: doc.projectId ?? null,
    org_id: user!.org_id,
    type: doc.type,
    status: doc.status ?? 'draft',
    data: doc,
  })

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(doc, { status: 201 })
}
