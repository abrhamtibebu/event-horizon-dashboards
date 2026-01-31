import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { subscriptionsApi, type SubscriptionPlan } from '@/lib/api/subscriptions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react'
import { toast as sonnerToast } from 'sonner'
import api from '@/lib/api'

export default function PlanManagement() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)

  const { data: plans = [], isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionsApi.getPlans(),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/subscription-plans', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] })
      sonnerToast.success('Plan created successfully')
      setIsDialogOpen(false)
    },
    onError: (error: any) => {
      sonnerToast.error(error.response?.data?.message || 'Failed to create plan')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      api.put(`/subscription-plans/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] })
      sonnerToast.success('Plan updated successfully')
      setIsDialogOpen(false)
      setEditingPlan(null)
    },
    onError: (error: any) => {
      sonnerToast.error(error.response?.data?.message || 'Failed to update plan')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/subscription-plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] })
      sonnerToast.success('Plan deleted successfully')
    },
    onError: (error: any) => {
      sonnerToast.error(error.response?.data?.message || 'Failed to delete plan')
    },
  })

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Plan Management</h1>
          <p className="text-muted-foreground">Create and manage subscription plans</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingPlan(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
              <DialogDescription>
                {editingPlan ? 'Update plan details' : 'Create a new subscription plan'}
              </DialogDescription>
            </DialogHeader>
            <PlanForm
              plan={editingPlan}
              onSubmit={(data) => {
                // Handle empty yearly price (convert 0 to null for auto-calculation)
                const planData = {
                  ...data,
                  price_yearly: data.price_yearly === 0 ? null : data.price_yearly,
                }
                if (editingPlan) {
                  updateMutation.mutate({ id: editingPlan.id, data: planData })
                } else {
                  createMutation.mutate(planData)
                }
              }}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner text="Loading plans..." />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plans</CardTitle>
            <CardDescription>Manage all subscription plans and their features</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Monthly Price</TableHead>
                  <TableHead>Yearly Price</TableHead>
                  <TableHead>Recurring</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-semibold">{plan.name}</TableCell>
                    <TableCell>
                      {plan.duration_days ? `${plan.duration_days} days` : 'N/A'}
                    </TableCell>
                    <TableCell>{plan.price_monthly.toLocaleString()} ETB</TableCell>
                    <TableCell>{plan.price_yearly.toLocaleString()} ETB</TableCell>
                    <TableCell>
                      {plan.is_recurring ? (
                        <Badge className="bg-green-100 text-green-800">Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {plan.is_active ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingPlan(plan)
                            setIsDialogOpen(true)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this plan?')) {
                              deleteMutation.mutate(plan.id)
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function PlanForm({
  plan,
  onSubmit,
  isLoading,
}: {
  plan: SubscriptionPlan | null
  onSubmit: (data: any) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    slug: plan?.slug || '',
    description: plan?.description || '',
    price_monthly: plan?.price_monthly || '',
    price_yearly: plan?.price_yearly || '',
    currency: plan?.currency || 'ETB',
    duration_days: plan?.duration_days || null,
    is_recurring: plan?.is_recurring || false,
    is_active: plan?.is_active ?? true,
    sort_order: plan?.sort_order || '',
    features: plan?.features || [],
    limits: plan?.limits || {},
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Convert empty strings to proper numeric values or null
    const submitData = {
      ...formData,
      price_monthly: formData.price_monthly === '' ? 0 : Number(formData.price_monthly),
      price_yearly: formData.price_yearly === '' ? null : Number(formData.price_yearly),
      sort_order: formData.sort_order === '' ? 0 : Number(formData.sort_order),
    }
    onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Plan Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price_monthly">Monthly Price (ETB) *</Label>
          <Input
            id="price_monthly"
            type="number"
            min="0"
            step="0.01"
            value={formData.price_monthly === '' ? '' : formData.price_monthly}
            onChange={(e) =>
              setFormData({ ...formData, price_monthly: e.target.value === '' ? '' : parseFloat(e.target.value) || '' })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price_yearly">Yearly Price (ETB)</Label>
          <Input
            id="price_yearly"
            type="number"
            min="0"
            step="0.01"
            value={formData.price_yearly === '' ? '' : formData.price_yearly}
            onChange={(e) =>
              setFormData({ ...formData, price_yearly: e.target.value === '' ? '' : parseFloat(e.target.value) || '' })
            }
            placeholder="Auto-calculated (Monthly × 12)"
          />
          <p className="text-xs text-muted-foreground">
            Leave empty to auto-calculate (Monthly × 12) when client requests annually
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration_days">Duration (Days)</Label>
          <Select
            value={formData.duration_days?.toString() || 'none'}
            onValueChange={(value) =>
              setFormData({ ...formData, duration_days: value === 'none' ? null : parseInt(value) })
            }
          >
            <SelectTrigger id="duration_days">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="30">30 days (1 Month)</SelectItem>
              <SelectItem value="90">90 days (3 Months)</SelectItem>
              <SelectItem value="180">180 days (6 Months)</SelectItem>
              <SelectItem value="365">365 days (1 Year)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sort_order">Sort Order</Label>
          <Input
            id="sort_order"
            type="number"
            value={formData.sort_order === '' ? '' : formData.sort_order}
            onChange={(e) =>
              setFormData({ ...formData, sort_order: e.target.value === '' ? '' : parseInt(e.target.value) || '' })
            }
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="is_recurring"
            checked={formData.is_recurring}
            onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
          />
          <Label htmlFor="is_recurring">Auto-renew (Recurring)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active">Active</Label>
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : plan ? 'Update Plan' : 'Create Plan'}
        </Button>
      </DialogFooter>
    </form>
  )
}
