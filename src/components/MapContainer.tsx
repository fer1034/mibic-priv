import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { fetchAllStations } from '../services/bikeStationApi';
import type { StationWithStatus } from '../types/types';
import { getMarkerColor } from '../types/types';

const MAPBOX_TOKEN = import.meta.env.PUBLIC_MAPBOX_TOKEN as string;
const GDL_CENTER: [number, number] = [-103.3496, 20.6596];

interface Props {
  onSelectStation: (station: StationWithStatus | null) => void;
  selectedId: string | null;
}

export default function MapContainer({ onSelectStation, selectedId }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, { marker: mapboxgl.Marker; el: HTMLElement }>>(new Map());
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [stations, setStations] = useState<StationWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Init map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: GDL_CENTER,
      zoom: 13,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }), 'top-right');

    mapRef.current = map;

    map.on('load', async () => {
      try {
        const data = await fetchAllStations();
        setStations(data);
        addMarkers(map, data);
      } catch (e) {
        setError('No se pudo cargar la información de estaciones.');
      } finally {
        setLoading(false);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  function addMarkers(map: mapboxgl.Map, stationList: StationWithStatus[]) {
    stationList.forEach((station) => {
      const colorClass = getMarkerColor(station);
      const el = document.createElement('div');
      el.className = `custom-marker ${colorClass}`;
      el.textContent = String(station.num_bikes_available);
      el.title = station.name;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([station.lon, station.lat])
        .addTo(map);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        showPopup(map, station);
        onSelectStation(station);
      });

      markersRef.current.set(station.station_id, { marker, el });
    });
  }

  function showPopup(map: mapboxgl.Map, station: StationWithStatus) {
    popupRef.current?.remove();

    const colorClass = getMarkerColor(station);
    const statusLabel = colorClass === 'available' ? 'Disponible' : colorClass === 'full' ? 'Estación llena' : 'Sin bicicletas';

    const html = `
      <div class="popup-header ${colorClass}">${station.name} — ${statusLabel}</div>
      <div class="popup-body">
        <div class="popup-row"><span>Bicicletas</span><span>${station.num_bikes_available}</span></div>
        <div class="popup-row"><span>Espacios libres</span><span>${station.num_docks_available}</span></div>
        <div class="popup-row"><span>Capacidad total</span><span>${station.capacity}</span></div>
        ${station.address ? `<div class="popup-address">${station.address}</div>` : ''}
      </div>
    `;

    popupRef.current = new mapboxgl.Popup({ offset: 18, closeButton: true, maxWidth: '280px' })
      .setLngLat([station.lon, station.lat])
      .setHTML(html)
      .addTo(map);
  }

  // Sync selected marker highlight
  useEffect(() => {
    markersRef.current.forEach(({ el }, id) => {
      el.classList.toggle('selected', id === selectedId);
    });

    if (selectedId && mapRef.current) {
      const station = stations.find((s) => s.station_id === selectedId);
      if (station) {
        mapRef.current.flyTo({ center: [station.lon, station.lat], zoom: 15, duration: 600 });
        showPopup(mapRef.current, station);
      }
    }
  }, [selectedId, stations]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainerRef} id="mapbox-container" />
      {loading && (
        <div className="loading-overlay">
          <div className="spinner" />
          <span className="loading-text">Cargando estaciones...</span>
        </div>
      )}
      {error && <div className="error-banner">{error}</div>}
    </div>
  );
}
