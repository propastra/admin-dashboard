import axios from 'axios';

// Indian Bounding Box: [minLat, maxLat, minLon, maxLon] roughly
const IS_WITHIN_INDIA = (lat, lon) => lat >= 6.0 && lat <= 38.0 && lon >= 68.0 && lon <= 98.0;

// Get coordinates from a location string using open Nominatim API
export const getCoordinates = async (locationName, context = "India") => {
    if (!locationName) return null;
    
    // Create multiple variations to increase hit rate
    const queries = [
        `${locationName}, ${context}`,
        locationName,
        `${locationName}, Karnataka, India`
    ];

    for (const q of queries) {
        try {
            const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                params: {
                    q,
                    format: 'json',
                    limit: 3,
                    addressdetails: 1
                },
                headers: {
                    'User-Agent': 'PropAstra_RealEstate_App/1.0',
                    'Accept-Language': 'en'
                }
            });

            if (response.data && response.data.length > 0) {
                // Find the best match within India
                for (const result of response.data) {
                    const lat = parseFloat(result.lat);
                    const lon = parseFloat(result.lon);
                    if (IS_WITHIN_INDIA(lat, lon)) {
                        return { lat, lon };
                    }
                }
            }
            
            // Wait slightly between attempts if one fails (OSM Rate Limit)
            await new Promise(r => setTimeout(r, 400));
        } catch (error) {
            console.error("Geocoding Error for query:", q, error);
        }
    }
    
    return null;
};

// Calculate driving distance and time between two coordinates using OSRM
export const calculateRoute = async (startCoords, endCoords) => {
    if (!startCoords || !endCoords) return null;

    try {
        // OSRM requires format: lon,lat;lon,lat
        const response = await axios.get(
            `https://router.project-osrm.org/route/v1/driving/${startCoords.lon},${startCoords.lat};${endCoords.lon},${endCoords.lat}?overview=false`,
            {
                headers: { 'User-Agent': 'PropAstra_RealEstate_App/1.0' }
            }
        );

        if (response.data && response.data.routes && response.data.routes.length > 0) {
            const route = response.data.routes[0];
            
            // OSRM provides idealistic "no traffic" duration in seconds.
            // For Indian city traffic (especially Bangalore), we apply a multiplier.
            // A multiplier of ~2.2x is standard for realistic city estimates.
            const realisticDurationSec = route.duration * 2.2;
            const durationMin = Math.max(1, Math.round(realisticDurationSec / 60));

            return {
                distanceKm: (route.distance / 1000).toFixed(1), // distance is in meters
                durationMin: durationMin
            };
        }
        return null;
    } catch (error) {
        console.error("Routing Error:", error);
        return null;
    }
};
