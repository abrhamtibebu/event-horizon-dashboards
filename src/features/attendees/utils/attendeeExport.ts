// Utility functions for attendee export functionality
import Papa from 'papaparse'
import { format, parseISO } from 'date-fns'
import type { Attendee } from '../types/attendee.types'

export function exportAttendeesToCSV(attendees: Attendee[], eventName: string): void {
  if (attendees.length === 0) {
    throw new Error('No attendees to export.')
  }

  const dataToExport = attendees.map((attendee) => {
    // Handle guest type display properly for CSV export
    let guestTypeName = 'N/A'
    // Try both guestType and guest_type for compatibility
    const guestType = attendee.guestType || attendee.guest_type
    if (guestType) {
      if (typeof guestType === 'object' && guestType !== null) {
        guestTypeName = guestType.name || guestType.id || 'N/A'
      } else if (typeof guestType === 'string') {
        guestTypeName = guestType
      } else {
        guestTypeName = String(guestType)
      }
    }

    return {
      'Attendee ID': attendee.id,
      'Name': attendee.guest?.name || 'N/A',
      'Email': attendee.guest?.email || 'N/A',
      'Phone': attendee.guest?.phone || 'N/A',
      'Company': attendee.guest?.company || 'N/A',
      'Job Title': attendee.guest?.jobtitle || 'N/A',
      'Gender': attendee.guest?.gender || 'N/A',
      'Country': attendee.guest?.country || 'N/A',
      'Guest Type': guestTypeName,
      'Registration Date': attendee.created_at
        ? format(parseISO(attendee.created_at), 'MMM d, yyyy, h:mm a')
        : 'N/A',
      'Checked In': attendee.checked_in ? 'Yes' : 'No',
      'Check-In Time': attendee.check_in_time
        ? format(parseISO(attendee.check_in_time), 'MMM d, yyyy, h:mm a')
        : 'N/A',
    }
  })

  const csv = Papa.unparse(dataToExport)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${eventName}_attendees.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
