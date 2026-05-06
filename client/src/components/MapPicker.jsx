import React, { useState, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';

/* ── Fix Leaflet default icon paths broken by Vite/Webpack bundling ── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/* Custom accent-coloured marker */
const accentIcon = new L.Icon({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:      [25, 41],
  iconAnchor:    [12, 41],
  popupAnchor:   [1, -34],
  shadowSize:    [41, 41],
  className:     'map-marker-accent',
});

/* ── GeoSearch control injected into map ── */
function GeoSearchBar() {
  const map = useMap();

  useEffect(() => {
    const provider = new OpenStreetMapProvider();
    const searchControl = new GeoSearchControl({
      provider,
      style:           'bar',
      showMarker:      false,
      showPopup:       false,
      autoClose:       true,
      retainZoomLevel: false,
      animateZoom:     true,
      keepResult:      false,
      searchLabel:     'Пошук адреси…',
    });

    map.addControl(searchControl);
    return () => map.removeControl(searchControl);
  }, [map]);

  return null;
}

/* ── Click-to-place marker ── */
function ClickMarker({ position, setPosition, onLocationSelect }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition(e.latlng);
      onLocationSelect({ lat, lng });
    },
  });

  return position ? <Marker position={position} icon={accentIcon} /> : null;
}

/* ── Main MapPicker ── */
const MapPicker = ({ onLocationSelect, closeModal }) => {
  const DEFAULT_CENTER = [49.4229, 26.9871];
  const [markerPos, setMarkerPos] = useState(null);
  const overlayRef = useRef(null);

  /* Close on backdrop click */
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) closeModal();
  };

  /* Prevent body scroll while modal is open */
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleConfirm = () => {
    if (markerPos) {
      onLocationSelect({ lat: markerPos.lat, lng: markerPos.lng });
    }
    closeModal();
  };

  return (
    <div
      className="map-modal-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div className="map-modal-content">
        {/* Header */}
        <div className="map-modal-header">
          <div className="map-modal-title">
            <span className="map-modal-icon">📍</span>
            <h3>Оберіть точку на мапі</h3>
          </div>
          <button
            id="map-modal-close"
            onClick={closeModal}
            className="map-modal-close-btn"
            aria-label="Закрити"
          >
            ✕
          </button>
        </div>

        <p className="map-modal-hint">
          Натисніть на карту або знайдіть адресу через пошук
        </p>

        {/* Map */}
        <div className="map-leaflet-wrapper">
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={12}
            scrollWheelZoom={false}   /* prevents page scroll conflict on mobile */
            tap={true}                /* iOS touch support */
            style={{ height: '100%', width: '100%' }}
          >
            {/* Dark CartoDB tiles — no API key needed */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            <GeoSearchBar />

            <ClickMarker
              position={markerPos}
              setPosition={setMarkerPos}
              onLocationSelect={() => {}}   /* coords confirmed on button press */
            />
          </MapContainer>
        </div>

        {/* Footer */}
        <div className="map-modal-footer">
          {markerPos ? (
            <span className="map-coords-display">
              📌 {markerPos.lat.toFixed(5)}, {markerPos.lng.toFixed(5)}
            </span>
          ) : (
            <span className="map-coords-hint">Точку не обрано</span>
          )}
          <div className="map-modal-actions">
            <button className="map-btn-cancel" onClick={closeModal}>
              Скасувати
            </button>
            <button
              className="map-btn-confirm"
              onClick={handleConfirm}
              disabled={!markerPos}
            >
              Підтвердити
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPicker;