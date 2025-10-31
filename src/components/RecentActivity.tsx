import React from 'react'
import { MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

interface RecentActivityProps {
  limit?: number
  showHeader?: boolean
  className?: string
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  limit = 10,
  showHeader = true,
  className = ''
}) => {
  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p>Recent Activity Component</p>
          <p className="text-sm text-gray-400 mt-1">This component is working</p>
        </div>
      </CardContent>
    </Card>
  )
}
