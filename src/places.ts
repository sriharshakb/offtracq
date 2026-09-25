export type Place = {
  // Unique per marker (several markers can share a countryId).
  key: string;
  // ISO-3166 numeric country code, matching the topojson feature ids above.
  countryId: string;
  name: string;
  role: string;
  coordinates: [number, number];
  home?: boolean;
};

// A handful of pins per home country (India, USA) instead of just one,
// plus a single pin for each one-trip destination.
export const PLACES: Place[] = [
  { key: "us-denver", countryId: "840", name: "Denver, CO", role: "Home base", coordinates: [-104.9903, 39.7392], home: true },
  { key: "us-telluride", countryId: "840", name: "Telluride, CO", role: "Via Ferrata", coordinates: [-107.8123, 37.9375] },
  { key: "us-estes-park", countryId: "840", name: "Estes Park, CO", role: "Seven Keys Inn", coordinates: [-105.5217, 40.3772] },
  { key: "us-havasupai", countryId: "840", name: "Havasupai, AZ", role: "Havasupai Falls", coordinates: [-112.6979, 36.2551] },
  { key: "us-santa-fe", countryId: "840", name: "Santa Fe, NM", role: "Chimayó pilgrimage", coordinates: [-105.9378, 35.687] },
  { key: "us-texas", countryId: "840", name: "Austin, TX", role: "Texas", coordinates: [-97.7431, 30.2672] },
  { key: "us-florida", countryId: "840", name: "Miami, FL", role: "Florida", coordinates: [-80.1918, 25.7617] },
  { key: "us-california", countryId: "840", name: "Los Angeles, CA", role: "California", coordinates: [-118.2437, 34.0522] },
  { key: "us-utah", countryId: "840", name: "Moab, UT", role: "Utah", coordinates: [-109.5498, 38.5733] },

  { key: "in-delhi", countryId: "356", name: "New Delhi", role: "Where I'm from", coordinates: [77.209, 28.6139] },
  { key: "in-hyderabad", countryId: "356", name: "Hyderabad", role: "India", coordinates: [78.4867, 17.385] },
  { key: "in-mumbai", countryId: "356", name: "Mumbai", role: "India", coordinates: [72.8777, 19.076] },
  { key: "in-bengaluru", countryId: "356", name: "Bengaluru", role: "India", coordinates: [77.5946, 12.9716] },

  { key: "nepal", countryId: "524", name: "Nepal", role: "Everest Base Camp", coordinates: [85.324, 27.7172] },
  { key: "bhutan", countryId: "064", name: "Bhutan", role: "Visited", coordinates: [89.6339, 27.4712] },
  { key: "indonesia", countryId: "360", name: "Indonesia", role: "Bali", coordinates: [115.1889, -8.4095] },
];


export const VISITED_IDS = new Set(PLACES.map((place) => place.countryId));
export const PLACE_COUNT = PLACES.length;
export const COUNTRY_COUNT = VISITED_IDS.size;
