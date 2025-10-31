import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { BadgeElement, BadgeTemplate } from '@/types/badge-designer/badge'
import { migrateTemplate } from '@/lib/badge-designer/utils/templateMigration'

const CURRENT_TEMPLATE_VERSION = '2.1'
const MAX_HISTORY_SIZE = 50

interface BadgeStore {
  elements: BadgeElement[]
  activeElementId: string | null
  canvasSize: { width: number; height: number }
  templateVersion: string
  badgeType: 'single' | 'double'
  currentSide: 'front' | 'back'
  backgroundImage: { front?: string; back?: string }
  
  // History for undo/redo
  history: BadgeElement[][]
  historyIndex: number
  
  // Actions
  addElement: (element: BadgeElement) => void
  updateElement: (id: string, updates: Partial<BadgeElement>) => void
  deleteElement: (id: string) => void
  setActiveElement: (id: string | null) => void
  reorderElements: (fromIndex: number, toIndex: number) => void
  
  // Undo/Redo
  undo: () => void
  redo: () => void
  saveToHistory: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  
  // Template management
  loadTemplate: (template: any) => void
  exportTemplate: () => BadgeTemplate
  clearCanvas: () => void
  
  // Canvas size
  setCanvasSize: (size: { width: number; height: number }) => void
  
  // Badge configuration
  setBadgeType: (type: 'single' | 'double') => void
  setCurrentSide: (side: 'front' | 'back') => void
  setBackgroundImage: (side: 'front' | 'back', imageUrl: string | null) => void
}

export const useBadgeStore = create<BadgeStore>()(
  immer((set, get) => ({
    elements: [],
    activeElementId: null,
    canvasSize: { width: 400, height: 600 },
    templateVersion: CURRENT_TEMPLATE_VERSION,
    badgeType: 'single',
    currentSide: 'front',
    backgroundImage: {},
    history: [[]],
    historyIndex: 0,
    
    addElement: (element) => {
      set((state) => {
        state.elements.push(element)
        state.activeElementId = element.id
      })
      get().saveToHistory()
    },
    
    updateElement: (id, updates) => {
      set((state) => {
        const index = state.elements.findIndex(el => el.id === id)
        if (index !== -1) {
          state.elements[index] = {
            ...state.elements[index],
            ...updates,
            properties: {
              ...state.elements[index].properties,
              ...(updates.properties || {}),
            },
          }
        }
      })
      get().saveToHistory()
    },
    
    deleteElement: (id) => {
      set((state) => {
        state.elements = state.elements.filter(el => el.id !== id)
        if (state.activeElementId === id) {
          state.activeElementId = null
        }
      })
      get().saveToHistory()
    },
    
    setActiveElement: (id) => {
      set({ activeElementId: id })
    },
    
    reorderElements: (fromIndex, toIndex) => {
      set((state) => {
        const [removed] = state.elements.splice(fromIndex, 1)
        state.elements.splice(toIndex, 0, removed)
      })
      get().saveToHistory()
    },
    
    saveToHistory: () => {
      set((state) => {
        const currentElements = JSON.parse(JSON.stringify(state.elements))
        
        // Remove future history if we're not at the end
        if (state.historyIndex < state.history.length - 1) {
          state.history = state.history.slice(0, state.historyIndex + 1)
        }
        
        // Add current state to history
        state.history.push(currentElements)
        
        // Limit history size
        if (state.history.length > MAX_HISTORY_SIZE) {
          state.history = state.history.slice(-MAX_HISTORY_SIZE)
        }
        
        state.historyIndex = state.history.length - 1
      })
    },
    
    undo: () => {
      const { historyIndex, history } = get()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        set({
          elements: JSON.parse(JSON.stringify(history[newIndex])),
          historyIndex: newIndex,
        })
      }
    },
    
    redo: () => {
      const { historyIndex, history } = get()
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1
        set({
          elements: JSON.parse(JSON.stringify(history[newIndex])),
          historyIndex: newIndex,
        })
      }
    },
    
    canUndo: () => {
      return get().historyIndex > 0
    },
    
    canRedo: () => {
      const { historyIndex, history } = get()
      return historyIndex < history.length - 1
    },
    
    loadTemplate: (template) => {
      // Auto-migrate old templates
      const migrated = migrateTemplate(template)
      
      set({
        elements: migrated.objects || [],
        templateVersion: migrated.version || CURRENT_TEMPLATE_VERSION,
        activeElementId: null,
        history: [migrated.objects || []],
        historyIndex: 0,
      })
    },
    
    exportTemplate: () => {
      const { elements } = get()
      
      return {
        name: 'Badge Template',
        version: CURRENT_TEMPLATE_VERSION,
        objects: elements.map(el => ({
          id: el.id,
          type: el.type,
          properties: el.properties,
        })),
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          versionHistory: [CURRENT_TEMPLATE_VERSION],
        },
      }
    },
    
    clearCanvas: () => {
      set({
        elements: [],
        activeElementId: null,
        history: [[]],
        historyIndex: 0,
      })
    },
    
    setCanvasSize: (size) => {
      set({ canvasSize: size })
    },
    
    setBadgeType: (type) => {
      set({ badgeType: type })
    },
    
    setCurrentSide: (side) => {
      set({ currentSide: side })
    },
    
    setBackgroundImage: (side, imageUrl) => {
      set((state) => {
        if (imageUrl === null) {
          delete state.backgroundImage[side]
        } else {
          state.backgroundImage[side] = imageUrl
        }
      })
    },
  }))
)

// Auto-save to localStorage every 30 seconds
let autoSaveInterval: NodeJS.Timeout | null = null

export function startAutoSave() {
  if (autoSaveInterval) return
  
  autoSaveInterval = setInterval(() => {
    const template = useBadgeStore.getState().exportTemplate()
    localStorage.setItem('badge-designer-autosave', JSON.stringify(template))
    console.log('Auto-saved template to localStorage')
  }, 30000) // 30 seconds
}

export function stopAutoSave() {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval)
    autoSaveInterval = null
  }
}

// Load autosaved template on mount
export function loadAutoSave() {
  try {
    const saved = localStorage.getItem('badge-designer-autosave')
    if (saved) {
      const template = JSON.parse(saved)
      useBadgeStore.getState().loadTemplate(template)
      return true
    }
  } catch (error) {
    console.error('Failed to load autosaved template:', error)
  }
  return false
}


