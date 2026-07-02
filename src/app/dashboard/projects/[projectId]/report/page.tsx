'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { getCurrentUser } from '@/lib/auth'

const ReportView = dynamic(() => import('@/components/report/ReportView'), { ssr: false })

export default function ProjectReportPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [canEdit, setCanEdit] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    getCurrentUser().then((user) => {
      const role = user?.user_metadata?.role
      setCanEdit(role === 'pm' || role === 'consultant' || role === 'admin-ti')
      setReady(true)
    })
  }, [])

  if (!ready) return null
  return <ReportView projectId={projectId} canEdit={canEdit} />
}
