import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Database,
  Download,
  Upload,
  Trash2,
  Archive,
  FileText,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  HardDrive,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardCard } from '@/components/DashboardCard'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import api from '@/lib/api'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface BackupInfo {
  id: number
  name: string
  type: 'full' | 'incremental'
  size: number
  created_at: string
  status: 'completed' | 'failed' | 'in_progress'
}

export default function DataManagement() {
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [backupDialogOpen, setBackupDialogOpen] = useState(false)
  const [exportType, setExportType] = useState<'events' | 'users' | 'all'>('all')
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'xlsx'>('csv')
  const [backupType, setBackupType] = useState<'full' | 'incremental'>('full')
  const [uploadProgress, setUploadProgress] = useState(0)

  const fetchBackups = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/data/backups')
      setBackups(response.data.data || response.data || [])
    } catch (err: any) {
      console.error('Failed to fetch backups:', err)
      // Use mock data for development
      setBackups([
        {
          id: 1,
          name: 'backup_2024_01_15_full.sql',
          type: 'full',
          size: 52428800, // 50MB
          created_at: new Date().toISOString(),
          status: 'completed',
        },
        {
          id: 2,
          name: 'backup_2024_01_14_incremental.sql',
          type: 'incremental',
          size: 10485760, // 10MB
          created_at: new Date(Date.now() - 86400000).toISOString(),
          status: 'completed',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      toast.loading('Exporting data...')
      const response = await api.get('/admin/data/export', {
        params: {
          type: exportType,
          format: exportFormat,
        },
        responseType: 'blob',
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `export_${exportType}_${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success('Data exported successfully')
      setExportDialogOpen(false)
    } catch (err: any) {
      toast.error(`Failed to export data: ${err.response?.data?.message || err.message}`)
    }
  }

  const handleImport = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', exportType)

      toast.loading('Importing data...')
      await api.post('/admin/data/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(percentCompleted)
          }
        },
      })

      toast.success('Data imported successfully')
      setImportDialogOpen(false)
      setUploadProgress(0)
    } catch (err: any) {
      toast.error(`Failed to import data: ${err.response?.data?.message || err.message}`)
      setUploadProgress(0)
    }
  }

  const handleCreateBackup = async () => {
    try {
      toast.loading('Creating backup...')
      await api.post('/admin/data/backup', {
        type: backupType,
      })
      toast.success('Backup created successfully')
      setBackupDialogOpen(false)
      fetchBackups()
    } catch (err: any) {
      toast.error(`Failed to create backup: ${err.response?.data?.message || err.message}`)
    }
  }

  const handleRestoreBackup = async (backupId: number) => {
    if (!confirm('Are you sure you want to restore this backup? This action cannot be undone.')) {
      return
    }

    try {
      toast.loading('Restoring backup...')
      await api.post(`/admin/data/backup/${backupId}/restore`)
      toast.success('Backup restored successfully')
      fetchBackups()
    } catch (err: any) {
      toast.error(`Failed to restore backup: ${err.response?.data?.message || err.message}`)
    }
  }

  const handleDeleteBackup = async (backupId: number) => {
    if (!confirm('Are you sure you want to delete this backup?')) {
      return
    }

    try {
      await api.delete(`/admin/data/backup/${backupId}`)
      toast.success('Backup deleted successfully')
      fetchBackups()
    } catch (err: any) {
      toast.error(`Failed to delete backup: ${err.response?.data?.message || err.message}`)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'in_progress':
        return <Badge className="bg-yellow-500">In Progress</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const stats = {
    total_backups: backups.length,
    total_size: backups.reduce((sum, b) => sum + b.size, 0),
    last_backup: backups.length > 0 ? backups[0].created_at : null,
  }

  return (
    <div className="min-h-screen bg-transparent p-1 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary/80">
              Data Management
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Data Management
          </h1>
          <p className="text-muted-foreground mt-1">Export, import, and backup your data.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 flex-wrap"
        >
          <Button variant="outline" onClick={() => setExportDialogOpen(true)} className="gap-2">
            <Download className="w-4 h-4" />
            Export Data
          </Button>
          <Button variant="outline" onClick={() => setImportDialogOpen(true)} className="gap-2">
            <Upload className="w-4 h-4" />
            Import Data
          </Button>
          <Button onClick={() => setBackupDialogOpen(true)} className="gap-2">
            <Archive className="w-4 h-4" />
            Create Backup
          </Button>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard title="Total Backups">
          <div className="space-y-2">
            <p className="text-3xl font-bold">{stats.total_backups}</p>
            <p className="text-sm text-muted-foreground">Backup files</p>
          </div>
        </DashboardCard>
        <DashboardCard title="Total Size">
          <div className="space-y-2">
            <p className="text-3xl font-bold">{formatFileSize(stats.total_size)}</p>
            <p className="text-sm text-muted-foreground">Storage used</p>
          </div>
        </DashboardCard>
        <DashboardCard title="Last Backup">
          <div className="space-y-2">
            <p className="text-3xl font-bold">
              {stats.last_backup ? format(new Date(stats.last_backup), 'MMM d') : 'Never'}
            </p>
            <p className="text-sm text-muted-foreground">Most recent backup</p>
          </div>
        </DashboardCard>
      </div>

      {/* Backups List */}
      <DashboardCard
        title="Backups"
        action={
          <Button variant="outline" size="sm" onClick={fetchBackups} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        }
      >
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Spinner text="Loading backups..." />
          </div>
        ) : backups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
            <Database className="w-12 h-12 mb-4 opacity-50" />
            <p>No backups found. Create your first backup to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {backups.map((backup) => (
              <div
                key={backup.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Archive className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{backup.name}</p>
                      {getStatusBadge(backup.status)}
                      <Badge variant="secondary" className="capitalize">
                        {backup.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-4 h-4" />
                        {formatFileSize(backup.size)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {format(new Date(backup.created_at), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestoreBackup(backup.id)}
                    disabled={backup.status !== 'completed'}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Restore
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteBackup(backup.id)}
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardCard>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Data</DialogTitle>
            <DialogDescription>Export data from the system in various formats.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Data Type</Label>
              <Select value={exportType} onValueChange={(value: any) => setExportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Data</SelectItem>
                  <SelectItem value="events">Events Only</SelectItem>
                  <SelectItem value="users">Users Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Export Format</Label>
              <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport}>Export</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
            <DialogDescription>Import data from a file into the system.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Data Type</Label>
              <Select value={exportType} onValueChange={(value: any) => setExportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Data</SelectItem>
                  <SelectItem value="events">Events Only</SelectItem>
                  <SelectItem value="users">Users Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>File</Label>
              <Input
                type="file"
                accept=".csv,.json,.xlsx"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleImport(file)
                  }
                }}
              />
              {uploadProgress > 0 && (
                <div className="mt-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{uploadProgress}% uploaded</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Dialog */}
      <Dialog open={backupDialogOpen} onOpenChange={setBackupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Backup</DialogTitle>
            <DialogDescription>Create a backup of the system data.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Backup Type</Label>
              <Select value={backupType} onValueChange={(value: any) => setBackupType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Backup</SelectItem>
                  <SelectItem value="incremental">Incremental Backup</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                {backupType === 'full'
                  ? 'Creates a complete backup of all data'
                  : 'Creates a backup of changes since last backup'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBackupDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBackup}>Create Backup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
