export type Event = {
  id: number | string
  event_name: string
  event_time: string
  event_description?: string | null
  route?: string | null
  event_start?: string | null
  created_at?: string
  updated_at?: string
}

export type RegistrationInput = {
  eventId: number
  name: string
  surname: string
  email: string
  phone?: string
  gender?: string
  birth_year?: number
  club?: string
  country?: string
  city?: string
}

export type RegistrationDTO = {
  id: number
  event_id: number
  name: string
  surname: string
  email: string
  phone: string
  gender: string
  birth_year: number | null
  club: string
  country: string
  city: string
  start_number: number | null
  created_at: string
  updated_at: string
}

export type EventCreateInput = {
  event_name: string
  event_time: string
  event_description?: string
  route: string
  event_start?: string
}

export type NewEventFormState = {
  event_name: string
  event_date: string
  event_time: string
  event_description: string
  event_route: string
  event_location: string
}


