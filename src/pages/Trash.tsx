import React, { useState, useEffect } from 'react'
import {
  Trash2,
  RotateCcw,
  Search,
  MoreHorizontal,
  Calendar,
  Building,
  Users,
  User,
  Tag,
  Folder,
  UserCheck,
  UserCheck2,
  X,
  RefreshCw,
  Trash,
  Eye,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Settings,
  Shield,
} from 'lucide-react'
import Breadcrumbs from '@/components/Breadcrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import { format, formatDistanceToNow } from 'date-fns'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface TrashItem {
  id: number
  name?: string
  email?: string
  location?: string
  start_date?: string
  end_date?: string
  phone?: string
  company?: string
  role?: string
  tin_number?: string
  description?: string
  deleted_at: string
  organizer?: { name: string; email: string }
  eventType?: { name: string }
  eventCategory?: { name: string }
  event?: { name: string }
  guest?: { name: string; email: string }
  guestType?: { name: string }
  users?: Array<{ name: string; email: string }>
}

interface TrashCategory {
  key: string
  title: string
  icon: string
  count: number
}

interface TrashData {
  categories: TrashCategory[]
  total_items: number
}

const iconMap: Record<string, React.ReactNode> = {
  calendar: <Calendar className="h-5 w-5" />,
  building: <Building className="h-5 w-5" />,
  users: <Users className="h-5 w-5" />,
  user: <User className="h-5 w-5" />,
  tag: <Tag className="h-5 w-5" />,
  folder: <Folder className="h-5 w-5" />,
  'user-check': <UserCheck className="h-5 w-5" />,
  'user-tag': <UserCheck2 className="h-5 w-5" />,
}

// PAGE 1: Category Selection View
function TrashCategoryList({
  categories,
  totalItems,
  onSelectCategory,
}: {
  categories: TrashCategory[]
  totalItems: number
  onSelectCategory: (category: string) => void
}) {
  return (
    <TooltipProvider>
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 py-8 px-2 sm:px-6 lg:px-12">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: 'Trash', href: '/dashboard/trash' }
          ]}
          className="mb-4"
        />
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Trash Management</h1>
            <p className="text-gray-600 mt-2">Recover or permanently delete items from the system</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="lg">
              <RefreshCw className="h-5 w-5 mr-2" />
              Refresh
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="lg">
                  <Trash2 className="h-5 w-5 mr-2" />
                  Empty Trash ({totalItems})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Empty Trash</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all items in the trash. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                    Empty Trash
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 text-center">
            <CardHeader>
              <CardTitle className="text-gray-700 text-lg font-semibold">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalItems}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 text-center">
            <CardHeader>
              <CardTitle className="text-gray-700 text-lg font-semibold">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{categories.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 text-center">
            <CardHeader>
              <CardTitle className="text-gray-700 text-lg font-semibold">Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {categories.find(cat => cat.key === 'events')?.count || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 text-center">
            <CardHeader>
              <CardTitle className="text-gray-700 text-lg font-semibold">Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {categories.find(cat => cat.key === 'users')?.count || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <Card className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 max-w-md mx-auto">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Trash is Empty
              </h3>
              <p className="text-gray-600">No deleted items found in the system.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Card
                key={cat.key}
                className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 cursor-pointer hover:shadow-xl transition-all duration-200 hover:border-blue-300"
                onClick={() => onSelectCategory(cat.key)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                      {iconMap[cat.icon] || <Trash2 className="h-6 w-6 text-gray-600" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {cat.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {cat.count} item{cat.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <ArrowLeft className="h-5 w-5 text-gray-400 rotate-180" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

// PAGE 2: Category Details View
function TrashCategoryDetails({
  selectedCategory,
  onBack,
}: {
  selectedCategory: string
  onBack: () => void
}) {
  const [categoryInfo, setCategoryInfo] = useState<TrashCategory | null>(null)
  const [items, setItems] = useState<TrashItem[]>([])
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Only show the action bar if we are inside a category (selectedCategory is truthy)
  const showActionBar = !!selectedCategory && selectedItems.length > 0

  useEffect(() => {
    fetchCategoryItems()
    // eslint-disable-next-line
  }, [selectedCategory, search])

  async function fetchCategoryItems() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ category: selectedCategory })
      if (search) params.append('search', search)
      const res = await api.get(`/trash?${params}`)
      setCategoryInfo(res.data.category)
      setItems(res.data.items.data || [])
      setSelectedItems([])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load items',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  function handleSelectItem(id: number) {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  function handleSelectAll() {
    if (selectedItems.length === items.length) setSelectedItems([])
    else setSelectedItems(items.map((i) => i.id))
  }

  function clearSelection() {
    setSelectedItems([])
  }

  async function handleBulkRestore() {
    try {
      await api.post(`/trash/${selectedCategory}/bulk-restore`, { ids: selectedItems })
      toast({ title: 'Success', description: `${selectedItems.length} items restored.` })
      fetchCategoryItems()
      clearSelection()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to restore items.', variant: 'destructive' })
    }
  }
  async function handleBulkDelete() {
    try {
      await api.post(`/trash/${selectedCategory}/bulk-force-delete`, { ids: selectedItems })
      toast({ title: 'Success', description: `${selectedItems.length} items permanently deleted.` })
      fetchCategoryItems()
      clearSelection()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete items.', variant: 'destructive' })
    }
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 py-8 px-2 sm:px-6 lg:px-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={onBack}
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Categories
            </Button>
            <Separator orientation="vertical" className="h-8" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                {iconMap[categoryInfo?.icon || ''] || (
                  <Trash2 className="h-6 w-6 text-gray-600" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {categoryInfo?.title}
                </h1>
                <p className="text-gray-600">
                  {categoryInfo?.count} items in this category
                </p>
              </div>
            </div>
          </div>
          <div className="w-full sm:w-80">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 py-3 rounded-lg text-base"
              />
            </div>
          </div>
        </div>

        {/* Selection Action Bar */}
        {showActionBar && (
          <Card className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-blue-200 p-4 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{selectedItems.length}</span>
                </div>
                <span className="font-semibold text-blue-800">
                  {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-blue-700 hover:text-blue-900"
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={handleBulkRestore} 
                  disabled={selectedItems.length === 0}
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Restore ({selectedItems.length})
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="lg" 
                      disabled={selectedItems.length === 0}
                    >
                      <Trash className="h-5 w-5 mr-2" />
                      Delete Permanently ({selectedItems.length})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the selected items from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        )}

        {/* Main Content */}
        <Card className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="p-6">
                      <Checkbox
                        checked={
                          items.length > 0 && selectedItems.length === items.length
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                    >
                      Item Details
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                    >
                      Deleted Date
                    </th>
                    <th scope="col" className="relative px-6 py-4">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="p-12 text-center">
                        <div className="flex justify-center items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                          <span className="ml-3 text-gray-500">Loading items...</span>
                        </div>
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-12 text-center">
                        <div className="text-center">
                          <Trash2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No items found
                          </h3>
                          <p className="text-gray-600">
                            {search ? 'Try adjusting your search criteria' : 'No items in this category'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        isSelected={selectedItems.includes(item.id)}
                        onSelect={() => handleSelectItem(item.id)}
                        category={selectedCategory}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}

function ItemRow({
  item,
  isSelected,
  onSelect,
  category,
}: {
  item: TrashItem
  isSelected: boolean
  onSelect: () => void
  category: string
}) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const { toast } = useToast()

  const handleRestore = async () => {
    try {
      await api.post(`/trash/${category}/${item.id}/restore`)
      toast({ title: 'Success', description: 'Item restored successfully.' })
      // Here you would typically refetch the list
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to restore item.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/trash/${category}/${item.id}`)
      toast({ title: 'Success', description: 'Item permanently deleted.' })
      // Here you would typically refetch the list
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete item.',
        variant: 'destructive',
      })
    }
  }

  const getItemPrimaryText = (item: TrashItem) => {
    return (
      item.name ||
      item.email ||
      item.company ||
      item.description ||
      `Item #${item.id}`
    )
  }

  const getItemSecondaryText = (item: TrashItem) => {
    if (item.email && item.name) return item.email
    if (item.location) return item.location
    if (item.start_date)
      return `${format(new Date(item.start_date), 'PP')} - ${format(
        new Date(item.end_date as string),
        'PP'
      )}`
    if (item.phone) return item.phone
    return ''
  }

  return (
    <>
      <tr className={`hover:bg-gray-50 transition ${isSelected ? 'bg-blue-50' : ''}`}>
        <td className="p-6">
          <Checkbox checked={isSelected} onCheckedChange={onSelect} />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 text-sm font-semibold">
              {getItemPrimaryText(item)?.[0] || 'I'}
            </div>
            <div>
              <div className="font-semibold text-gray-900">
                {getItemPrimaryText(item)}
              </div>
              <div className="text-sm text-gray-500">
                {getItemSecondaryText(item)}
              </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {formatDistanceToNow(new Date(item.deleted_at), { addSuffix: true })}
            </span>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsDetailsOpen(true)}>
                <Eye className="mr-2 h-4 w-4" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRestore}>
                <RefreshCw className="mr-2 h-4 w-4" /> Restore
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-red-600"
                  >
                    <Trash className="mr-2 h-4 w-4" /> Delete Permanently
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the item from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Item Details</DialogTitle>
            <DialogDescription>
              Detailed information about the deleted item
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {Object.entries(item).map(([key, value]) => (
              <div key={key} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-semibold flex-shrink-0">
                  {key[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 capitalize">
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div className="text-sm text-gray-600 break-words">
                    {typeof value === 'object' && value !== null
                      ? JSON.stringify(value, null, 2)
                      : value?.toString() || 'N/A'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Main Component
const Trash: React.FC = () => {
  const [categories, setCategories] = useState<TrashCategory[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedCategory) {
      fetchCategories()
    }
    // eslint-disable-next-line
  }, [selectedCategory])

  async function fetchCategories() {
    setLoading(true)
    try {
      const res = await api.get('/trash')
      setCategories(res.data.categories || [])
      setTotalItems(res.data.total_items || 0)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
  }

  // Render the appropriate view
  if (selectedCategory) {
    return (
      <TrashCategoryDetails
        selectedCategory={selectedCategory}
        onBack={() => setSelectedCategory(null)}
      />
    )
  }

  return (
    <TrashCategoryList
      categories={categories}
      totalItems={totalItems}
      onSelectCategory={setSelectedCategory}
    />
  )
}

export default Trash
