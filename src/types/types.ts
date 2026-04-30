export interface BikeStation {
  station_id: string;
  name: string;
  lat: number;
  lon: number;
  address: string;
  capacity: number;
}

export interface StationStatus {
  station_id: string;
  num_bikes_available: number;
  num_docks_available: number;
  is_installed: boolean;
  is_returning: boolean;
  last_reported: number;
}

export interface StationWithStatus extends BikeStation, StationStatus {}

export type MarkerColor = 'available' | 'empty' | 'full';
export type DisplayMode = 'bikes' | 'docks';

export function getMarkerColor(status: StationStatus): MarkerColor {
  if (status.num_docks_available === 0) return 'full';
  if (status.num_bikes_available === 0) return 'empty';
  return 'available';
}

export function getMarkerColorForMode(station: StationWithStatus, mode: DisplayMode): MarkerColor {
  if (mode === 'bikes') {
    if (station.num_docks_available === 0) return 'full';
    if (station.num_bikes_available === 0) return 'empty';
    return 'available';
  } else {
    // Docks mode: green if spaces available, yellow if full
    if (station.num_docks_available === 0) return 'full';
    return 'available';
  }
}
