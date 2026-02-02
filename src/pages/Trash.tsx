import React, { useState, useEffect } from 'react'
import {
  Trash2,
  RefreshCw,
  Search,
  Calendar,
  Building,
  Users,
  User,
  Tag,
  Folder,
  UserCheck,
  UserCheck2,
  ArrowLeft,
  Trash,
  Clock,
  Archive,
  MoreVertical,
  RotateCcw,
  Check
} from 'lucide-react'
import Breadcrumbs from '@/components/Breadcrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import { format, formatDistanceToNow } from 'date-fns'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'

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

// Helper for consistent date formatting
const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a')
  } catch (e) {
    return 'Invalid Date'
  }
}

// PAGE 1: Category Selection View (Theme Aware & Cleaner)
function TrashCategoryList({
  categories,
  totalItems,
  onSelectCategory,
  loading: listLoading
}: {
  categories: TrashCategory[]
  totalItems: number
  onSelectCategory: (category: string) => void
  loading: boolean
}) {
  return (
    <div className="min-h-screen w-full bg-background p-6 md:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Breadcrumbs
              items={[{ label: 'Trash', href: '/dashboard/trash' }]}
              className="mb-2"
            />
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Trash</h1>
            <p className="text-muted-foreground mt-1">Manage deleted items and recovery</p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>

            {totalItems > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Empty Trash
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Empty Trash</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to permanently delete all {totalItems} items? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Empty Trash
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Categories Grid */}
        {listLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-muted/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-border border-dashed">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Archive className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Trash is Correctly Empty</h3>
            <p className="text-muted-foreground max-w-sm text-center mt-2">
              There are no deleted items to display. Great job keeping things clean!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <div
                key={cat.key}
                onClick={() => onSelectCategory(cat.key)}
                className="group relative bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-[0.08] group-hover:opacity-[0.08] dark:group-hover:opacity-[0.12] transition-opacity">
                  {/* Background Icon Decoration */}
                  {React.cloneElement(iconMap[cat.icon] as React.ReactElement, { className: "w-24 h-24 text-foreground" })}
                </div>

                <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center text-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300">
                      {iconMap[cat.icon] || <Trash2 className="h-6 w-6" />}
                    </div>
                    <Badge variant="secondary" className="bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {cat.count}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {cat.title}
                    </h3>
                    <div className="flex items-center text-sm text-muted-foreground mt-1 group-hover:translate-x-1 transition-transform">
                      <span>View Items</span>
                      <ArrowLeft className="w-3 h-3 ml-1 rotate-180" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// PAGE 2: Category Details View (Theme Aware & Cleaner)
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

  const showActionBar = selectedItems.length > 0

  useEffect(() => {
    fetchCategoryItems()
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
      toast({ title: 'Restored', description: `Successfully restored ${selectedItems.length} items.` })
      fetchCategoryItems()
      clearSelection()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to restore items.', variant: 'destructive' })
    }
  }

  async function handleBulkDelete() {
    try {
      await api.post(`/trash/${selectedCategory}/bulk-force-delete`, { ids: selectedItems })
      toast({ title: 'Deleted', description: `Permanently deleted ${selectedItems.length} items.` })
      fetchCategoryItems()
      clearSelection()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete items.', variant: 'destructive' })
    }
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen w-full bg-background p-6 md:p-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="w-fit -ml-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Categories
            </Button>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center shadow-sm text-foreground">
                  {iconMap[categoryInfo?.icon || ''] || <Trash2 className="h-7 w-7 text-muted-foreground" />}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground tracking-tight">{categoryInfo?.title}</h1>
                  <p className="text-muted-foreground">
                    {categoryInfo?.count} items deleted
                  </p>
                </div>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search deleted items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-card border-border focus-visible:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Wrapper for Card and Bulk Actions */}
          <div className="relative">
            {/* Bulk Actions Bar - Floating Overlay */}
            <AnimatePresence>
              {showActionBar && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="fixed bottom-8 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
                >
                  <div className="bg-foreground text-background dark:bg-zinc-800 dark:text-zinc-100 p-2 pl-4 rounded-full shadow-xl flex items-center justify-between pointer-events-auto min-w-[350px] max-w-lg border border-border/10">
                    <div className="flex items-center gap-3 mr-4">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background text-foreground text-xs font-bold">
                        {selectedItems.length}
                      </span>
                      <span className="text-sm font-medium">selected</span>
                      <div className="h-4 w-px bg-current/20 mx-1" />
                      <button
                        onClick={clearSelection}
                        className="text-xs opacity-70 hover:opacity-100 transition-opacity font-medium hover:underline"
                      >
                        Clear
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBulkRestore}
                        className="hover:bg-background/20 hover:text-current h-9 rounded-full px-4"
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-2" />
                        Restore
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white h-9 rounded-full px-4 shadow-sm border-0"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Permanently?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove {selectedItems.length} items from the database. This action is irreversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete Forever
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground font-medium">
                    <tr>
                      <th className="p-4 w-14">
                        <Checkbox
                          checked={items.length > 0 && selectedItems.length === items.length}
                          onCheckedChange={handleSelectAll}
                          className="translate-y-[2px]"
                        />
                      </th>
                      <th className="py-3 px-4">Item Details</th>
                      <th className="py-3 px-4">Deleted</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="py-20 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                            <p className="text-muted-foreground mt-2 text-sm">Loading items...</p>
                          </div>
                        </td>
                      </tr>
                    ) : items.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-20 text-center">
                          <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                              <Search className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium text-foreground">No items found</h3>
                            <p className="text-muted-foreground text-sm mt-1">
                              {search ? `No matches for "${search}"` : 'This category is empty'}
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
                          onActionComplete={fetchCategoryItems}
                          icon={iconMap[categoryInfo?.icon || '']}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

function ItemRow({
  item,
  isSelected,
  onSelect,
  category,
  onActionComplete,
  icon
}: {
  item: TrashItem
  isSelected: boolean
  onSelect: () => void
  category: string
  onActionComplete: () => void
  icon: React.ReactNode
}) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const { toast } = useToast()

  const handleRestore = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await api.post(`/trash/${category}/${item.id}/restore`)
      toast({ title: 'Success', description: 'Item restored successfully.' })
      onActionComplete()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to restore item.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await api.delete(`/trash/${category}/${item.id}`)
      toast({ title: 'Success', description: 'Item permanently deleted.' })
      onActionComplete()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete item.',
        variant: 'destructive',
      })
    }
  }

  // Improved Logic for Displaying Item Text
  const getItemPrimaryText = (item: TrashItem) => {
    if (item.guest?.name) return item.guest.name
    if (item.name) return item.name
    if (item.email) return item.email
    if (item.company) return item.company
    if (item.description) return item.description
    return `Item #${item.id}`
  }

  const getItemSecondaryText = (item: TrashItem) => {
    if ((item.guest || item.email) && item.event?.name) {
      return (
        <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-700/10 dark:ring-blue-400/20">
          <Calendar className="mr-1 h-3 w-3" />
          {item.event.name}
        </span>
      )
    }

    if (item.event?.name) return `Event: ${item.event.name}`
    if (item.company) return item.company
    if (item.email) return item.email
    if (item.location) return item.location
    if (item.start_date) return `${formatDate(item.start_date)}`

    return ''
  }

  return (
    <>
      <tr
        className={cn(
          "group bg-card hover:bg-muted/50 transition-colors cursor-pointer border-b border-border last:border-0",
          isSelected && "bg-muted hover:bg-muted"
        )}
        onClick={() => setIsDetailsOpen(true)}
      >
        <td className="p-4" onClick={(e) => e.stopPropagation()}>
          <Checkbox checked={isSelected} onCheckedChange={onSelect} />
        </td>
        <td className="p-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-colors border border-border",
              isSelected ? "bg-primary/10 text-primary border-primary/20" : "bg-muted/30 text-muted-foreground"
            )}>
              {icon || <Trash2 className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex flex-col gap-1.5">
              <span className="font-semibold text-foreground truncate max-w-[200px] md:max-w-xs block">
                {getItemPrimaryText(item)}
              </span>
              <div className="text-muted-foreground flex">
                {getItemSecondaryText(item)}
              </div>
            </div>
          </div>
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {/* Uses opacity for cleaner look, plain text */}
            <span className="tabular-nums">{formatDistanceToNow(new Date(item.deleted_at), { addSuffix: true })}</span>
          </div>
        </td>
        <td className="p-4 text-right">
          {/* Always visible actions as requested */}
          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleRestore}
                  className="h-8 w-8 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-900/50 shadow-sm"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Restore Item</TooltipContent>
            </Tooltip>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900/50 shadow-sm"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Permanently?</AlertDialogTitle>
                  <AlertDialogDescription>
                    To maintain database integrity, this record will be permanently wiped. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete Forever
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </td>
      </tr>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-lg bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Item Details</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Snapshot of deleted record data
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="bg-muted/30 rounded-lg p-4 border border-border max-h-[60vh] overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-border">
              {Object.entries(item).map(([key, value]) => {
                if (['id', 'deleted_at', 'organizer_id'].includes(key)) return null;
                return (
                  <div key={key} className="grid grid-cols-3 gap-2 text-sm border-b border-border/50 last:border-0 pb-2 last:pb-0">
                    <span className="font-medium text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="col-span-2 text-foreground break-words font-medium">
                      {typeof value === 'object' && value !== null
                        ? JSON.stringify(value).replace(/[{"}]/g, '').replace(/:/g, ': ').replace(/,/g, ', ')
                        : value?.toString() || '-'}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Close</Button>
              <Button
                onClick={(e) => { handleRestore(e); setIsDetailsOpen(false); }}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Restore Item
              </Button>
            </div>
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
      loading={loading}
    />
  )
}

export default Trash
