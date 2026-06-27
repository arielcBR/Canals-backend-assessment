export interface GeocodeResult {
  lat: number;
  lng: number;
}

export interface IGeocodingService {
  geocode(address: string): Promise<GeocodeResult>;
}