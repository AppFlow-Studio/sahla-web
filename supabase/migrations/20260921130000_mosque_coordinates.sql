-- Store each mosque's real coordinates so prayer times stop depending on a
-- third-party geocoder.
-- ----------------------------------------------------------------------------
-- Every AlAdhan call we make today passes a free-text address or city, which
-- forces THEIR geocoder to run. That geocoder returns 503 for anything outside
-- its cache, so real street addresses fail outright:
--   calendarByAddress "200 Vesey Street"                       -> 503
--   calendarByAddress "200 Vesey Street, New York, NY 10281"   -> 503
--   calendar          latitude=40.7127&longitude=-74.0134      -> 200
--
-- Google Places already hands back `location.latitude/longitude` on every
-- address the admin picks during onboarding — app/api/places/details/route.ts
-- has been discarding them, with a comment saying exactly that. Persist them
-- here and the lat/lng endpoints work regardless of AlAdhan's geocoder.
--
-- `geocoded_at` / `geocode_source` exist so a stale or hand-entered coordinate
-- is distinguishable from a freshly resolved one.

alter table public.mosques
  add column if not exists latitude       double precision,
  add column if not exists longitude      double precision,
  add column if not exists geocoded_at    timestamptz,
  add column if not exists geocode_source text;

comment on column public.mosques.latitude is
  'WGS84 latitude used for prayer-time calculation. Set from Google Places at address-selection time, or backfilled by geocoding the stored address.';
comment on column public.mosques.longitude is
  'WGS84 longitude. See latitude.';
comment on column public.mosques.geocode_source is
  'Where the coordinates came from: google_places, google_geocoding, manual, or backfill.';

-- Guard against a transposed or placeholder pair being written. AlAdhan happily
-- returns times for nonsense coordinates, so a bad value fails silently and the
-- mosque simply gets another city's prayer times.
alter table public.mosques
  drop constraint if exists mosques_coordinates_in_range;
alter table public.mosques
  add constraint mosques_coordinates_in_range check (
    (latitude is null and longitude is null)
    or (latitude between -90 and 90 and longitude between -180 and 180)
  );

-- Partial index: the sync job's only question is "which mosques still need
-- coordinates", so index the rows that lack them.
create index if not exists idx_mosques_missing_coordinates
  on public.mosques (id)
  where latitude is null or longitude is null;
