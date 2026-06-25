/**
 * Mock de geocoding service.
 * Converte um endereço em coordenadas fixas (lat/lng).
 *
 * Em produção, isso seria substituído por um provider como Google Maps API,
 * Mapbox ou similar.
 */

interface GeocodeResult {
  lat: number;
  lng: number;
}

interface IGeocodingService {
  geocode(address: string): Promise<GeocodeResult>;
}

/**
 * Para o assessment, usamos um mapa fixo de cidades conhecidas.
 * Isso garante previsibilidade nos testes e elimina dependência externa.
 */
const CITY_COORDINATES: Record<string, GeocodeResult> = {
  "porto alegre, rs, brasil": { lat: -30.0346, lng: -51.2177 },
  "sao paulo, sp, brasil": { lat: -23.5505, lng: -46.6333 },
  "rio de janeiro, rj, brasil": { lat: -22.9068, lng: -43.1729 },
  "new york, ny, usa": { lat: 40.7128, lng: -74.006 },
  "san francisco, ca, usa": { lat: 37.7749, lng: -122.4194 },
};

function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .trim();
}

export const geocodingMock: IGeocodingService = {
  async geocode(address: string): Promise<GeocodeResult> {
    const normalized = normalizeAddress(address);

    const match = Object.entries(CITY_COORDINATES).find(([key]) =>
      normalized.includes(key)
    );

    if (match) {
      return match[1];
    }

    // fallback determinístico (evita crash no fluxo)
    return { lat: 0, lng: 0 };
  },
};