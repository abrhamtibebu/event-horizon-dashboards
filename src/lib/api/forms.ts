import api from '../api';
import type {
  Form,
  CreateFormRequest,
  UpdateFormRequest,
  FormField,
  CreateFormFieldRequest,
  UpdateFormFieldRequest,
  FormSubmission,
  FormTemplate,
  FormPreviewData,
  FormStatistics,
  SubmissionStatistics,
  BadgeFieldMapping,
  BadgeMappingSuggestion,
  FormSubmissionRequest,
  SubmissionResult,
  TestSubmissionResult,
  ExportOptions,
  ExportFormat,
  FormTemplateCategory,
} from '@/types/forms';

// Form API functions
export const formApi = {
  // Get all forms for an event
  getEventForms: async (eventId: number, guestTypeId?: number): Promise<Form[]> => {
    const params = guestTypeId ? { guest_type_id: guestTypeId } : {};
    const response = await api.get(`/events/${eventId}/forms`, { params });
    return response.data;
  },

  // Get form by guest type for an event
  getFormByGuestType: async (eventId: number, guestTypeId: number): Promise<Form> => {
    const response = await api.get(`/events/${eventId}/forms/by-guest-type/${guestTypeId}`);
    return response.data;
  },

  // Create a new form
  createForm: async (eventId: number, data: CreateFormRequest): Promise<Form> => {
    const response = await api.post(`/events/${eventId}/forms`, data);
    return response.data;
  },

  // Get a specific form
  getForm: async (formId: number): Promise<Form> => {
    const response = await api.get(`/forms/${formId}`);
    return response.data;
  },

  // Update a form
  updateForm: async (formId: number, data: UpdateFormRequest): Promise<Form> => {
    const response = await api.put(`/forms/${formId}`, data);
    return response.data;
  },

  // Delete a form
  deleteForm: async (formId: number): Promise<void> => {
    await api.delete(`/forms/${formId}`);
  },

  // Duplicate a form
  duplicateForm: async (formId: number): Promise<Form> => {
    const response = await api.post(`/forms/${formId}/duplicate`);
    return response.data;
  },

  // Activate a form
  activateForm: async (formId: number): Promise<Form> => {
    const response = await api.post(`/forms/${formId}/activate`);
    return response.data;
  },

  // Deactivate a form
  deactivateForm: async (formId: number): Promise<Form> => {
    const response = await api.post(`/forms/${formId}/deactivate`);
    return response.data;
  },

  // Get form statistics
  getFormStatistics: async (formId: number): Promise<FormStatistics> => {
    const response = await api.get(`/forms/${formId}/statistics`);
    return response.data;
  },

  // Get form preview data
  getFormPreview: async (formId: number) => {
    const response = await api.get(`/forms/${formId}/preview`);
    return response.data;
  },
};

// Form Field API functions
export const formFieldApi = {
  // Create a field for a form
  createField: async (formId: number, data: CreateFormFieldRequest): Promise<FormField> => {
    const response = await api.post(`/forms/${formId}/fields`, data);
    return response.data;
  },

  // Update a form field
  updateField: async (formId: number, fieldId: number, data: UpdateFormFieldRequest): Promise<FormField> => {
    const response = await api.put(`/forms/${formId}/fields/${fieldId}`, data);
    return response.data;
  },

  // Delete a form field
  deleteField: async (formId: number, fieldId: number): Promise<void> => {
    await api.delete(`/forms/${formId}/fields/${fieldId}`);
  },

  // Reorder form fields
  reorderFields: async (formId: number, fieldIds: number[]): Promise<{ message: string }> => {
    const response = await api.post(`/forms/${formId}/fields/reorder`, { field_ids: fieldIds });
    return response.data;
  },

  // Create badge field mapping
  createBadgeMapping: async (
    formId: number,
    fieldId: number,
    data: { badge_placeholder: string; field_type: string }
  ): Promise<BadgeFieldMapping> => {
    const response = await api.post(`/forms/${formId}/fields/${fieldId}/mappings`, data);
    return response.data;
  },

  // Update badge field mapping
  updateBadgeMapping: async (
    formId: number,
    fieldId: number,
    mappingId: number,
    data: { badge_placeholder: string; field_type: string }
  ): Promise<BadgeFieldMapping> => {
    const response = await api.put(`/forms/${formId}/fields/${fieldId}/mappings/${mappingId}`, data);
    return response.data;
  },

  // Delete badge field mapping
  deleteBadgeMapping: async (formId: number, fieldId: number, mappingId: number): Promise<void> => {
    await api.delete(`/forms/${formId}/fields/${fieldId}/mappings/${mappingId}`);
  },

  // Get available badge placeholders for a field
  getAvailablePlaceholders: async (formId: number, fieldId: number): Promise<{
    placeholders: Record<string, string>;
    suggestions: BadgeMappingSuggestion[];
  }> => {
    const response = await api.get(`/forms/${formId}/fields/${fieldId}/available-placeholders`);
    return response.data;
  },
};

// Form Submission API functions
export const formSubmissionApi = {
  // Get form submissions with pagination and filtering
  getSubmissions: async (
    formId: number,
    params?: {
      page?: number;
      per_page?: number;
      status?: string;
      participant_type?: string;
      date_from?: string;
      date_to?: string;
      search?: string;
    }
  ): Promise<{
    data: FormSubmission[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  }> => {
    const response = await api.get(`/forms/${formId}/submissions`, { params });
    return response.data;
  },

  // Get a specific submission
  getSubmission: async (formId: number, submissionId: number): Promise<FormSubmission> => {
    const response = await api.get(`/forms/${formId}/submissions/${submissionId}`);
    return response.data;
  },

  // Submit form data (public endpoint)
  submitForm: async (formId: number, data: FormSubmissionRequest): Promise<SubmissionResult> => {
    const response = await api.post(`/forms/${formId}/submit`, data);
    return response.data;
  },

  // Export submissions
  exportSubmissions: async (
    formId: number,
    options: ExportOptions
  ): Promise<Blob> => {
    const params = new URLSearchParams();
    params.append('format', options.format);
    if (options.status) params.append('status', options.status);
    if (options.participant_type) params.append('participant_type', options.participant_type);
    if (options.date_from) params.append('date_from', options.date_from);
    if (options.date_to) params.append('date_to', options.date_to);
    if (options.search) params.append('search', options.search);

    const response = await api.get(`/forms/${formId}/submissions/export?${params}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Get submission statistics
  getSubmissionStatistics: async (formId: number): Promise<SubmissionStatistics> => {
    const response = await api.get(`/forms/${formId}/submission-statistics`);
    return response.data;
  },

  // Get available export formats
  getExportFormats: async (): Promise<Record<ExportFormat, string>> => {
    const response = await api.get('/form-submissions/export-formats');
    return response.data;
  },
};

// Form Preview API functions
export const formPreviewApi = {
  // Get form preview data
  getPreview: async (formId: number): Promise<FormPreviewData> => {
    const response = await api.get(`/forms/${formId}/preview`);
    return response.data;
  },

  // Test form submission
  testSubmit: async (formId: number, data: FormSubmissionRequest): Promise<TestSubmissionResult> => {
    const response = await api.post(`/forms/${formId}/preview/test`, data);
    return response.data;
  },

  // Get form schema for external integrations
  getSchema: async (formId: number): Promise<any> => {
    const response = await api.get(`/forms/${formId}/preview/schema`);
    return response.data;
  },

  // Get sample form data
  getSampleData: async (formId: number): Promise<Record<string, any>> => {
    const response = await api.get(`/forms/${formId}/preview/sample-data`);
    return response.data;
  },
};

// Form Template API functions
export const formTemplateApi = {
  // Get all available templates
  getTemplates: async (params?: {
    form_type?: string;
    page?: number;
    per_page?: number;
  }): Promise<{
    data: FormTemplate[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  }> => {
    const response = await api.get('/form-templates', { params });
    return response.data;
  },

  // Get a specific template
  getTemplate: async (templateId: number): Promise<FormTemplate> => {
    const response = await api.get(`/form-templates/${templateId}`);
    return response.data;
  },

  // Create a new template
  createTemplate: async (data: {
    name: string;
    description?: string;
    form_type: string;
    template_data: any;
    is_public?: boolean;
  }): Promise<FormTemplate> => {
    const response = await api.post('/form-templates', data);
    return response.data;
  },

  // Update a template
  updateTemplate: async (templateId: number, data: Partial<{
    name: string;
    description: string;
    form_type: string;
    template_data: any;
    is_public: boolean;
  }>): Promise<FormTemplate> => {
    const response = await api.put(`/form-templates/${templateId}`, data);
    return response.data;
  },

  // Delete a template
  deleteTemplate: async (templateId: number): Promise<void> => {
    await api.delete(`/form-templates/${templateId}`);
  },

  // Use a template to create a new form
  useTemplate: async (templateId: number, data: {
    event_id: number;
    form_name?: string;
  }): Promise<Form> => {
    const response = await api.post(`/form-templates/${templateId}/use`, data);
    return response.data;
  },

  // Get template categories
  getCategories: async (): Promise<Record<string, FormTemplateCategory>> => {
    const response = await api.get('/form-templates/categories');
    return response.data;
  },

  // Get popular templates
  getPopularTemplates: async (): Promise<FormTemplate[]> => {
    const response = await api.get('/form-templates/popular');
    return response.data;
  },
};

// Combined API object for easy importing
export const formsApi = {
  forms: formApi,
  fields: formFieldApi,
  submissions: formSubmissionApi,
  preview: formPreviewApi,
  templates: formTemplateApi,
};

// Default export
export default formsApi;
