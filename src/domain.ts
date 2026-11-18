export type ListingKind = "LOST" | "FOUND";
export type ListingStatus = "ACTIVE" | "MATCHED" | "CLAIMED" | "EXPIRED";

export type Listing = {
  id: string;
  kind: ListingKind;
  category: string;
  zone: string;
  date: string;
  colour: string;
  title: string;
  description: string;
  status: ListingStatus;
  ownerName?: string;
  ownerId?: string;
};

export type Match = {
  id: string;
  listingId: string;
  candidateId: string;
  score: number;
  summary: string;
  read: boolean;
};

export const categories = [
  "Student ID card",
  "Scientific calculator",
  "Water bottle",
  "Earphones",
  "Umbrella",
  "USB drive",
  "Spectacles",
] as const;

export const zones = [
  "Division of IT",
  "Main Library",
  "Lecture Hall Complex",
  "Laboratories",
  "Canteen",
  "Sports Complex",
] as const;
