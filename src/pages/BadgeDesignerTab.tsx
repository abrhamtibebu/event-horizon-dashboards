import React, { useEffect, useState } from 'react'
import { BadgeTemplate } from '../types/badge'
import * as badgeApi from '../lib/badgeTemplates'
import {
  Stage,
  Layer,
  Rect,
  Text,
  Image as KonvaImage,
  Transformer,
} from 'react-konva'
import { v4 as uuidv4 } from 'uuid'
import useImage from 'use-image'
import {
  Info,
  Type,
  Square,
  User,
  Mail,
  QrCode,
  Image as ImageIcon,
  Trash2,
  Save,
  UploadCloud,
  Eye,
  Phone,
  Building,
  Briefcase,
  Globe,
  Tag,
  CheckCircle,
  Clock,
  MapPin,
  UserCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import * as QRCodeReact from 'qrcode.react'
import QRCode from 'qrcode'
import { useAuth } from '../hooks/use-auth'
import * as api from '../lib/api'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog'

interface CanvasElement {
  id: string
  type: 'text' | 'rect' | 'image' | 'qr'
  x: number
  y: number
  width?: number
  height?: number
  text?: string
  fontSize?: number
  fill?: string
  src?: string
  value?: string
  qrContentType?: 'text' | 'vcard' | 'custom' | 'json'
  qrFields?: {
    name?: string
    email?: string
    phone?: string
    company?: string
    title?: string
    address?: string
    website?: string
    [key: string]: string | undefined
  }
  qrCustomTemplate?: string
  qrJsonTemplate?: string
}

interface BadgeDesignerTabProps {
  eventId: number
}

const initialElements: CanvasElement[] = [
  {
    id: 'rect1',
    type: 'rect',
    x: 50,
    y: 100,
    width: 120,
    height: 60,
    fill: '#4F46E5',
  },
  {
    id: 'text1',
    type: 'text',
    x: 80,
    y: 200,
    text: 'John Doe',
    fontSize: 24,
    fill: '#222',
  },
]

// Custom hook to generate QR code data URL and load as image
function useQrImage(value: string, size: number) {
  const [url, setUrl] = React.useState<string | null>(null)
  React.useEffect(() => {
    QRCode.toDataURL(value || '', { width: size, margin: 0 }, (err, url) => {
      if (!err && url) setUrl(url)
    })
  }, [value, size])
  return useImage(url || undefined)
}

// Child component for QR code image in Konva
const QrCodeImage: React.FC<{
  el: CanvasElement
  isSelected: boolean
  onSelect: () => void
  onDrag: (id: string, x: number, y: number) => void
  onTransformEnd: (id: string, node: any) => void
}> = ({ el, isSelected, onSelect, onDrag, onTransformEnd }) => {
  const [qrImg] = useQrImage(
    el.value || '',
    Math.max(el.width || 80, el.height || 80)
  )
  return (
    <KonvaImage
      key={el.id}
      id={el.id}
      x={el.x}
      y={el.y}
      width={el.width}
      height={el.height}
      image={qrImg}
      draggable
      onDragEnd={(e) => onDrag(el.id, e.target.x(), e.target.y())}
      onClick={onSelect}
      stroke={isSelected ? '#6366F1' : undefined}
      strokeWidth={isSelected ? 2 : 0}
      onTransformEnd={(e) => onTransformEnd(el.id, e.target)}
    />
  )
}

// Child component for background image
const BackgroundImage: React.FC<{
  src: string
  width?: number
  height?: number
}> = ({ src, width = 400, height = 600 }) => {
  const [image] = useImage(src)
  return (
    <KonvaImage
      x={0}
      y={0}
      width={width}
      height={height}
      image={image}
      listening={false}
      perfectDrawEnabled={false}
    />
  )
}

// Child component for regular images
const CanvasImage: React.FC<{
  el: CanvasElement
  isSelected: boolean
  onSelect: () => void
  onDrag: (id: string, x: number, y: number) => void
  onTransformEnd: (id: string, node: any) => void
}> = ({ el, isSelected, onSelect, onDrag, onTransformEnd }) => {
  const [image] = useImage(el.src || '')
  return (
    <KonvaImage
      x={el.x}
      y={el.y}
      width={el.width}
      height={el.height}
      image={image}
      draggable
      id={el.id}
      onDragEnd={(e) => onDrag(el.id, e.target.x(), e.target.y())}
      onClick={onSelect}
      stroke={isSelected ? '#F59E42' : undefined}
      strokeWidth={isSelected ? 2 : 0}
      onTransformEnd={(e) => onTransformEnd(el.id, e.target)}
    />
  )
}

// Static preview component for a badge side
const BadgeSidePreview: React.FC<{
  elements: CanvasElement[]
  background: string | null
}> = ({ elements, background }) => {
  const DESIGN_WIDTH = 400
  const DESIGN_HEIGHT = 600
  const PREVIEW_WIDTH = 200
  const PREVIEW_HEIGHT = 300
  const scale = PREVIEW_WIDTH / DESIGN_WIDTH
  return (
    <div
      className="shadow rounded-xl bg-white"
      style={{
        width: PREVIEW_WIDTH,
        height: PREVIEW_HEIGHT,
        overflow: 'hidden',
      }}
    >
      <Stage width={PREVIEW_WIDTH} height={PREVIEW_HEIGHT}>
        <Layer>
          {background && (
            <BackgroundImage
              src={background}
              width={PREVIEW_WIDTH}
              height={PREVIEW_HEIGHT}
            />
          )}
          {elements.map((el) => {
            if (el.type === 'rect') {
              return (
                <Rect
                  key={el.id}
                  x={el.x * scale}
                  y={el.y * scale}
                  width={(el.width || 0) * scale}
                  height={(el.height || 0) * scale}
                  fill={el.fill}
                />
              )
            } else if (el.type === 'text') {
              return (
                <Text
                  key={el.id}
                  x={el.x * scale}
                  y={el.y * scale}
                  text={el.text}
                  fontSize={(el.fontSize || 20) * scale}
                  fill={el.fill}
                  width={el.width ? el.width * scale : undefined}
                  height={el.height ? el.height * scale : undefined}
                />
              )
            } else if (el.type === 'image' && el.src) {
              return (
                <CanvasImage
                  key={el.id}
                  el={{
                    ...el,
                    x: el.x * scale,
                    y: el.y * scale,
                    width: (el.width || 0) * scale,
                    height: (el.height || 0) * scale,
                  }}
                  isSelected={false}
                  onSelect={() => {}}
                  onDrag={() => {}}
                  onTransformEnd={() => {}}
                />
              )
            } else if (el.type === 'qr') {
              return (
                <QrCodeImage
                  key={el.id}
                  el={{
                    ...el,
                    x: el.x * scale,
                    y: el.y * scale,
                    width: (el.width || 0) * scale,
                    height: (el.height || 0) * scale,
                  }}
                  isSelected={false}
                  onSelect={() => {}}
                  onDrag={() => {}}
                  onTransformEnd={() => {}}
                />
              )
            }
            return null
          })}
        </Layer>
      </Stage>
    </div>
  )
}

const BadgeDesignerTab: React.FC<BadgeDesignerTabProps> = ({
  eventId: initialEventId,
}) => {
  const { user } = useAuth()
  const [organizers, setOrganizers] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [selectedOrganizer, setSelectedOrganizer] = useState<number | null>(
    null
  )
  const [selectedEvent, setSelectedEvent] = useState<number | null>(
    initialEventId || null
  )
  const [loadingOrganizers, setLoadingOrganizers] = useState(false)
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [drafts, setDrafts] = useState<BadgeTemplate[]>([])
  const [official, setOfficial] = useState<BadgeTemplate | null>(null)
  const [currentDraft, setCurrentDraft] = useState<BadgeTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front')
  const [elementsFront, setElementsFront] =
    useState<CanvasElement[]>(initialElements)
  const [elementsBack, setElementsBack] = useState<CanvasElement[]>([])
  const [backgroundFront, setBackgroundFront] = useState<string | null>(null)
  const [backgroundBack, setBackgroundBack] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const stageRef = React.useRef<any>(null)
  const trRef = React.useRef<any>(null)
  const [zoom, setZoom] = useState(1)
  const ZOOM_MIN = 0.5
  const ZOOM_MAX = 2
  const ZOOM_STEP = 0.1
  const [showGrid, setShowGrid] = useState(true)
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [draftToDelete, setDraftToDelete] = useState<null | number>(null)

  // Fetch organizers if admin
  useEffect(() => {
    if (user?.role === 'admin') {
      setLoadingOrganizers(true)
      console.log('Fetching organizers for admin...')
      api
        .getAllOrganizers()
        .then((res) => {
          console.log('Organizers fetched:', res.data)
          setOrganizers(res.data)
        })
        .catch((err) => {
          console.error('Error fetching organizers:', err)
        })
        .finally(() => setLoadingOrganizers(false))
    }
  }, [user])

  // Fetch events for selected organizer (admin) or own events (organizer)
  useEffect(() => {
    if (user?.role === 'admin' && selectedOrganizer) {
      setLoadingEvents(true)
      console.log('Fetching events for organizer:', selectedOrganizer)
      api
        .getEventsForOrganizer(selectedOrganizer)
        .then((res) => {
          console.log('Events fetched for organizer:', res.data)
          setEvents(res.data)
        })
        .catch((err) => {
          console.error('Error fetching events for organizer:', err)
        })
        .finally(() => setLoadingEvents(false))
    } else if (user?.role === 'organizer') {
      setLoadingEvents(true)
      console.log('Fetching events for organizer user...')
      api
        .getMyEvents()
        .then((res) => {
          console.log('Events fetched for organizer user:', res.data)
          setEvents(res.data)
        })
        .catch((err) => {
          console.error('Error fetching events for organizer user:', err)
        })
        .finally(() => setLoadingEvents(false))
    }
  }, [user, selectedOrganizer])

  // Reset selected event if organizer changes
  useEffect(() => {
    setSelectedEvent(null)
  }, [selectedOrganizer])

  // Load drafts and official template on mount or when selectedEvent changes
  useEffect(() => {
    if (!selectedEvent || selectedEvent === 0) {
      setDrafts([])
      setOfficial(null)
      setCurrentDraft(null)
      setElementsFront(initialElements)
      setBackgroundFront(null)
      setElementsBack([])
      setBackgroundBack(null)
      return
    }
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [draftsRes, officialRes] = await Promise.all([
          badgeApi.getBadgeTemplateDrafts(selectedEvent),
          badgeApi.getOfficialBadgeTemplate(selectedEvent).catch(() => null),
        ])
        setDrafts(draftsRes.data)
        setOfficial(officialRes?.data || null)
        setCurrentDraft(draftsRes.data[0] || null)
        // Load elements/backgrounds from template_json if available
        const template = draftsRes.data[0]?.template_json
        if (template) {
          setElementsFront(template.front?.elements || initialElements)
          setBackgroundFront(template.front?.background || null)
          setElementsBack(template.back?.elements || [])
          setBackgroundBack(template.back?.background || null)
        }
      } catch (err) {
        setError('Failed to load badge templates')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedEvent])

  // When selectedEvent changes, if no current draft, create and save a new draft for that event
  useEffect(() => {
    if (selectedEvent && !currentDraft) {
      // Create a new draft for the selected event
      const createDraft = async () => {
        try {
          const res = await badgeApi.createBadgeTemplate(selectedEvent, {
            name: 'New Badge Draft',
            template_json: {
              front: { elements: initialElements, background: null },
              back: { elements: [], background: null },
            },
            status: 'draft',
          })
          setCurrentDraft(res.data)
          setDrafts((prev) => [res.data, ...prev])
        } catch (err) {
          toast.error('Failed to create draft for selected event')
        }
      }
      createDraft()
    }
  }, [selectedEvent, currentDraft])

  // Attach transformer to selected node
  React.useEffect(() => {
    if (trRef.current && selectedId && stageRef.current) {
      const selectedNode = stageRef.current.findOne(`#${selectedId}`)
      if (selectedNode) {
        trRef.current.nodes([selectedNode])
        trRef.current.getLayer().batchDraw()
      }
    }
  }, [selectedId, elementsFront])

  // Helper hooks to get/set elements/background for the active side
  const elements = activeSide === 'front' ? elementsFront : elementsBack
  const setElements =
    activeSide === 'front' ? setElementsFront : setElementsBack
  const backgroundImage =
    activeSide === 'front' ? backgroundFront : backgroundBack
  const setBackgroundImage =
    activeSide === 'front' ? setBackgroundFront : setBackgroundBack

  // Handle transform end (resize)
  const handleTransformEnd = (id: string, node: any) => {
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    const width = Math.max(10, node.width() * scaleX)
    const height = Math.max(10, node.height() * scaleY)
    setElements((prev) =>
      prev.map((el) =>
        el.id === id
          ? {
              ...el,
              width: width,
              height: height,
            }
          : el
      )
    )
    node.scaleX(1)
    node.scaleY(1)
  }

  // Save draft handler
  const handleSaveDraft = async () => {
    if (!currentDraft) return
    setSaving(true)
    setError(null)
    try {
      const res = await badgeApi.updateBadgeTemplate(
        selectedEvent || 0,
        currentDraft.id,
        {
          ...currentDraft,
          template_json: {
            front: { elements: elementsFront, background: backgroundFront },
            back: { elements: elementsBack, background: backgroundBack },
          },
        }
      )
      setCurrentDraft(res.data)
      setDrafts((prev) =>
        prev.map((d) => (d.id === res.data.id ? res.data : d))
      )
      toast.success('Draft saved successfully')
    } catch (err: any) {
      setError('Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  // Publish handler
  const handlePublish = async () => {
    setShowPublishConfirm(false)
    setPublishing(true)
    setError(null)
    try {
      const res = await badgeApi.publishBadgeTemplate(
        selectedEvent || 0,
        currentDraft.id
      )
      setOfficial(res.data)
      setDrafts((prev) => prev.filter((d) => d.id !== res.data.id))
      toast.success('Draft published as official!')
    } catch (err: any) {
      setError('Failed to publish draft')
      toast.error('Failed to publish draft')
    } finally {
      setPublishing(false)
    }
  }

  // Canvas element drag handler
  const handleDrag = (id: string, x: number, y: number) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, x, y } : el))
    )
  }

  // Select element
  const handleSelect = (id: string) => {
    setSelectedId(id)
  }

  // Update selected element property
  const handlePropertyChange = (prop: keyof CanvasElement, value: any) => {
    if (!selectedId) return
    setElements((prev) =>
      prev.map((el) => (el.id === selectedId ? { ...el, [prop]: value } : el))
    )
  }

  // Toolbox add handlers
  const addText = () => {
    setElements((prev) => [
      ...prev,
      {
        id: uuidv4(),
        type: 'text',
        x: 60,
        y: 60,
        text: 'Sample Text',
        fontSize: 20,
        fill: '#222',
      },
    ])
  }
  const addRect = () => {
    setElements((prev) => [
      ...prev,
      {
        id: uuidv4(),
        type: 'rect',
        x: 80,
        y: 120,
        width: 100,
        height: 40,
        fill: '#10B981',
      },
    ])
  }
  const addAttendeeField = (field: string) => {
    setElements((prev) => [
      ...prev,
      {
        id: uuidv4(),
        type: 'text',
        x: 100,
        y: 200,
        text: `{{${field}}}`,
        fontSize: 18,
        fill: '#1D4ED8',
      },
    ])
  }
  const addQRCode = () => {
    setElements((prev) => [
      ...prev,
      {
        id: uuidv4(),
        type: 'qr',
        x: 150,
        y: 300,
        width: 80,
        height: 80,
        value: 'https://example.com',
      },
    ])
  }

  // Image upload handler
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const backgroundInputRef = React.useRef<HTMLInputElement>(null)
  const addImage = () => {
    fileInputRef.current?.click()
  }
  const addBackground = () => {
    backgroundInputRef.current?.click()
  }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setElements((prev) => [
        ...prev,
        {
          id: uuidv4(),
          type: 'image',
          x: 120,
          y: 120,
          width: 100,
          height: 100,
          src: ev.target?.result as string,
        },
      ])
    }
    reader.readAsDataURL(file)
    // Reset input value so the same file can be uploaded again if needed
    e.target.value = ''
  }
  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setBackgroundImage(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Delete selected element
  const handleDelete = () => {
    if (!selectedId) return
    setElements((prev) => prev.filter((el) => el.id !== selectedId))
    setSelectedId(null)
    toast.success('Element deleted')
  }

  // Keyboard delete support
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        handleDelete()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedId])

  const selectedElement = elements.find((el) => el.id === selectedId)

  // Sample data for preview
  const samplePerson = {
    name: 'Jane Doe',
    email: 'jane.doe@email.com',
    phone: '+1234567890',
    company: 'Validity Inc.',
    title: 'Event Manager',
    address: '123 Main St, City',
    website: 'https://validity.com',
    jobtitle: 'Developer',
    gender: 'Female',
    country: 'Wonderland',
    guest_type: 'VIP',
    checked_in: 'true',
    check_in_time: '2024-07-01T09:00:00Z',
    profile_image_url: 'https://example.com/photo.jpg',
  }
  const availablePlaceholders = Object.keys(samplePerson)
  function resolveTemplate(template: string, data: Record<string, string>) {
    return template.replace(/{{(\w+)}}/g, (_, key) => data[key] || '')
  }
  function vCardTemplate(fields: Record<string, string>) {
    return `BEGIN:VCARD\nVERSION:3.0\nFN:${fields.name || ''}\nTITLE:${
      fields.title || ''
    }\nEMAIL:${fields.email || ''}\nTEL:${fields.phone || ''}\nORG:${
      fields.company || ''
    }\nADR:${fields.address || ''}\nURL:${fields.website || ''}\nEND:VCARD`
  }
  function jsonTemplate(fields: Record<string, string>) {
    return JSON.stringify(fields, null, 2)
  }

  const handleDeleteDraft = async () => {
    if (!draftToDelete) return
    if (!selectedEvent || selectedEvent === 0) {
      toast.error(
        'No event selected. Please select an event before deleting a draft.'
      )
      setShowDeleteConfirm(false)
      setDraftToDelete(null)
      return
    }
    try {
      await badgeApi.deleteBadgeTemplate(selectedEvent, draftToDelete)
      // Refetch drafts from backend to ensure state is up to date
      const draftsRes = await badgeApi.getBadgeTemplateDrafts(selectedEvent)
      setDrafts(draftsRes.data)
      // Set currentDraft to the first available draft, or null if none
      if (draftsRes.data.length > 0) {
        setCurrentDraft(draftsRes.data[0])
        // Load elements/backgrounds from template_json if available
        const template = draftsRes.data[0]?.template_json
        setElementsFront(template?.front?.elements || initialElements)
        setBackgroundFront(template?.front?.background || null)
        setElementsBack(template?.back?.elements || [])
        setBackgroundBack(template?.back?.background || null)
      } else {
        setCurrentDraft(null)
        setElementsFront(initialElements)
        setBackgroundFront(null)
        setElementsBack([])
        setBackgroundBack(null)
      }
      toast.success('Draft deleted')
    } catch (err) {
      toast.error('Failed to delete draft')
    } finally {
      setShowDeleteConfirm(false)
      setDraftToDelete(null)
    }
  }

  // UI for event mapping
  return (
    <div className="flex flex-col h-full w-full bg-slate-50">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-8 py-4 border-b bg-white shadow-sm">
        <div className="flex items-center gap-4">
          <Eye className="w-6 h-6 text-blue-600" />
          <div className="font-bold text-2xl tracking-tight">
            Badge Designer
          </div>
          {user?.role === 'admin' && (
            <span className="ml-4 text-gray-500 text-sm">
              Organizer:{' '}
              {organizers.find((o) => o.id === selectedOrganizer)?.name || '—'}
              {selectedOrganizer ? ' | ' : ''}
              Event: {events.find((e) => e.id === selectedEvent)?.name || '—'}
            </span>
          )}
          {user?.role === 'organizer' && (
            <span className="ml-4 text-gray-500 text-sm">
              Event: {events.find((e) => e.id === selectedEvent)?.name || '—'}
            </span>
          )}
        </div>
        <span
          className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
            official
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {official ? 'Official' : 'Draft'}
        </span>
        <div className="ml-8 flex gap-2">
          <button
            className={`px-3 py-1 rounded-t ${
              activeSide === 'front'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setActiveSide('front')}
          >
            Front
          </button>
          <button
            className={`px-3 py-1 rounded-t ${
              activeSide === 'back'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setActiveSide('back')}
          >
            Back
          </button>
        </div>
        <div className="flex gap-2">
          <button
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 disabled:opacity-50"
            onClick={handleSaveDraft}
            disabled={saving || !currentDraft || !selectedEvent}
            title="Save Draft"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 disabled:opacity-50"
            onClick={() => setShowPublishConfirm(true)}
            disabled={publishing || !currentDraft}
            title="Publish as Official"
          >
            <UploadCloud className="w-4 h-4" />{' '}
            {publishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>
      {/* Event Mapping UI - now beside Save/Publish buttons */}
      <div className="flex items-center gap-4 px-8 py-2 bg-white border-b border-gray-100">
        {user?.role === 'admin' && (
          <>
            <div>
              <label className="block text-xs font-medium mb-0.5">
                Organizer
              </label>
              <select
                className="border rounded px-2 py-1 min-w-[140px]"
                value={selectedOrganizer ?? ''}
                onChange={(e) =>
                  setSelectedOrganizer(Number(e.target.value) || null)
                }
                disabled={loadingOrganizers}
              >
                <option value="">Select Organizer</option>
                {organizers.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-0.5">Event</label>
              <select
                className="border rounded px-2 py-1 min-w-[140px]"
                value={selectedEvent ?? ''}
                onChange={(e) =>
                  setSelectedEvent(Number(e.target.value) || null)
                }
                disabled={!selectedOrganizer || loadingEvents}
              >
                <option value="">Select Event</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} ({ev.status})
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
        {user?.role === 'organizer' && (
          <div>
            <label className="block text-xs font-medium mb-0.5">Event</label>
            <select
              className="border rounded px-2 py-1 min-w-[140px]"
              value={selectedEvent ?? ''}
              onChange={(e) => setSelectedEvent(Number(e.target.value) || null)}
              disabled={loadingEvents}
            >
              <option value="">Select Event</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} ({ev.status})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {/* Drafts Dropdown */}
      {drafts.length > 1 && (
        <div className="flex items-center gap-2 px-8 py-2 bg-white border-b border-gray-100">
          <label className="block text-xs font-medium mb-0.5">Drafts</label>
          <select
            className="border rounded px-2 py-1 min-w-[180px]"
            value={currentDraft?.id || ''}
            onChange={(e) => {
              const draft = drafts.find((d) => d.id === Number(e.target.value))
              if (draft) {
                setCurrentDraft(draft)
                // Load elements/backgrounds from template_json
                const template = draft.template_json
                setElementsFront(template?.front?.elements || initialElements)
                setBackgroundFront(template?.front?.background || null)
                setElementsBack(template?.back?.elements || [])
                setBackgroundBack(template?.back?.background || null)
              }
            }}
          >
            {drafts.map((draft) => (
              <option key={draft.id} value={draft.id}>
                {draft.name} (
                {draft.created_at
                  ? new Date(draft.created_at).toLocaleString()
                  : 'No date'}
                )
              </option>
            ))}
          </select>
          {/* Delete button for current draft */}
          {currentDraft && (
            <button
              className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
              onClick={() => {
                setDraftToDelete(currentDraft.id)
                setShowDeleteConfirm(true)
              }}
              title="Delete this draft"
              disabled={drafts.length <= 1}
            >
              Delete
            </button>
          )}
        </div>
      )}
      {/* Main Layout */}
      <div className="flex flex-1 min-h-0 gap-6 p-6 items-start">
        {/* Sidebar/Toolbox */}
        <div className="w-60 bg-white rounded-xl shadow p-4 flex flex-col gap-4">
          <div className="font-semibold mb-2 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500" /> Toolbox
          </div>
          <div className="flex flex-col gap-2">
            <button
              className="flex items-center gap-2 px-2 py-1 bg-blue-50 rounded hover:bg-blue-100"
              onClick={addText}
              title="Add Text"
            >
              <Type className="w-4 h-4" />
              Text
            </button>
            <button
              className="flex items-center gap-2 px-2 py-1 bg-green-50 rounded hover:bg-green-100"
              onClick={addRect}
              title="Add Rectangle"
            >
              <Square className="w-4 h-4" />
              Rectangle
            </button>
            {/* Attendee Fields Section */}
            <div className="font-semibold text-xs text-gray-500 mt-2 mb-1">
              Attendee Fields
            </div>
            <button
              className="flex items-center gap-2 px-2 py-1 bg-indigo-50 rounded hover:bg-indigo-100"
              onClick={() => addAttendeeField('name')}
              title="Add Name Field"
            >
              <User className="w-4 h-4" />
              Name
            </button>
            <button
              className="flex items-center gap-2 px-2 py-1 bg-indigo-50 rounded hover:bg-indigo-100"
              onClick={() => addAttendeeField('email')}
              title="Add Email Field"
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              className="flex items-center gap-2 px-2 py-1 bg-indigo-50 rounded hover:bg-indigo-100"
              onClick={() => addAttendeeField('phone')}
              title="Add Phone Field"
            >
              <Phone className="w-4 h-4" />
              Phone
            </button>
            <button
              className="flex items-center gap-2 px-2 py-1 bg-indigo-50 rounded hover:bg-indigo-100"
              onClick={() => addAttendeeField('company')}
              title="Add Company Field"
            >
              <Building className="w-4 h-4" />
              Company
            </button>
            <button
              className="flex items-center gap-2 px-2 py-1 bg-indigo-50 rounded hover:bg-indigo-100"
              onClick={() => addAttendeeField('jobtitle')}
              title="Add Job Title Field"
            >
              <Briefcase className="w-4 h-4" />
              Job Title
            </button>
            <button
              className="flex items-center gap-2 px-2 py-1 bg-indigo-50 rounded hover:bg-indigo-100"
              onClick={() => addAttendeeField('title')}
              title="Add Title Field"
            >
              <Briefcase className="w-4 h-4" />
              Title
            </button>
            <button
              className="flex items-center gap-2 px-2 py-1 bg-indigo-50 rounded hover:bg-indigo-100"
              onClick={() => addAttendeeField('gender')}
              title="Add Gender Field"
            >
              <UserCircle className="w-4 h-4" />
              Gender
            </button>
            <button
              className="flex items-center gap-2 px-2 py-1 bg-indigo-50 rounded hover:bg-indigo-100"
              onClick={() => addAttendeeField('country')}
              title="Add Country Field"
            >
              <Globe className="w-4 h-4" />
              Country
            </button>
            <button
              className="flex items-center gap-2 px-2 py-1 bg-indigo-50 rounded hover:bg-indigo-100"
              onClick={() => addAttendeeField('guest_type')}
              title="Add Guest Type Field"
            >
              <Tag className="w-4 h-4" />
              Guest Type
            </button>
            <button
              className="flex items-center gap-2 px-2 py-1 bg-indigo-50 rounded hover:bg-indigo-100"
              onClick={() => addAttendeeField('checked_in')}
              title="Add Checked In Field"
            >
              <CheckCircle className="w-4 h-4" />
              Checked In
            </button>
            <button
              className="flex items-center gap-2 px-2 py-1 bg-indigo-50 rounded hover:bg-indigo-100"
              onClick={() => addAttendeeField('check_in_time')}
              title="Add Check In Time Field"
            >
              <Clock className="w-4 h-4" />
              Check In Time
            </button>
            <button
              className="flex items-center gap-2 px-2 py-1 bg-indigo-50 rounded hover:bg-indigo-100"
              onClick={() => addAttendeeField('address')}
              title="Add Address Field"
            >
              <MapPin className="w-4 h-4" />
              Address
            </button>
            <button
              className="flex items-center gap-2 px-2 py-1 bg-indigo-50 rounded hover:bg-indigo-100"
              onClick={() => addAttendeeField('website')}
              title="Add Website Field"
            >
              <Globe className="w-4 h-4" />
              Website
            </button>
            <button
              className="flex items-center gap-2 px-2 py-1 bg-indigo-50 rounded hover:bg-indigo-100"
              onClick={() => addAttendeeField('profile_image_url')}
              title="Add Profile Image URL Field"
            >
              <ImageIcon className="w-4 h-4" />
              Profile Image URL
            </button>
            {/* End Attendee Fields Section */}
            <button
              className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
              onClick={addQRCode}
              title="Add QR Code"
            >
              <QrCode className="w-4 h-4" />
              QR Code
            </button>
            <button
              className="flex items-center gap-2 px-2 py-1 bg-yellow-50 rounded hover:bg-yellow-100"
              onClick={addImage}
              title="Add Image"
            >
              <ImageIcon className="w-4 h-4" />
              Image
            </button>
            <button
              className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded hover:bg-gray-100"
              onClick={addBackground}
              title="Upload Background Image"
            >
              <ImageIcon className="w-4 h-4" />
              Upload Background
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <input
              type="file"
              accept="image/*"
              ref={backgroundInputRef}
              style={{ display: 'none' }}
              onChange={handleBackgroundChange}
            />
          </div>
        </div>
        {/* Canvas Area */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          <div className="mb-2 text-gray-500 text-xs">Badge: 400 x 600 px</div>
          <div className="relative shadow-xl rounded-xl bg-white">
            {/* Render Stage with background, grid, and elements */}
            <Stage
              width={400 * zoom}
              height={600 * zoom}
              className="rounded-xl z-10"
              ref={stageRef}
              style={{ background: 'transparent' }}
              scale={{ x: zoom, y: zoom }}
            >
              <Layer>
                {/* Render background image if present (always 400x600, only visually scaled) */}
                {backgroundImage && (
                  <BackgroundImage
                    src={backgroundImage}
                    width={400}
                    height={600}
                  />
                )}
                {/* Render grid overlay on top of background image */}
                {showGrid && (
                  <Rect
                    x={0}
                    y={0}
                    width={400}
                    height={600}
                    listening={false}
                    fillPatternImage={(() => {
                      const canvas = document.createElement('canvas')
                      const ctx = canvas.getContext('2d')
                      const size = 20
                      canvas.width = canvas.height = size
                      if (ctx) {
                        ctx.strokeStyle = '#e5e7eb'
                        ctx.lineWidth = 1
                        ctx.beginPath()
                        ctx.moveTo(0, 0)
                        ctx.lineTo(size, 0)
                        ctx.moveTo(0, 0)
                        ctx.lineTo(0, size)
                        ctx.stroke()
                      }
                      return canvas
                    })()}
                    fillPatternScale={{ x: zoom, y: zoom }}
                  />
                )}
                {/* Render other elements */}
                {elements.map((el) => {
                  if (el.type === 'rect') {
                    return (
                      <Rect
                        key={el.id}
                        id={el.id}
                        x={el.x}
                        y={el.y}
                        width={el.width}
                        height={el.height}
                        fill={el.fill}
                        draggable
                        onDragEnd={(e) =>
                          handleDrag(el.id, e.target.x(), e.target.y())
                        }
                        onClick={() => handleSelect(el.id)}
                        stroke={selectedId === el.id ? '#6366F1' : undefined}
                        strokeWidth={selectedId === el.id ? 2 : 0}
                        onTransformEnd={(e) =>
                          handleTransformEnd(el.id, e.target)
                        }
                      />
                    )
                  } else if (el.type === 'text') {
                    return (
                      <Text
                        key={el.id}
                        id={el.id}
                        x={el.x}
                        y={el.y}
                        text={el.text}
                        fontSize={el.fontSize}
                        fill={el.fill}
                        width={el.width}
                        height={el.height}
                        draggable
                        onDragEnd={(e) =>
                          handleDrag(el.id, e.target.x(), e.target.y())
                        }
                        onClick={() => handleSelect(el.id)}
                        stroke={selectedId === el.id ? '#6366F1' : undefined}
                        strokeWidth={selectedId === el.id ? 1 : 0}
                        onTransformEnd={(e) =>
                          handleTransformEnd(el.id, e.target)
                        }
                      />
                    )
                  } else if (el.type === 'image' && el.src) {
                    return (
                      <CanvasImage
                        key={el.id}
                        el={el}
                        isSelected={selectedId === el.id}
                        onSelect={() => handleSelect(el.id)}
                        onDrag={handleDrag}
                        onTransformEnd={handleTransformEnd}
                      />
                    )
                  } else if (el.type === 'qr') {
                    return (
                      <QrCodeImage
                        key={el.id}
                        el={el}
                        isSelected={selectedId === el.id}
                        onSelect={() => handleSelect(el.id)}
                        onDrag={handleDrag}
                        onTransformEnd={handleTransformEnd}
                      />
                    )
                  }
                  return null
                })}
                {/* Transformer for selected element */}
                {selectedId && (
                  <Transformer
                    ref={trRef}
                    rotateEnabled={false}
                    enabledAnchors={[
                      'top-left',
                      'top-right',
                      'bottom-left',
                      'bottom-right',
                    ]}
                  />
                )}
              </Layer>
            </Stage>
          </div>
        </div>
        {/* Controls: Zoom & Grid, outside the canvas */}
        <div className="flex flex-col items-center gap-2 ml-2 mt-8 bg-white/80 rounded shadow p-2">
          <button
            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
            onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))}
            disabled={zoom <= ZOOM_MIN}
            title="Zoom Out"
          >
            -
          </button>
          <span className="text-sm w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
            onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))}
            disabled={zoom >= ZOOM_MAX}
            title="Zoom In"
          >
            +
          </button>
          <button
            className={`px-2 py-1 rounded ${
              showGrid ? 'bg-blue-200' : 'bg-gray-200'
            } hover:bg-blue-300`}
            onClick={() => setShowGrid((g) => !g)}
            title={showGrid ? 'Hide Grid' : 'Show Grid'}
          >
            {showGrid ? 'Hide Grid' : 'Show Grid'}
          </button>
        </div>
        {/* Properties Panel */}
        <div className="w-72 bg-white rounded-xl shadow p-4 flex flex-col gap-4">
          <div className="font-semibold mb-2 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500" /> Properties
          </div>
          {selectedElement ? (
            <div className="space-y-2">
              <div className="text-xs text-gray-500">
                ID: {selectedElement.id}
              </div>
              {selectedElement.type === 'text' && (
                <>
                  <label className="block text-sm">Text</label>
                  <input
                    className="w-full border px-2 py-1 rounded"
                    value={selectedElement.text}
                    onChange={(e) =>
                      handlePropertyChange('text', e.target.value)
                    }
                  />
                  <label className="block text-sm">Font Size</label>
                  <input
                    type="number"
                    className="w-full border px-2 py-1 rounded"
                    value={selectedElement.fontSize}
                    onChange={(e) =>
                      handlePropertyChange('fontSize', Number(e.target.value))
                    }
                  />
                  <label className="block text-sm">Color</label>
                  <input
                    type="color"
                    className="w-8 h-8 p-0 border rounded"
                    value={selectedElement.fill || '#000000'}
                    onChange={(e) =>
                      handlePropertyChange('fill', e.target.value)
                    }
                  />
                </>
              )}
              {selectedElement.type === 'rect' && (
                <>
                  <label className="block text-sm">Width</label>
                  <input
                    type="number"
                    className="w-full border px-2 py-1 rounded"
                    value={selectedElement.width}
                    onChange={(e) =>
                      handlePropertyChange('width', Number(e.target.value))
                    }
                  />
                  <label className="block text-sm">Height</label>
                  <input
                    type="number"
                    className="w-full border px-2 py-1 rounded"
                    value={selectedElement.height}
                    onChange={(e) =>
                      handlePropertyChange('height', Number(e.target.value))
                    }
                  />
                  <label className="block text-sm">Color</label>
                  <input
                    type="color"
                    className="w-8 h-8 p-0 border rounded"
                    value={selectedElement.fill || '#0000ff'}
                    onChange={(e) =>
                      handlePropertyChange('fill', e.target.value)
                    }
                  />
                </>
              )}
              {selectedElement.type === 'image' && (
                <>
                  <label className="block text-sm">Width</label>
                  <input
                    type="number"
                    className="w-full border px-2 py-1 rounded"
                    value={selectedElement.width}
                    onChange={(e) =>
                      handlePropertyChange('width', Number(e.target.value))
                    }
                  />
                  <label className="block text-sm">Height</label>
                  <input
                    type="number"
                    className="w-full border px-2 py-1 rounded"
                    value={selectedElement.height}
                    onChange={(e) =>
                      handlePropertyChange('height', Number(e.target.value))
                    }
                  />
                </>
              )}
              {selectedElement.type === 'qr' && (
                <>
                  <label className="block text-sm">QR Content Type</label>
                  <select
                    className="w-full border px-2 py-1 rounded mb-2"
                    value={selectedElement.qrContentType || 'text'}
                    onChange={(e) =>
                      handlePropertyChange('qrContentType', e.target.value)
                    }
                  >
                    <option value="text">Text / URL</option>
                    <option value="vcard">vCard (Contact)</option>
                    <option value="json">JSON</option>
                    <option value="custom">Custom Template</option>
                  </select>
                  {(!selectedElement.qrContentType ||
                    selectedElement.qrContentType === 'text') && (
                    <>
                      <label className="block text-sm">QR Value</label>
                      <input
                        className="w-full border px-2 py-1 rounded"
                        value={selectedElement.value || ''}
                        onChange={(e) =>
                          handlePropertyChange('value', e.target.value)
                        }
                        placeholder="Enter QR code content (URL, text, etc.)"
                      />
                    </>
                  )}
                  {selectedElement.qrContentType === 'vcard' && (
                    <>
                      <label className="block text-sm">Name</label>
                      <input
                        className="w-full border px-2 py-1 rounded"
                        value={selectedElement.qrFields?.name || ''}
                        onChange={(e) =>
                          handlePropertyChange('qrFields', {
                            ...selectedElement.qrFields,
                            name: e.target.value,
                          })
                        }
                        placeholder="{{name}}"
                      />
                      <label className="block text-sm">Title</label>
                      <input
                        className="w-full border px-2 py-1 rounded"
                        value={selectedElement.qrFields?.title || ''}
                        onChange={(e) =>
                          handlePropertyChange('qrFields', {
                            ...selectedElement.qrFields,
                            title: e.target.value,
                          })
                        }
                        placeholder="{{title}}"
                      />
                      <label className="block text-sm">Email</label>
                      <input
                        className="w-full border px-2 py-1 rounded"
                        value={selectedElement.qrFields?.email || ''}
                        onChange={(e) =>
                          handlePropertyChange('qrFields', {
                            ...selectedElement.qrFields,
                            email: e.target.value,
                          })
                        }
                        placeholder="{{email}}"
                      />
                      <label className="block text-sm">Phone</label>
                      <input
                        className="w-full border px-2 py-1 rounded"
                        value={selectedElement.qrFields?.phone || ''}
                        onChange={(e) =>
                          handlePropertyChange('qrFields', {
                            ...selectedElement.qrFields,
                            phone: e.target.value,
                          })
                        }
                        placeholder="{{phone}}"
                      />
                      <label className="block text-sm">Company</label>
                      <input
                        className="w-full border px-2 py-1 rounded"
                        value={selectedElement.qrFields?.company || ''}
                        onChange={(e) =>
                          handlePropertyChange('qrFields', {
                            ...selectedElement.qrFields,
                            company: e.target.value,
                          })
                        }
                        placeholder="{{company}}"
                      />
                      <label className="block text-sm">Address</label>
                      <input
                        className="w-full border px-2 py-1 rounded"
                        value={selectedElement.qrFields?.address || ''}
                        onChange={(e) =>
                          handlePropertyChange('qrFields', {
                            ...selectedElement.qrFields,
                            address: e.target.value,
                          })
                        }
                        placeholder="{{address}}"
                      />
                      <label className="block text-sm">Website</label>
                      <input
                        className="w-full border px-2 py-1 rounded"
                        value={selectedElement.qrFields?.website || ''}
                        onChange={(e) =>
                          handlePropertyChange('qrFields', {
                            ...selectedElement.qrFields,
                            website: e.target.value,
                          })
                        }
                        placeholder="{{website}}"
                      />
                    </>
                  )}
                  {selectedElement.qrContentType === 'json' && (
                    <>
                      <label className="block text-sm">JSON Template</label>
                      <textarea
                        className="w-full border px-2 py-1 rounded"
                        rows={4}
                        value={selectedElement.qrJsonTemplate || ''}
                        onChange={(e) =>
                          handlePropertyChange('qrJsonTemplate', e.target.value)
                        }
                        placeholder='{"name": "{{name}}", "email": "{{email}}"}'
                      />
                    </>
                  )}
                  {selectedElement.qrContentType === 'custom' && (
                    <>
                      <label className="block text-sm">Custom Template</label>
                      <textarea
                        className="w-full border px-2 py-1 rounded"
                        rows={4}
                        value={selectedElement.qrCustomTemplate || ''}
                        onChange={(e) =>
                          handlePropertyChange(
                            'qrCustomTemplate',
                            e.target.value
                          )
                        }
                        placeholder="Use {{name}}, {{email}}, etc."
                      />
                      <div className="mt-1 text-xs text-gray-500">
                        <span className="font-semibold">
                          Available placeholders:
                        </span>{' '}
                        {availablePlaceholders.map((ph) => (
                          <span
                            key={ph}
                            className="inline-block bg-gray-200 rounded px-1 mx-1"
                          >
                            {'{{' + ph + '}}'}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                  {/* Live preview of resolved QR value */}
                  <div className="mt-2 text-xs text-gray-500">
                    <div className="font-semibold mb-1">QR Preview Value:</div>
                    <pre className="bg-gray-100 rounded p-2 overflow-x-auto">
                      {selectedElement.qrContentType === 'vcard'
                        ? vCardTemplate(samplePerson)
                        : selectedElement.qrContentType === 'json'
                        ? resolveTemplate(
                            selectedElement.qrJsonTemplate || '',
                            samplePerson
                          )
                        : selectedElement.qrContentType === 'custom'
                        ? resolveTemplate(
                            selectedElement.qrCustomTemplate || '',
                            samplePerson
                          )
                        : resolveTemplate(
                            selectedElement.value || '',
                            samplePerson
                          )}
                    </pre>
                  </div>
                  <label className="block text-sm mt-2">Width</label>
                  <input
                    type="number"
                    className="w-full border px-2 py-1 rounded"
                    value={selectedElement.width}
                    onChange={(e) =>
                      handlePropertyChange('width', Number(e.target.value))
                    }
                  />
                  <label className="block text-sm">Height</label>
                  <input
                    type="number"
                    className="w-full border px-2 py-1 rounded"
                    value={selectedElement.height}
                    onChange={(e) =>
                      handlePropertyChange('height', Number(e.target.value))
                    }
                  />
                </>
              )}
              <button
                className="mt-4 flex items-center gap-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" /> Delete Element
              </button>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">
              (Select an element to edit properties)
            </div>
          )}
        </div>
      </div>
      {/* Add preview below the designer */}
      <div className="flex flex-col items-center mt-8">
        <div className="font-semibold text-gray-700 mb-2">
          Preview (Front & Back)
        </div>
        <div className="flex gap-8">
          <div className="flex flex-col items-center">
            <span className="text-xs mb-1">Front</span>
            <BadgeSidePreview
              elements={elementsFront}
              background={backgroundFront}
            />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs mb-1">Back</span>
            <BadgeSidePreview
              elements={elementsBack}
              background={backgroundBack}
            />
          </div>
        </div>
      </div>
      {/* Draft/Official Info */}
      <div className="px-8 py-3 border-t bg-white text-xs flex gap-8 shadow-inner rounded-b-xl">
        <div>
          <span className="font-semibold">Current Draft:</span>{' '}
          {currentDraft ? currentDraft.name : 'None'}
        </div>
        <div>
          <span className="font-semibold">Official Template:</span>{' '}
          {official ? official.name : 'None'}
        </div>
      </div>
      {/* Publish Confirmation Dialog */}
      <Dialog open={showPublishConfirm} onOpenChange={setShowPublishConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Publish</DialogTitle>
            <DialogDescription>
              Are you sure you want to publish this draft as the official badge
              template for this event?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              onClick={() => setShowPublishConfirm(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              onClick={handlePublish}
              disabled={publishing}
            >
              {publishing ? 'Publishing...' : 'Yes, Publish'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Draft</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this draft? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              onClick={handleDeleteDraft}
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BadgeDesignerTab
