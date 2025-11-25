import { useState, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import api from '@/lib/api'

interface Permission {
  permission: string
  label: string
  description?: string
}

interface PermissionsByFeature {
  [feature: string]: Permission[]
}

interface PermissionMatrixProps {
  selectedPermissions: string[]
  onPermissionsChange: (permissions: string[]) => void
  disabled?: boolean
}

const permissionLabels: Record<string, string> = {
  // Dashboard
  'dashboard.view': 'View Dashboard',
  
  // Events
  'events.view': 'View Events',
  'events.create': 'Create Events',
  'events.edit': 'Edit Events',
  'events.delete': 'Delete Events',
  'events.publish': 'Publish Events',
  
  // Tickets
  'tickets.view': 'View Tickets',
  'tickets.manage': 'Manage Tickets',
  'tickets.validate': 'Validate Tickets',
  'tickets.export': 'Export Tickets',
  
  // Guests & Attendees
  'guests.view': 'View Guests',
  'guests.manage': 'Manage Guests',
  'guests.checkin': 'Check-in Guests',
  'guests.export': 'Export Guests',
  
  // Ushers
  'ushers.view': 'View Ushers',
  'ushers.manage': 'Manage Ushers',
  'ushers.assign': 'Assign Ushers',
  
  // Vendors - Discovery
  'vendors.view': 'View Vendors',
  'vendors.manage': 'Manage Vendors',
  'vendors.create': 'Create Vendors',
  'vendors.edit': 'Edit Vendors',
  'vendors.delete': 'Delete Vendors',
  'vendors.discovery': 'Vendor Discovery',
  'vendors.onboard': 'Onboard Vendors',
  'vendors.lookup': 'Lookup Vendors',
  
  // Vendors - Requirements & RFQ
  'vendors.requirements': 'Manage Requirements',
  'vendors.rfq.create': 'Create RFQs',
  'vendors.rfq.send': 'Send RFQs',
  'vendors.rfq.invite': 'Invite Vendors to RFQ',
  'vendors.rfq.view': 'View RFQs',
  
  // Vendors - Quotations & Evaluation
  'vendors.quotations.view': 'View Quotations',
  'vendors.quotations.manage': 'Manage Quotations',
  'vendors.quotations.approve': 'Approve Quotations',
  'vendors.quotations.compare': 'Compare Quotations',
  
  // Vendors - Contracts
  'vendors.contracts.view': 'View Contracts',
  'vendors.contracts.create': 'Create Contracts',
  'vendors.contracts.edit': 'Edit Contracts',
  'vendors.contracts.manage': 'Manage Contracts',
  'vendors.contracts.milestones': 'Manage Payment Milestones',
  'vendors.contracts.po': 'Manage Purchase Orders',
  
  // Vendors - Deliverables & Execution
  'vendors.deliverables.view': 'View Deliverables',
  'vendors.deliverables.manage': 'Manage Deliverables',
  'vendors.deliverables.track': 'Track Deliverables',
  
  // Vendors - Payments & Settlement
  'vendors.payments.view': 'View Payments',
  'vendors.payments.manage': 'Manage Payments',
  'vendors.payments.process': 'Process Payments',
  
  // Vendors - Reviews & Ratings
  'vendors.reviews.view': 'View Reviews',
  'vendors.reviews.create': 'Create Reviews',
  'vendors.reviews.manage': 'Manage Reviews',
  'vendors.ratings.view': 'View Ratings',
  'vendors.ratings.create': 'Create Ratings',
  
  // Tasks
  'tasks.view': 'View Tasks',
  'tasks.manage': 'Manage Tasks',
  'tasks.create': 'Create Tasks',
  'tasks.edit': 'Edit Tasks',
  'tasks.delete': 'Delete Tasks',
  
  // Badges
  'badges.view': 'View Badges',
  'badges.design': 'Design Badges',
  'badges.locate': 'Locate Badges',
  'badges.manage': 'Manage Badges',
  
  // Reports & Analytics
  'reports.view': 'View Reports',
  'reports.analytics': 'View Analytics',
  'reports.export': 'Export Reports',
  
  // Messages
  'messages.view': 'View Messages',
  'messages.send': 'Send Messages',
  'messages.manage': 'Manage Messages',
  
  // Marketing
  'marketing.manage': 'Manage Marketing',
  'marketing.campaigns': 'Manage Campaigns',
  'marketing.templates': 'Manage Templates',
  'marketing.segments': 'Manage Segments',
  
  // Subscription
  'subscription.view': 'View Subscription',
  'subscription.manage': 'Manage Subscription',
  
  // Team Management
  'team.view': 'View Team',
  'team.manage': 'Manage Team',
  'team.invite': 'Invite Team Members',
  'team.roles': 'Manage Roles',
}

export function PermissionMatrix({
  selectedPermissions,
  onPermissionsChange,
  disabled = false,
}: PermissionMatrixProps) {
  const [permissionsByFeature, setPermissionsByFeature] = useState<PermissionsByFeature>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await api.get('/permissions')
        const data = response.data.permissions_by_feature || {}
        setPermissionsByFeature(data)
      } catch (error) {
        console.error('Failed to fetch permissions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [])

  const handlePermissionToggle = (permission: string) => {
    if (disabled) return

    const newPermissions = selectedPermissions.includes(permission)
      ? selectedPermissions.filter((p) => p !== permission)
      : [...selectedPermissions, permission]

    onPermissionsChange(newPermissions)
  }

  const handleFeatureToggle = (featurePermissions: string[]) => {
    if (disabled) return

    const allSelected = featurePermissions.every((p) => selectedPermissions.includes(p))

    if (allSelected) {
      // Deselect all permissions in this feature
      onPermissionsChange(
        selectedPermissions.filter((p) => !featurePermissions.includes(p))
      )
    } else {
      // Select all permissions in this feature
      const newPermissions = [...selectedPermissions]
      featurePermissions.forEach((p) => {
        if (!newPermissions.includes(p)) {
          newPermissions.push(p)
        }
      })
      onPermissionsChange(newPermissions)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading permissions...</div>
  }

  return (
    <ScrollArea className="h-[600px] [&_[data-radix-scroll-area-scrollbar]]:hidden">
      <div className="space-y-6 pr-4">
        {Object.entries(permissionsByFeature).map(([feature, permissions]) => {
          const featurePermissions = permissions.map((p) => p.permission || p)
          const allSelected = featurePermissions.every((p) => selectedPermissions.includes(p))
          const someSelected = featurePermissions.some((p) => selectedPermissions.includes(p))

          return (
            <Card key={feature}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{feature}</CardTitle>
                  <Checkbox
                    checked={allSelected}
                    ref={(el) => {
                      if (el) {
                        el.indeterminate = someSelected && !allSelected
                      }
                    }}
                    onCheckedChange={() => handleFeatureToggle(featurePermissions)}
                    disabled={disabled}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {featurePermissions.map((permission) => (
                    <div key={permission} className="flex items-start space-x-3">
                      <Checkbox
                        id={permission}
                        checked={selectedPermissions.includes(permission)}
                        onCheckedChange={() => handlePermissionToggle(permission)}
                        disabled={disabled}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={permission}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {permissionLabels[permission] || permission}
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </ScrollArea>
  )
}

