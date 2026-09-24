import { format } from 'date-fns'
import jsPDF from 'jspdf'
import Papa from 'papaparse'
import { bookingTitle } from '@/components/venue/bookingLabels'
import type { VenueBooking, VenueRevenueReport } from '@/lib/api/venues'

const ORANGE: [number, number, number] = [242, 97, 13]
const RICH_BLACK: [number, number, number] = [15, 23, 41]
const MUTED: [number, number, number] = [100, 116, 139]

const methodLabel: Record<string, string> = {
  cash: 'Cash',
  bank: 'Bank transfer',
  chapa: 'Chapa',
}

export interface VenueReportInput {
  venueName: string
  month: string
  report: VenueRevenueReport
  bookings: VenueBooking[]
}

function money(amount: number | null | undefined, currency: string) {
  return `${currency} ${Number(amount ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function statusLabel(status: string) {
  if (!status) return ''
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function balanceAmount(booking: VenueBooking) {
  if (booking.quoted_amount == null) return null
  return Math.max(0, Number(booking.quoted_amount) - Number(booking.paid_total ?? 0))
}

function periodLabel(month: string, report: VenueRevenueReport) {
  const start = new Date(`${report.from}T00:00:00`)
  if (Number.isNaN(start.getTime())) return month
  return format(start, 'MMMM yyyy')
}

async function loadLogo(): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const response = await fetch('/evella-logo.png')
    if (!response.ok) return null
    const bitmap = await createImageBitmap(await response.blob())
    const source = document.createElement('canvas')
    source.width = bitmap.width
    source.height = bitmap.height
    const ctx = source.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null
    ctx.drawImage(bitmap, 0, 0)
    const { data, width, height } = ctx.getImageData(0, 0, source.width, source.height)
    let minX = width
    let minY = height
    let maxX = 0
    let maxY = 0
    for (let py = 0; py < height; py += 1) {
      for (let px = 0; px < width; px += 1) {
        const index = (py * width + px) * 4
        if (data[index + 3] < 16) continue
        if (data[index] < 24 && data[index + 1] < 24 && data[index + 2] < 24) continue
        if (px < minX) minX = px
        if (py < minY) minY = py
        if (px > maxX) maxX = px
        if (py > maxY) maxY = py
      }
    }
    if (maxX <= minX || maxY <= minY) return null
    const pad = 8
    const sx = Math.max(0, minX - pad)
    const sy = Math.max(0, minY - pad)
    const sw = Math.min(width - sx, maxX - minX + 1 + pad * 2)
    const sh = Math.min(height - sy, maxY - minY + 1 + pad * 2)
    const cropped = document.createElement('canvas')
    cropped.width = sw
    cropped.height = sh
    cropped.getContext('2d')?.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh)
    return { dataUrl: cropped.toDataURL('image/png'), width: sw, height: sh }
  } catch {
    return null
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function exportVenueRevenuePdf(input: VenueReportInput) {
  const { venueName, month, report, bookings } = input
  const currency = report.currency || 'ETB'
  const period = periodLabel(month, report)
  const generated = format(new Date(), 'd MMM yyyy, HH:mm')
  const logo = await loadLogo()

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentWidth = pageWidth - margin * 2
  let y = 0

  const paintHeader = () => {
    doc.setFillColor(...RICH_BLACK)
    doc.rect(0, 0, pageWidth, 28, 'F')
    doc.setFillColor(...ORANGE)
    doc.rect(0, 28, pageWidth, 2.2, 'F')
    let textX = margin
    if (logo) {
      const logoH = 16
      const logoW = logoH * (logo.width / logo.height)
      doc.addImage(logo.dataUrl, 'PNG', margin, 6, logoW, logoH)
      textX = margin + logoW + 4
    }
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('Evella', textX, 12)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text('Revenue report', textX, 18)
    doc.setFontSize(8)
    doc.setTextColor(203, 213, 225)
    doc.text(venueName || 'Venue', textX, 23.5)
    y = 38
  }

  const ensureSpace = (needed: number) => {
    if (y + needed <= pageHeight - 16) return
    doc.addPage()
    paintHeader()
  }

  const sectionTitle = (title: string) => {
    ensureSpace(12)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...RICH_BLACK)
    doc.text(title, margin, y)
    y += 2
    doc.setDrawColor(...ORANGE)
    doc.setLineWidth(0.6)
    doc.line(margin, y, margin + 28, y)
    y += 6
  }

  paintHeader()

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  doc.text(`Period  ${period}`, margin, y)
  doc.text(`Generated  ${generated}`, margin + 70, y)
  y += 8

  sectionTitle('Summary')
  const summary = [
    ['Collected', money(report.collected, currency)],
    ['Quoted', money(report.quoted, currency)],
    ['Outstanding', money(report.outstanding, currency)],
  ]
  const cardWidth = (contentWidth - 8) / 3
  summary.forEach(([label, value], index) => {
    const x = margin + index * (cardWidth + 4)
    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(x, y, cardWidth, 16, 1.5, 1.5, 'FD')
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text(label, x + 3, y + 6)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...RICH_BLACK)
    doc.text(value, x + 3, y + 12)
  })
  y += 22

  sectionTitle('By method')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  if (report.byMethod.length === 0) {
    doc.setTextColor(...MUTED)
    doc.setFontSize(9)
    doc.text('No payments this month.', margin, y)
    y += 6
  }
  report.byMethod.forEach((row) => {
    ensureSpace(7)
    doc.setTextColor(...MUTED)
    doc.text(methodLabel[row.method] || row.method, margin, y)
    doc.setTextColor(...RICH_BLACK)
    doc.setFont('helvetica', 'bold')
    doc.text(money(row.amount, currency), margin + contentWidth, y, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    y += 6
  })
  y += 4

  sectionTitle('By space')
  const spaceCols = [0, 70, 112, 154]
  const spaceHeads = ['Space', 'Quoted', 'Collected', 'Outstanding']
  const paintSpaceHead = () => {
    doc.setFillColor(241, 245, 249)
    doc.rect(margin, y - 4, contentWidth, 7, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    spaceHeads.forEach((head, index) => {
      const x = margin + spaceCols[index]
      if (index === 0) doc.text(head, x, y)
      else doc.text(head, x + 28, y, { align: 'right' })
    })
    y += 6
  }
  if (report.bySpace.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...MUTED)
    doc.text('No quotes this month.', margin, y)
    y += 6
  } else {
    paintSpaceHead()
  }
  report.bySpace.forEach((space) => {
    ensureSpace(8)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...RICH_BLACK)
    const name = doc.splitTextToSize(space.name || 'Space', 64)[0]
    doc.text(name, margin, y)
    const figures = [money(space.quoted, currency), money(space.collected, currency), money(space.outstanding, currency)]
    figures.forEach((figure, index) => {
      doc.text(figure, margin + spaceCols[index + 1] + 28, y, { align: 'right' })
    })
    y += 6
  })
  y += 4

  sectionTitle('Bookings')
  const ledgerCols = [0, 24, 70, 104]
  const ledgerHeads = ['Date', 'Title', 'Space', 'Status', 'Quote', 'Paid', 'Balance']
  const ledgerRights = [132, 157, 182]
  const paintLedgerHead = () => {
    doc.setFillColor(...RICH_BLACK)
    doc.rect(margin, y - 4.2, contentWidth, 7, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(255, 255, 255)
    ledgerHeads.forEach((head, index) => {
      if (index < 4) doc.text(head, margin + ledgerCols[index], y)
      else doc.text(head, margin + ledgerRights[index - 4], y, { align: 'right' })
    })
    y += 6
  }
  paintLedgerHead()

  const rows = [...bookings].sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  if (rows.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...MUTED)
    doc.text('No bookings in this period.', margin, y)
    y += 6
  }

  rows.forEach((booking, index) => {
    if (y + 7 > pageHeight - 16) {
      doc.addPage()
      paintHeader()
      paintLedgerHead()
    }
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252)
      doc.rect(margin, y - 4, contentWidth, 6.5, 'F')
    }
    const balance = balanceAmount(booking)
    const cells = [
      format(new Date(booking.starts_at), 'd MMM yyyy'),
      doc.splitTextToSize(bookingTitle(booking), 42)[0],
      doc.splitTextToSize(booking.space?.name || '—', 30)[0],
      statusLabel(booking.status),
    ]
    const amounts = [
      booking.quoted_amount == null ? '—' : money(booking.quoted_amount, booking.currency || currency),
      money(booking.paid_total, booking.currency || currency),
      balance == null ? '—' : money(balance, booking.currency || currency),
    ]
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...RICH_BLACK)
    cells.forEach((cell, cellIndex) => doc.text(String(cell), margin + ledgerCols[cellIndex], y))
    amounts.forEach((amount, amountIndex) => {
      doc.text(amount, margin + ledgerRights[amountIndex], y, { align: 'right' })
    })
    y += 6.5
  })

  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text('Evella', margin, pageHeight - 8)
    doc.text(`${page} / ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' })
  }

  doc.save(`evella-venue-revenue-${month}.pdf`)
}

export function exportVenueRevenueCsv(input: VenueReportInput) {
  const { venueName, month, report, bookings } = input
  const currency = report.currency || 'ETB'
  const period = periodLabel(month, report)
  const rows: Record<string, string | number>[] = [
    { Section: 'Report', Field: 'Venue', Value: venueName },
    { Section: 'Report', Field: 'Period', Value: period },
    { Section: 'Report', Field: 'Generated', Value: format(new Date(), 'yyyy-MM-dd HH:mm') },
    { Section: 'Summary', Field: 'Collected', Value: money(report.collected, currency) },
    { Section: 'Summary', Field: 'Quoted', Value: money(report.quoted, currency) },
    { Section: 'Summary', Field: 'Outstanding', Value: money(report.outstanding, currency) },
  ]

  report.byMethod.forEach((row) => {
    rows.push({
      Section: 'By method',
      Field: methodLabel[row.method] || row.method,
      Value: money(row.amount, currency),
    })
  })

  report.bySpace.forEach((space) => {
    rows.push({
      Section: 'By space',
      Field: space.name,
      Quoted: money(space.quoted, currency),
      Collected: money(space.collected, currency),
      Outstanding: money(space.outstanding, currency),
    })
  })

  ;[...bookings]
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .forEach((booking) => {
      const balance = balanceAmount(booking)
      const bookingCurrency = booking.currency || currency
      rows.push({
        Section: 'Bookings',
        Date: format(new Date(booking.starts_at), 'yyyy-MM-dd'),
        Title: bookingTitle(booking),
        Space: booking.space?.name || '',
        Status: statusLabel(booking.status),
        Quote: booking.quoted_amount == null ? '' : money(booking.quoted_amount, bookingCurrency),
        Paid: money(booking.paid_total, bookingCurrency),
        Balance: balance == null ? '' : money(balance, bookingCurrency),
      })
    })

  const csv = Papa.unparse(rows)
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `evella-venue-revenue-${month}.csv`)
}
