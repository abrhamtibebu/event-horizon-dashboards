import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  User,
  Mail,
  Phone,
  ArrowLeft,
  Plus,
  Star,
  StarOff,
  Trash2,
  Edit,
  Crown,
} from 'lucide-react'
import Breadcrumbs from '@/components/Breadcrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import api from '@/lib/api'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'

interface Contact {
  id: number
  name: string
  email: string
  phone_number?: string
  role: string
  is_primary_contact: boolean
  created_at: string
  last_login?: string
}

interface AvailableUser {
  id: number
  name: string
  email: string
  role: string
}

export default function OrganizerContacts() {
  const { organizerId } = useParams<{ organizerId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>('')

  useEffect(() => {
    fetchContacts()
    fetchAvailableUsers()
  }, [organizerId])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/organizers/${organizerId}/contacts`)
      setContacts(response.data)
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
      toast.error('Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableUsers = async () => {
    try {
      // Get all users that could be assigned as contacts
      const response = await api.get('/users')
      // Filter out users who are already contacts of this organizer
      const existingContactIds = contacts.map(c => c.id)
      const available = response.data.filter((u: any) => !existingContactIds.includes(u.id))
      setAvailableUsers(available)
    } catch (error) {
      console.error('Failed to fetch available users:', error)
    }
  }

  const handleAssignContact = async () => {
    if (!selectedUserId) return

    try {
      setAssigning(true)
      await api.post(`/organizers/${organizerId}/contacts`, {
        user_id: parseInt(selectedUserId)
      })

      toast.success('Contact assigned successfully!')
      setIsAddDialogOpen(false)
      setSelectedUserId('')
      await fetchContacts()
      await fetchAvailableUsers()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign contact')
    } finally {
      setAssigning(false)
    }
  }

  const handleSetPrimaryContact = async (contactId: number) => {
    try {
      await api.post(`/organizers/${organizerId}/contacts/${contactId}/primary`)
      toast.success('Primary contact updated!')
      await fetchContacts()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update primary contact')
    }
  }

  const handleRemoveContact = async (contactId: number, contactName: string) => {
    if (!confirm(`Are you sure you want to remove ${contactName} from this organizer?`)) {
      return
    }

    try {
      await api.delete(`/organizers/${organizerId}/contacts/${contactId}`)
      toast.success('Contact removed successfully!')
      await fetchContacts()
      await fetchAvailableUsers()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove contact')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent p-6">
        <div className="flex items-center justify-center h-96">
          <Spinner size="lg" text="Loading contacts..." />
        </div>
      </div>
    )
  }

  const primaryContacts = contacts.filter(c => c.is_primary_contact)
  const regularContacts = contacts.filter(c => !c.is_primary_contact)

  return (
    <div className="min-h-screen bg-transparent p-6 space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Organizers', href: '/dashboard/organizers' },
          { label: 'Manage Contacts' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <User className="w-5 h-5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary/80">Contact Management</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">Organizer Contacts</h1>
          <p className="text-muted-foreground mt-1">Manage contact persons and access permissions for this organizer.</p>
        </div>

        <div className="flex items-center gap-3">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card/95 backdrop-blur-xl border-white/10">
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
                <DialogDescription>
                  Assign a user as a contact person for this organizer.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user">Select User</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user to assign" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name} ({user.email}) - {user.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    disabled={assigning}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAssignContact}
                    disabled={!selectedUserId || assigning}
                  >
                    {assigning ? 'Assigning...' : 'Assign Contact'}
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

      {/* Primary Contacts */}
      {primaryContacts.length > 0 && (
        <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Primary Contacts
            </CardTitle>
            <CardDescription>
              Main contact persons with elevated permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {primaryContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="p-4 rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-yellow-500/20 text-yellow-600">
                        {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{contact.name}</h4>
                      <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                        Primary Contact
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      {contact.email}
                    </div>
                    {contact.phone_number && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        {contact.phone_number}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetPrimaryContact(contact.id)}
                      disabled
                      className="flex-1"
                    >
                      <Star className="w-4 h-4 mr-1" />
                      Primary
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveContact(contact.id, contact.name)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Contacts Table */}
      <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl">
        <CardHeader>
          <CardTitle>All Contacts</CardTitle>
          <CardDescription>
            Complete list of contact persons and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-white/5 overflow-hidden">
            <Table>
              <TableHeader className="bg-background/40">
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Contact</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Role</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Contact Info</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Status</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No contacts assigned to this organizer yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  contacts.map((contact) => (
                    <TableRow key={contact.id} className="group border-white/5 bg-background/10 hover:bg-background/20 transition-colors">
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src="" />
                            <AvatarFallback className="bg-primary/20 text-primary text-xs">
                              {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm">{contact.name}</p>
                            <p className="text-xs text-muted-foreground">ID: #{contact.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="secondary" className="text-xs">
                          {contact.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            {contact.email}
                          </div>
                          {contact.phone_number && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              {contact.phone_number}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {contact.is_primary_contact ? (
                          <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                            <Crown className="w-3 h-3 mr-1" />
                            Primary
                          </Badge>
                        ) : (
                          <Badge variant="outline">Regular</Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!contact.is_primary_contact && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetPrimaryContact(contact.id)}
                              className="h-8 w-8 p-0 hover:bg-yellow-500/10"
                              title="Set as Primary Contact"
                            >
                              <Star className="w-4 h-4 text-yellow-500" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveContact(contact.id, contact.name)}
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            title="Remove Contact"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
