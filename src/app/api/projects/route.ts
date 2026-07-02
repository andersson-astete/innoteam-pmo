import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabaseAdmin'

// Crear un proyecto nuevo (con su configuración de alcance: fases + tipos de reporte)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, subtitle, brand_color, phases, report_types } = body

    if (!name || !Array.isArray(phases) || !Array.isArray(report_types)) {
      return NextResponse.json(
        { error: 'name, phases y report_types son obligatorios' },
        { status: 400 }
      )
    }

    const db = getAdminClient()
    const { data, error } = await db
      .from('projects')
      .insert({
        name,
        subtitle: subtitle || null,
        brand_color: brand_color || '#2F6BD8',
        phases,
        report_types,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true, project: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 })
  }
}
