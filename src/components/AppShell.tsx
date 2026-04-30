import { useState } from 'react';
import type { StationWithStatus, DisplayMode } from '../types/types';
import MapContainer from './MapContainer';
import StationPanel from './StationPanel';
import { fetchAllStations } from '../services/bikeStationApi';
import { useEffect } from 'react';

export default function AppShell() {
  const [stations, setStations] = useState<StationWithStatus[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('bikes');

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
        <MapContainer
          stations={stations}
          onSelectStation={handleSelectStation}
          selectedId={selectedId}
          displayMode={displayMode}
        />
        <button
          className="mode-toggle"
          onClick={() => setDisplayMode(m => m === 'bikes' ? 'docks' : 'bikes')}
          aria-label="Toggle between bikes and docking spaces"
        >
          <span className={displayMode === 'bikes' ? 'active' : ''}>🚲</span>
          <span className={displayMode === 'docks' ? 'active' : ''}>🅿️</span>
        </button>
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
