export type GeocodedPlace = {
  displayName: string;
  latitude: number;
  longitude: number;
  provider: "mapbox" | "nominatim";
  placeType?: string;
  addressType?: string;
};

type MapboxFeature = {
  place_name?: string;
  center?: [number, number];
  place_type?: string[];
  properties?: {
    feature_type?: string;
  };
};

type NominatimResult = {
  display_name?: string;
  lat?: string;
  lon?: string;
  type?: string;
  addresstype?: string;
};

function getMapboxAccessToken() {
  return (
    import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ||
    import.meta.env.VITE_NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
    import.meta.env.VITE_PUBLIC_MAPBOX_ACCESS_TOKEN ||
    ""
  ).trim();
}

function toMapboxPlaces(features: MapboxFeature[]): GeocodedPlace[] {
  const places: GeocodedPlace[] = [];

  for (const feature of features) {
    const latitude = feature.center?.[1];
    const longitude = feature.center?.[0];

    if (!feature.place_name || typeof latitude !== "number" || typeof longitude !== "number") {
      continue;
    }

    places.push({
      displayName: feature.place_name,
      latitude,
      longitude,
      provider: "mapbox",
      placeType: feature.place_type?.[0] ?? feature.properties?.feature_type,
    });
  }

  return places;
}

function toNominatimPlaces(results: NominatimResult[]): GeocodedPlace[] {
  const places: GeocodedPlace[] = [];

  for (const result of results) {
    const latitude = Number(result.lat);
    const longitude = Number(result.lon);

    if (!result.display_name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      continue;
    }

    places.push({
      displayName: result.display_name,
      latitude,
      longitude,
      provider: "nominatim",
      placeType: result.type,
      addressType: result.addresstype,
    });
  }

  return places;
}

async function searchWithMapbox(query: string, signal?: AbortSignal) {
  const token = getMapboxAccessToken();
  if (!token) {
    return [];
  }

  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`);
  url.searchParams.set("access_token", token);
  url.searchParams.set("autocomplete", "true");
  url.searchParams.set("limit", "5");
  url.searchParams.set("language", "vi");
  url.searchParams.set("country", "vn");

  const response = await fetch(url.toString(), { signal });
  if (!response.ok) {
    throw new Error(`Mapbox geocoding lỗi HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as { features?: MapboxFeature[] };
  return toMapboxPlaces(payload.features ?? []);
}

async function searchWithNominatim(query: string, signal?: AbortSignal) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "vi");
  url.searchParams.set("countrycodes", "vn");

  const response = await fetch(url.toString(), {
    signal,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Geocoding lỗi HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as NominatimResult[];
  return toNominatimPlaces(payload);
}

export async function searchLocation(query: string, signal?: AbortSignal) {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return [];
  }

  try {
    const mapboxResults = await searchWithMapbox(normalizedQuery, signal);
    if (mapboxResults.length > 0) {
      return mapboxResults;
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
  }

  return searchWithNominatim(normalizedQuery, signal);
}

export async function geocodePlace(query: string, signal?: AbortSignal) {
  const results = await searchLocation(query, signal);
  return results[0] ?? null;
}
