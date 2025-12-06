/**
 * Verify geolocation
 * This is a simplified implementation. In production, you might want to:
 * - Use a geolocation API service (e.g., MaxMind, IP2Location)
 * - Cache results
 * - Handle edge cases better
 */
export interface GeolocationResult {
  allowed: boolean;
  error?: string;
}

export async function verifyGeolocation(
  latitude: string | undefined,
  longitude: string | undefined,
  allowedCountries: string | undefined
): Promise<GeolocationResult> {
  try {
    // If no coordinates provided, return error
    if (!latitude || !longitude || latitude === "" || longitude === "") {
      return {
        allowed: false,
        error: "No geolocation data provided",
      };
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    // Validate coordinates
    if (isNaN(lat) || isNaN(lon)) {
      return {
        allowed: false,
        error: "Invalid coordinates",
      };
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return {
        allowed: false,
        error: "Coordinates out of range",
      };
    }

    // If no country restrictions, allow
    if (!allowedCountries || allowedCountries === "") {
      return {
        allowed: true,
      };
    }

    // Parse allowed countries (comma-separated)
    const allowedList = allowedCountries
      .split(",")
      .map((c) => c.trim().toUpperCase());

    // In a real implementation, you would:
    // 1. Reverse geocode coordinates to get country code
    // 2. Check if country code is in allowedList
    // For now, we'll use a simple mock implementation

    // TODO: Implement actual reverse geocoding
    // For now, we'll allow all requests (you should integrate with a geocoding service)
    // Example: const countryCode = await reverseGeocode(lat, lon);
    // return { allowed: allowedList.includes(countryCode) };

    // Mock: Allow all for now
    return {
      allowed: true,
    };
  } catch (error) {
    return {
      allowed: false,
      error:
        error instanceof Error
          ? error.message
          : "Geolocation verification failed",
    };
  }
}
