import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { QrCode, User, Mail, Phone, Building, Briefcase, CheckCircle2, Loader2 } from 'lucide-react'
import { assignPreGeneratedBadge } from '@/lib/api'

interface BadgeAssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: number
  onSuccess?: () => void
}

export function BadgeAssignmentDialog({
  open,
  onOpenChange,
  eventId,
  onSuccess,
}: BadgeAssignmentDialogProps) {
  const [badgeCode, setBadgeCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [badgeData, setBadgeData] = useState<any>(null)
  
  // Guest information
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  
  const badgeCodeInputRef = useRef<HTMLInputElement>(null)
  const firstNameInputRef = useRef<HTMLInputElement>(null)

  // Focus badge code input when dialog opens
  useEffect(() => {
    if (open && badgeCodeInputRef.current) {
      setTimeout(() => {
        badgeCodeInputRef.current?.focus()
      }, 100)
    }
  }, [open])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setBadgeCode('')
      setFirstName('')
      setLastName('')
      setEmail('')
      setPhone('')
      setCompany('')
      setJobTitle('')
      setBadgeData(null)
    }
  }, [open])

  // Load badge details when code is scanned
  const handleBadgeCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value.trim()
    setBadgeCode(code)

    // If code looks complete (has minimum length), fetch badge details
    if (code.length >= 10) {
      await fetchBadgeDetails(code)
    }
  }

  // Fetch badge details
  const fetchBadgeDetails = async (code: string) => {
    setLoading(true)
    try {
      // In a real implementation, you would fetch badge details here
      // For now, we'll just set basic badge data
      setBadgeData({
        badge_code: code,
        status: 'available', // Assumed
      })
      
      // Move focus to first name input
      setTimeout(() => {
        firstNameInputRef.current?.focus()
      }, 100)
    } catch (error: any) {
      toast.error('Badge not found or not available')
      setBadgeData(null)
    } finally {
      setLoading(false)
    }
  }

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!badgeCode || !firstName || !lastName) {
      toast.error('Please fill in required fields')
      return
    }

    setAssigning(true)
    try {
      const response = await assignPreGeneratedBadge(eventId, {
        badge_code: badgeCode,
        first_name: firstName,
        last_name: lastName,
        email: email || undefined,
        phone: phone || undefined,
        company: company || undefined,
        job_title: jobTitle || undefined,
      })

      toast.success(`Badge assigned to ${firstName} ${lastName}`)
      
      // Reset form for next assignment
      setBadgeCode('')
      setFirstName('')
      setLastName('')
      setEmail('')
      setPhone('')
      setCompany('')
      setJobTitle('')
      setBadgeData(null)
      
      // Focus on badge code input for next scan
      setTimeout(() => {
        badgeCodeInputRef.current?.focus()
      }, 100)
      
      // Notify parent of success
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      toast.error('Failed to assign badge: ' + (error.response?.data?.error || error.message))
    } finally {
      setAssigning(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-border/50">
          <DialogTitle className="text-xl font-semibold flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/20 rounded-xl flex items-center justify-center border-2 border-blue-200 dark:border-blue-800">
              <QrCode className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            Assign Badge to Guest
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            Scan the badge QR code using a 2D scanner, then fill in the guest information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Badge Code Input */}
          <div>
            <Label htmlFor="badge-code" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Scan Badge QR Code
            </Label>
            <Input
              id="badge-code"
              ref={badgeCodeInputRef}
              value={badgeCode}
              onChange={handleBadgeCodeChange}
              placeholder="Scan or enter badge code"
              className="font-mono text-lg"
              disabled={loading}
              autoFocus
            />
            {loading && (
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Verifying badge...
              </div>
            )}
            {badgeData && badgeData.status === 'assigned' && (
              <div className="mt-2 text-sm text-orange-600">
                ⚠️ This badge is already assigned to another guest.
              </div>
            )}
          </div>

          {/* Guest Information */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold mb-4">Guest Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <Label htmlFor="first-name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  First Name *
                </Label>
                <Input
                  id="first-name"
                  ref={firstNameInputRef}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter first name"
                  required
                />
              </div>

              {/* Last Name */}
              <div>
                <Label htmlFor="last-name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Last Name *
                </Label>
                <Input
                  id="last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter last name"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                />
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>

              {/* Company */}
              <div>
                <Label htmlFor="company" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Company
                </Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Enter company"
                />
              </div>

              {/* Job Title */}
              <div>
                <Label htmlFor="job-title" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Job Title
                </Label>
                <Input
                  id="job-title"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Enter job title"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3 pt-6 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={assigning || !badgeCode || !firstName || !lastName}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              {assigning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Assign Badge
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

