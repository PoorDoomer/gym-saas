import { z } from 'zod'

export const memberSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  membership_plan_id: z.string().optional(),
  notes: z.string().optional()
})

export type MemberSchema = z.infer<typeof memberSchema>
