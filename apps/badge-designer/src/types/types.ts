// A4, A5, A6, etc. dimensions in mm
export const PAGE_SIZES = {
  A6: { width: 105, height: 148 },
  A5: { width: 148, height: 210 },
  A4: { width: 210, height: 297 },
};

export type PageSize = keyof typeof PAGE_SIZES;

export type ElementType = 'text' | 'image' | 'qr' | 'shape';

// Base interface for all elements
interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
}

// Specific element types
export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | 'bolder' | 'lighter';
  color: string;
  textAlign: 'left' | 'center' | 'right';
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string; // URL or base64
}

export interface QRElement extends BaseElement {
  type: 'qr';
  vCardData: {
    firstName: string;
    lastName: string;
    organization: string;
    title: string;
    email: string;
  };
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: 'rectangle' | 'ellipse';
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
}

export type BadgeElement = TextElement | ImageElement | QRElement | ShapeElement;

// Represents the entire badge template (front and back)
export interface BadgeTemplate {
  id: string;
  name: string;
  pageSize: PageSize;
  frontElements: BadgeElement[];
  backElements: BadgeElement[];
  backgroundColor: string;
  backgroundImage: string | null;
} 