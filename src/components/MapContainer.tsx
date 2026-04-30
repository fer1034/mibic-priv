import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { StationWithStatus, DisplayMode } from '../types/types';
import { getMarkerColor, getMarkerColorForMode } from '../types/types';

const GDL_CENTER: [number, number] = [-103.3496, 20.6596];
const GDL_BOUNDS: mapboxgl.LngLatBoundsLike = [
  [-103.46, 20.57],
  [-103.24, 20.75],
];

interface Props {
  stations: StationWithStatus[];
  onSelectStation: (station: StationWithStatus | null) => void;
  selectedId: string | null;
  displayMode: DisplayMode;
}

export default function MapContainer({ stations, onSelectStation, selectedId, displayMode }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, { marker: mapboxgl.Marker; el: HTMLElement }>>(new Map());
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Init map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let cancelled = false;

    async function initMap() {
      try {
        const res = await fetch('/api/mapbox-token');
        if (!res.ok) throw new Error(`${res.status}`);
        const { token } = await res.json() as { token: string };

        if (cancelled || !mapContainerRef.current) return;

        mapboxgl.accessToken = token;

        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: GDL_CENTER,
          zoom: 13,
        });

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.addControl(new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }), 'top-right');

        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          map.setMaxBounds(GDL_BOUNDS);
        }

        mapRef.current = map;

        map.on('load', () => {
          if (!cancelled) setMapReady(true);
        });
      } catch (e) {
        if (!cancelled) {
          setError('No se pudo inicializar el mapa.');
        }
      }
    }

    initMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  function addMarkers(map: mapboxgl.Map, stationList: StationWithStatus[]) {
    stationList.forEach((station) => {
      const colorClass = getMarkerColorForMode(station, displayMode);
      const el = document.createElement('div');
      el.className = `custom-marker ${colorClass}`;
      el.textContent = String(displayMode === 'bikes' ? station.num_bikes_available : station.num_docks_available);
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

  // Render markers when stations or displayMode changes
  useEffect(() => {
    if (!mapRef.current || stations.length === 0) return;

    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current.clear();
    addMarkers(mapRef.current, stations);
  }, [stations, displayMode]);

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
      {stations.length === 0 && (
        <div className="loading-overlay">
          <div className="spinner" />
          <span className="loading-text">Cargando estaciones...</span>
        </div>
      )}
      {error && <div className="error-banner">{error}</div>}
    </div>
  );
}
