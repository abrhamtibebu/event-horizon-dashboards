import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Activity, Home, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const NotFound = () => {
  const location = useLocation()
  const isDashboard = location.pathname.startsWith('/dashboard')

  return (
    <div
      className={cn(
        'min-h-screen flex items-center justify-center p-4',
        'bg-background text-foreground'
      )}
    >
      <div className="text-center max-w-md mx-auto">
        {/* Icon */}
        <div
          className={cn(
            'inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-8',
            'bg-primary/10 text-primary border border-primary/20',
            'shadow-sm'
          )}
        >
          <Activity className="w-10 h-10" />
        </div>

        {/* 404 Message */}
        <div className="mb-8">
          <h1
            className={cn(
              'text-8xl sm:text-9xl font-bold mb-4 tabular-nums',
              'text-foreground'
            )}
          >
            404
          </h1>
          <h2 className="text-2xl font-semibold text-foreground mb-3" style={{ fontFamily: 'Mosk, sans-serif' }}>
            Page Not Found
          </h2>
          <p className="text-muted-foreground text-base">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link
              to={isDashboard ? '/dashboard' : '/'}
              className="flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>{isDashboard ? 'Go to Dashboard' : 'Go Home'}</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 border-border bg-background hover:bg-accent hover:text-accent-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default NotFound
