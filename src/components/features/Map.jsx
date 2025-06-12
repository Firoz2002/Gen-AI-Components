"use client";

import { useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

const UK_BOUNDS = [
  [49.5, -10.5], 
  [59, 2],       
];

const DEFAULT_CENTER = [54.5, -2.5];

const MapUpdater = ({ position }) => {
  const map = useMap();
  map.setView(position, map.getZoom(), { animate: true });
  return null;
};

const Map = ({ setFormData }) => {
  const [markerPosition, setMarkerPosition] = useState(DEFAULT_CENTER);
  const [tempPosition, setTempPosition] = useState(DEFAULT_CENTER);
  const [postcode, setPostcode] = useState("");
  const [tempAddress, setTempAddress] = useState({
    fullAddress: "",
    location: "",
    postcode: "",
    serviceAreas: "",
    latitude: "",
    longitude: "",
  });

  const markerRef = useRef(null);

  const fetchAddress = useCallback(async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();

      if (data && data.address) {
        const { city, town, village, postcode, state, country } = data.address;
        const location = city || town || village || state || "Unknown Location";
        const fullAddress = data.display_name;
        const serviceArea = state || country || "Unknown";

        setTempAddress({
          fullAddress,
          location,
          postcode: postcode || "N/A",
          serviceAreas: serviceArea,
          latitude: lat,
          longitude: lng,
        });
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      setTempAddress({ fullAddress: "Failed to get address", location: "", postcode: "", serviceAreas: "" });
    }
  }, []);

  const fetchCoordinates = async () => {
    if (!postcode.trim()) {
      alert("Please enter a postcode.");
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${postcode}&country=UK&format=json`
      );
      const data = await response.json();

      if (data.length === 0) {
        alert("Invalid postcode. Please try again.");
        return;
      }

      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);

      if (isWithinBounds(lat, lon)) {
        setTempPosition([lat, lon]);
        setMarkerPosition([lat, lon]);
        fetchAddress(lat, lon);
      } else {
        alert("Postcode location is out of UK bounds.");
      }
    } catch (error) {
      console.error("Error fetching location:", error.message);
    }
  };

  const isWithinBounds = (lat, lng) => {
    return (
      lat >= UK_BOUNDS[0][0] && lat <= UK_BOUNDS[1][0] &&
      lng >= UK_BOUNDS[0][1] && lng <= UK_BOUNDS[1][1]
    );
  };

  const handleDragEnd = useCallback(() => {
    if (markerRef.current) {
      const { lat, lng } = markerRef.current.getLatLng();

      if (isWithinBounds(lat, lng)) {
        setTempPosition([lat, lng]);
        fetchAddress(lat, lng);
      } else {
        markerRef.current.setLatLng(tempPosition); // Reset marker if out of bounds
      }
    }
  }, [fetchAddress, tempPosition]);

  const handleConfirmLocation = () => {
    setMarkerPosition(tempPosition);
    setFormData((prev) => ({
      ...prev,
      location: tempAddress.location,
      address: tempAddress.fullAddress,
      postcode: tempAddress.postcode,
      serviceAreas: tempAddress.serviceAreas,
      latitude: tempPosition[0],
      longitude: tempPosition[1],
    }));
  };

  return (
    <div className="relative">
      {/* Postcode Input Field */}
      <div className="flex mb-2 w-1/2">
        <input
          type="text"
          placeholder="Use Postcode to find location"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          className="p-2 border border-gray-300 rounded-l-md w-full"
        />
        <button
          onClick={fetchCoordinates}
          className="bg-primary text-white px-4 rounded-r-md hover:bg-blue-700 transition"
        >
          Find
        </button>
      </div>

      {/* Map Container */}
      <div className="max-h-[300px] h-[300px] relative">
      <MapContainer
        center={markerPosition}
        zoom={6}
        scrollWheelZoom={true}
        touchZoom={true}
        zoomControl={true}
        wheelDebounceTime={10}
        wheelPxPerZoomLevel={100}
        style={{ height: "100%", width: "100%", position: "relative", zIndex: "0" }}
        maxBounds={UK_BOUNDS}
        maxBoundsViscosity={1.0}
      >
        <MapUpdater position={tempPosition} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker 
          position={tempPosition} 
          draggable={true} 
          eventHandlers={{ dragend: handleDragEnd }}
          ref={markerRef}
        >
          <Popup>
            <p><strong>Address:</strong> {tempAddress.fullAddress}</p>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Confirm Location Button */}
      <button
        onClick={handleConfirmLocation}
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-green-600 text-white rounded-md shadow-lg hover:bg-green-700 transition z-50"
      >
        Confirm Location
      </button>
      </div>
    </div>
  );
};

export default Map;
