import config from "../../config";
import { HTTP } from "../consts";
import logger from "../logger";

const { geocodingURL, apiKey } = config.google.geolocation;

export async function handleGeocodingAddress(location: {
  latitude: number;
  longitude: number;
}): Promise<string> {
  const { latitude, longitude } = location;
  const geoUrl = `${geocodingURL}json?latlng=${latitude},${longitude}&key=${apiKey}`;

  try {
    const response = await fetch(geoUrl);

    if (!response.ok) {
      throw new Error(
        `[Utils][handleGeocodingAddress] Failed to fetch geocoding data with params: latitude ${latitude}, longitude ${longitude} and status ${response.status}`,
      );
    }

    const data = await response.json();

    if (data.status !== HTTP.STATUS_CODES.OK && !Array.isArray(data.results)) {
      logger.warn(`[Utils][handleGeocodingAddress] Status: ${data.status}`);
      return "";
    }

    const nearbyAddresses = data.results.map(
      (result: any) => result.formatted_address,
    );

    logger.info(
      "[Utils][handleGeocodingAddress] Direcciones cercana obtenida:",
      nearbyAddresses[0],
    );

    return `${nearbyAddresses[0]}`;
  } catch (error) {
    logger.error(
      "[Utils][handleGeocodingAddress] Error al procesar la ubicación:",
      error,
    );
    return "";
  }
}
