import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { LatLngTuple } from "leaflet";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import LocationMapPicker from "./components/location-map-picker";
import CityTable from "./components/admin/city-table";
import LocationTable from "./components/admin/location-table";
import RoadTable from "./components/admin/road-table";
import UserTable from "./components/admin/user-table";
import RoadIntersectionMap from "./components/road-intersection-map";
import { computeSegmentLengths } from "./lib/utils";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:4000";

const LOCATION_CATEGORIES: Record<string, string[]> = {
  public_and_civic: [
    "hospital",
    "police_station",
    "fire_station",
    "post_office",
    "government_office",
    "embassy",
  ],
  transportation: [
    "bus_stop",
    "train_station",
    "airport",
    "parking_lot",
    "gas_station",
    "harbor",
  ],
  entertainment_and_leisure: [
    "restaurant",
    "cafe",
    "bar",
    "cinema",
    "stadium",
    "sports_center",
    "park",
    "zoo",
    "amusement_park",
  ],
  commerce: [
    "store",
    "market",
    "mall",
    "supermarket",
    "bank",
    "hotel",
    "pharmacy",
    "beauty_salon",
    "laundry",
  ],
  education_and_culture: ["school", "university", "library", "museum"],
  religious: ["pagoda", "monastery", "temple", "church", "mosque"],
  residential_and_industrial: [
    "apartment",
    "residential_area",
    "factory",
    "warehouse",
    "farm",
    "cemetery",
  ],
  other: ["landmark", "intersection", "office", "other"],
};

type AdminCity = {
  id: string;
  user_id: string | null;
  burmese_name: string | null;
  english_name: string;
  address: string | null;
  description: string | null;
  image_urls: string[] | string | null;
  geometry: string | null;
};

type AdminLocation = {
  id: string;
  city_id: string | null;
  user_id: string | null;
  burmese_name: string | null;
  english_name: string | null;
  address: string | null;
  description: string | null;
  image_urls: string[] | string | null;
  location_type: string | null;
  geometry: string | null;
};

type AdminRoad = {
  id: string;
  city_id: string | null;
  user_id: string | null;
  burmese_name: string | null;
  english_name: string | null;
  road_type: string | null;
  is_oneway: boolean | null;
  length_m: number[] | null;
  geometry: string | null;
};

type AdminUser = {
  id: string;
  username: string | null;
  email: string | null;
  user_type: string | null;
  is_admin: boolean | null;
  created_at: string | null;
  last_login: string | null;
};

type StoredUser = {
  id?: unknown;
  user_id?: unknown;
  userId?: unknown;
  user_type?: unknown;
  role?: unknown;
  roles?: unknown;
  is_admin?: unknown;
};

type PanelKey = "cities" | "locations" | "roads" | "users";

type DashboardResponse = {
  cities: AdminCity[];
  locations: AdminLocation[];
  roads: AdminRoad[];
  users?: AdminUser[];
};

type ApiEnvelope<T> = {
  is_success: boolean;
  data?: T;
  msg?: string;
  error?: string;
};

type CityFormState = {
  id: string | null;
  burmese_name: string;
  english_name: string;
  address: string;
  description: string;
  image_urls: string;
  image_files: File[];
  lon: string;
  lat: string;
};

type LocationFormState = {
  id: string | null;
  city_id: string;
  burmese_name: string;
  english_name: string;
  address: string;
  description: string;
  location_type: string;
  image_urls: string;
  image_files: File[];
  lon: string;
  lat: string;
};

type RoadFormState = {
  id: string | null;
  city_id: string;
  user_id: string;
  burmese_name: string;
  english_name: string;
  road_type: string;
  is_oneway: boolean;
  intersection_ids: string[];
  coordinates: string;
};

const initialCityForm: CityFormState = {
  id: null,
  burmese_name: "",
  english_name: "",
  address: "",
  description: "",
  image_urls: "",
  image_files: [],
  lon: "",
  lat: "",
};

const initialLocationForm: LocationFormState = {
  id: null,
  city_id: "",
  burmese_name: "",
  english_name: "",
  address: "",
  description: "",
  location_type: "",
  image_urls: "",
  image_files: [],
  lon: "",
  lat: "",
};

const initialRoadForm: RoadFormState = {
  id: null,
  city_id: "",
  user_id: "",
  burmese_name: "",
  english_name: "",
  road_type: "",
  is_oneway: false,
  intersection_ids: [],
  coordinates: "",
};

const ROAD_TYPE_OPTIONS = [
  "highway",
  "local_road",
  "residential_road",
  "bridge",
  "tunnel",
];

const CARD_BORDER_CLASS =
  "border border-white/10 bg-white/[0.04] backdrop-blur-lg shadow-[0_20px_60px_-40px_rgba(15,118,110,0.6)]";
const FORM_CARD_CLASS = `grid gap-5 rounded-3xl ${CARD_BORDER_CLASS} p-6 md:grid-cols-2`;
const PANEL_PILL_CLASS =
  "rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200";
const FIELD_LABEL_CLASS =
  "flex flex-col gap-2 text-sm font-medium text-slate-200";
const FIELD_SUBTEXT_CLASS = "mt-1 text-xs text-slate-400";
const INPUT_BASE_CLASS =
  "mt-1 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white placeholder:text-slate-500 transition focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/30";
const TEXTAREA_BASE_CLASS =
  "mt-1 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white placeholder:text-slate-500 transition focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/30";
const SELECT_BASE_CLASS =
  "mt-1 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white transition focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/30";
const SECTION_HEADING_CLASS = "text-2xl font-semibold text-white";
const SECTION_DESCRIPTION_CLASS = "text-sm text-slate-300";

function formatImageValue(value: AdminCity["image_urls"]): string {
  if (!value) return "";
  if (Array.isArray(value)) return value.join(", ");
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.join(", ");
    }
  } catch (error) {
    console.warn("Unable to parse image url string", error);
  }
  return value;
}

function extractPointFromWkt(wkt: string | null | undefined) {
  if (!wkt) return { lon: "", lat: "" };
  const match = /POINT\s*\(([-+0-9.eE]+)\s+([-+0-9.eE]+)\)/i.exec(wkt);
  if (!match) return { lon: "", lat: "" };
  return { lon: match[1], lat: match[2] };
}

function formatLineStringForEditor(wkt: string | null | undefined) {
  if (!wkt) return "";
  const match = /LINESTRING\s*\(([^)]+)\)/i.exec(wkt);
  if (!match) return "";
  return match[1]
    .split(",")
    .map((segment) => segment.trim())
    .join("\n");
}

function parseCoordinateText(input: string) {
  const coords: Array<[number, number]> = [];
  input
    .replace(/;/g, "\n")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const parts = line.split(",").map((value) => value.trim());
      if (parts.length < 2) return;
      const lon = Number(parts[0]);
      const lat = Number(parts[1]);
      if (Number.isFinite(lon) && Number.isFinite(lat)) {
        coords.push([lon, lat]);
      }
    });
  return coords;
}

function extractLineStringCoordinates(
  wkt: string | null | undefined
): Array<[number, number]> {
  if (!wkt) return [];
  const match = /LINESTRING\s*\(([^)]+)\)/i.exec(wkt);
  if (!match) return [];

  const segments = match[1]
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

  const coordinates: Array<[number, number]> = [];
  segments.forEach((segment) => {
    const parts = segment.split(/\s+/).filter(Boolean);
    if (parts.length < 2) {
      return;
    }
    const lon = Number(parts[0]);
    const lat = Number(parts[1]);
    if (Number.isFinite(lon) && Number.isFinite(lat)) {
      coordinates.push([lon, lat]);
    }
  });

  return coordinates;
}

function humanizeKey(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  if (!token || typeof token !== "string") {
    return null;
  }

  const segments = token.split(".");
  if (segments.length < 2) {
    return null;
  }

  try {
    const base64 = segments[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(base64);
    return JSON.parse(decoded);
  } catch (error) {
    console.warn("Failed to decode JWT", error);
    return null;
  }
}

function resolveUserId(
  storedUser: unknown,
  token: string | null
): string | null {
  if (storedUser && typeof storedUser === "object") {
    const candidate =
      (storedUser as { id?: unknown }).id ??
      (storedUser as { user_id?: unknown }).user_id ??
      (storedUser as { userId?: unknown }).userId;
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }

  if (token) {
    const payload = decodeJwtPayload(token);
    const candidate =
      (payload?.sub as string | undefined) ??
      (payload?.user_id as string | undefined) ??
      (payload?.identity as string | undefined);
    if (candidate && candidate.trim().length > 0) {
      return candidate;
    }
  }

  return null;
}

async function requestWithAuth<T>(
  token: string,
  path: string,
  options?: RequestInit
): Promise<ApiEnvelope<T>> {
  const isFormData = options?.body instanceof FormData;
  const headers = new Headers(options?.headers ?? {});

  headers.set("Authorization", `Bearer ${token}`);
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  } else if (isFormData && headers.has("Content-Type")) {
    headers.delete("Content-Type");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...(options ?? {}),
    headers,
  });

  const data = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok) {
    throw new Error(data?.msg || data?.error || "Request failed");
  }
  return data;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<AdminCity[]>([]);
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [roads, setRoads] = useState<AdminRoad[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [activePanel, setActivePanel] = useState<PanelKey>("cities");
  const [cityForm, setCityForm] = useState<CityFormState>(initialCityForm);
  const [locationForm, setLocationForm] =
    useState<LocationFormState>(initialLocationForm);
  const [roadForm, setRoadForm] = useState<RoadFormState>(initialRoadForm);
  const [cityFileInputKey, setCityFileInputKey] = useState<number>(0);
  const [locationFileInputKey, setLocationFileInputKey] = useState<number>(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    const storedUserRaw = localStorage.getItem("user");

    if (!storedToken || !storedUserRaw) {
      toast.error(
        "Please sign in as an administrator to access the dashboard."
      );
      navigate("/sign-in", { replace: true });
      return;
    }

    let storedUser: StoredUser | null = null;
    try {
      storedUser = JSON.parse(storedUserRaw) as StoredUser;
      const normalizedType = String(
        (storedUser?.user_type ?? storedUser?.role ?? "") as string
      ).toLowerCase();
      const hasAdminRole = Array.isArray(storedUser?.roles)
        ? storedUser.roles.some(
            (role: unknown) =>
              typeof role === "string" && role.toLowerCase() === "admin"
          )
        : false;
      const isAdmin =
        storedUser?.is_admin === true ||
        normalizedType === "admin" ||
        hasAdminRole;

      if (!isAdmin) {
        toast.error("Admin access required.");
        navigate("/", { replace: true });
        return;
      }
    } catch (error) {
      console.error("Failed to parse stored user", error);
      toast.error("Session data is corrupted. Please sign in again.");
      navigate("/sign-in", { replace: true });
      return;
    }

    setCurrentUserId(resolveUserId(storedUser, storedToken));
    setToken(storedToken);
  }, [navigate]);

  useEffect(() => {
    if (!token) return;

    async function loadDashboard(currentToken: string) {
      try {
        setLoading(true);
        const { data } = await requestWithAuth<DashboardResponse>(
          currentToken,
          "/admin/dashboard"
        );
        if (data) {
          setCities(data.cities ?? []);
          setLocations(data.locations ?? []);
          setRoads(data.roads ?? []);
          setUsers(data.users ?? []);
        }
      } catch (error) {
        console.error("Failed to load admin data", error);
        toast.error(
          error instanceof Error ? error.message : "Unable to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard(token);
  }, [token]);

  const cityOptions = useMemo(
    () =>
      cities.map((city) => ({
        id: city.id,
        label: city.english_name || city.burmese_name || city.id,
      })),
    [cities]
  );

  const baseLocationTypeGroups = useMemo(
    () =>
      Object.entries(LOCATION_CATEGORIES).map(([groupKey, values]) => ({
        key: groupKey,
        label: humanizeKey(groupKey),
        options: values.map((value) => ({
          value,
          label: humanizeKey(value),
        })),
      })),
    []
  );

  const locationTypeGroups = useMemo(() => {
    const groups = [...baseLocationTypeGroups];

    const knownValues = new Set<string>();
    groups.forEach((group) => {
      group.options.forEach((option) => knownValues.add(option.value));
    });

    if (
      locationForm.location_type &&
      !knownValues.has(locationForm.location_type)
    ) {
      groups.push({
        key: "existing",
        label: "Existing Value",
        options: [
          {
            value: locationForm.location_type,
            label: humanizeKey(locationForm.location_type),
          },
        ],
      });
    }

    return groups;
  }, [baseLocationTypeGroups, locationForm.location_type]);

  const cityLabelById = useMemo(() => {
    const lookup: Record<string, string> = {};
    cities.forEach((city) => {
      const label = city.english_name || city.burmese_name || city.id;
      lookup[city.id] = label;
    });
    return lookup;
  }, [cities]);

  const selectedLocationCity = useMemo(() => {
    if (!locationForm.city_id) return null;
    return cities.find((city) => city.id === locationForm.city_id) ?? null;
  }, [cities, locationForm.city_id]);

  const selectedCityCenter = useMemo(() => {
    if (!selectedLocationCity) return null;
    const { lon, lat } = extractPointFromWkt(selectedLocationCity.geometry);
    const parsedLon = Number(lon);
    const parsedLat = Number(lat);
    if (!Number.isFinite(parsedLon) || !Number.isFinite(parsedLat)) {
      return null;
    }
    return { lon: parsedLon, lat: parsedLat };
  }, [selectedLocationCity]);

  const hasLocationCoordinates = useMemo(() => {
    const lonText = locationForm.lon.trim();
    const latText = locationForm.lat.trim();
    if (!lonText || !latText) {
      return false;
    }
    const lon = Number(lonText);
    const lat = Number(latText);
    return Number.isFinite(lon) && Number.isFinite(lat);
  }, [locationForm.lat, locationForm.lon]);

  const isLocationMapDisabled =
    !locationForm.city_id && !hasLocationCoordinates;

  const navItems = useMemo(
    () => [
      { id: "cities" as const, label: "Cities", count: cities.length },
      {
        id: "locations" as const,
        label: "Locations",
        count: locations.length,
      },
      { id: "roads" as const, label: "Roads", count: roads.length },
      { id: "users" as const, label: "Users", count: users.length },
    ],
    [cities.length, locations.length, roads.length, users.length]
  );

  const intersectionLocations = useMemo(
    () =>
      locations.filter((location) => {
        const type = (location.location_type ?? "").toLowerCase();
        return type.includes("intersection");
      }),
    [locations]
  );

  const intersectionLookupById = useMemo(() => {
    const lookup: Record<string, AdminLocation> = {};
    intersectionLocations.forEach((location) => {
      lookup[location.id] = location;
    });
    return lookup;
  }, [intersectionLocations]);

  const intersectionCoordinateLookup = useMemo(() => {
    const lookup: Record<string, string> = {};
    intersectionLocations.forEach((location) => {
      const { lon, lat } = extractPointFromWkt(location.geometry);
      const lonNum = Number(lon);
      const latNum = Number(lat);
      if (Number.isFinite(lonNum) && Number.isFinite(latNum)) {
        const key = `${lonNum.toFixed(6)},${latNum.toFixed(6)}`;
        lookup[key] = location.id;
      }
    });
    return lookup;
  }, [intersectionLocations]);

  const cityIntersections = useMemo(() => {
    if (!roadForm.city_id) return [] as AdminLocation[];
    return intersectionLocations.filter(
      (location) => location.city_id === roadForm.city_id
    );
  }, [intersectionLocations, roadForm.city_id]);

  const cityRoadPolylines = useMemo(() => {
    if (!roadForm.city_id)
      return [] as Array<{
        id: string;
        name: string;
        positions: LatLngTuple[];
        lengthMeters: number;
      }>;

    return roads
      .filter((road) => road.city_id === roadForm.city_id && road.geometry)
      .map((road) => {
        const coordinates = extractLineStringCoordinates(road.geometry);
        if (coordinates.length < 2) {
          return null;
        }

        const positions = coordinates.map(
          ([lon, lat]) => [lat, lon] as LatLngTuple
        );
        const segmentLengths = computeSegmentLengths(coordinates);
        const totalLength = segmentLengths.reduce(
          (sum: number, segment: number) => sum + segment,
          0
        );

        return {
          id: road.id,
          name:
            road.english_name || road.burmese_name || road.road_type || road.id,
          positions,
          lengthMeters: totalLength,
        };
      })
      .filter(
        (
          road
        ): road is {
          id: string;
          name: string;
          positions: LatLngTuple[];
          lengthMeters: number;
        } => Boolean(road)
      );
  }, [roadForm.city_id, roads]);

  const selectedIntersections = useMemo(() => {
    return roadForm.intersection_ids
      .map((id) => intersectionLookupById[id])
      .filter((location): location is AdminLocation => Boolean(location));
  }, [intersectionLookupById, roadForm.intersection_ids]);

  const derivedIntersectionCoordinateText = useMemo(() => {
    if (roadForm.intersection_ids.length < 2) {
      return "";
    }

    const parts: string[] = [];
    for (const id of roadForm.intersection_ids) {
      const location = intersectionLookupById[id];
      if (!location) {
        return "";
      }
      const { lon, lat } = extractPointFromWkt(location.geometry);
      const lonNum = Number(lon);
      const latNum = Number(lat);
      if (!Number.isFinite(lonNum) || !Number.isFinite(latNum)) {
        return "";
      }
      parts.push(`${lonNum}, ${latNum}`);
    }

    return parts.join("\n");
  }, [intersectionLookupById, roadForm.intersection_ids]);

  useEffect(() => {
    if (!derivedIntersectionCoordinateText) {
      return;
    }

    setRoadForm((prev) => {
      if (prev.intersection_ids.length < 2) {
        return prev;
      }
      if (prev.coordinates.trim() === derivedIntersectionCoordinateText) {
        return prev;
      }
      return {
        ...prev,
        coordinates: derivedIntersectionCoordinateText,
      };
    });
  }, [derivedIntersectionCoordinateText]);

  useEffect(() => {
    if (roadForm.intersection_ids.length >= 2) {
      return;
    }

    if (!roadForm.coordinates) {
      return;
    }

    setRoadForm((prev) => {
      if (prev.intersection_ids.length >= 2 || !prev.coordinates) {
        return prev;
      }
      return {
        ...prev,
        coordinates: "",
      };
    });
  }, [roadForm.intersection_ids.length, roadForm.coordinates]);

  const toNullable = (value: string) => {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  };

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const confirmAction = (message: string) =>
    typeof window === "undefined" ? true : window.confirm(message);

  const getActiveUserId = (): string | null => {
    if (currentUserId) {
      return currentUserId;
    }

    try {
      const storedToken = localStorage.getItem("access_token");
      const storedUserRaw = localStorage.getItem("user");
      if (!storedToken || !storedUserRaw) {
        return null;
      }
      const parsed = JSON.parse(storedUserRaw) as StoredUser;
      const resolved = resolveUserId(parsed, storedToken);
      if (resolved) {
        setCurrentUserId(resolved);
      }
      return resolved;
    } catch (error) {
      console.error("Unable to derive user id", error);
      return null;
    }
  };

  const buildPointPayload = (lonText: string, latText: string) => {
    const lonTrimmed = lonText.trim();
    const latTrimmed = latText.trim();

    if (!lonTrimmed && !latTrimmed) {
      return { coords: null } as const;
    }

    if (!lonTrimmed || !latTrimmed) {
      return { error: "Please provide both longitude and latitude." } as const;
    }

    const lon = Number(lonTrimmed);
    const lat = Number(latTrimmed);

    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      return { error: "Longitude and latitude must be numeric." } as const;
    }

    return { coords: { lon, lat } } as const;
  };

  async function handleCitySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const authToken = token;
    if (!authToken) return;

    const { coords, error } = buildPointPayload(cityForm.lon, cityForm.lat);

    if (error) {
      toast.error(error);
      return;
    }

    const activeUserId = getActiveUserId();
    if (!activeUserId) {
      toast.error("Unable to determine the current administrator account.");
      return;
    }

    const formData = new FormData();
    formData.append("english_name", cityForm.english_name.trim());
    formData.append("burmese_name", cityForm.burmese_name);
    formData.append("user_id", activeUserId);
    formData.append("address", cityForm.address);
    formData.append("description", cityForm.description);
    formData.append("image_urls", cityForm.image_urls);

    if (coords) {
      formData.append("lon", String(coords.lon));
      formData.append("lat", String(coords.lat));
    } else {
      formData.append("geometry", "");
    }

    if (cityForm.image_files.length) {
      cityForm.image_files.forEach((file) => {
        formData.append("image_files[]", file);
      });
      if (!formData.has("image_file")) {
        formData.append("image_file", cityForm.image_files[0]);
      }
    }

    const cityId = cityForm.id;

    try {
      const { data } = await requestWithAuth<AdminCity>(
        authToken,
        cityId ? `/admin/cities/${cityId}` : "/admin/cities",
        {
          method: cityId ? "PUT" : "POST",
          body: formData,
        }
      );

      if (data) {
        setCities((prev) =>
          cityId
            ? prev.map((city) => (city.id === data.id ? data : city))
            : [data, ...prev]
        );
        toast.success(cityId ? "City updated." : "City created.");
        setCityForm(initialCityForm);
        setCityFileInputKey((prev: number) => prev + 1);
      }
    } catch (err) {
      console.error("Failed to save city", err);
      toast.error(err instanceof Error ? err.message : "Unable to save city");
    }
  }

  function handleCityEdit(city: AdminCity) {
    const { lon, lat } = extractPointFromWkt(city.geometry);
    setCityForm({
      id: city.id,
      burmese_name: city.burmese_name ?? "",
      english_name: city.english_name ?? "",
      address: city.address ?? "",
      description: city.description ?? "",
      image_urls: formatImageValue(city.image_urls),
      image_files: [],
      lon,
      lat,
    });
    setCityFileInputKey((prev: number) => prev + 1);
    scrollToTop();
  }

  async function handleCityDelete(cityId: string) {
    const authToken = token;
    if (!authToken) return;
    if (!confirmAction("Are you sure you want to delete this city?")) {
      return;
    }

    try {
      await requestWithAuth<null>(authToken, `/admin/cities/${cityId}`, {
        method: "DELETE",
      });
      setCities((prev) => prev.filter((city) => city.id !== cityId));
      setLocations((prev) =>
        prev.filter((location) => location.city_id !== cityId)
      );
      setRoads((prev) => prev.filter((road) => road.city_id !== cityId));
      if (cityForm.id === cityId) {
        setCityForm(initialCityForm);
        setCityFileInputKey((prev: number) => prev + 1);
      }
      toast.success("City deleted.");
    } catch (err) {
      console.error("Failed to delete city", err);
      toast.error(err instanceof Error ? err.message : "Unable to delete city");
    }
  }

  async function handleLocationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const authToken = token;
    if (!authToken) return;

    if (!locationForm.city_id.trim()) {
      toast.error("Please select a city.");
      return;
    }

    const { coords, error } = buildPointPayload(
      locationForm.lon,
      locationForm.lat
    );

    if (error) {
      toast.error(error);
      return;
    }

    const activeUserId = getActiveUserId();
    if (!activeUserId) {
      toast.error("Unable to determine the current administrator account.");
      return;
    }

    const formData = new FormData();
    formData.append("city_id", locationForm.city_id);
    formData.append("user_id", activeUserId);
    formData.append("burmese_name", locationForm.burmese_name);
    formData.append("english_name", locationForm.english_name);
    formData.append("address", locationForm.address);
    formData.append("description", locationForm.description);
    formData.append("location_type", locationForm.location_type);
    formData.append("image_urls", locationForm.image_urls);

    if (coords) {
      formData.append("lon", String(coords.lon));
      formData.append("lat", String(coords.lat));
    } else {
      formData.append("geometry", "");
    }

    if (locationForm.image_files.length) {
      locationForm.image_files.forEach((file) => {
        formData.append("image_files[]", file);
      });
      if (!formData.has("image_file")) {
        formData.append("image_file", locationForm.image_files[0]);
      }
    }

    const locationId = locationForm.id;

    try {
      const { data } = await requestWithAuth<AdminLocation>(
        authToken,
        locationId ? `/admin/locations/${locationId}` : "/admin/locations",
        {
          method: locationId ? "PUT" : "POST",
          body: formData,
        }
      );

      if (data) {
        setLocations((prev) =>
          locationId
            ? prev.map((location) =>
                location.id === data.id ? data : location
              )
            : [data, ...prev]
        );
        toast.success(locationId ? "Location updated." : "Location created.");
        setLocationForm(initialLocationForm);
        setLocationFileInputKey((prev: number) => prev + 1);
      }
    } catch (err) {
      console.error("Failed to save location", err);
      toast.error(
        err instanceof Error ? err.message : "Unable to save location"
      );
    }
  }

  function handleLocationEdit(location: AdminLocation) {
    const { lon, lat } = extractPointFromWkt(location.geometry);
    setLocationForm({
      id: location.id,
      city_id: location.city_id ?? "",
      burmese_name: location.burmese_name ?? "",
      english_name: location.english_name ?? "",
      address: location.address ?? "",
      description: location.description ?? "",
      location_type: location.location_type ?? "",
      image_urls: formatImageValue(location.image_urls),
      image_files: [],
      lon,
      lat,
    });
    setLocationFileInputKey((prev: number) => prev + 1);
    scrollToTop();
  }

  async function handleLocationDelete(locationId: string) {
    const authToken = token;
    if (!authToken) return;
    if (!confirmAction("Are you sure you want to delete this location?")) {
      return;
    }

    try {
      await requestWithAuth<null>(authToken, `/admin/locations/${locationId}`, {
        method: "DELETE",
      });
      setLocations((prev) =>
        prev.filter((location) => location.id !== locationId)
      );
      if (locationForm.id === locationId) {
        setLocationForm(initialLocationForm);
        setLocationFileInputKey((prev: number) => prev + 1);
      }
      toast.success("Location deleted.");
    } catch (err) {
      console.error("Failed to delete location", err);
      toast.error(
        err instanceof Error ? err.message : "Unable to delete location"
      );
    }
  }

  async function handleRoadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const authToken = token;
    if (!authToken) return;

    if (!roadForm.city_id.trim()) {
      toast.error("Please select a city.");
      return;
    }

    let coordinatePairs: Array<[number, number]> = [];

    if (roadForm.intersection_ids.length >= 2) {
      const missingIds: string[] = [];
      coordinatePairs = roadForm.intersection_ids
        .map((id) => {
          const location = intersectionLookupById[id];
          if (!location || location.city_id !== roadForm.city_id) {
            missingIds.push(id);
            return null;
          }
          const { lon, lat } = extractPointFromWkt(location.geometry);
          const lonNum = Number(lon);
          const latNum = Number(lat);
          if (!Number.isFinite(lonNum) || !Number.isFinite(latNum)) {
            missingIds.push(id);
            return null;
          }
          return [lonNum, latNum] as [number, number];
        })
        .filter((pair): pair is [number, number] => pair !== null);

      if (missingIds.length) {
        toast.error(
          "Unable to resolve coordinates for all selected intersections."
        );
        return;
      }
    }

    if (coordinatePairs.length < 2) {
      coordinatePairs = parseCoordinateText(roadForm.coordinates);
    }

    if (coordinatePairs.length < 2) {
      toast.error(
        "Please select at least two intersections or provide coordinates."
      );
      return;
    }

    const segmentLengths = computeSegmentLengths(coordinatePairs);

    const payload: Record<string, unknown> = {
      city_id: roadForm.city_id,
      user_id: toNullable(roadForm.user_id),
      burmese_name: toNullable(roadForm.burmese_name),
      english_name: toNullable(roadForm.english_name),
      road_type: toNullable(roadForm.road_type),
      is_oneway: roadForm.is_oneway,
      coordinates: coordinatePairs,
      length_m: segmentLengths,
    };

    const roadId = roadForm.id;

    try {
      const { data } = await requestWithAuth<AdminRoad>(
        authToken,
        roadId ? `/admin/roads/${roadId}` : "/admin/roads",
        {
          method: roadId ? "PUT" : "POST",
          body: JSON.stringify(payload),
        }
      );

      if (data) {
        setRoads((prev) =>
          roadId
            ? prev.map((road) => (road.id === data.id ? data : road))
            : [data, ...prev]
        );
        toast.success(roadId ? "Road updated." : "Road created.");
        setRoadForm(initialRoadForm);
      }
    } catch (err) {
      console.error("Failed to save road", err);
      toast.error(err instanceof Error ? err.message : "Unable to save road");
    }
  }

  function handleRoadEdit(road: AdminRoad) {
    const coordinateText = formatLineStringForEditor(road.geometry) || "";
    const coordinatePairs = parseCoordinateText(coordinateText);
    const resolvedIntersectionIds: string[] = [];
    let allMatched = coordinatePairs.length > 0;

    coordinatePairs.forEach(([lon, lat]) => {
      const key = `${Number(lon).toFixed(6)},${Number(lat).toFixed(6)}`;
      const intersectionId = intersectionCoordinateLookup[key];
      if (intersectionId) {
        resolvedIntersectionIds.push(intersectionId);
      } else {
        allMatched = false;
      }
    });

    setRoadForm({
      id: road.id,
      city_id: road.city_id ?? "",
      user_id: road.user_id ?? "",
      burmese_name: road.burmese_name ?? "",
      english_name: road.english_name ?? "",
      road_type: road.road_type ?? "",
      is_oneway: Boolean(road.is_oneway),
      intersection_ids: allMatched ? resolvedIntersectionIds : [],
      coordinates: coordinateText,
    });
    scrollToTop();
  }

  async function handleRoadDelete(roadId: string) {
    const authToken = token;
    if (!authToken) return;
    if (!confirmAction("Are you sure you want to delete this road?")) {
      return;
    }

    try {
      await requestWithAuth<null>(authToken, `/admin/roads/${roadId}`, {
        method: "DELETE",
      });
      setRoads((prev) => prev.filter((road) => road.id !== roadId));
      if (roadForm.id === roadId) {
        setRoadForm(initialRoadForm);
      }
      toast.success("Road deleted.");
    } catch (err) {
      console.error("Failed to delete road", err);
      toast.error(err instanceof Error ? err.message : "Unable to delete road");
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        <p className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm uppercase tracking-[0.3em] text-slate-200">
          Validating credentials…
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/85 to-slate-950" />
        <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),transparent_60%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="absolute -left-1/3 top-32 h-[420px] w-[420px] rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -right-1/2 bottom-0 h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <header className="relative z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-300/80">
              Admin Console
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              Infrastructure Command Center
            </h1>
          </div>
          <nav className="flex gap-3 text-sm">
            <Link
              to="/"
              className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 font-medium text-slate-200 transition hover:border-emerald-400/60 hover:bg-emerald-400/10 hover:text-white"
            >
              <span className="size-1 rounded-full bg-emerald-400 transition group-hover:bg-emerald-200" />
              Back to site
            </Link>
            <Link
              to="/landmark-map"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 px-4 py-2 font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02]"
            >
              Explore map
            </Link>
          </nav>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 gap-8 px-6 py-12">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div
            className={`sticky top-24 space-y-4 rounded-3xl ${CARD_BORDER_CLASS} p-5`}
          >
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-300/80">
                Sections
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Jump to a management surface.
              </p>
            </div>
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = activePanel === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActivePanel(item.id)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      isActive
                        ? "border-emerald-400/60 bg-emerald-400/10 text-white shadow-lg shadow-emerald-500/20"
                        : "border-white/10 text-slate-300 hover:border-emerald-400/30 hover:bg-white/5 hover:text-white"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="font-medium">{item.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        isActive
                          ? "bg-emerald-400 text-slate-950"
                          : "bg-white/5 text-slate-300"
                      }`}
                    >
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="flex-1 space-y-12 pb-16">
          {loading ? (
            <div
              className={`rounded-3xl ${CARD_BORDER_CLASS} p-10 text-center text-sm text-slate-300`}
            >
              Loading dashboard data…
            </div>
          ) : null}

          <div className="lg:hidden">
            <div className={`rounded-3xl ${CARD_BORDER_CLASS} p-4`}>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-300/80">
                Sections
              </p>
              <nav className="mt-3 flex flex-wrap gap-2">
                {navItems.map((item) => {
                  const isActive = activePanel === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActivePanel(item.id)}
                      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition ${
                        isActive
                          ? "border-emerald-400/60 bg-emerald-400/10 text-white shadow-sm"
                          : "border-white/10 text-slate-300 hover:border-emerald-400/30 hover:bg-white/5 hover:text-white"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span>{item.label}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 ${
                          isActive
                            ? "bg-emerald-400 text-slate-950"
                            : "bg-white/5 text-slate-300"
                        }`}
                      >
                        {item.count}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {activePanel === "cities" ? (
            <section className="space-y-6">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className={SECTION_HEADING_CLASS}>Cities</h2>
                  <p className={SECTION_DESCRIPTION_CLASS}>
                    Manage township profiles, hero imagery, and descriptions.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className={PANEL_PILL_CLASS}>
                    {cities.length} total
                  </span>
                </div>
              </div>

              <form onSubmit={handleCitySubmit} className={FORM_CARD_CLASS}>
                <div className="md:col-span-2 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    {cityForm.id ? "Edit City" : "Create City"}
                  </h3>
                  {cityForm.id ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCityForm(initialCityForm);
                        setCityFileInputKey((prev: number) => prev + 1);
                      }}
                      className="text-xs uppercase tracking-wide text-emerald-300 hover:text-emerald-200"
                    >
                      Cancel edit
                    </button>
                  ) : null}
                </div>
                <label className={FIELD_LABEL_CLASS}>
                  <span className="text-slate-200">English Name *</span>
                  <input
                    type="text"
                    required
                    value={cityForm.english_name}
                    onChange={(event) =>
                      setCityForm((prev) => ({
                        ...prev,
                        english_name: event.target.value,
                      }))
                    }
                    className={INPUT_BASE_CLASS}
                  />
                </label>
                <label className={FIELD_LABEL_CLASS}>
                  <span className="text-slate-200">Burmese Name</span>
                  <input
                    type="text"
                    value={cityForm.burmese_name}
                    onChange={(event) =>
                      setCityForm((prev) => ({
                        ...prev,
                        burmese_name: event.target.value,
                      }))
                    }
                    className={INPUT_BASE_CLASS}
                  />
                </label>
                <label className={FIELD_LABEL_CLASS}>
                  <span className="text-slate-200">Address</span>
                  <input
                    type="text"
                    value={cityForm.address}
                    onChange={(event) =>
                      setCityForm((prev) => ({
                        ...prev,
                        address: event.target.value,
                      }))
                    }
                    className={INPUT_BASE_CLASS}
                  />
                </label>
                <label className={FIELD_LABEL_CLASS}>
                  <span className="text-slate-200">Description</span>
                  <textarea
                    value={cityForm.description}
                    onChange={(event) =>
                      setCityForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    className={`${TEXTAREA_BASE_CLASS} h-24`}
                  />
                </label>
                <label className={`md:col-span-2 ${FIELD_LABEL_CLASS}`}>
                  <span className="text-slate-200">Upload images</span>
                  <input
                    key={cityFileInputKey}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) =>
                      setCityForm((prev) => ({
                        ...prev,
                        image_files: event.target.files
                          ? Array.from(event.target.files)
                          : [],
                      }))
                    }
                    className={`${INPUT_BASE_CLASS} file:mr-3 file:rounded-md file:border-0 file:bg-gradient-to-r file:from-emerald-500 file:via-cyan-500 file:to-blue-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-950 hover:file:brightness-110`}
                  />
                  <p className={FIELD_SUBTEXT_CLASS}>
                    Upload one or more images; each file is uploaded alongside
                    any manual URLs you provide.
                  </p>
                </label>
                <label className={FIELD_LABEL_CLASS}>
                  <span className="text-slate-200">Longitude</span>
                  <input
                    type="text"
                    value={cityForm.lon}
                    onChange={(event) =>
                      setCityForm((prev) => ({
                        ...prev,
                        lon: event.target.value,
                      }))
                    }
                    className={INPUT_BASE_CLASS}
                  />
                </label>
                <label className={FIELD_LABEL_CLASS}>
                  <span className="text-slate-200">Latitude</span>
                  <input
                    type="text"
                    value={cityForm.lat}
                    onChange={(event) =>
                      setCityForm((prev) => ({
                        ...prev,
                        lat: event.target.value,
                      }))
                    }
                    className={INPUT_BASE_CLASS}
                  />
                </label>
                <div className="md:col-span-2 flex justify-end gap-3">
                  <button
                    type="submit"
                    className="rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:scale-[1.02]"
                  >
                    {cityForm.id ? "Update City" : "Add City"}
                  </button>
                </div>
              </form>

              <CityTable
                cities={cities}
                onEdit={handleCityEdit}
                onDelete={handleCityDelete}
              />
            </section>
          ) : null}

          {activePanel === "locations" ? (
            <section className="space-y-6">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className={SECTION_HEADING_CLASS}>Locations</h2>
                  <p className={SECTION_DESCRIPTION_CLASS}>
                    Curate points of interest, dining venues, and experiences.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className={PANEL_PILL_CLASS}>
                    {locations.length} total
                  </span>
                </div>
              </div>

              <form onSubmit={handleLocationSubmit} className={FORM_CARD_CLASS}>
                <div className="md:col-span-2 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    {locationForm.id ? "Edit Location" : "Create Location"}
                  </h3>
                  {locationForm.id ? (
                    <button
                      type="button"
                      onClick={() => {
                        setLocationForm(initialLocationForm);
                        setLocationFileInputKey((prev: number) => prev + 1);
                      }}
                      className="text-xs uppercase tracking-wide text-emerald-300 hover:text-emerald-200"
                    >
                      Cancel edit
                    </button>
                  ) : null}
                </div>
                <label className={FIELD_LABEL_CLASS}>
                  <span className="text-slate-200">City *</span>
                  <select
                    required
                    value={locationForm.city_id}
                    onChange={(event) =>
                      setLocationForm((prev) => ({
                        ...prev,
                        city_id: event.target.value,
                      }))
                    }
                    className={SELECT_BASE_CLASS}
                  >
                    <option value="">Select a city</option>
                    {cityOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={FIELD_LABEL_CLASS}>
                  <span className="text-slate-200">English Name</span>
                  <input
                    type="text"
                    value={locationForm.english_name}
                    onChange={(event) =>
                      setLocationForm((prev) => ({
                        ...prev,
                        english_name: event.target.value,
                      }))
                    }
                    className={INPUT_BASE_CLASS}
                  />
                </label>
                <label className={FIELD_LABEL_CLASS}>
                  <span className="text-slate-200">Burmese Name</span>
                  <input
                    type="text"
                    value={locationForm.burmese_name}
                    onChange={(event) =>
                      setLocationForm((prev) => ({
                        ...prev,
                        burmese_name: event.target.value,
                      }))
                    }
                    className={INPUT_BASE_CLASS}
                  />
                </label>
                <label className={FIELD_LABEL_CLASS}>
                  <span className="text-slate-200">Location Category</span>
                  <select
                    value={locationForm.location_type}
                    onChange={(event) =>
                      setLocationForm((prev) => ({
                        ...prev,
                        location_type: event.target.value,
                      }))
                    }
                    className={SELECT_BASE_CLASS}
                  >
                    <option value="">Select a category</option>
                    {locationTypeGroups.map((group) => (
                      <optgroup key={group.key} label={group.label}>
                        {group.options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
                <label className={FIELD_LABEL_CLASS}>
                  <span className="text-slate-200">Description</span>
                  <textarea
                    value={locationForm.description}
                    onChange={(event) =>
                      setLocationForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    className={`${TEXTAREA_BASE_CLASS} h-20`}
                  />
                </label>
                <label className={`md:col-span-2 ${FIELD_LABEL_CLASS}`}>
                  <span className="text-slate-200">Upload images</span>
                  <input
                    key={locationFileInputKey}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) =>
                      setLocationForm((prev) => ({
                        ...prev,
                        image_files: event.target.files
                          ? Array.from(event.target.files)
                          : [],
                      }))
                    }
                    className={`${INPUT_BASE_CLASS} file:mr-3 file:rounded-md file:border-0 file:bg-gradient-to-r file:from-emerald-500 file:via-cyan-500 file:to-blue-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-950 hover:file:brightness-110`}
                  />
                  <p className={FIELD_SUBTEXT_CLASS}>
                    Upload one or more images; files are uploaded alongside any
                    manual URLs you add for this location.
                  </p>
                </label>
                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span>Coordinate Picker</span>
                    <span className="text-xs text-slate-400">
                      Click on the map to update longitude & latitude.
                    </span>
                  </div>
                  <LocationMapPicker
                    value={{ lon: locationForm.lon, lat: locationForm.lat }}
                    cityCenter={selectedCityCenter}
                    disabled={isLocationMapDisabled}
                    onChange={({ lon, lat }) =>
                      setLocationForm((prev) => ({
                        ...prev,
                        lon,
                        lat,
                      }))
                    }
                  />
                </div>
                <label className={FIELD_LABEL_CLASS}>
                  <span className="text-slate-200">Longitude</span>
                  <input
                    type="text"
                    value={locationForm.lon}
                    onChange={(event) =>
                      setLocationForm((prev) => ({
                        ...prev,
                        lon: event.target.value,
                      }))
                    }
                    className={INPUT_BASE_CLASS}
                  />
                </label>
                <label className={FIELD_LABEL_CLASS}>
                  <span className="text-slate-200">Latitude</span>
                  <input
                    type="text"
                    value={locationForm.lat}
                    onChange={(event) =>
                      setLocationForm((prev) => ({
                        ...prev,
                        lat: event.target.value,
                      }))
                    }
                    className={INPUT_BASE_CLASS}
                  />
                </label>
                <div className="md:col-span-2 flex justify-end gap-3">
                  <button
                    type="submit"
                    className="rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:scale-[1.02]"
                  >
                    {locationForm.id ? "Update Location" : "Add Location"}
                  </button>
                </div>
              </form>

              <LocationTable
                locations={locations}
                cityLookup={cityLabelById}
                onEdit={handleLocationEdit}
                onDelete={handleLocationDelete}
                categoryGroups={baseLocationTypeGroups}
              />
            </section>
          ) : null}

          {activePanel === "roads" ? (
            <section className="space-y-6">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className={SECTION_HEADING_CLASS}>Roads</h2>
                  <p className={SECTION_DESCRIPTION_CLASS}>
                    Maintain road geometries and one-way metadata for route
                    planning.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className={PANEL_PILL_CLASS}>{roads.length} total</span>
                </div>
              </div>

              <form onSubmit={handleRoadSubmit} className={FORM_CARD_CLASS}>
                <div className="md:col-span-2 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    {roadForm.id ? "Edit Road" : "Create Road"}
                  </h3>
                  {roadForm.id ? (
                    <button
                      type="button"
                      onClick={() => {
                        setRoadForm(initialRoadForm);
                      }}
                      className="text-xs uppercase tracking-wide text-emerald-300 hover:text-emerald-200"
                    >
                      Cancel edit
                    </button>
                  ) : null}
                </div>
                <label className={FIELD_LABEL_CLASS}>
                  <span className="text-slate-200">City *</span>
                  <select
                    required
                    value={roadForm.city_id}
                    onChange={(event) => {
                      const nextCityId = event.target.value;
                      setRoadForm((prev) => ({
                        ...prev,
                        city_id: nextCityId,
                        intersection_ids: [],
                        coordinates: "",
                      }));
                    }}
                    className={SELECT_BASE_CLASS}
                  >
                    <option value="">Select a city</option>
                    {cityOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={FIELD_LABEL_CLASS}>
                  <span className="text-slate-200">English Name</span>
                  <input
                    type="text"
                    value={roadForm.english_name}
                    onChange={(event) =>
                      setRoadForm((prev) => ({
                        ...prev,
                        english_name: event.target.value,
                      }))
                    }
                    className={INPUT_BASE_CLASS}
                  />
                </label>
                <label className={FIELD_LABEL_CLASS}>
                  <span className="text-slate-200">Burmese Name</span>
                  <input
                    type="text"
                    value={roadForm.burmese_name}
                    onChange={(event) =>
                      setRoadForm((prev) => ({
                        ...prev,
                        burmese_name: event.target.value,
                      }))
                    }
                    className={INPUT_BASE_CLASS}
                  />
                </label>
                <label className={FIELD_LABEL_CLASS}>
                  <span className="text-slate-200">Road Type</span>
                  <select
                    value={roadForm.road_type}
                    onChange={(event) =>
                      setRoadForm((prev) => ({
                        ...prev,
                        road_type: event.target.value,
                      }))
                    }
                    className={SELECT_BASE_CLASS}
                  >
                    <option value="">Select a road type</option>
                    {ROAD_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {humanizeKey(option)}
                      </option>
                    ))}
                    {roadForm.road_type &&
                    !ROAD_TYPE_OPTIONS.includes(roadForm.road_type) ? (
                      <option value={roadForm.road_type}>
                        {`Current: ${humanizeKey(roadForm.road_type)}`}
                      </option>
                    ) : null}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-200">
                  <input
                    type="checkbox"
                    checked={roadForm.is_oneway}
                    onChange={(event) =>
                      setRoadForm((prev) => ({
                        ...prev,
                        is_oneway: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border border-white/20 text-emerald-400 accent-emerald-400"
                  />
                  <span className="text-slate-200">One way</span>
                </label>
                <div className="md:col-span-2 space-y-4">
                  <div className="flex flex-col gap-1 text-sm font-medium text-slate-200">
                    <span className="text-slate-200">
                      Pick intersections on the map
                    </span>
                    <span className={FIELD_SUBTEXT_CLASS}>
                      Choose at least two intersections within the selected
                      city. Click a marker to toggle selection; the road
                      geometry and distance are generated automatically.
                    </span>
                  </div>
                  <RoadIntersectionMap
                    intersections={cityIntersections
                      .map((location) => {
                        const { lon, lat } = extractPointFromWkt(
                          location.geometry
                        );
                        return {
                          id: location.id,
                          name:
                            location.english_name ||
                            location.burmese_name ||
                            location.id,
                          lon: Number(lon),
                          lat: Number(lat),
                        };
                      })
                      .filter(
                        (point) =>
                          Number.isFinite(point.lon) &&
                          Number.isFinite(point.lat)
                      )}
                    selectedIds={roadForm.intersection_ids}
                    onChange={(nextIds) =>
                      setRoadForm((prev) => ({
                        ...prev,
                        intersection_ids: nextIds,
                      }))
                    }
                    existingRoads={cityRoadPolylines}
                    disabled={
                      !roadForm.city_id || cityIntersections.length === 0
                    }
                  />
                  <div className="flex flex-wrap gap-2">
                    {selectedIntersections.length ? (
                      selectedIntersections.map((location, index) => (
                        <span
                          key={location.id}
                          className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200"
                        >
                          <span className="font-medium">{index + 1}.</span>
                          <span>
                            {location.english_name ||
                              location.burmese_name ||
                              location.id}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setRoadForm((prev) => ({
                                ...prev,
                                intersection_ids: prev.intersection_ids.filter(
                                  (intersectionId) =>
                                    intersectionId !== location.id
                                ),
                              }))
                            }
                            className="rounded-full border border-emerald-300/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200 transition hover:border-emerald-200 hover:text-emerald-50"
                          >
                            Remove
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full border border-dashed border-white/15 px-3 py-1 text-xs text-slate-400">
                        No intersections selected yet.
                      </span>
                    )}
                    {selectedIntersections.length ? (
                      <button
                        type="button"
                        onClick={() =>
                          setRoadForm((prev) => ({
                            ...prev,
                            intersection_ids: [],
                            coordinates: "",
                          }))
                        }
                        className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-emerald-300/40 hover:bg-emerald-400/10 hover:text-white"
                      >
                        Clear selections
                      </button>
                    ) : null}
                  </div>
                </div>
                <label className={`md:col-span-2 ${FIELD_LABEL_CLASS}`}>
                  <span className="text-slate-200">
                    Coordinates (lon,lat per line or comma separated pairs)
                  </span>
                  <textarea
                    required={roadForm.intersection_ids.length < 2}
                    value={roadForm.coordinates}
                    onChange={(event) =>
                      setRoadForm((prev) => ({
                        ...prev,
                        coordinates: event.target.value,
                      }))
                    }
                    readOnly={roadForm.intersection_ids.length >= 2}
                    className={`${TEXTAREA_BASE_CLASS} h-28 ${
                      roadForm.intersection_ids.length >= 2
                        ? "bg-slate-900/40"
                        : ""
                    }`}
                  />
                  <p className={FIELD_SUBTEXT_CLASS}>
                    {roadForm.intersection_ids.length >= 2
                      ? "Coordinates are auto-generated from the selected intersections. Remove an intersection to edit manually."
                      : "Provide coordinates manually if intersections are unavailable."}
                  </p>
                </label>
                <div className="md:col-span-2 flex justify-end gap-3">
                  <button
                    type="submit"
                    className="rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:scale-[1.02]"
                  >
                    {roadForm.id ? "Update Road" : "Add Road"}
                  </button>
                </div>
              </form>

              <RoadTable
                roads={roads}
                cityLookup={cityLabelById}
                roadTypeOptions={ROAD_TYPE_OPTIONS}
                onEdit={handleRoadEdit}
                onDelete={handleRoadDelete}
              />
            </section>
          ) : null}

          {activePanel === "users" ? (
            <section className="space-y-6">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className={SECTION_HEADING_CLASS}>Users</h2>
                  <p className={SECTION_DESCRIPTION_CLASS}>
                    Review registered administrators and contributors.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className={PANEL_PILL_CLASS}>{users.length} total</span>
                </div>
              </div>

              <UserTable users={users} />
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
