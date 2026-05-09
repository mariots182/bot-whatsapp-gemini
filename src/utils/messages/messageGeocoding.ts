import config from "../../config";

const { geocodingURL, apiKey } = config.google.geolocation;

export async function handleGeocodingAddress(location: {
  latitude: number;
  longitude: number;
}): Promise<string> {
  const geoUrl = `${geocodingURL}json?latlng=${location.latitude},${location.longitude}&key=${apiKey}`;
  let nearbyAddresses: string[] = [];
  let messageAddresses;

  try {
    const response = await fetch(geoUrl);

    if (!response.ok) throw new Error("Failed to fetch geocoding data");

    const data = await response.json();

    if (data.status === "OK" && Array.isArray(data.results)) {
      nearbyAddresses = data.results.map(
        (result: any) => result.formatted_address,
      );
    }

    console.log(
      "[Utils][handleGeocodingAddress] Direcciones cercana obtenida:",
      nearbyAddresses[0],
    );

    messageAddresses = `${nearbyAddresses[0]}`;

    return messageAddresses;
  } catch (error) {
    console.error(
      "[Utils][handleGeocodingAddress] Error al procesar la ubicación:",
      error,
    );
    return "";
  }
}
