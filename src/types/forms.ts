// Form Types
export type FormType = 'attendee' | 'exhibitor' | 'speaker' | 'staff' | 'sponsor';

export type FormStatus = 'draft' | 'active' | 'inactive';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'date'
  | 'datetime'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'number'
  | 'address'
  | 'hidden'
  | 'payment';

export type SubmissionStatus = 'pending' | 'completed' | 'cancelled';

export interface Form {
  id: number;
  event_id: number;
  name: string;
  form_type?: FormType; // Deprecated - kept for backward compatibility
  guest_type_id?: number;
  description?: string;
  status: FormStatus;
  is_multi_page: boolean;
  registration_limit?: number;
  expires_at?: string;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Relations
  event?: Event;
  guest_type?: GuestType;
  formFields?: FormField[];
  creator?: User;
  updater?: User;
  formSubmissions?: FormSubmission[];
  formSubmissions_count?: number;
}

export interface GuestType {
  id: number;
  event_id: number;
  name: string;
  description?: string;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface FormField {
  id: number;
  form_id: number;
  field_type: FieldType;
  label: string;
  field_key: string;
  placeholder?: string;
  is_required: boolean;
  default_value?: any;
  validation_rules?: ValidationRules;
  conditional_logic?: ConditionalLogic;
  conditional_logic_version: number;
  order: number;
  page_number: number;
  created_at: string;
  updated_at: string;

  // Relations
  form?: Form;
  fieldOptions?: FormFieldOption[];
  badgeMappings?: BadgeFieldMapping[];
}

export interface FormFieldOption {
  id: number;
  form_field_id: number;
  option_label: string;
  option_value: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface ValidationRules {
  min_length?: number;
  max_length?: number;
  pattern?: string;
  min_value?: number;
  max_value?: number;
  custom_message?: string;
}

export interface ConditionalLogic {
  field_id?: number;
  operator?: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value?: any;
  logic_group?: 'AND' | 'OR';
  conditions?: ConditionalLogic[];
}

export interface BadgeFieldMapping {
  id: number;
  form_field_id: number;
  badge_placeholder: string;
  field_type: string;
  created_at: string;
  updated_at: string;
}

export interface FormSubmission {
  id: number;
  form_id: number;
  event_id: number;
  guest_id?: number;
  attendee_id?: number;
  participant_type: string;
  submission_data: Record<string, any>;
  status: SubmissionStatus;
  ip_address?: string;
  user_agent?: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Relations
  form?: Form;
  event?: Event;
  guest?: Guest;
  attendee?: Attendee;
}

export interface FormTemplate {
  id: number;
  name: string;
  description?: string;
  form_type: FormType;
  template_data: FormTemplateData;
  is_public: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;

  // Relations
  creator?: User;
  usage_count?: number;
}

export interface FormTemplateData {
  form: {
    name: string;
    description?: string;
    is_multi_page: boolean;
  };
  fields: FormField[];
}

// API Request/Response Types
export interface CreateFormRequest {
  event_id: number;
  name: string;
  guest_type_id: number;
  form_type?: FormType; // Deprecated - kept for backward compatibility
  description?: string;
  is_multi_page?: boolean;
  registration_limit?: number;
  expires_at?: string;
}

export interface UpdateFormRequest {
  name?: string;
  guest_type_id?: number;
  form_type?: FormType; // Deprecated
  description?: string;
  status?: FormStatus;
  is_multi_page?: boolean;
  registration_limit?: number;
  expires_at?: string;
}

export interface CreateFormFieldRequest {
  field_type: FieldType;
  label: string;
  field_key?: string;
  placeholder?: string;
  is_required?: boolean;
  default_value?: any;
  validation_rules?: ValidationRules;
  conditional_logic?: ConditionalLogic;
  order?: number;
  page_number?: number;
  options?: Array<{
    label: string;
    value: string;
  }>;
}

export interface UpdateFormFieldRequest extends Partial<CreateFormFieldRequest> {}

export interface FormSubmissionRequest {
  submission_data: Record<string, any>;
}

export interface FormPreviewData {
  form: {
    id: number;
    name: string;
    form_type: FormType;
    description?: string;
    is_multi_page: boolean;
    status: FormStatus;
  };
  fields: FormField[];
  pages: Record<number, {
    page_number: number;
    fields: FormField[];
  }>;
  conditional_logic: Array<{
    field_id: number;
    logic: ConditionalLogic;
  }>;
  validation_rules: Record<string, ValidationRules>;
}

export interface FormStatistics {
  total_submissions: number;
  completed_submissions: number;
  pending_submissions: number;
  submissions_by_type: Record<string, number>;
  submissions_by_date: Record<string, number>;
  export_timestamp: string;
}

export interface SubmissionStatistics {
  total_submissions: number;
  completed_submissions: number;
  pending_submissions: number;
  cancelled_submissions: number;
  submissions_today: number;
  submissions_this_week: number;
  submissions_this_month: number;
  average_completion_time: number;
  conversion_rate: number;
}

export interface BadgeMappingSuggestion {
  placeholder: string;
  label: string;
}

export interface FormBuilderState {
  form: Partial<Form>;
  fields: FormField[];
  selectedFieldId?: number;
  isDirty: boolean;
  isPreviewMode: boolean;
  previewData?: FormPreviewData;
}

// Export formats
export type ExportFormat = 'csv' | 'excel' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  status?: SubmissionStatus;
  participant_type?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

// Form builder UI types
export interface FormFieldPaletteItem {
  type: FieldType;
  label: string;
  icon: string;
  description: string;
  category: 'basic' | 'advanced' | 'layout';
}

export interface DragItem {
  type: 'field';
  field: FormField;
  index: number;
}

export interface ConditionalLogicRule {
  id: string;
  fieldId?: number;
  operator: ConditionalLogic['operator'];
  value: any;
  logicGroup: 'AND' | 'OR';
}

// Form submission result
export interface SubmissionResult {
  success: boolean;
  submission?: FormSubmission;
  attendee?: Attendee;
  badge_generated: boolean;
  errors?: Record<string, string[]>;
  message?: string;
}

// Test submission result
export interface TestSubmissionResult {
  success: boolean;
  validated_data: Record<string, any>;
  validation_errors: Array<{
    field: string;
    message: string;
  }>;
  conditional_logic_results: Array<{
    field: string;
    should_show: boolean;
    logic: ConditionalLogic;
  }>;
  badge_mappings: Array<{
    field_key: string;
    field_value: any;
    badge_placeholder: string;
    mapped_value: any;
  }>;
  errors?: string[];
}

// Form template categories
export interface FormTemplateCategory {
  label: string;
  description: string;
  icon: string;
}

// Placeholder types for external dependencies
interface Event {
  id: number;
  name: string;
  // Add other event properties as needed
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  // Add other user properties as needed
}

interface Guest {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  jobtitle?: string;
  // Add other guest properties as needed
}

interface Attendee {
  id: number;
  event_id: number;
  guest_id: number;
  guest_type_id: number;
  checked_in: boolean;
  // Add other attendee properties as needed
}
