export interface TelebirrEventData {
  id: number
  uuid: string
  name: string
  title?: string
  description: string
  start_date: string
  end_date: string
  location: string
  max_guests: number
  event_type: string
  status?: string
  venue_name?: string
  formatted_address?: string
  image?: string
  image_url?: string
  event_image?: string
  registration_start_date?: string
  registration_end_date?: string
  is_registration_open?: boolean
  guestTypes?: Array<{ id: number; name: string }>
  organizer?: { name: string; logo?: string }
}

export interface TelebirrFormData {
  fullName: string
  email: string
  phoneNumber: string
  organization: string
  jobTitle: string
  joiningAs: string
  guest_type_id?: string
  profilePicture?: File | null
}

export interface TelebirrRegistrationData {
  id: number
  guest_uuid?: string
  guest_name?: string
  guest_email?: string
  guest_job_title?: string
  guest_company?: string
  registration_code?: string
}

export interface TelebirrRegistrationSuccessState {
  registrationData: TelebirrRegistrationData
  eventData: TelebirrEventData
}
