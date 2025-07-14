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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
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
  calendar: <Calendar className="h-4 w-4" />,
  building: <Building className="h-4 w-4" />,
  users: <Users className="h-4 w-4" />,
  user: <User className="h-4 w-4" />,
  tag: <Tag className="h-4 w-4" />,
  folder: <Folder className="h-4 w-4" />,
  'user-check': <UserCheck className="h-4 w-4" />,
  'user-tag': <UserCheck2 className="h-4 w-4" />,
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
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Trash</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage deleted items and restore or permanently delete them
              </p>
            </div>
            <Button variant="destructive" size="lg">
              <Trash2 className="h-5 w-5 mr-2" />
              Empty Trash ({totalItems})
            </Button>
          </div>
        </div>

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="p-12 text-center">
              <Trash2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No deleted items
              </h3>
              <p className="text-gray-500">There are no items in the trash.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Card
                key={cat.key}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20"
                onClick={() => onSelectCategory(cat.key)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      {iconMap[cat.icon] || <Trash2 className="h-6 w-6" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {cat.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {cat.count} item{cat.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
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
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Categories
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {iconMap[categoryInfo?.icon || ''] || (
                <Trash2 className="h-5 w-5" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {categoryInfo?.title}
              </h1>
              <p className="text-sm text-gray-500">
                {categoryInfo?.count} items in this category
              </p>
            </div>
          </div>
        </div>
        <div className="w-full sm:w-auto sm:max-w-xs">
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Selection Action Bar */}
      {showActionBar && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-blue-800">
              {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
            </span>
            <Separator orientation="vertical" className="h-6 bg-blue-300" />
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="text-blue-700 hover:text-blue-900"
            >
              Clear Selection
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleBulkRestore} disabled={selectedItems.length === 0}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Restore ({selectedItems.length})
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={selectedItems.length === 0}>
                  <Trash className="h-4 w-4 mr-2" />
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
                  <AlertDialogAction onClick={handleBulkDelete}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      {/* Main Content */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="p-4">
                    <Checkbox
                      checked={
                        items.length > 0 && selectedItems.length === items.length
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Item Details
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Deleted Date
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-500">
                      No items found.
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
      <tr className={isSelected ? 'bg-blue-50' : ''}>
        <td className="p-4">
          <Checkbox checked={isSelected} onCheckedChange={onSelect} />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-gray-900">
            {getItemPrimaryText(item)}
          </div>
          <div className="text-sm text-gray-500">
            {getItemSecondaryText(item)}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {formatDistanceToNow(new Date(item.deleted_at), { addSuffix: true })}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
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
                    <AlertDialogAction onClick={handleDelete}>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Item Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {Object.entries(item).map(([key, value]) => (
              <div key={key} className="flex">
                <strong className="w-1/3 capitalize">
                  {key.replace(/_/g, ' ')}:
                </strong>
                <span className="w-2/3">
                  {typeof value === 'object' && value !== null
                    ? JSON.stringify(value, null, 2)
                    : value?.toString()}
                </span>
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
