export interface Guest {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  jobtitle?: string;
  profile_image_url?: string;
  uuid?: string;
  profile_picture?: string;
}

export interface GuestType {
  id: number;
  name: string;
}

export interface Attendee {
  id: number;
  event_id: number;
  guest_id: number;
  guest_type_id: number;
  checked_in: boolean;
  check_in_time?: string;
  guest?: Guest;
  guestType?: GuestType;
} 