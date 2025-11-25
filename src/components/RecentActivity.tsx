import React from 'react'
import { MessageSquare, User, Calendar, RefreshCw, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Spinner } from './ui/spinner'
import { formatDistanceToNow } from 'date-fns'
import { Link } from 'react-router-dom'

interface Activity {
  id?: string
  type: string
  subtype?: string
  action?: string
  content?: string
  sender_name?: string
  recipient_name?: string
  other_user_name?: string
  other_user_avatar?: string
  event_name?: string
  is_reply?: boolean
  parent_message_content?: string
  parent_message_sender?: string
  created_at: string
  read_at?: string
  file_path?: string
  file_name?: string
  file_type?: string
  description?: string
  timestamp?: string
}

interface RecentActivityProps {
  limit?: number
  showHeader?: boolean
  className?: string
  activities?: Activity[]
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  limit = 10,
  showHeader = true,
  className = '',
  activities = [],
  loading = false,
  error = null,
  onRefresh
}) => {
  const getActivityIcon = (activity: Activity) => {
    if (activity.type === 'message') {
      return <MessageSquare className="w-4 h-4 text-primary" />;
    } else if (activity.type === 'event') {
      return <Calendar className="w-4 h-4 text-info" />;
    } else {
      return <User className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActivityTitle = (activity: Activity) => {
    if (activity.type === 'message') {
      // Show conversation context instead of individual message action
      if (activity.event_name) {
        // Event chat
        return activity.event_name;
      } else {
        // Direct chat - show the other user's name
        return activity.other_user_name || 'Direct Message';
      }
    } else if (activity.description) {
      return activity.description;
    } else {
      return 'Activity';
    }
  };

  const getActivitySubtitle = (activity: Activity) => {
    if (activity.type === 'message') {
      // Show who sent the last message
      if (activity.action === 'sent') {
        return 'You sent a message';
      } else {
        return `${activity.sender_name || activity.other_user_name} sent a message`;
      }
    }
    return null;
  };

  const getActivityContent = (activity: Activity) => {
    if (activity.content) {
      return activity.content.length > 100 
        ? activity.content.substring(0, 100) + '...' 
        : activity.content;
    }
    return null;
  };

  const formatTimestamp = (timestamp: string | undefined, createdAt: string) => {
    if (timestamp) {
      return timestamp;
    }
    if (createdAt) {
      try {
        return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
      } catch (e) {
        return 'Recently';
      }
    }
    return 'Recently';
  };

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Recent Activity
            </CardTitle>
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent>
        {loading && (
          <div className="text-center py-8">
            <Spinner size="sm" variant="primary" />
            <p className="text-sm text-muted-foreground mt-2">Loading activities...</p>
          </div>
        )}
        
        {error && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{error}</p>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="mt-2"
              >
                Try Again
              </Button>
            )}
          </div>
        )}
        
        {!loading && !error && activities.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
            <p>No recent activity</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your recent messages and activities will appear here
            </p>
          </div>
        )}
        
        {!loading && !error && activities.length > 0 && (
          <div className="space-y-3">
            {activities.slice(0, limit).map((activity, index) => (
              <div
                key={activity.id || index}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors group"
              >
                <div className="mt-0.5 flex-shrink-0">
                  {getActivityIcon(activity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {getActivityTitle(activity)}
                      </p>
                      {getActivitySubtitle(activity) && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {getActivitySubtitle(activity)}
                        </p>
                      )}
                      {activity.event_name && activity.type === 'message' && (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs bg-info/10 text-info border-info/30">
                            Event Chat
                          </Badge>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatTimestamp(activity.timestamp, activity.created_at)}
                    </span>
                  </div>
                  {getActivityContent(activity) && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {getActivityContent(activity)}
                    </p>
                  )}
                  {activity.file_name && (
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">
                        📎 {activity.file_name}
                      </Badge>
                    </div>
                  )}
                  {activity.type === 'message' && (
                    <Link
                      to={activity.event_name 
                        ? `/dashboard/messages?event=${encodeURIComponent(activity.event_name)}` 
                        : `/dashboard/messages?user=${encodeURIComponent(activity.other_user_name || '')}`
                      }
                      className="flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
                    >
                      Open conversation
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
            {activities.length > limit && (
              <Link to="/dashboard/messages">
                <Button variant="outline" className="w-full" size="sm">
                  View All Activities
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
