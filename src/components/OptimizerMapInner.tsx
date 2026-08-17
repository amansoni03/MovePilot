"use client";

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons for Leaflet in Next.js
const startMarkerIcon = L.divIcon({
  html: `<div class="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white shadow-xl flex items-center justify-center text-white font-bold text-xs ring-4 ring-emerald-100">A</div>`,
  className: 'custom-leaflet-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

const destMarkerIcon = L.divIcon({
  html: `<div class="w-8 h-8 rounded-full bg-red-600 border-2 border-white shadow-xl flex items-center justify-center text-white font-bold text-xs ring-4 ring-red-100">B</div>`,
  className: 'custom-leaflet-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

interface RoutePathOption {
  id: string;
  name: string;
  color: string;
  path: [number, number][];
  distance: number;
  duration: number;
  isRecommended: boolean;
}

interface OptimizerMapInnerProps {
  startCoords: { lat: number; lng: number };
  destCoords: { lat: number; lng: number };
  startName: string;
  destName: string;
  routesList: RoutePathOption[];
  selectedCandidateId: string;
  onSelectCandidate: (id: string) => void;
}

// Controller to handle Leaflet container sizing & auto-fit bounds ONLY when origin/destination actually change
const MapContainerFixController: React.FC<{ bounds: [number, number][] }> = ({ bounds }) => {
  const map = useMap();
  const prevBoundsRef = useRef<string>('');

  useEffect(() => {
    const boundsKey = JSON.stringify(bounds);
    
    // Invalidate map size once on initial mount
    map.invalidateSize();

    // Fit bounds ONLY if user selected new origin or destination coordinates (not during manual zoom/pan)
    if (boundsKey !== prevBoundsRef.current && bounds.length > 0 && bounds[0][0] && bounds[1][0]) {
      prevBoundsRef.current = boundsKey;
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [50, 50], maxZoom: 14 });
    }
  }, [bounds, map]);

  return null;
};

const OptimizerMapInner: React.FC<OptimizerMapInnerProps> = ({
  startCoords,
  destCoords,
  startName,
  destName,
  routesList,
  selectedCandidateId,
  onSelectCandidate,
}) => {
  const bounds: [number, number][] = [
    [startCoords.lat, startCoords.lng],
    [destCoords.lat, destCoords.lng],
  ];

  return (
    <div className="w-full h-[380px] relative border border-slate-200 rounded-3xl overflow-hidden shadow-inner bg-slate-100">
      <MapContainer
        center={[startCoords.lat, startCoords.lng]}
        zoom={12}
        className="w-full h-full z-10"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapContainerFixController bounds={bounds} />

        {/* Start Point Marker (A) */}
        <Marker position={[startCoords.lat, startCoords.lng]} icon={startMarkerIcon}>
          <Popup>
            <div className="p-2 text-xs font-semibold text-slate-800">
              <strong className="text-emerald-600 block mb-0.5">Start Point (Origin A)</strong>
              <span>{startName}</span>
            </div>
          </Popup>
        </Marker>

        {/* Destination Point Marker (B) */}
        <Marker position={[destCoords.lat, destCoords.lng]} icon={destMarkerIcon}>
          <Popup>
            <div className="p-2 text-xs font-semibold text-slate-800">
              <strong className="text-red-600 block mb-0.5">Destination (Point B)</strong>
              <span>{destName}</span>
            </div>
          </Popup>
        </Marker>

        {/* Multiple Alternative & Recommended Route Polylines */}
        {routesList.map((r) => {
          const isSelected = r.id === selectedCandidateId;
          return (
            <Polyline
              key={r.id}
              positions={r.path}
              color={r.color}
              weight={isSelected ? 6 : 4}
              opacity={isSelected ? 0.95 : 0.4}
              dashArray={isSelected ? undefined : '6, 6'}
              eventHandlers={{
                click: () => onSelectCandidate(r.id),
              }}
            >
              <Popup>
                <div className="p-2.5 text-xs text-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }}></span>
                    <span>{r.name}</span>
                  </div>
                  <p className="text-slate-600">
                    Distance: <strong>{r.distance} km</strong> | Time: <strong>{r.duration} mins</strong>
                  </p>
                  {r.isRecommended && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold block">
                      ★ Recommended Favorable Route
                    </span>
                  )}
                </div>
              </Popup>
            </Polyline>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default OptimizerMapInner;
