import React from 'react'

interface DateSeparatorProps {
  date: string
}

export const DateSeparator: React.FC<DateSeparatorProps> = ({ date }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    }
    
    // Check if it's yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    }
    
    // Format as weekday, month day (e.g., "Wed, Dec 21")
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <div className="flex items-center justify-center my-4">
      <div className="bg-gray-100 px-3 py-1 rounded-full">
        <span className="text-xs text-gray-600 font-medium">
          {formatDate(date)}
        </span>
      </div>
    </div>
  )
}
