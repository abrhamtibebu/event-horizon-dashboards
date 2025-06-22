import { create } from 'zustand';
import { BadgeTemplate, BadgeElement, ElementType, PageSize } from '../types/types';
import { v4 as uuidv4 } from 'uuid';

type BadgeSide = 'front' | 'back';

interface BadgeState {
  template: BadgeTemplate;
  selectedElementId: string | null;
  activeSide: BadgeSide;

  // Actions
  setTemplate: (template: BadgeTemplate) => void;
  updateTemplateInfo: (updates: Partial<Omit<BadgeTemplate, 'frontElements' | 'backElements'>>) => void;
  setActiveSide: (side: BadgeSide) => void;

  addElement: (type: ElementType) => void;
  setSelectedElementId: (id: string | null) => void;
  updateElement: (id: string, updates: Partial<BadgeElement>) => void;
  deleteElement: (id: string) => void;
  moveElement: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
}

const getInitialState = (): BadgeTemplate => ({
  id: uuidv4(),
  name: 'Untitled Badge',
  pageSize: 'A6',
  frontElements: [],
  backElements: [],
  backgroundColor: '#ffffff',
  backgroundImage: null,
});

const getZIndex = (elements: BadgeElement[], direction: 'top' | 'bottom') => {
  if (elements.length === 0) return 1;
  const zIndexes = elements.map(e => e.zIndex);
  if (direction === 'top') return Math.max(...zIndexes) + 1;
  return Math.min(...zIndexes) - 1;
};

export const useBadgeStore = create<BadgeState>((set, get) => ({
  template: getInitialState(),
  selectedElementId: null,
  activeSide: 'front',

  setTemplate: (template) => set({ template, selectedElementId: null, activeSide: 'front' }),
  
  updateTemplateInfo: (updates) => set(state => ({
    template: { ...state.template, ...updates }
  })),

  setActiveSide: (activeSide) => set({ activeSide, selectedElementId: null }),

  setSelectedElementId: (id) => set({ selectedElementId: id }),

  addElement: (type) => {
    const newElement: BadgeElement = {
      id: uuidv4(),
      type,
      x: 50,
      y: 50,
      rotation: 0,
      zIndex: getZIndex(get().activeSide === 'front' ? get().template.frontElements : get().template.backElements, 'top'),
      ...(type === 'text' && {
        content: 'New Text',
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'normal',
        color: '#000000',
        textAlign: 'left',
        width: 150,
        height: 30,
      }),
      ...(type === 'image' && {
        src: 'https://via.placeholder.com/150',
        width: 150,
        height: 100,
      }),
      ...(type === 'qr' && {
        vCardData: { firstName: 'John', lastName: 'Doe', organization: 'VEMS', title: 'Attendee', email: 'john.doe@example.com' },
        width: 100,
        height: 100,
      }),
       ...(type === 'shape' && {
        shapeType: 'rectangle',
        backgroundColor: '#cccccc',
        borderColor: '#333333',
        borderWidth: 1,
        width: 100,
        height: 100,
      }),
    } as BadgeElement;

    set(state => {
      const elements = state.activeSide === 'front' ? 'frontElements' : 'backElements';
      return {
        template: {
          ...state.template,
          [elements]: [...state.template[elements], newElement],
        },
        selectedElementId: newElement.id
      };
    });
  },
  
  updateElement: (id, updates) => {
    set(state => {
      const elementsKey = state.activeSide === 'front' ? 'frontElements' : 'backElements';
      const updatedElements = state.template[elementsKey].map(el =>
        el.id === id ? { ...el, ...updates } : el
      );
      return {
        template: { ...state.template, [elementsKey]: updatedElements }
      };
    });
  },

  deleteElement: (id) => {
     set(state => {
      const elementsKey = state.activeSide === 'front' ? 'frontElements' : 'backElements';
      const filteredElements = state.template[elementsKey].filter(el => el.id !== id);
      return {
        template: { ...state.template, [elementsKey]: filteredElements },
        selectedElementId: state.selectedElementId === id ? null : state.selectedElementId
      };
    });
  },
  
  moveElement: (id, direction) => {
    // Logic for re-ordering z-index will be implemented here
    // For now, this is a placeholder
    console.log(`Moving element ${id} ${direction}`);
  },
})); 