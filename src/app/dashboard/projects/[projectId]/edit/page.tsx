'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { getCurrentUser } from '@/lib/auth'

const EditGrid = dynamic(() => import('@/components/report/EditGrid'), { ssr: false })

export default function EditProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    getCurrentUser().then((user) => {
      const role = user?.user_metadata?.role
      const canEdit = role === 'pm' || role === 'consultant' || role === 'admin-ti'
      if (!canEdit) {
        // gerencia (solo lectura) → de vuelta al reporte
        router.replace(`/dashboard/projects/${projectId}`)
      } else {
        setAllowed(true)
      }
    })
  }, [projectId, router])

  if (!allowed) return null
  return <EditGrid projectId={projectId} />
}
