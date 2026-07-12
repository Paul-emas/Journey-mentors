export type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first'

export type PassengerType = 'adult' | 'child' | 'infant_without_seat'

export type PlaceType = 'airport' | 'city'

export type BaggageType = 'checked' | 'carry_on'

export type PassengerIdentityDocumentType =
  | 'passport'
  | 'tax_id'
  | 'known_traveler_number'
  | 'passenger_redress_number'

export type FareType =
  | 'accompanying_adult'
  | 'contract_bulk'
  | 'contract_bulk_child'
  | 'contract_bulk_infant_with_seat'
  | 'contract_bulk_infant_without_seat'
  | 'frequent_flyer'
  | 'group_inclusive_tour'
  | 'group_inclusive_tour_child'
  | 'humanitarian'
  | 'individual_inclusive_tour_child'
  | 'marine'
  | 'seat_only'
  | 'student'
  | 'teacher'
  | 'tour_operator_inclusive'
  | 'tour_operator_inclusive_infant'
  | 'unaccompanied_child'
  | 'visiting_friends_and_family'

export interface Airline {
  id: string
  name: string
  iata_code: string | null
  logo_symbol_url: string | null
  logo_lockup_url: string | null
  conditions_of_carriage_url: string | null
}

export interface Aircraft {
  id: string
  name: string
  iata_code: string
}

export interface City {
  id: string
  type: 'city'
  name: string
  iata_code: string
  iata_city_code: string | null
  iata_country_code: string
  city_name: string | null
  icao_code: string | null
  latitude: number | null
  longitude: number | null
  time_zone: string | null
  airports?: Airport[]
}

export interface Airport {
  id: string
  type: 'airport'
  name: string
  iata_code: string | null
  icao_code: string
  iata_city_code: string | null
  iata_country_code: string
  city_name: string
  city: City | null
  latitude: number
  longitude: number
  time_zone: string
}

export type Place = Airport | City

export type FlightCondition = {
  allowed: boolean
  penalty_amount: string | null
  penalty_currency: string | null
}

export interface OfferConditions {
  refund_before_departure: FlightCondition | null
  change_before_departure: FlightCondition | null
}

export interface SliceConditions {
  change_before_departure: FlightCondition | null
  advance_seat_selection: boolean | null
  priority_boarding: boolean | null
  priority_check_in: boolean | null
}

export interface Baggage {
  type: BaggageType
  quantity: number
}

export type SeatType =
  | 'standard'
  | 'extra_legroom'
  | 'skycouch'
  | 'recliner'
  | 'angle_flat'
  | 'full_flat'
  | 'private_suite'

export interface SeatAmenity {
  pitch: string
  legroom: string
  type: SeatType | null
}

export interface WifiAmenity {
  available: boolean
  cost: 'free' | 'paid' | 'free or paid' | 'n/a'
}

export interface PowerAmenity {
  available: boolean
}

export interface CabinAmenities {
  seat: SeatAmenity | null
  wifi: WifiAmenity | null
  power: PowerAmenity | null
}

export interface Cabin {
  name: CabinClass
  marketing_name: string
  amenities: CabinAmenities | null
}

export interface SegmentPassenger {
  passenger_id: string
  cabin_class: CabinClass
  cabin_class_marketing_name: string
  fare_basis_code: string | null
  baggages: Baggage[]
  cabin: Cabin | null
}

export interface Stop {
  id: string
  airport: Airport
  departing_at: string
  arriving_at: string
  duration: string
}

export interface Segment {
  id: string
  origin: Airport
  destination: Airport
  origin_terminal: string | null
  destination_terminal: string | null
  // Local datetime without offset, in the origin/destination airport's time zone
  departing_at: string
  arriving_at: string
  duration: string | null
  distance: string | null // kilometers
  aircraft: Aircraft | null
  marketing_carrier: Airline
  marketing_carrier_flight_number: string
  operating_carrier: Airline
  operating_carrier_flight_number: string
  stops: Stop[]
  passengers: SegmentPassenger[]
  media: unknown[]
}

export interface Slice {
  id: string
  origin: Place
  destination: Place
  origin_type: PlaceType
  destination_type: PlaceType
  duration: string | null
  fare_brand_name: string | null
  comparison_key: string
  ngs_shelf: number | null
  segments: Segment[]
  conditions: SliceConditions
}

export interface LoyaltyProgrammeAccount {
  airline_iata_code: string
  account_number: string
}

export interface OfferPassenger {
  id: string
  type: PassengerType | null
  age: number | null
  given_name: string | null
  family_name: string | null
  fare_type: FareType | null
  loyalty_programme_accounts: LoyaltyProgrammeAccount[]
}

export interface PaymentRequirements {
  requires_instant_payment: boolean
  price_guarantee_expires_at: string | null
  payment_required_by: string | null
}

export interface PrivateFare {
  type: 'corporate' | 'leisure' | 'negotiated'
  corporate_code?: string
  tracking_reference?: string
}

interface AvailableServiceBase {
  id: string
  maximum_quantity: number
  passenger_ids: string[]
  segment_ids: string[]
  total_amount: string
  total_currency: string
}

export interface BaggageServiceMetadata {
  type: BaggageType
  maximum_weight_kg: number | null
  maximum_height_cm: number | null
  maximum_length_cm: number | null
  maximum_depth_cm: number | null
}

export interface CancelForAnyReasonServiceMetadata {
  refund_amount: string
  merchant_copy: string
  terms_and_conditions_url: string
}

export type AvailableService =
  | (AvailableServiceBase & { type: 'baggage'; metadata: BaggageServiceMetadata })
  | (AvailableServiceBase & {
      type: 'cancel_for_any_reason'
      metadata: CancelForAnyReasonServiceMetadata
    })

export interface IntendedService {
  id: string
  quantity: number
}

export interface Offer {
  id: string
  live_mode: boolean
  partial: boolean
  created_at: string
  updated_at: string
  expires_at: string
  owner: Airline
  slices: Slice[]
  passengers: OfferPassenger[]
  conditions: OfferConditions
  total_amount: string
  total_currency: string
  base_amount: string
  base_currency: string
  tax_amount: string | null
  tax_currency: string | null
  // Totals once intended_services are included
  intended_total_amount: string
  intended_base_amount: string
  intended_services: IntendedService[] | null
  total_emissions_kg: string | null
  payment_requirements: PaymentRequirements
  passenger_identity_documents_required: boolean
  supported_passenger_identity_document_types: PassengerIdentityDocumentType[]
  supported_loyalty_programmes: string[]
  private_fares: PrivateFare[]
  available_services: AvailableService[] | null
  available_airline_credit_ids: string[]
}

// The search criteria echoed back on the offer request, not an offer slice
export interface OfferRequestSlice {
  origin: Place
  destination: Place
  origin_type: PlaceType
  destination_type: PlaceType
  departure_date: string
}

export type OfferRequestPassenger = Omit<OfferPassenger, 'fare_type'>

export interface OfferRequest {
  id: string
  live_mode: boolean
  created_at: string
  cabin_class?: CabinClass | null
  // Token for initializing Duffel UI components with this search
  client_key?: string
  slices: OfferRequestSlice[]
  passengers: OfferRequestPassenger[]
  offers: Offer[]
  airline_credit_ids: string[]
}

export interface OfferRequestResponse {
  data: OfferRequest
}

// Minimal shapes accepted by Duffel when *creating* an offer request.
// Unlike OfferRequestSlice/OfferRequestPassenger (which echo back full
// place/passenger objects), the create payload only needs IATA codes and type.
export interface CreateOfferRequestSlice {
  origin: string
  destination: string
  departure_date: string
}

export interface CreateOfferRequestPassenger {
  type: PassengerType
}

export interface CreateOfferRequestPayload {
  slices: CreateOfferRequestSlice[]
  passengers: CreateOfferRequestPassenger[]
  cabin_class?: CabinClass
}
