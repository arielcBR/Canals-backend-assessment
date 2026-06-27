export interface GeocodeLocation {
  city: string;
  state: string;
  country: string;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
}

export interface IGeocodingService {
  geocode(location: GeocodeLocation): Promise<GeocodeResult>;
}