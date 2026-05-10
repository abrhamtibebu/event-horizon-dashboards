export type SurveyTriggerType = 'instant' | 'post_event' | 'manual'

export type SurveyQuestionType = 'rating' | 'multiple_choice' | 'checkbox' | 'text' | 'nps'

export interface SurveyChoiceOption {
  label: string
  value: string
}

export interface SurveyQuestionOptions {
  min?: number
  max?: number
  max_length?: number
  choices?: SurveyChoiceOption[]
}

export interface SurveyQuestion {
  id: number
  survey_id?: number
  type: SurveyQuestionType
  question_text: string
  is_required: boolean
  options: SurveyQuestionOptions | null
  order_index: number
  created_at?: string
  updated_at?: string
}

export interface Survey {
  id: number
  event_id: number
  title: string
  description: string | null
  trigger_type: SurveyTriggerType
  is_active: boolean
  is_lotto_enabled?: boolean
  created_by: number | null
  created_at?: string
  updated_at?: string
  questions?: SurveyQuestion[]
}

export interface CreateSurveyRequest {
  event_id: number
  title: string
  description?: string | null
  trigger_type: SurveyTriggerType
  is_active?: boolean
  is_lotto_enabled?: boolean
}

/** Payload for POST /events/{event}/surveys (no event_id). */
export type CreateSurveyForEventBody = Omit<CreateSurveyRequest, 'event_id'>

export interface UpdateSurveyRequest {
  title?: string
  description?: string | null
  trigger_type?: SurveyTriggerType
  is_active?: boolean
  is_lotto_enabled?: boolean
}

export interface CreateSurveyQuestionRequest {
  type: SurveyQuestionType
  question_text: string
  is_required?: boolean
  options?: SurveyQuestionOptions | null
  order_index?: number
}

export interface SurveyAnswerPayload {
  question_id: number
  value: string | number | string[] | null
}

export interface PublicSurveyPayload {
  id: number
  event_id: number
  title: string
  description: string | null
  trigger_type: SurveyTriggerType
  questions: Omit<SurveyQuestion, 'survey_id' | 'created_at' | 'updated_at'>[]
}

export interface SurveyResponseRow {
  id: number
  survey_id: number
  attendee_id: number | null
  respondent_name?: string | null
  respondent_phone?: string | null
  lotto_number?: string | null
  submitted_at: string
  answers?: {
    id: number
    question_id: number
    answer_text: string | null
    answer_value: number | null
  }[]
}

/** Laravel paginator JSON from GET /surveys/{id}/responses */
export interface SurveyResponsesPage {
  data: SurveyResponseRow[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}
