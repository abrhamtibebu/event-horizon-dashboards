import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { subscribeWithSelector } from 'zustand/middleware'
import type { BadgeElement, BadgeTemplate } from '@/types/badge-designer/badge'
import { migrateTemplate } from '@/lib/badge-designer/utils/templateMigration'

const CURRENT_TEMPLATE_VERSION = '2.1'
const MAX_HISTORY_SIZE = 50
const AUTO_SAVE_DEBOUNCE_MS = 2000 // 2 seconds debounce

// Diff-based history for better memory efficiency
interface HistoryDiff {
  type: 'add' | 'update' | 'delete' | 'reorder' | 'full'
  elementId?: string
  element?: BadgeElement
  updates?: Partial<BadgeElement>
  fromIndex?: number
  toIndex?: number
  fullState?: BadgeElement[]
}

interface PerformanceMetrics {
  renderTime: number
  historySize: number
  elementCount: number
  lastUpdate: number
}

interface BadgeStore {
  elements: BadgeElement[]
  activeElementId: string | null
  selectedElementIds: string[] // Multi-select support
  canvasSize: { width: number; height: number }
  templateVersion: string
  badgeType: 'single' | 'double'
  currentSide: 'front' | 'back'
  backgroundImage: { front?: string; back?: string }
  
  // History for undo/redo (diff-based)
  history: HistoryDiff[]
  historyIndex: number
  baseState: BadgeElement[] // Base state for diff calculation
  
  // Performance metrics
  performance: PerformanceMetrics
  
  // Actions
  addElement: (element: BadgeElement) => void
  updateElement: (id: string, updates: Partial<BadgeElement>, skipHistory?: boolean) => void
  deleteElement: (id: string) => void
  setActiveElement: (id: string | null) => void
  setSelectedElements: (ids: string[]) => void
  reorderElements: (fromIndex: number, toIndex: number) => void
  
  // Undo/Redo
  undo: () => void
  redo: () => void
  saveToHistory: (diff?: HistoryDiff) => void
  canUndo: () => boolean
  canRedo: () => boolean
  
  // Template management
  loadTemplate: (template: any) => void
  exportTemplate: () => BadgeTemplate
  clearCanvas: () => void
  importTemplate: (template: any) => void
  
  // Canvas size
  setCanvasSize: (size: { width: number; height: number }) => void
  
  // Badge configuration
  setBadgeType: (type: 'single' | 'double') => void
  setCurrentSide: (side: 'front' | 'back') => void
  setBackgroundImage: (side: 'front' | 'back', imageUrl: string | null) => void
  
  // Performance
  updatePerformanceMetrics: (metrics: Partial<PerformanceMetrics>) => void
}

// Helper function to calculate diff between two states
function calculateDiff(
  oldState: BadgeElement[],
  newState: BadgeElement[]
): HistoryDiff | null {
  if (oldState.length === 0 && newState.length > 0) {
    return { type: 'full', fullState: newState }
  }
  
  if (oldState.length !== newState.length) {
    // State size changed - store full state
    return { type: 'full', fullState: newState }
  }
  
  // Find differences
  for (let i = 0; i < newState.length; i++) {
    const oldEl = oldState[i]
    const newEl = newState[i]
    
    if (oldEl.id !== newEl.id) {
      // Reorder detected
      return { type: 'full', fullState: newState }
    }
    
    if (JSON.stringify(oldEl) !== JSON.stringify(newEl)) {
      // Element changed
      const updates: Partial<BadgeElement> = {}
      Object.keys(newEl.properties).forEach(key => {
        if (oldEl.properties[key as keyof typeof oldEl.properties] !== 
            newEl.properties[key as keyof typeof newEl.properties]) {
          updates.properties = { ...updates.properties, [key]: newEl.properties[key as keyof typeof newEl.properties] }
        }
      })
      
      return {
        type: 'update',
        elementId: newEl.id,
        updates,
      }
    }
  }
  
  return null
}

// Helper to apply diff to state
function applyDiff(state: BadgeElement[], diff: HistoryDiff): BadgeElement[] {
  switch (diff.type) {
    case 'full':
      return diff.fullState ? [...diff.fullState] : state
    case 'add':
      return diff.element ? [...state, diff.element] : state
    case 'update':
      if (!diff.elementId || !diff.updates) return state
      return state.map(el => 
        el.id === diff.elementId 
          ? { ...el, ...diff.updates, properties: { ...el.properties, ...diff.updates?.properties } }
          : el
      )
    case 'delete':
      return state.filter(el => el.id !== diff.elementId)
    case 'reorder':
      if (diff.fromIndex === undefined || diff.toIndex === undefined) return state
      const newState = [...state]
      const [removed] = newState.splice(diff.fromIndex, 1)
      newState.splice(diff.toIndex, 0, removed)
      return newState
    default:
      return state
  }
}

export const useBadgeStore = create<BadgeStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      elements: [],
      activeElementId: null,
      selectedElementIds: [],
      canvasSize: { width: 400, height: 600 },
      templateVersion: CURRENT_TEMPLATE_VERSION,
      badgeType: 'single',
      currentSide: 'front',
      backgroundImage: {},
      history: [],
      historyIndex: -1,
      baseState: [],
      performance: {
        renderTime: 0,
        historySize: 0,
        elementCount: 0,
        lastUpdate: Date.now(),
      },
      
      addElement: (element) => {
        const startTime = performance.now()
        set((state) => {
          state.elements.push(element)
          state.activeElementId = element.id
          state.selectedElementIds = [element.id]
        })
        get().saveToHistory({ type: 'add', element })
        get().updatePerformanceMetrics({ 
          elementCount: get().elements.length,
          renderTime: performance.now() - startTime,
          lastUpdate: Date.now(),
        })
      },
      
      updateElement: (id, updates, skipHistory = false) => {
        const startTime = performance.now()
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
        
        if (!skipHistory) {
          get().saveToHistory({ type: 'update', elementId: id, updates })
        }
        
        get().updatePerformanceMetrics({ 
          renderTime: performance.now() - startTime,
          lastUpdate: Date.now(),
        })
      },
      
      deleteElement: (id) => {
        const startTime = performance.now()
        set((state) => {
          state.elements = state.elements.filter(el => el.id !== id)
          if (state.activeElementId === id) {
            state.activeElementId = null
          }
          state.selectedElementIds = state.selectedElementIds.filter(elId => elId !== id)
        })
        get().saveToHistory({ type: 'delete', elementId: id })
        get().updatePerformanceMetrics({ 
          elementCount: get().elements.length,
          renderTime: performance.now() - startTime,
          lastUpdate: Date.now(),
        })
      },
      
      setActiveElement: (id) => {
        set({ activeElementId: id })
        if (id) {
          set({ selectedElementIds: [id] })
        }
      },
      
      setSelectedElements: (ids) => {
        set({ selectedElementIds: ids })
        if (ids.length === 1) {
          set({ activeElementId: ids[0] })
        } else {
          set({ activeElementId: null })
        }
      },
      
      reorderElements: (fromIndex, toIndex) => {
        set((state) => {
          const [removed] = state.elements.splice(fromIndex, 1)
          state.elements.splice(toIndex, 0, removed)
        })
        get().saveToHistory({ type: 'reorder', fromIndex, toIndex })
      },
      
      saveToHistory: (diff) => {
        set((state) => {
          const currentState = state.elements
          
          // If no diff provided, calculate it
          let historyDiff = diff
          if (!historyDiff) {
            historyDiff = calculateDiff(state.baseState, currentState)
            if (!historyDiff) return // No changes
          }
          
          // Remove future history if we're not at the end
          if (state.historyIndex < state.history.length - 1) {
            state.history = state.history.slice(0, state.historyIndex + 1)
          }
          
          // Add diff to history
          state.history.push(historyDiff)
          
          // Limit history size
          if (state.history.length > MAX_HISTORY_SIZE) {
            // Rebuild base state from oldest diff and remove oldest
            let rebuiltState = state.baseState
            const removedDiffs = state.history.splice(0, state.history.length - MAX_HISTORY_SIZE)
            removedDiffs.forEach(d => {
              rebuiltState = applyDiff(rebuiltState, d)
            })
            state.baseState = rebuiltState
          }
          
          state.historyIndex = state.history.length - 1
          state.baseState = [...currentState]
          state.performance.historySize = state.history.length
        })
      },
      
      undo: () => {
        const { historyIndex, history, baseState } = get()
        if (historyIndex < 0) return
        
        const diff = history[historyIndex]
        if (!diff) return
        
        // Apply reverse diff
        let newState = baseState
        for (let i = historyIndex; i >= 0; i--) {
          const currentDiff = history[i]
          // Reverse the diff
          if (currentDiff.type === 'add') {
            newState = newState.filter(el => el.id !== currentDiff.elementId)
          } else if (currentDiff.type === 'delete' && currentDiff.element) {
            newState = [...newState, currentDiff.element]
          } else if (currentDiff.type === 'update') {
            // Need to restore previous state - use full state for complex updates
            newState = baseState
            break
          }
        }
        
        set({
          elements: newState,
          historyIndex: historyIndex - 1,
          baseState: newState,
        })
      },
      
      redo: () => {
        const { historyIndex, history, elements } = get()
        if (historyIndex >= history.length - 1) return
        
        const newIndex = historyIndex + 1
        const diff = history[newIndex]
        if (!diff) return
        
        const newState = applyDiff(elements, diff)
        set({
          elements: newState,
          historyIndex: newIndex,
          baseState: newState,
        })
      },
      
      canUndo: () => {
        return get().historyIndex >= 0
      },
      
      canRedo: () => {
        const { historyIndex, history } = get()
        return historyIndex < history.length - 1
      },
      
      loadTemplate: (template) => {
        const migrated = migrateTemplate(template)
        const elements = migrated.objects || []
        
        set({
          elements,
          templateVersion: migrated.version || CURRENT_TEMPLATE_VERSION,
          activeElementId: null,
          selectedElementIds: [],
          history: [],
          historyIndex: -1,
          baseState: elements,
        })
      },
      
      importTemplate: (template) => {
        get().loadTemplate(template)
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
          selectedElementIds: [],
          history: [],
          historyIndex: -1,
          baseState: [],
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
      
      updatePerformanceMetrics: (metrics) => {
        set((state) => {
          state.performance = { ...state.performance, ...metrics }
        })
      },
    }))
  )
)

// Debounced auto-save
let autoSaveTimeout: NodeJS.Timeout | null = null
let autoSaveInterval: NodeJS.Timeout | null = null

function debouncedAutoSave() {
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout)
  }
  
  autoSaveTimeout = setTimeout(() => {
    const template = useBadgeStore.getState().exportTemplate()
    try {
      localStorage.setItem('badge-designer-autosave', JSON.stringify(template))
      console.log('Auto-saved template to localStorage')
    } catch (error) {
      console.error('Failed to auto-save:', error)
    }
  }, AUTO_SAVE_DEBOUNCE_MS)
}

export function startAutoSave() {
  if (autoSaveInterval) return
  
  // Subscribe to store changes
  useBadgeStore.subscribe(
    (state) => state.elements,
    () => {
      debouncedAutoSave()
    }
  )
  
  // Also save periodically as backup
  autoSaveInterval = setInterval(() => {
    debouncedAutoSave()
  }, 30000) // 30 seconds
}

export function stopAutoSave() {
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout)
    autoSaveTimeout = null
  }
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval)
    autoSaveInterval = null
  }
}

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

// Performance monitoring hook
export function useBadgePerformance() {
  return useBadgeStore((state) => state.performance)
}

// Selective subscription hook for element-level updates
export function useElement(elementId: string | null) {
  return useBadgeStore(
    (state) => elementId ? state.elements.find(el => el.id === elementId) : null,
    (a, b) => JSON.stringify(a) === JSON.stringify(b)
  )
}
