import type { StationWithStatus } from '../types/types';
import { getMarkerColor } from '../types/types';

interface Props {
  stations: StationWithStatus[];
  selectedId: string | null;
  onSelect: (station: StationWithStatus) => void;
}

export default function StationPanel({ stations, selectedId, onSelect }: Props) {
  const available = stations.filter((s) => s.num_bikes_available > 0 && s.num_docks_available > 0).length;
  const empty = stations.filter((s) => s.num_bikes_available === 0).length;
  const full = stations.filter((s) => s.num_docks_available === 0).length;

  return (
    <>
      <div className="stats-bar">
        <div className="stat-chip available">
          <span className="stat-dot" />
          {available} disp.
        </div>
        <div className="stat-chip empty">
          <span className="stat-dot" />
          {empty} vacías
        </div>
        <div className="stat-chip full">
          <span className="stat-dot" />
          {full} llenas
        </div>
      </div>
      <div className="side-panel-content">
        {stations.map((station) => {
          const color = getMarkerColor(station);
          const label =
            color === 'available'
              ? `${station.num_bikes_available} bici${station.num_bikes_available !== 1 ? 's' : ''}`
              : color === 'full'
              ? 'Llena'
              : 'Sin bicis';

          return (
            <div
              key={station.station_id}
              className={`station-card${selectedId === station.station_id ? ' selected' : ''}`}
              onClick={() => onSelect(station)}
            >
              <div className="station-card-name">{station.name}</div>
              <div className="station-card-info">
                <span className={`badge ${color}`}>{label}</span>
                <span className={`badge ${color}`}>{station.num_docks_available} espacios</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
