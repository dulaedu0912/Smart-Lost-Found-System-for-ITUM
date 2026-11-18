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

const adjacentZones: Record<string, string[]> = {
  "Division of IT": ["Lecture Hall Complex", "Laboratories"],
  "Main Library": ["Lecture Hall Complex", "Canteen"],
  "Lecture Hall Complex": ["Division of IT", "Main Library", "Laboratories"],
  Laboratories: ["Division of IT", "Lecture Hall Complex"],
  Canteen: ["Main Library", "Sports Complex"],
  "Sports Complex": ["Canteen"],
};

export const seedListings: Listing[] = [
  {
    id: "listing-1",
    kind: "LOST",
    category: "Scientific calculator",
    zone: "Division of IT",
    date: "2026-11-16",
    colour: "Black",
    title: "Casio calculator",
    description: "Black Casio fx-991EX with a small scratch near the display.",
    status: "ACTIVE",
    ownerName: "You",
  },
  {
    id: "listing-2",
    kind: "FOUND",
    category: "Scientific calculator",
    zone: "Laboratories",
    date: "2026-11-16",
    colour: "Black",
    title: "Calculator found in lab",
    description: "Black Casio calculator with a scratch near the screen.",
    status: "ACTIVE",
    ownerName: "Nethmi",
  },
  {
    id: "listing-3",
    kind: "FOUND",
    category: "Water bottle",
    zone: "Canteen",
    date: "2026-11-15",
    colour: "Blue",
    title: "Blue bottle",
    description: "Metal bottle left near the canteen seating area.",
    status: "ACTIVE",
    ownerName: "Kavindu",
  },
];

export function jaroWinkler(left: string, right: string): number {
  const a = left.trim().toLowerCase();
  const b = right.trim().toLowerCase();
  if (!a || !b) return 0;
  if (a === b) return 1;

  const distance = Math.max(Math.floor(Math.max(a.length, b.length) / 2) - 1, 0);
  const aMatches = new Array<boolean>(a.length).fill(false);
  const bMatches = new Array<boolean>(b.length).fill(false);
  let matches = 0;

  for (let index = 0; index < a.length; index += 1) {
    const start = Math.max(0, index - distance);
    const end = Math.min(index + distance + 1, b.length);
    for (let candidate = start; candidate < end; candidate += 1) {
      if (bMatches[candidate] || a[index] !== b[candidate]) continue;
      aMatches[index] = true;
      bMatches[candidate] = true;
      matches += 1;
      break;
    }
  }

  if (matches === 0) return 0;
  let transpositions = 0;
  let candidateIndex = 0;
  for (let index = 0; index < a.length; index += 1) {
    if (!aMatches[index]) continue;
    while (!bMatches[candidateIndex]) candidateIndex += 1;
    if (a[index] !== b[candidateIndex]) transpositions += 1;
    candidateIndex += 1;
  }

  const jaro =
    (matches / a.length +
      matches / b.length +
      (matches - transpositions / 2) / matches) /
    3;
  let prefix = 0;
  while (prefix < Math.min(4, a.length, b.length) && a[prefix] === b[prefix]) {
    prefix += 1;
  }
  return jaro + prefix * 0.1 * (1 - jaro);
}

function locationScore(left: string, right: string): number {
  if (left === right) return 1;
  if (adjacentZones[left]?.includes(right)) return 0.6;
  return 0;
}

function dateScore(left: string, right: string): number {
  const days = Math.abs(
    (new Date(left).getTime() - new Date(right).getTime()) / 86_400_000,
  );
  return Math.max(0, 1 - days / 14);
}

export function calculateMatchScore(left: Listing, right: Listing): number {
  if (left.kind === right.kind) return 0;
  const category = left.category === right.category ? 1 : 0;
  const location = locationScore(left.zone, right.zone);
  const date = dateScore(left.date, right.date);
  const text = jaroWinkler(
    `${left.title} ${left.description} ${left.colour}`,
    `${right.title} ${right.description} ${right.colour}`,
  );
  return 0.35 * category + 0.25 * location + 0.15 * date + 0.25 * text;
}

export function findMatches(listing: Listing, listings: Listing[]): Match[] {
  return listings
    .filter((candidate) => candidate.id !== listing.id && candidate.status === "ACTIVE")
    .map((candidate) => ({
      id: `${listing.id}-${candidate.id}`,
      listingId: listing.id,
      candidateId: candidate.id,
      score: calculateMatchScore(listing, candidate),
      summary: `${candidate.category} reported near ${candidate.zone}`,
      read: false,
    }))
    .filter((match) => match.score >= 0.6)
    .sort((left, right) => right.score - left.score);
}
