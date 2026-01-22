import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  Users,
  Building2,
  TrendingUp,
  AlertCircle,
  Plus,
  Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/MetricCard'
import api from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const response = await api.get('/dashboard/admin')
        setStats(response.data)
        setError(null)
      } catch (err) {
        setError('Failed to load Command Center data.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner size="lg" variant="primary" text="Initializing Command Center..." />
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center p-6">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry Connection</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent p-1 sm:p-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary/80">Platform Status: Optimal</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Command Center
          </h1>
          <p className="text-muted-foreground mt-1">Real-time oversight and administrative control.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <Button variant="outline" className="bg-background/50 backdrop-blur-md border-border/50">
            <Globe className="w-4 h-4 mr-2" /> Global Reach
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> Global Action
          </Button>
        </motion.div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Events', ...stats?.keyMetrics?.totalEvents, icon: <Calendar /> },
          { title: 'Platform Users', ...stats?.keyMetrics?.totalUsers, icon: <Users /> },
          { title: 'Active Organizers', ...stats?.keyMetrics?.activeOrganizers, icon: <Building2 /> },
          { title: 'Total Revenue', ...stats?.keyMetrics?.totalRevenue, icon: <TrendingUp /> },
        ].map((metric, idx) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <MetricCard
              title={metric.title}
              value={metric.value || '0'}
              trend={metric.growth}
              icon={metric.icon}
              className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl"
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
