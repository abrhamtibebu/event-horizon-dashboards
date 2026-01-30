// Utility functions for admin dashboard export
import Papa from 'papaparse'
import { format } from 'date-fns'
import jsPDF from 'jspdf'

// Note: jspdf-autotable needs to be installed separately if PDF export is needed
// For now, we'll create a simpler PDF without tables

interface DashboardStats {
  keyMetrics?: any
  eventGrowth?: any[]
  eventStatusDistribution?: any[]
  userRoleDistribution?: any[]
  systemAlerts?: any[]
  recentActivities?: any[]
}

export function exportDashboardToCSV(stats: DashboardStats, dateRange: string): void {
  const exportData: any[] = []
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')

  // Key Metrics Section
  exportData.push({ Section: 'Key Metrics', Metric: '', Value: '', Trend: '' })
  if (stats.keyMetrics) {
    Object.entries(stats.keyMetrics).forEach(([key, value]: [string, any]) => {
      exportData.push({
        Section: 'Key Metrics',
        Metric: key.replace(/([A-Z])/g, ' $1').trim(),
        Value: value.value || '',
        Trend: value.trend || '',
      })
    })
  }

  // Event Growth Section
  exportData.push({ Section: 'Event Growth', Month: '', Events: '', Users: '' })
  if (stats.eventGrowth && stats.eventGrowth.length > 0) {
    stats.eventGrowth.forEach((item) => {
      exportData.push({
        Section: 'Event Growth',
        Month: item.month || '',
        Events: item.events || 0,
        Users: item.users || 0,
      })
    })
  }

  // Event Status Distribution
  exportData.push({ Section: 'Event Status', Status: '', Count: '', Color: '' })
  if (stats.eventStatusDistribution && stats.eventStatusDistribution.length > 0) {
    stats.eventStatusDistribution.forEach((item) => {
      exportData.push({
        Section: 'Event Status',
        Status: item.name || '',
        Count: item.value || 0,
        Color: item.color || '',
      })
    })
  }

  // User Role Distribution
  exportData.push({ Section: 'User Roles', Role: '', Count: '', Growth: '' })
  if (stats.userRoleDistribution && stats.userRoleDistribution.length > 0) {
    stats.userRoleDistribution.forEach((item) => {
      exportData.push({
        Section: 'User Roles',
        Role: item.role || '',
        Count: item.count || 0,
        Growth: item.growth || 0,
      })
    })
  }

  // System Alerts
  exportData.push({ Section: 'System Alerts', Title: '', Description: '', Severity: '', Timestamp: '' })
  if (stats.systemAlerts && stats.systemAlerts.length > 0) {
    stats.systemAlerts.forEach((alert) => {
      exportData.push({
        Section: 'System Alerts',
        Title: alert.title || '',
        Description: alert.description || '',
        Severity: alert.severity || '',
        Timestamp: alert.timestamp || '',
      })
    })
  }

  // Recent Activities
  exportData.push({ Section: 'Recent Activities', Type: '', Description: '', Timestamp: '' })
  if (stats.recentActivities && stats.recentActivities.length > 0) {
    stats.recentActivities.forEach((activity) => {
      exportData.push({
        Section: 'Recent Activities',
        Type: activity.type || '',
        Description: activity.description || '',
        Timestamp: activity.timestamp || '',
      })
    })
  }

  const csv = Papa.unparse(exportData)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `admin_dashboard_${dateRange}_${timestamp}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportDashboardToPDF(stats: DashboardStats, dateRange: string): void {
  const doc = new jsPDF()
  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss')
  let yPosition = 20
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14
  const maxWidth = pageWidth - 2 * margin

  // Helper function to add new page if needed
  const checkNewPage = (requiredSpace: number = 20) => {
    if (yPosition + requiredSpace > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage()
      yPosition = 20
      return true
    }
    return false
  }

  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Admin Dashboard Report', margin, yPosition)
  yPosition += 10

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Date Range: ${dateRange}`, margin, yPosition)
  yPosition += 5
  doc.text(`Generated: ${timestamp}`, margin, yPosition)
  yPosition += 15

  doc.setTextColor(0, 0, 0)

  // Key Metrics Section
  if (stats.keyMetrics) {
    checkNewPage(30)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Key Metrics', margin, yPosition)
    yPosition += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    Object.entries(stats.keyMetrics).forEach(([key, value]: [string, any]) => {
      checkNewPage(8)
      const metricName = key.replace(/([A-Z])/g, ' $1').trim()
      doc.text(`${metricName}:`, margin, yPosition)
      doc.setFont('helvetica', 'bold')
      doc.text(`${value.value || ''} ${value.trend || ''}`, margin + 60, yPosition)
      doc.setFont('helvetica', 'normal')
      yPosition += 7
    })
    yPosition += 5
  }

  // Event Status Distribution
  if (stats.eventStatusDistribution && stats.eventStatusDistribution.length > 0) {
    checkNewPage(30)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Event Status Distribution', margin, yPosition)
    yPosition += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    stats.eventStatusDistribution.forEach((item) => {
      checkNewPage(8)
      doc.text(`${item.name || ''}:`, margin, yPosition)
      doc.setFont('helvetica', 'bold')
      doc.text(`${item.value || 0}`, margin + 60, yPosition)
      doc.setFont('helvetica', 'normal')
      yPosition += 7
    })
    yPosition += 5
  }

  // User Role Distribution
  if (stats.userRoleDistribution && stats.userRoleDistribution.length > 0) {
    checkNewPage(30)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('User Role Distribution', margin, yPosition)
    yPosition += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    stats.userRoleDistribution.forEach((item) => {
      checkNewPage(8)
      doc.text(`${item.role || ''}:`, margin, yPosition)
      doc.setFont('helvetica', 'bold')
      doc.text(`Total: ${item.count || 0} | Growth: ${item.growth || 0}`, margin + 50, yPosition)
      doc.setFont('helvetica', 'normal')
      yPosition += 7
    })
    yPosition += 5
  }

  // System Alerts
  if (stats.systemAlerts && stats.systemAlerts.length > 0) {
    checkNewPage(30)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('System Alerts', margin, yPosition)
    yPosition += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    stats.systemAlerts.forEach((alert) => {
      checkNewPage(15)
      doc.setFont('helvetica', 'bold')
      doc.text(`[${alert.severity?.toUpperCase() || 'INFO'}] ${alert.title || ''}`, margin, yPosition)
      yPosition += 6
      doc.setFont('helvetica', 'normal')
      const description = doc.splitTextToSize(alert.description || '', maxWidth)
      doc.text(description, margin, yPosition)
      yPosition += description.length * 5 + 3
    })
  }

  // Recent Activities
  if (stats.recentActivities && stats.recentActivities.length > 0) {
    checkNewPage(30)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Recent Activities', margin, yPosition)
    yPosition += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    stats.recentActivities.forEach((activity) => {
      checkNewPage(10)
      const description = doc.splitTextToSize(activity.description || '', maxWidth)
      doc.text(description, margin, yPosition)
      yPosition += description.length * 5 + 2
      doc.setTextColor(100, 100, 100)
      doc.setFontSize(8)
      doc.text(activity.timestamp || '', margin, yPosition)
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(10)
      yPosition += 5
    })
  }

  // Save PDF
  doc.save(`admin_dashboard_${dateRange}_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.pdf`)
}
