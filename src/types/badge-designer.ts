// Badge Designer Type System
// Comprehensive types for the Konva.js-based drag-and-drop badge editor

// ── Canvas & Layout ──────────────────────────────────────────────────────────

export const BADGE_SIZES = {
  A6_PORTRAIT: { width: 105, height: 148, label: 'A6 Portrait (105×148mm)' },
  A6_LANDSCAPE: { width: 148, height: 105, label: 'A6 Landscape (148×105mm)' },
  CR80: { width: 85.6, height: 53.98, label: 'CR80 Card (85.6×54mm)' },
  CUSTOM_4X4: { width: 100, height: 100, label: '4×4 inch (100×100mm)' },
  CUSTOM_4X6: { width: 100, height: 150, label: '4×6 inch (100×150mm)' },
} as const;

export type BadgeSizeKey = keyof typeof BADGE_SIZES;

export interface BadgeSize {
  width: number;
  height: number;
  label: string;
}

// Conversion: 1mm = 3.7795275591 px at 96dpi. We use a simpler scale factor.
export const MM_TO_PX = 3.78;

// ── Element Types ────────────────────────────────────────────────────────────

export type DesignerElementType =
  | 'text'
  | 'dynamicField'
  | 'image'
  | 'qrCode'
  | 'barcode'
  | 'shape'
  | 'line';

// Dynamic fields that can be bound to attendee data
export type DynamicFieldKey =
  | 'firstName'
  | 'lastName'
  | 'fullName'
  | 'company'
  | 'jobTitle'
  | 'email'
  | 'phone'
  | 'guestType'
  | 'ticketType'
  | 'qrCode'
  | 'attendeePhoto'
  | 'customField1'
  | 'customField2'
  | 'customField3';

export const DYNAMIC_FIELD_LABELS: Record<DynamicFieldKey, string> = {
  firstName: 'First Name',
  lastName: 'Last Name',
  fullName: 'Full Name',
  company: 'Company',
  jobTitle: 'Job Title',
  email: 'Email',
  phone: 'Phone',
  guestType: 'Guest Type',
  ticketType: 'Ticket Type',
  qrCode: 'QR Code',
  attendeePhoto: 'Attendee Photo',
  customField1: 'Custom Field 1',
  customField2: 'Custom Field 2',
  customField3: 'Custom Field 3',
};

// ── Base Element ─────────────────────────────────────────────────────────────

export interface BaseDesignerElement {
  id: string;
  type: DesignerElementType;
  name: string; // User-friendly label in the layers panel
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
}

// ── Text Element ─────────────────────────────────────────────────────────────

export interface TextDesignerElement extends BaseDesignerElement {
  type: 'text';
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline' | 'line-through';
  color: string;
  backgroundColor: string;
  textAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
  lineHeight: number;
  letterSpacing: number;
  padding: number;
}

// ── Dynamic Field Element ────────────────────────────────────────────────────

export interface DynamicFieldDesignerElement extends BaseDesignerElement {
  type: 'dynamicField';
  fieldKey: DynamicFieldKey;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  color: string;
  backgroundColor: string;
  textAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
  lineHeight: number;
  padding: number;
  // Conditional styling rules
  conditionalStyles?: ConditionalStyle[];
}

export interface ConditionalStyle {
  id: string;
  condition: {
    field: DynamicFieldKey;
    operator: 'equals' | 'contains' | 'startsWith';
    value: string;
  };
  style: {
    color?: string;
    backgroundColor?: string;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
  };
}

// ── Image Element ────────────────────────────────────────────────────────────

export interface ImageDesignerElement extends BaseDesignerElement {
  type: 'image';
  src: string;
  objectFit: 'contain' | 'cover' | 'fill';
  borderRadius: number;
  borderColor: string;
  borderWidth: number;
}

// ── QR Code Element ──────────────────────────────────────────────────────────

export interface QRCodeDesignerElement extends BaseDesignerElement {
  type: 'qrCode';
  dataSource: 'attendeeId' | 'confirmationCode' | 'customUrl' | 'vCard';
  customValue: string;
  foregroundColor: string;
  backgroundColor: string;
  errorCorrection: 'L' | 'M' | 'Q' | 'H';
}

// ── Barcode Element ──────────────────────────────────────────────────────────

export interface BarcodeDesignerElement extends BaseDesignerElement {
  type: 'barcode';
  format: 'CODE128' | 'CODE39' | 'EAN13' | 'QR';
  dataSource: 'attendeeId' | 'confirmationCode' | 'custom';
  customValue: string;
  color: string;
}

// ── Shape Element ────────────────────────────────────────────────────────────

export interface ShapeDesignerElement extends BaseDesignerElement {
  type: 'shape';
  shapeType: 'rectangle' | 'ellipse' | 'circle';
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
}

// ── Line Element ─────────────────────────────────────────────────────────────

export interface LineDesignerElement extends BaseDesignerElement {
  type: 'line';
  points: number[]; // [x1, y1, x2, y2, ...]
  stroke: string;
  strokeWidth: number;
  dash: number[];
}

// ── Union Type ───────────────────────────────────────────────────────────────

export type DesignerElement =
  | TextDesignerElement
  | DynamicFieldDesignerElement
  | ImageDesignerElement
  | QRCodeDesignerElement
  | BarcodeDesignerElement
  | ShapeDesignerElement
  | LineDesignerElement;

// ── Badge Layout (serialized template) ───────────────────────────────────────

export interface BadgeSide {
  elements: DesignerElement[];
  backgroundColor: string;
  backgroundImage: string | null;
}

export interface BadgeLayout {
  size: BadgeSizeKey;
  orientation: 'portrait' | 'landscape';
  front: BadgeSide;
  back: BadgeSide;
}

// ── Designer State ───────────────────────────────────────────────────────────

export type DesignerTool =
  | 'select'
  | 'text'
  | 'dynamicField'
  | 'image'
  | 'qrCode'
  | 'shape'
  | 'line'
  | 'pan';

export interface DesignerState {
  // Template metadata
  templateId: string | null;
  templateName: string;
  isDirty: boolean;

  // Layout
  layout: BadgeLayout;
  activeSide: 'front' | 'back';

  // Selection
  selectedElementIds: string[];
  activeTool: DesignerTool;

  // Canvas
  zoom: number;
  panX: number;
  panY: number;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;

  // History
  undoStack: BadgeLayout[];
  redoStack: BadgeLayout[];
}

// ── Sample Data for Preview ──────────────────────────────────────────────────

export interface SampleAttendeeData {
  firstName: string;
  lastName: string;
  fullName: string;
  company: string;
  jobTitle: string;
  email: string;
  phone: string;
  guestType: string;
  ticketType: string;
  qrCode: string;
  attendeePhoto: string;
  customField1: string;
  customField2: string;
  customField3: string;
}

export const DEFAULT_SAMPLE_DATA: SampleAttendeeData = {
  firstName: 'Jane',
  lastName: 'Smith',
  fullName: 'Jane Smith',
  company: 'TechCorp Inc.',
  jobTitle: 'Product Manager',
  email: 'jane@techcorp.com',
  phone: '+1 (555) 123-4567',
  guestType: 'VIP',
  ticketType: 'Premium',
  qrCode: 'REG-00000001',
  attendeePhoto: '',
  customField1: 'Workshop A',
  customField2: 'Table 5',
  customField3: '',
};

// ── Font Catalog ─────────────────────────────────────────────────────────────

export const FONT_FAMILIES = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Courier New',
  'Inter',
  'Roboto',
  'Open Sans',
  'Montserrat',
  'Lato',
  'Poppins',
  'Outfit',
] as const;

// ── Color Presets ────────────────────────────────────────────────────────────

export const COLOR_PRESETS = [
  '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
  '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1',
  '#dc2626', '#ea580c', '#d97706', '#65a30d', '#0891b2', '#2563eb',
  '#7c3aed', '#c026d3', '#e11d48', '#0d9488', '#4f46e5', '#9333ea',
] as const;
