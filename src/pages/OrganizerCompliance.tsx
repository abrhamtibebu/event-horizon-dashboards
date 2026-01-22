import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Shield,
} from 'lucide-react'
import Breadcrumbs from '@/components/Breadcrumbs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import api from '@/lib/api'
import { toast } from 'sonner'

interface ComplianceDocument {
  id: number
  name: string
  type: string
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  uploaded_at: string
  expires_at?: string
  file_url?: string
  notes?: string
  verified_by?: string
  verified_at?: string
}

const DOCUMENT_TYPES = [
  { value: 'business_license', label: 'Business License' },
  { value: 'tax_certificate', label: 'Tax Certificate' },
  { value: 'insurance_policy', label: 'Insurance Policy' },
  { value: 'identification', label: 'Identification Document' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'other', label: 'Other' },
]

export default function OrganizerCompliance() {
  const { organizerId } = useParams<{ organizerId: string }>()
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<ComplianceDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadForm, setUploadForm] = useState({
    name: '',
    type: '',
    notes: '',
  })

  useEffect(() => {
    fetchDocuments()
  }, [organizerId])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      // Mock data for demonstration - in production this would be a real API call
      const mockDocuments: ComplianceDocument[] = [
        {
          id: 1,
          name: 'Business License 2024',
          type: 'business_license',
          status: 'approved',
          uploaded_at: '2024-01-15T10:00:00Z',
          expires_at: '2025-01-15T10:00:00Z',
          verified_by: 'Compliance Officer',
          verified_at: '2024-01-16T14:30:00Z',
          notes: 'Valid business license for the current year'
        },
        {
          id: 2,
          name: 'Tax Certificate Q1 2024',
          type: 'tax_certificate',
          status: 'approved',
          uploaded_at: '2024-02-01T09:15:00Z',
          verified_by: 'Tax Department',
          verified_at: '2024-02-03T11:20:00Z',
          notes: 'Q1 tax compliance verified'
        },
        {
          id: 3,
          name: 'Event Insurance Policy',
          type: 'insurance_policy',
          status: 'pending',
          uploaded_at: '2024-07-20T16:45:00Z',
          notes: 'Awaiting review by insurance department'
        },
        {
          id: 4,
          name: 'Director ID Copy',
          type: 'identification',
          status: 'rejected',
          uploaded_at: '2024-06-10T08:30:00Z',
          notes: 'Document quality insufficient - please resubmit clearer copy'
        }
      ]
      setDocuments(mockDocuments)
    } catch (error) {
      console.error('Failed to fetch compliance documents:', error)
      toast.error('Failed to load compliance documents')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile || !uploadForm.name || !uploadForm.type) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setUploading(true)

      // Mock upload - in production this would upload to backend
      const newDocument: ComplianceDocument = {
        id: Date.now(), // Mock ID
        name: uploadForm.name,
        type: uploadForm.type,
        status: 'pending',
        uploaded_at: new Date().toISOString(),
        notes: uploadForm.notes,
      }

      setDocuments(prev => [newDocument, ...prev])
      toast.success('Document uploaded successfully!')

      // Reset form
      setUploadForm({ name: '', type: '', notes: '' })
      setSelectedFile(null)
      setIsUploadDialogOpen(false)
    } catch (error) {
      console.error('Failed to upload document:', error)
      toast.error('Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDocument = async (documentId: number, documentName: string) => {
    if (!confirm(`Are you sure you want to delete "${documentName}"?`)) {
      return
    }

    try {
      // Mock delete - in production this would call backend
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
      toast.success('Document deleted successfully!')
    } catch (error) {
      console.error('Failed to delete document:', error)
      toast.error('Failed to delete document')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'expired':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Rejected</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Pending</Badge>
      case 'expired':
        return <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30">Expired</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getDocumentTypeLabel = (type: string) => {
    const docType = DOCUMENT_TYPES.find(dt => dt.value === type)
    return docType ? docType.label : type
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent p-6">
        <div className="flex items-center justify-center h-96">
          <Spinner size="lg" text="Loading compliance documents..." />
        </div>
      </div>
    )
  }

  const approvedCount = documents.filter(doc => doc.status === 'approved').length
  const pendingCount = documents.filter(doc => doc.status === 'pending').length
  const rejectedCount = documents.filter(doc => doc.status === 'rejected').length

  return (
    <div className="min-h-screen bg-transparent p-6 space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Organizers', href: '/dashboard/organizers' },
          { label: 'Compliance Documents' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary/80">Compliance Management</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">Document Compliance</h1>
          <p className="text-muted-foreground mt-1">Manage legal documents and compliance verification.</p>
        </div>

        <div className="flex items-center gap-3">
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card/95 backdrop-blur-xl border-white/10">
              <DialogHeader>
                <DialogTitle>Upload Compliance Document</DialogTitle>
                <DialogDescription>
                  Upload a new compliance document for verification.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Document Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter document name"
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Document Type *</Label>
                  <Select value={uploadForm.type} onValueChange={(value) => setUploadForm(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">File *</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes or comments"
                    value={uploadForm.notes}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsUploadDialogOpen(false)}
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleFileUpload}
                    disabled={uploading || !selectedFile || !uploadForm.name || !uploadForm.type}
                  >
                    {uploading ? 'Uploading...' : 'Upload Document'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/organizers')}
            className="bg-card/50 backdrop-blur-md border-border/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Organizers
          </Button>
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Documents</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">Verified and compliant</p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Documents</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">Require resubmission</p>
          </CardContent>
        </Card>
      </div>

      {/* Documents List */}
      <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl">
        <CardHeader>
          <CardTitle>Compliance Documents</CardTitle>
          <CardDescription>
            All uploaded compliance documents and their verification status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {documents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No compliance documents uploaded yet.</p>
              </div>
            ) : (
              documents.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-white/5 hover:bg-background/70 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{document.name}</h4>
                      <div className="flex items-center gap-4 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getDocumentTypeLabel(document.type)}
                        </Badge>
                        {getStatusBadge(document.status)}
                        <span className="text-xs text-muted-foreground">
                          Uploaded {new Date(document.uploaded_at).toLocaleDateString()}
                        </span>
                      </div>
                      {document.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{document.notes}</p>
                      )}
                      {document.verified_by && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Verified by {document.verified_by} on {new Date(document.verified_at!).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {document.file_url && (
                      <>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Download className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDocument(document.id, document.name)}
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
