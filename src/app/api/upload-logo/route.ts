import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabaseAdmin'

// Sube un logo a Storage (bucket público 'logos') y guarda la URL.
// FormData: file, target ('innoteam' | 'client'), projectId (si target=client)
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const file = form.get('file') as File | null
    const target = String(form.get('target') || '')
    const projectId = form.get('projectId') ? String(form.get('projectId')) : null

    if (!file) return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 })
    if (target !== 'innoteam' && target !== 'client') {
      return NextResponse.json({ error: 'target inválido' }, { status: 400 })
    }
    if (target === 'client' && !projectId) {
      return NextResponse.json({ error: 'Falta projectId' }, { status: 400 })
    }

    const db = getAdminClient()
    const ext = (file.name.split('.').pop() || 'png').toLowerCase()
    const path = target === 'innoteam' ? `innoteam.${ext}` : `client-${projectId}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: upErr } = await db.storage.from('logos').upload(path, buffer, {
      contentType: file.type || 'image/png',
      upsert: true,
    })
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 })

    const { data: pub } = db.storage.from('logos').getPublicUrl(path)
    const url = `${pub.publicUrl}?v=${Date.now()}` // cache-bust

    if (target === 'innoteam') {
      await db.from('settings').update({ innoteam_logo_url: url }).eq('id', 1)
    } else {
      await db.from('projects').update({ client_logo_url: url }).eq('id', projectId)
    }

    return NextResponse.json({ url })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno' }, { status: 500 })
  }
}
