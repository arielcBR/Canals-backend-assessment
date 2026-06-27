import type { IGeocodingService, GeocodeResult } from "../interfaces/geocoding.service.interface";

const CITY_COORDINATES: Record<string, GeocodeResult> = {
  "porto alegre, rs, brasil":    { lat: -30.0346, lng: -51.2177 },
  "sao paulo, sp, brasil":       { lat: -23.5505, lng: -46.6333 },
  "rio de janeiro, rj, brasil":  { lat: -22.9068, lng: -43.1729 },
  "new york, ny, usa":           { lat:  40.7128, lng: -74.006  },
  "san francisco, ca, usa":      { lat:  37.7749, lng: -122.4194 },
};

function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export const geocodingMock: IGeocodingService = {
  async geocode(address: string): Promise<GeocodeResult> {
    const normalized = normalizeAddress(address);
    const match = Object.entries(CITY_COORDINATES).find(([key]) =>
      normalized.includes(key)
    );

    if (match) return match[1];

    return { lat: 0, lng: 0 };
  },
};