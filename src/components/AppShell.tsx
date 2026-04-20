import { useState } from 'react';
import type { StationWithStatus } from '../types/types';
import MapContainer from './MapContainer';
import StationPanel from './StationPanel';
import { fetchAllStations } from '../services/bikeStationApi';
import { useEffect } from 'react';

interface Props {
  token: string;
}

export default function AppShell({ token }: Props) {
  const [stations, setStations] = useState<StationWithStatus[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchAllStations()
      .then(setStations)
      .catch(() => {});
  }, []);

  function handleSelectStation(station: StationWithStatus | null) {
    setSelectedId(station?.station_id ?? null);
  }

  function handlePanelSelect(station: StationWithStatus) {
    setSelectedId(station.station_id);
  }

  return (
    <div className="app-body">
      <div className="map-wrapper">
        <MapContainer onSelectStation={handleSelectStation} selectedId={selectedId} token={token} />
      </div>
      <aside className="side-panel">
        <div className="side-panel-header">
          <h2>Estaciones ({stations.length})</h2>
        </div>
        <StationPanel stations={stations} selectedId={selectedId} onSelect={handlePanelSelect} />
      </aside>
    </div>
  );
}
