import type { BikeStation, StationStatus, StationWithStatus } from '../types/types';

const BASE_URL = 'https://guadalajara-mx.publicbikesystem.net/customer/gbfs/v2/es';

export async function fetchStationInformation(): Promise<BikeStation[]> {
  const res = await fetch(`${BASE_URL}/station_information.json`);
  if (!res.ok) throw new Error(`Error fetching station info: ${res.status}`);
  const data = await res.json();
  return data.data.stations as BikeStation[];
}

export async function fetchStationStatus(): Promise<StationStatus[]> {
  const res = await fetch(`${BASE_URL}/station_status.json`);
  if (!res.ok) throw new Error(`Error fetching station status: ${res.status}`);
  const data = await res.json();
  return data.data.stations as StationStatus[];
}

export async function fetchAllStations(): Promise<StationWithStatus[]> {
  const [stations, statuses] = await Promise.all([
    fetchStationInformation(),
    fetchStationStatus(),
  ]);

  const statusMap = new Map(statuses.map((s) => [s.station_id, s]));

  return stations
    .map((station) => {
      const status = statusMap.get(station.station_id);
      if (!status) return null;
      return { ...station, ...status };
    })
    .filter((s): s is StationWithStatus => s !== null);
}
