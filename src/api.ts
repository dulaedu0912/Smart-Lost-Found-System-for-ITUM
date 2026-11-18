import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { Listing, ListingKind, Match } from "./domain";

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:43127").replace(/\/$/, "");
const TOKEN_KEY = "smart-campus.access-token";
const USER_KEY = "smart-campus.user";
let webAccessToken: string | null = null;
const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  accessToken: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = Platform.OS === "web"
    ? webAccessToken
    : await SecureStore.getItemAsync(TOKEN_KEY);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError("Unable to reach the campus service. Check your connection.", 0, "NETWORK_ERROR");
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      body?.error?.message ?? "The request could not be completed.",
      response.status,
      body?.error?.code,
      body?.error?.details,
    );
  }
  return body as T;
}

async function persistSession(user: AuthUser): Promise<void> {
  if (Platform.OS === "web") {
    webAccessToken = user.accessToken;
    return;
  }
  await Promise.all([
    SecureStore.setItemAsync(TOKEN_KEY, user.accessToken),
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
  ]);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  if (Platform.OS === "web") return null;
  const stored = await SecureStore.getItemAsync(USER_KEY);
  if (!stored) return null;
  try {
    const user = JSON.parse(stored) as AuthUser;
    return user.accessToken ? user : null;
  } catch {
    return null;
  }
}

export async function register(input: {
  email: string;
  displayName: string;
  password: string;
}): Promise<AuthUser> {
  const result = await request<{ data: AuthUser }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
  await persistSession(result.data);
  return result.data;
}

export async function login(input: { email: string; password: string }): Promise<AuthUser> {
  const result = await request<{ data: AuthUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  await persistSession(result.data);
  return result.data;
}

export async function signOut(): Promise<void> {
  if (Platform.OS === "web") {
    webAccessToken = null;
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  }
}

export async function listListings(kind?: ListingKind): Promise<Listing[]> {
  const result = await request<{ data: Listing[] }>(`/api/listings${kind ? `?kind=${kind}` : ""}`);
  return result.data.map((listing) => ({ ...listing, ownerName: listing.ownerName ?? "Campus user" }));
}

export async function createListing(input: {
  kind: ListingKind;
  category: string;
  zone: string;
  date: string;
  colour: string;
  title: string;
  description: string;
  privateDetail: string;
  photoUrl?: string;
}): Promise<{ listing: Listing; matches: Match[] }> {
  const result = await request<{ data: Listing; matches: Match[] }>("/api/listings", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return { listing: result.data, matches: result.matches };
}

export async function claimListing(listingId: string, privateDetail: string): Promise<void> {
  await request(`/api/listings/${encodeURIComponent(listingId)}/claims`, {
    method: "POST",
    body: JSON.stringify({ privateDetail }),
  });
}

export async function uploadPhoto(uri: string): Promise<string> {
  if (!cloudName || !uploadPreset) {
    throw new ApiError("Photo uploads are not configured. Set the Cloudinary environment variables.", 0, "MEDIA_NOT_CONFIGURED");
  }
  const form = new FormData();
  form.append("file", { uri, type: "image/jpeg", name: "lost-found-photo.jpg" } as unknown as Blob);
  form.append("upload_preset", uploadPreset);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || typeof body?.secure_url !== "string") {
    throw new ApiError("The photo could not be uploaded. Try again.", response.status, "MEDIA_UPLOAD_FAILED");
  }
  return body.secure_url;
}

export async function listNotifications(): Promise<Match[]> {
  const result = await request<{ data: Match[] }>("/api/notifications");
  // shortcut: claim notifications are hidden here because the alerts tab only renders matches, add a claims inbox when needed
  return result.data.filter((notification) => notification.candidateId);
}
