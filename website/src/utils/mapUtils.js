import axios from 'axios';

// Get coordinates from a location string using open Nominatim API
export const getCoordinates = async (locationName) => {
    if (!locationName) return null;
    try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
            params: {
                q: locationName,
                format: 'json',
                limit: 1
            }
        });
        if (response.data && response.data.length > 0) {
            return {
                lat: parseFloat(response.data[0].lat),
                lon: parseFloat(response.data[0].lon)
            };
        }
        return null;
    } catch (error) {
        console.error("Geocoding Error:", error);
        return null;
    }
};

// Calculate driving distance and time between two coordinates using OSRM
export const calculateRoute = async (startCoords, endCoords) => {
    if (!startCoords || !endCoords) return null;

    try {
        // OSRM requires format: lon,lat;lon,lat
        const response = await axios.get(
            `https://router.project-osrm.org/route/v1/driving/${startCoords.lon},${startCoords.lat};${endCoords.lon},${endCoords.lat}?overview=false`
        );

        if (response.data && response.data.routes && response.data.routes.length > 0) {
            const route = response.data.routes[0];
            return {
                distanceKm: (route.distance / 1000).toFixed(1), // distance is in meters
                durationMin: Math.round(route.duration / 60) // duration is in seconds
            };
        }
        return null;
    } catch (error) {
        console.error("Routing Error:", error);
        return null;
    }
};
