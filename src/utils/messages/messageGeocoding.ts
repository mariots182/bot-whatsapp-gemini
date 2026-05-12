import config from "../../config";

import logger from "../logger";

const { geocodingURL, apiKey } = config.google.geolocation;

export async function handleGeocodingAddress(location: {
  latitude: number;
  longitude: number;
}): Promise<string> {
  const { latitude, longitude } = location;

  const geoUrl = `${geocodingURL}json?latlng=${latitude},${longitude}&key=${apiKey}`;
  let nearbyAddresses: string[] = [];
  let messageAddresses;

  try {
    const response = await fetch(geoUrl);

    logger.info(
      `[Utils][handleGeocodingAddress] Response status:  ${JSON.stringify(response)}`,
    );

    if (!response.ok) throw new Error("Failed to fetch geocoding data");

    const data = await response.json();

    if (data.status === "OK" && Array.isArray(data.results)) {
      nearbyAddresses = data.results.map(
        (result: any) => result.formatted_address,
      );
    }

    messageAddresses = `${nearbyAddresses[0]}`;

    return messageAddresses;
  } catch (error) {
    logger.error(
      "[Utils][handleGeocodingAddress] Error al procesar la ubicación:",
      error,
    );
    return "";
  }
}
