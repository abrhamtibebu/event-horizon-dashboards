import React from 'react'

interface DateDividerProps {
  date: string
}

export const DateDivider: React.FC<DateDividerProps> = ({ date }) => {
  return (
    <div className="flex items-center justify-center my-4 px-4">
      <div className="flex-1 border-t border-gray-200"></div>
      <span className="px-4 text-xs text-[#9CA3AF] font-medium">
        {date}
      </span>
      <div className="flex-1 border-t border-gray-200"></div>
    </div>
  )
}

