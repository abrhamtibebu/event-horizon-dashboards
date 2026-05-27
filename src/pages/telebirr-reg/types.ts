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
  venue_name?: string
  formatted_address?: string
  image?: string
  guestTypes?: Array<{ id: number; name: string }>
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
  country: string
  otherCountry?: string
  city: string
  otherCity?: string
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
