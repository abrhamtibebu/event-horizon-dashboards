// Badge Designer State Management
// Zustand-like store using React's useReducer for undo/redo, element CRUD, and canvas state

import { useReducer, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  DesignerState,
  DesignerElement,
  DesignerTool,
  BadgeLayout,
  BadgeSizeKey,
  BadgeSide,
  TextDesignerElement,
  DynamicFieldDesignerElement,
  ImageDesignerElement,
  QRCodeDesignerElement,
  ShapeDesignerElement,
  DynamicFieldKey,
} from '@/types/badge-designer';
import { BADGE_SIZES } from '@/types/badge-designer';

// ── Action Types ─────────────────────────────────────────────────────────────

type DesignerAction =
  | { type: 'SET_TEMPLATE_META'; payload: { id: string | null; name: string } }
  | { type: 'SET_TEMPLATE_NAME'; payload: string }
  | { type: 'SET_LAYOUT'; payload: BadgeLayout }
  | { type: 'SET_BADGE_SIZE'; payload: BadgeSizeKey }
  | { type: 'SET_ACTIVE_SIDE'; payload: 'front' | 'back' }
  | { type: 'SET_BACKGROUND_COLOR'; payload: string }
  | { type: 'SET_BACKGROUND_IMAGE'; payload: string | null }
  | { type: 'ADD_ELEMENT'; payload: DesignerElement }
  | { type: 'UPDATE_ELEMENT'; payload: { id: string; updates: Partial<DesignerElement> } }
  | { type: 'DELETE_ELEMENTS'; payload: string[] }
  | { type: 'DUPLICATE_ELEMENTS'; payload: string[] }
  | { type: 'MOVE_ELEMENT_LAYER'; payload: { id: string; direction: 'up' | 'down' | 'top' | 'bottom' } }
  | { type: 'SELECT_ELEMENTS'; payload: string[] }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_TOOL'; payload: DesignerTool }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_PAN'; payload: { x: number; y: number } }
  | { type: 'TOGGLE_GRID' }
  | { type: 'TOGGLE_SNAP' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'MARK_CLEAN' };

// ── Initial State ────────────────────────────────────────────────────────────

const createInitialSide = (): BadgeSide => ({
  elements: [],
  backgroundColor: '#FFFFFF',
  backgroundImage: null,
});

const createInitialLayout = (): BadgeLayout => ({
  size: 'A6_PORTRAIT',
  orientation: 'portrait',
  front: createInitialSide(),
  back: createInitialSide(),
});

export const createInitialState = (): DesignerState => ({
  templateId: null,
  templateName: 'Untitled Badge',
  isDirty: false,
  layout: createInitialLayout(),
  activeSide: 'front',
  selectedElementIds: [],
  activeTool: 'select',
  zoom: 1,
  panX: 0,
  panY: 0,
  showGrid: true,
  snapToGrid: true,
  gridSize: 5,
  undoStack: [],
  redoStack: [],
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const cloneLayout = (layout: BadgeLayout): BadgeLayout =>
  JSON.parse(JSON.stringify(layout));

const getActiveSideElements = (state: DesignerState): DesignerElement[] => {
  return state.layout[state.activeSide].elements;
};

const updateActiveSideElements = (
  state: DesignerState,
  updater: (elements: DesignerElement[]) => DesignerElement[]
): BadgeLayout => {
  const newLayout = cloneLayout(state.layout);
  newLayout[state.activeSide].elements = updater(
    newLayout[state.activeSide].elements
  );
  return newLayout;
};

const pushUndo = (state: DesignerState): DesignerState => ({
  ...state,
  undoStack: [...state.undoStack.slice(-49), cloneLayout(state.layout)],
  redoStack: [],
  isDirty: true,
});

// ── Reducer ──────────────────────────────────────────────────────────────────

function designerReducer(state: DesignerState, action: DesignerAction): DesignerState {
  switch (action.type) {
    case 'SET_TEMPLATE_META':
      return { ...state, templateId: action.payload.id, templateName: action.payload.name };

    case 'SET_TEMPLATE_NAME':
      return { ...state, templateName: action.payload, isDirty: true };

    case 'SET_LAYOUT':
      return {
        ...state,
        ...pushUndo(state),
        layout: action.payload,
        selectedElementIds: [],
      };

    case 'SET_BADGE_SIZE': {
      const withUndo = pushUndo(state);
      const newLayout = cloneLayout(withUndo.layout);
      newLayout.size = action.payload;
      return { ...withUndo, layout: newLayout };
    }

    case 'SET_ACTIVE_SIDE':
      return { ...state, activeSide: action.payload, selectedElementIds: [] };

    case 'SET_BACKGROUND_COLOR': {
      const withUndo = pushUndo(state);
      const newLayout = cloneLayout(withUndo.layout);
      newLayout[state.activeSide].backgroundColor = action.payload;
      return { ...withUndo, layout: newLayout };
    }

    case 'SET_BACKGROUND_IMAGE': {
      const withUndo = pushUndo(state);
      const newLayout = cloneLayout(withUndo.layout);
      newLayout[state.activeSide].backgroundImage = action.payload;
      return { ...withUndo, layout: newLayout };
    }

    case 'ADD_ELEMENT': {
      const withUndo = pushUndo(state);
      const newLayout = updateActiveSideElements(withUndo, (els) => [
        ...els,
        { ...action.payload, zIndex: els.length },
      ]);
      return {
        ...withUndo,
        layout: newLayout,
        selectedElementIds: [action.payload.id],
        activeTool: 'select',
      };
    }

    case 'UPDATE_ELEMENT': {
      const { id, updates } = action.payload;
      const withUndo = pushUndo(state);
      const newLayout = updateActiveSideElements(withUndo, (els) =>
        els.map((el) => (el.id === id ? ({ ...el, ...updates } as DesignerElement) : el))
      );
      return { ...withUndo, layout: newLayout };
    }

    case 'DELETE_ELEMENTS': {
      const ids = new Set(action.payload);
      const withUndo = pushUndo(state);
      const newLayout = updateActiveSideElements(withUndo, (els) =>
        els.filter((el) => !ids.has(el.id))
      );
      return { ...withUndo, layout: newLayout, selectedElementIds: [] };
    }

    case 'DUPLICATE_ELEMENTS': {
      const ids = new Set(action.payload);
      const withUndo = pushUndo(state);
      const newIds: string[] = [];
      const newLayout = updateActiveSideElements(withUndo, (els) => {
        const duplicates = els
          .filter((el) => ids.has(el.id))
          .map((el) => {
            const newId = uuidv4();
            newIds.push(newId);
            return {
              ...JSON.parse(JSON.stringify(el)),
              id: newId,
              name: `${el.name} (copy)`,
              x: el.x + 10,
              y: el.y + 10,
            } as DesignerElement;
          });
        return [...els, ...duplicates];
      });
      return { ...withUndo, layout: newLayout, selectedElementIds: newIds };
    }

    case 'MOVE_ELEMENT_LAYER': {
      const { id, direction } = action.payload;
      const withUndo = pushUndo(state);
      const newLayout = updateActiveSideElements(withUndo, (els) => {
        const sorted = [...els].sort((a, b) => a.zIndex - b.zIndex);
        const idx = sorted.findIndex((el) => el.id === id);
        if (idx === -1) return els;

        let newIdx = idx;
        if (direction === 'up') newIdx = Math.min(idx + 1, sorted.length - 1);
        if (direction === 'down') newIdx = Math.max(idx - 1, 0);
        if (direction === 'top') newIdx = sorted.length - 1;
        if (direction === 'bottom') newIdx = 0;

        const [moved] = sorted.splice(idx, 1);
        sorted.splice(newIdx, 0, moved);
        return sorted.map((el, i) => ({ ...el, zIndex: i }));
      });
      return { ...withUndo, layout: newLayout };
    }

    case 'SELECT_ELEMENTS':
      return { ...state, selectedElementIds: action.payload };

    case 'CLEAR_SELECTION':
      return { ...state, selectedElementIds: [] };

    case 'SET_TOOL':
      return { ...state, activeTool: action.payload };

    case 'SET_ZOOM':
      return { ...state, zoom: Math.max(0.25, Math.min(3, action.payload)) };

    case 'SET_PAN':
      return { ...state, panX: action.payload.x, panY: action.payload.y };

    case 'TOGGLE_GRID':
      return { ...state, showGrid: !state.showGrid };

    case 'TOGGLE_SNAP':
      return { ...state, snapToGrid: !state.snapToGrid };

    case 'UNDO': {
      if (state.undoStack.length === 0) return state;
      const undoStack = [...state.undoStack];
      const prevLayout = undoStack.pop()!;
      return {
        ...state,
        layout: prevLayout,
        undoStack,
        redoStack: [cloneLayout(state.layout), ...state.redoStack],
        selectedElementIds: [],
        isDirty: true,
      };
    }

    case 'REDO': {
      if (state.redoStack.length === 0) return state;
      const redoStack = [...state.redoStack];
      const nextLayout = redoStack.shift()!;
      return {
        ...state,
        layout: nextLayout,
        undoStack: [...state.undoStack, cloneLayout(state.layout)],
        redoStack,
        selectedElementIds: [],
        isDirty: true,
      };
    }

    case 'MARK_CLEAN':
      return { ...state, isDirty: false };

    default:
      return state;
  }
}

// ── Element Factory ──────────────────────────────────────────────────────────

export function createTextElement(overrides?: Partial<TextDesignerElement>): TextDesignerElement {
  return {
    id: uuidv4(),
    type: 'text',
    name: 'Text',
    x: 20,
    y: 20,
    width: 200,
    height: 40,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 0,
    content: 'Your text here',
    fontFamily: 'Helvetica',
    fontSize: 18,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    color: '#1e293b',
    backgroundColor: 'transparent',
    textAlign: 'left',
    verticalAlign: 'top',
    lineHeight: 1.2,
    letterSpacing: 0,
    padding: 4,
    ...overrides,
  };
}

export function createDynamicFieldElement(
  fieldKey: DynamicFieldKey,
  overrides?: Partial<DynamicFieldDesignerElement>
): DynamicFieldDesignerElement {
  return {
    id: uuidv4(),
    type: 'dynamicField',
    name: `Field: ${fieldKey}`,
    x: 20,
    y: 20,
    width: 220,
    height: 36,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 0,
    fieldKey,
    fontFamily: 'Helvetica',
    fontSize: 16,
    fontWeight: 'normal',
    fontStyle: 'normal',
    color: '#1e293b',
    backgroundColor: 'transparent',
    textAlign: 'center',
    verticalAlign: 'middle',
    lineHeight: 1.2,
    padding: 4,
    conditionalStyles: [],
    ...overrides,
  };
}

export function createImageElement(overrides?: Partial<ImageDesignerElement>): ImageDesignerElement {
  return {
    id: uuidv4(),
    type: 'image',
    name: 'Image',
    x: 20,
    y: 20,
    width: 100,
    height: 100,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 0,
    src: '',
    objectFit: 'contain',
    borderRadius: 0,
    borderColor: 'transparent',
    borderWidth: 0,
    ...overrides,
  };
}

export function createQRCodeElement(
  overrides?: Partial<QRCodeDesignerElement>
): QRCodeDesignerElement {
  return {
    id: uuidv4(),
    type: 'qrCode',
    name: 'QR Code',
    x: 20,
    y: 20,
    width: 100,
    height: 100,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 0,
    dataSource: 'confirmationCode',
    customValue: '',
    foregroundColor: '#000000',
    backgroundColor: '#FFFFFF',
    errorCorrection: 'M',
    ...overrides,
  };
}

export function createShapeElement(
  overrides?: Partial<ShapeDesignerElement>
): ShapeDesignerElement {
  return {
    id: uuidv4(),
    type: 'shape',
    name: 'Shape',
    x: 20,
    y: 20,
    width: 120,
    height: 80,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 0,
    shapeType: 'rectangle',
    fill: '#e2e8f0',
    stroke: '#94a3b8',
    strokeWidth: 1,
    cornerRadius: 4,
    ...overrides,
  };
}

// ── Custom Hook ──────────────────────────────────────────────────────────────

export function useBadgeDesigner(initialState?: Partial<DesignerState>) {
  const [state, dispatch] = useReducer(
    designerReducer,
    { ...createInitialState(), ...initialState }
  );

  const actions = useMemo(
    () => ({
      setTemplateMeta: (id: string | null, name: string) =>
        dispatch({ type: 'SET_TEMPLATE_META', payload: { id, name } }),
      setTemplateName: (name: string) =>
        dispatch({ type: 'SET_TEMPLATE_NAME', payload: name }),
      setLayout: (layout: BadgeLayout) =>
        dispatch({ type: 'SET_LAYOUT', payload: layout }),
      setBadgeSize: (size: BadgeSizeKey) =>
        dispatch({ type: 'SET_BADGE_SIZE', payload: size }),
      setActiveSide: (side: 'front' | 'back') =>
        dispatch({ type: 'SET_ACTIVE_SIDE', payload: side }),
      setBackgroundColor: (color: string) =>
        dispatch({ type: 'SET_BACKGROUND_COLOR', payload: color }),
      setBackgroundImage: (src: string | null) =>
        dispatch({ type: 'SET_BACKGROUND_IMAGE', payload: src }),
      addElement: (element: DesignerElement) =>
        dispatch({ type: 'ADD_ELEMENT', payload: element }),
      updateElement: (id: string, updates: Partial<DesignerElement>) =>
        dispatch({ type: 'UPDATE_ELEMENT', payload: { id, updates } }),
      deleteElements: (ids: string[]) =>
        dispatch({ type: 'DELETE_ELEMENTS', payload: ids }),
      duplicateElements: (ids: string[]) =>
        dispatch({ type: 'DUPLICATE_ELEMENTS', payload: ids }),
      moveElementLayer: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') =>
        dispatch({ type: 'MOVE_ELEMENT_LAYER', payload: { id, direction } }),
      selectElements: (ids: string[]) =>
        dispatch({ type: 'SELECT_ELEMENTS', payload: ids }),
      clearSelection: () => dispatch({ type: 'CLEAR_SELECTION' }),
      setTool: (tool: DesignerTool) =>
        dispatch({ type: 'SET_TOOL', payload: tool }),
      setZoom: (zoom: number) => dispatch({ type: 'SET_ZOOM', payload: zoom }),
      setPan: (x: number, y: number) =>
        dispatch({ type: 'SET_PAN', payload: { x, y } }),
      toggleGrid: () => dispatch({ type: 'TOGGLE_GRID' }),
      toggleSnap: () => dispatch({ type: 'TOGGLE_SNAP' }),
      undo: () => dispatch({ type: 'UNDO' }),
      redo: () => dispatch({ type: 'REDO' }),
      markClean: () => dispatch({ type: 'MARK_CLEAN' }),
    }),
    []
  );

  // Derived state
  const activeElements = state.layout[state.activeSide].elements;
  const selectedElements = activeElements.filter((el) =>
    state.selectedElementIds.includes(el.id)
  );
  const canUndo = state.undoStack.length > 0;
  const canRedo = state.redoStack.length > 0;
  const badgeSize = BADGE_SIZES[state.layout.size];

  return {
    state,
    actions,
    activeElements,
    selectedElements,
    canUndo,
    canRedo,
    badgeSize,
  };
}
