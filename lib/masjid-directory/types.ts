export type VerificationStatus = "unverified" | "computed" | "masjid_confirmed";

export type Masjid = {
  id: string;
  slug: string;
  name: string;
  name_ar: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  calculation_method: number | null;
  school: number | null;
  is_sahla_customer: boolean;
  mosque_id: string | null;
  verification_status: VerificationStatus;
  last_verified_at: string | null;
  verified_by: string | null;
  data_source: string | null;
  opted_out: boolean;
  created_at: string;
  updated_at: string;
};

export type MasjidJummah = {
  id: string;
  masjid_id: string;
  session_number: number;
  time: string;
  khateeb: string | null;
  language: string | null;
  created_at: string;
  updated_at: string;
};
