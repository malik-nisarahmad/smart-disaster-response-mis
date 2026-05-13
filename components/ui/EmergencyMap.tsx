"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface Emergency {
  id: number;
  disaster_type_name: string;
  severity: string;
  latitude: number;
  longitude: number;
  location_description: string;
  status: string;
  // Allow other properties to exist
  [key: string]: any;
}

interface EmergencyMapProps {
  emergencies: Emergency[];
  selected: Emergency | null;
  onSelect: (em: Emergency | null) => void;
}

const severityColor: Record<string, string> = {
  Critical: "#ef4444",
  High:     "#f97316",
  Moderate: "#eab308",
  Low:      "#22c55e",
};

// Sub-component: fly to selected marker
function FlyToSelected({ selected }: { selected: Emergency | null }) {
  const map = useMap();
  useEffect(() => {
    if (selected && selected.latitude && selected.longitude) {
      map.flyTo([selected.latitude, selected.longitude], 14, { duration: 1 });
    }
  }, [selected, map]);
  return null;
}

export default function EmergencyMap({ emergencies, selected, onSelect }: EmergencyMapProps) {
  const defaultCenter: [number, number] = [33.6844, 73.0479]; // Islamabad

  const validEmergencies = emergencies.filter(
    e => e.latitude && e.longitude && !isNaN(e.latitude) && !isNaN(e.longitude)
  );

  return (
    <div className="w-full h-full min-h-[290px] rounded-xl overflow-hidden border border-slate-200">
      <MapContainer
        center={defaultCenter}
        zoom={11}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", minHeight: "290px" }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyToSelected selected={selected} />
        {validEmergencies.map((em) => {
          const color = severityColor[em.severity] || "#64748b";
          const isSelected = selected?.id === em.id;
          return (
            <CircleMarker
              key={em.id}
              center={[em.latitude, em.longitude]}
              radius={isSelected ? 14 : 10}
              pathOptions={{
                fillColor: color,
                color: isSelected ? "#1e40af" : "#fff",
                weight: isSelected ? 3 : 2,
                fillOpacity: 0.9,
              }}
              eventHandlers={{ click: () => onSelect(em) }}
            >
              <Popup>
                <div className="text-xs font-semibold">
                  <p className="font-bold text-slate-900">{em.disaster_type_name}</p>
                  <p className="text-slate-600">{em.location_description?.split(",")[0]}</p>
                  <p className="mt-1">
                    <span className="font-bold" style={{ color }}>{em.severity}</span>
                    {" · "}
                    <span className="text-slate-500">{em.status}</span>
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
