// Public ticket purchase types (no authentication required)

export interface PublicTicketType {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  sold: number;
  remaining: number;
  reserved: number;
  available_for_sale: number;
  percent_remaining: number;
  availability_status: 'available' | 'limited' | 'selling_fast' | 'sold_out';
  status: string;
  benefits?: string[];
  is_featured?: boolean;
}

export interface PublicEvent {
  id: number;
  uuid: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  venue_name: string;
  status: string;
  event_type: string;
  image_url: string;
}

export interface TicketSelection {
  ticket_type_id: number;
  quantity: number;
  ticketType: PublicTicketType;
}

export interface AttendeeDetails {
  name: string;
  email: string;
  phone: string;
  company?: string;
  job_title?: string;
  gender?: string;
  country?: string;
  dietary_requirements?: string;
  special_accommodations?: string;
  guest_names?: string[];
  agreed_to_terms: boolean;
  subscribed_to_newsletter?: boolean;
}

export interface ReservationRequest {
  event_uuid: string;
  tickets: {
    ticket_type_id: number;
    quantity: number;
  }[];
  attendee_email: string;
  attendee_phone?: string;
}

export interface ReservationResponse {
  message: string;
  reservation_token: string;
  expires_at: string;
  expires_in_seconds: number;
  reservations: {
    ticket_type_id: number;
    ticket_type_name: string;
    quantity: number;
    price_per_ticket: number;
    subtotal: number;
  }[];
  total_amount: number;
}

export interface PaymentInitiationRequest {
  event_uuid: string;
  tickets: {
    ticket_type_id: number;
    quantity: number;
  }[];
  attendee_details: AttendeeDetails;
  payment_method: 'telebirr' | 'cbe_birr' | 'dashen_superapp' | 'bank';
  reservation_token?: string;
}

export interface PaymentInitiationResponse {
  success: boolean;
  message: string;
  data: {
    payment_id: number;
    payment_reference: string;
    transaction_id: string;
    checkout_url: string;
    expires_at: string;
    payment_method: string;
    amount: number;
    currency: string;
  };
}

export interface PaymentConfirmationResponse {
  success: boolean;
  message: string;
  data: {
    payment: any;
    tickets: {
      id: number;
      ticket_number: string;
      qr_code_path: string;
    }[];
  };
}

export interface TicketTypesResponse {
  event: PublicEvent;
  ticket_types: PublicTicketType[];
}


