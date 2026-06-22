import React, { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

type Props = {
  latitude: number;
  longitude: number;
  onChange: (next: { latitude: number; longitude: number }) => void;
};

const positionIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function RecenterMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom(), {
      animate: true,
    });
  }, [latitude, longitude, map]);

  return null;
}

function MapClickHandler({ onChange }: Pick<Props, "onChange">) {
  useMapEvents({
    click(event) {
      onChange({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return null;
}

export default function LocationPickerMap({ latitude, longitude, onChange }: Props) {
  return (
    <div className="solar-noon-map">
      <MapContainer center={[latitude, longitude]} zoom={10} scrollWheelZoom className="solar-noon-leaflet">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          draggable
          eventHandlers={{
            dragend(event) {
              const marker = event.target;
              const nextPosition = marker.getLatLng();
              onChange({
                latitude: nextPosition.lat,
                longitude: nextPosition.lng,
              });
            },
          }}
          icon={positionIcon}
          position={[latitude, longitude]}
        />
        <RecenterMap latitude={latitude} longitude={longitude} />
        <MapClickHandler onChange={onChange} />
      </MapContainer>
    </div>
  );
}
