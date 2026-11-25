const adjacentZones = {
  "Division of IT": ["Lecture Hall Complex", "Laboratories"],
  "Main Library": ["Lecture Hall Complex", "Canteen"],
  "Lecture Hall Complex": ["Division of IT", "Main Library", "Laboratories"],
  Laboratories: ["Division of IT", "Lecture Hall Complex"],
  Canteen: ["Main Library", "Sports Complex"],
  "Sports Complex": ["Canteen"],
};

function jaroWinkler(left, right) {
  const a = String(left ?? "").trim().toLowerCase();
  const b = String(right ?? "").trim().toLowerCase();
  if (!a || !b) return 0;
  if (a === b) return 1;

  const distance = Math.max(Math.floor(Math.max(a.length, b.length) / 2) - 1, 0);
  const aMatches = new Array(a.length).fill(false);
  const bMatches = new Array(b.length).fill(false);
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

  if (!matches) return 0;
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

function scoreLocation(left, right) {
  if (left === right) return 1;
  if (adjacentZones[left]?.includes(right)) return 0.6;
  return 0;
}

function scoreDate(left, right) {
  const leftDate = new Date(left);
  const rightDate = new Date(right);
  if (Number.isNaN(leftDate.getTime()) || Number.isNaN(rightDate.getTime())) return 0;
  const days = Math.abs(leftDate.getTime() - rightDate.getTime()) / 86_400_000;
  return Math.max(0, 1 - days / 14);
}

export function calculateMatchScore(left, right) {
  if (left.kind === right.kind) return 0;
  const category = left.category === right.category ? 1 : 0;
  const location = scoreLocation(left.zone, right.zone);
  const date = scoreDate(left.date, right.date);
  const text = jaroWinkler(
    `${left.title} ${left.description} ${left.colour}`,
    `${right.title} ${right.description} ${right.colour}`,
  );
  return 0.35 * category + 0.25 * location + 0.15 * date + 0.25 * text;
}

export function findMatches(listing, listings, threshold = 0.6) {
  return listings
    .filter((candidate) => candidate.id !== listing.id && candidate.status === "ACTIVE")
    .map((candidate) => ({
      listingId: listing.id,
      candidateId: candidate.id,
      score: calculateMatchScore(listing, candidate),
    }))
    .filter((match) => match.score >= threshold)
    .sort((left, right) => right.score - left.score);
}

export function findClaimableMatch(listingId, claimantId, matchRows) {
  for (const row of matchRows) {
    const counterpart = row.lostListingId === listingId
      ? row.listings_matches_foundListingIdTolistings
      : row.listings_matches_lostListingIdTolistings;
    if (counterpart?.userId === claimantId) return { match: row, counterpart };
  }
  return null;
}
