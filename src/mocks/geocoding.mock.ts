import type {
  IGeocodingService,
  GeocodeLocation,
  GeocodeResult,
} from "../interfaces/geocoding.service.interface";

import { AppError } from "../errors/AppError";

const CITY_COORDINATES: Record<string, GeocodeResult> = {
  "sao leopoldo, rs, brazil": { lat: -29.7547, lng: -51.1498 },
  "caxias do sul, rs, brazil": { lat: -29.1681, lng: -51.1794 },
  "porto alegre, rs, brazil": { lat: -30.0346, lng: -51.2177 },
  "sao paulo, sp, brazil": { lat: -23.5505, lng: -46.6333 },
  "rio de janeiro, rj, brazil": { lat: -22.9068, lng: -43.1729 },
  "new york, ny, usa": { lat: 40.7128, lng: -74.0060 },
  "san francisco, ca, usa": { lat: 37.7749, lng: -122.4194 },
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export const geocodingMock: IGeocodingService = {
  async geocode(location: GeocodeLocation): Promise<GeocodeResult> {
    const key = [
      normalize(location.city),
      normalize(location.state),
      normalize(location.country),
    ].join(", ");

    const coordinates = CITY_COORDINATES[key];

    if (coordinates) {
      return coordinates;
    }

    throw new AppError(
      `Address could not be geocoded: ${key}`,
      422,
      "GEOCODING_FAILED"
    );
  },
};