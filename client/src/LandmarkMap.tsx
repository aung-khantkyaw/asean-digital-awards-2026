import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, LayersControl, Polyline, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { LatLngTuple } from "leaflet";

interface Location {
  id: string;
  english_name: string;
  burmese_name: string;
  lat: number;
  lon: number;
  type: string;
  address: string;
  description: string;
}

interface Road {
  id: string;
  english_name: string;
  burmese_name: string;
  geojson: string;
  is_oneway: boolean;
  road_type: string;
  total_length: number;
}

// Fix for default marker icon issue with Vite
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Type assertion to unknown before casting to any to avoid 'any' directly
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
  ._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function LandmarkMap() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [roads, setRoads] = useState<Road[]>([]);
  const [showLocations, setShowLocations] = useState(true);
  const [showRoadLabels, setShowRoadLabels] = useState(true);
  const [showRoads, setShowRoads] = useState(true);
  const mapCenter: LatLngTuple = [16.733333, 95.65];

  useEffect(() => {
    fetch("http://127.0.0.1:4000/user/locations")
      .then(res => res.json())
      .then(data => setLocations(data.data))
      .catch(err => console.error(err));

    fetch("http://127.0.0.1:4000/user/roads")
      .then(res => res.json())
      .then(data => setRoads(data.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="relative">
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        <button 
          onClick={() => setShowLocations(!showLocations)}
          className="bg-white px-3 py-1 rounded shadow text-sm"
        >
          {showLocations ? 'Hide' : 'Show'} Locations
        </button>
        <button 
          onClick={() => setShowRoadLabels(!showRoadLabels)}
          className="bg-white px-3 py-1 rounded shadow text-sm"
        >
          {showRoadLabels ? 'Hide' : 'Show'} Road Labels
        </button>
        <button 
          onClick={() => setShowRoads(!showRoads)}
          className="bg-white px-3 py-1 rounded shadow text-sm"
        >
          {showRoads ? 'Hide' : 'Show'} Roads
        </button>
      </div>
      <MapContainer
        center={mapCenter}
        zoom={14}
        style={{ height: "80vh", width: "100%" }}
      >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Default">
          <TileLayer
            attribution="©OpenStreetMap, ©CartoDB"
            url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite">
          <TileLayer
            attribution=""
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      {showRoads && roads.map((road) => {
        const geoData = JSON.parse(road.geojson);
        const positions: LatLngTuple[] = geoData.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
        
        return (
          <Polyline key={road.id} positions={positions} color="#3388ff" weight={3}>
            {showRoadLabels && (
              <Tooltip permanent direction="center" className="road-label">
                {road.english_name}
              </Tooltip>
            )}
          </Polyline>
        );
      })}

      {showLocations && locations.map((location) => (
        <Marker key={location.id} position={[location.lat, location.lon]}>
          <Popup>
            <b>{location.english_name}</b>
          </Popup>
        </Marker>
      ))}
      </MapContainer>
    </div>
  );
}

export default LandmarkMap;
