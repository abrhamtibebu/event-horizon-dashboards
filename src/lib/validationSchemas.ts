import { z } from 'zod';

/**
 * Attendee details validation schema
 */
export const attendeeDetailsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .regex(/^\+?251[0-9]{9}$/, 'Please enter a valid Ethiopian phone number (e.g., +251911234567 or 0911234567)')
    .or(z.string().regex(/^0[0-9]{9}$/, 'Please enter a valid phone number'))
    .transform((val) => {
      // Normalize phone number to start with +251
      if (val.startsWith('0')) {
        return `+251${val.substring(1)}`;
      }
      if (!val.startsWith('+')) {
        return `+${val}`;
      }
      return val;
    }),
  company: z.string().optional(),
  job_title: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']).optional(),
  country: z.string().optional(),
  dietary_requirements: z.string().max(500, 'Dietary requirements are too long').optional(),
  special_accommodations: z.string().max(500, 'Special accommodations text is too long').optional(),
  guest_names: z.array(z.string().min(2, 'Guest name must be at least 2 characters')).optional(),
  agreed_to_terms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
  subscribed_to_newsletter: z.boolean().optional(),
});

export type AttendeeDetailsFormData = z.infer<typeof attendeeDetailsSchema>;

/**
 * Ticket selection validation schema
 */
export const ticketSelectionSchema = z.object({
  tickets: z
    .array(
      z.object({
        ticket_type_id: z.number(),
        quantity: z.number().min(1).max(10),
      })
    )
    .min(1, 'Select at least one ticket'),
});

export type TicketSelectionFormData = z.infer<typeof ticketSelectionSchema>;







