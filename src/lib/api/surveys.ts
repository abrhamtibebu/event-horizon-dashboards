import axios from 'axios'
import api from '../api'
import type {
  CreateSurveyForEventBody,
  CreateSurveyQuestionRequest,
  CreateSurveyRequest,
  PublicSurveyPayload,
  Survey,
  SurveyResponsesPage,
  UpdateSurveyRequest,
} from '@/types/survey'

const SURVEY_ROUTES_PROBE_KEY = 'validity_survey_routes_unavailable'

/** Call after deploy or from UI Retry so we probe both URL shapes again. */
export function clearSurveyRoutesProbe(): void {
  try {
    sessionStorage.removeItem(SURVEY_ROUTES_PROBE_KEY)
  } catch {
    /* private mode */
  }
}

function surveyRoutesMarkedUnavailable(): boolean {
  try {
    return sessionStorage.getItem(SURVEY_ROUTES_PROBE_KEY) === '1'
  } catch {
    return false
  }
}

function markSurveyRoutesUnavailable(): void {
  try {
    sessionStorage.setItem(SURVEY_ROUTES_PROBE_KEY, '1')
  } catch {
    /* ignore */
  }
}

/** True when the API host has no survey routes, or survey tables are not migrated yet. */
export function isSurveyApiMissingError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false
  const status = error.response?.status
  if (status === 404) return true
  const code = (error.response?.data as { code?: string } | undefined)?.code
  return status === 503 && code === 'surveys_schema_missing'
}

async function getSurveysListWithFallback(eventId: number): Promise<Survey[]> {
  const onlyNested = surveyRoutesMarkedUnavailable()

  if (onlyNested) {
    try {
      const { data } = await api.get<Survey[]>(`/events/${eventId}/surveys`)
      clearSurveyRoutesProbe()
      return data
    } catch (e) {
      if (isSurveyApiMissingError(e)) throw e
      clearSurveyRoutesProbe()
      throw e
    }
  }

  try {
    const { data } = await api.get<Survey[]>(`/events/${eventId}/surveys`)
    clearSurveyRoutesProbe()
    return data
  } catch (e) {
    if (!isSurveyApiMissingError(e)) throw e
    try {
      const { data } = await api.get<Survey[]>(`/surveys/event/${eventId}`)
      clearSurveyRoutesProbe()
      return data
    } catch (e2) {
      if (isSurveyApiMissingError(e2)) markSurveyRoutesUnavailable()
      throw e2
    }
  }
}

async function postSurveyCreateWithFallback(
  eventId: number,
  body: CreateSurveyForEventBody,
): Promise<Survey> {
  const onlyNested = surveyRoutesMarkedUnavailable()

  if (onlyNested) {
    try {
      const { data } = await api.post<Survey>(`/events/${eventId}/surveys`, body)
      clearSurveyRoutesProbe()
      return data
    } catch (e) {
      if (isSurveyApiMissingError(e)) throw e
      clearSurveyRoutesProbe()
      throw e
    }
  }

  try {
    const { data } = await api.post<Survey>(`/events/${eventId}/surveys`, body)
    clearSurveyRoutesProbe()
    return data
  } catch (e) {
    if (!isSurveyApiMissingError(e)) throw e
    try {
      const { data } = await api.post<Survey>('/surveys', { ...body, event_id: eventId })
      clearSurveyRoutesProbe()
      return data
    } catch (e2) {
      if (isSurveyApiMissingError(e2)) markSurveyRoutesUnavailable()
      throw e2
    }
  }
}

export const surveyApi = {
  listForEvent: async (eventId: number): Promise<Survey[]> => {
    return getSurveysListWithFallback(eventId)
  },

  /** Prefer nested URL; falls back to legacy paths if the server returns 404. */
  create: async (eventId: number, body: CreateSurveyForEventBody): Promise<Survey> => {
    return postSurveyCreateWithFallback(eventId, body)
  },

  /** Legacy: POST /surveys with event_id in JSON body. */
  createWithEventId: async (body: CreateSurveyRequest): Promise<Survey> => {
    const { data } = await api.post<Survey>('/surveys', body)
    return data
  },

  update: async (surveyId: number, body: UpdateSurveyRequest): Promise<Survey> => {
    const { data } = await api.put<Survey>(`/surveys/${surveyId}`, body)
    return data
  },

  remove: async (surveyId: number): Promise<void> => {
    await api.delete(`/surveys/${surveyId}`)
  },

  addQuestion: async (surveyId: number, body: CreateSurveyQuestionRequest): Promise<void> => {
    await api.post(`/surveys/${surveyId}/questions`, body)
  },

  updateQuestion: async (
    questionId: number,
    body: Partial<CreateSurveyQuestionRequest>,
  ): Promise<void> => {
    await api.put(`/survey-questions/${questionId}`, body)
  },

  deleteQuestion: async (questionId: number): Promise<void> => {
    await api.delete(`/survey-questions/${questionId}`)
  },

  reorderQuestions: async (surveyId: number, questionIds: number[]): Promise<void> => {
    await api.post(`/surveys/${surveyId}/questions/reorder`, {
      question_ids: questionIds,
    })
  },

  getResponses: async (
    surveyId: number,
    page = 1,
    perPage = 20,
  ): Promise<SurveyResponsesPage> => {
    const { data } = await api.get<SurveyResponsesPage>(`/surveys/${surveyId}/responses`, {
      params: { page, per_page: perPage },
    })
    return data
  },

  downloadLottoNumbers: async (surveyId: number): Promise<Blob> => {
    const { data } = await api.get(`/surveys/${surveyId}/download-lotto-numbers`, {
      responseType: 'blob',
    })
    return data
  },
}

export async function fetchPublicSurvey(
  eventId: number,
  params?: { attendee_id?: number; eligible?: boolean },
): Promise<PublicSurveyPayload> {
  const { data } = await api.get<PublicSurveyPayload>(`/public/surveys/${eventId}`, {
    params: {
      attendee_id: params?.attendee_id,
      eligible: params?.eligible ? '1' : undefined,
    },
  })
  return data
}

export async function submitPublicSurvey(
  surveyId: number,
  body: {
    attendee_id?: number | null
    respondent_name?: string | null
    respondent_phone?: string | null
    answers: { question_id: number; value: unknown }[]
  },
  query?: { eligible?: boolean },
): Promise<{ message: string; response_id: number; lotto_number?: string }> {
  const { data } = await api.post(`/public/surveys/${surveyId}/submit`, body, {
    params: query?.eligible ? { eligible: '1' } : undefined,
  })
  return data as { message: string; response_id: number; lotto_number?: string }
}
