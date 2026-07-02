import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabaseAdmin'

// Endpoint de mutación genérico para la grilla de edición.
// Solo permite operar sobre tablas del modelo (whitelist).
const ALLOWED = new Set([
  'projects',
  'countries',
  'societies',
  'deliverables',
  'alerts',
  'steps',
])

export async function POST(request: NextRequest) {
  try {
    const { table, op, data, id } = await request.json()

    if (!ALLOWED.has(table)) {
      return NextResponse.json({ error: `Tabla no permitida: ${table}` }, { status: 400 })
    }

    const db = getAdminClient()

    if (op === 'insert') {
      const { data: row, error } = await db.from(table).insert(data).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ row })
    }

    if (op === 'update') {
      if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
      const { data: row, error } = await db.from(table).update(data).eq('id', id).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ row })
    }

    if (op === 'delete') {
      if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
      const { error } = await db.from(table).delete().eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ ok: true })
    }

    // insert múltiple (p.ej. crear una sociedad + sus entregables)
    if (op === 'insertMany') {
      const { data: rows, error } = await db.from(table).insert(data).select()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ rows })
    }

    return NextResponse.json({ error: `Operación desconocida: ${op}` }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 })
  }
}
