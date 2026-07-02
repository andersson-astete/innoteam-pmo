import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import { Deliverable } from './mockData'

export function exportToExcel(deliverables: Deliverable[], filename: string = 'entregables.xlsx') {
  const data = deliverables.map(d => ({
    Sociedad: d.soc,
    País: d.f,
    Reporte: d.rep,
    Avance: `${d.pct}%`,
    Estado: d.est,
    Fase: d.last >= 0 ? d.last + 1 : '-',
    Observación: d.obs,
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Entregables')
  XLSX.writeFile(wb, filename)
}

export function exportToPDF(title: string, content: string, filename: string = 'reporte.pdf') {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(title, 20, 20)

  doc.setFontSize(10)
  const splitContent = doc.splitTextToSize(content, 170)
  doc.text(splitContent, 20, 40)

  doc.save(filename)
}

export function generateDashboardPDF(title: string, stats: any, filename: string = 'dashboard.pdf') {
  const doc = new jsPDF('l', 'mm', 'a4')

  // Título
  doc.setFontSize(18)
  doc.text(title, 15, 15)

  // Stats
  doc.setFontSize(10)
  const statsText = `
Avance Global: ${stats.avg}%
Entregables: ${stats.total}
En Pruebas Integrales: ${stats.testing}
Lado Cliente: ${stats.client}
Etapa Inicial: ${stats.init}
  `.trim()

  const splitText = doc.splitTextToSize(statsText, 170)
  doc.text(splitText, 15, 30)

  doc.save(filename)
}
