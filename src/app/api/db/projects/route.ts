import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/apiAuth'

// GET /api/db/projects
export async function GET() {
  const { user, error } = await getAuthenticatedUser()
  if (error) return error

  const { data, error: dbError } = await supabaseAdmin
    .from('project_registry')
    .select('*')
    .eq('org_id', user!.org_id)
    .order('updated_at', { ascending: false })

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  // snake_case → camelCase変換
  return NextResponse.json(data.map(dbRowToProjectSummary))
}

// POST /api/db/projects - upsert
export async function POST(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser()
  if (error) return error

  const body = await req.json()

  const row = projectSummaryToDbRow(body, user!.org_id, user!.id)
  const { data, error: dbError } = await supabaseAdmin
    .from('project_registry')
    .upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(dbRowToProjectSummary(data))
}

// ============================================================
// Mapping helpers
// ============================================================
function dbRowToProjectSummary(row: any) {
  return {
    id: row.id,
    name: row.name,
    clientName: row.client_name,
    venue: row.venue,
    startDate: row.start_date,
    endDate: row.end_date,
    setupDate: row.setup_date,
    status: row.status,
    equipmentUsage: row.equipment_usage ?? [],
    memberEmails: row.member_emails ?? [],
    ownerId: row.owner_id,
    driveFolderId: row.drive_folder_id,
    driveFileId: row.drive_file_id,
    driveFolderName: row.drive_folder_name,
  }
}

function projectSummaryToDbRow(p: any, orgId: string, userId: string) {
  return {
    id: p.id,
    org_id: orgId,
    owner_id: p.ownerId ?? userId,
    drive_file_id: p.driveFileId ?? null,
    drive_folder_id: p.driveFolderId ?? null,
    drive_folder_name: p.driveFolderName ?? null,
    name: p.name,
    client_name: p.clientName ?? null,
    venue: p.venue ?? null,
    start_date: p.startDate ?? null,
    end_date: p.endDate ?? null,
    setup_date: p.setupDate ?? null,
    status: p.status ?? 'planning',
    equipment_usage: p.equipmentUsage ?? [],
    member_emails: p.memberEmails ?? p.members ?? [],
  }
}
