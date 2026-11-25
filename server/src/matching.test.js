import test from "node:test";
import assert from "node:assert/strict";
import { calculateMatchScore, findClaimableMatch, findMatches } from "./matching.js";
import { createAccessToken, hashPassword, readAccessToken, verifyPassword } from "./auth.js";

const lostCalculator = {
  id: "lost",
  kind: "LOST",
  category: "Scientific calculator",
  zone: "Division of IT",
  date: "2026-11-16",
  colour: "Black",
  title: "Casio calculator",
  description: "Black Casio with a scratch near the display",
  status: "ACTIVE",
};

const foundCalculator = {
  ...lostCalculator,
  id: "found",
  kind: "FOUND",
  zone: "Laboratories",
  title: "Calculator found in lab",
};

test("scores a strong opposing listing above the configured threshold", () => {
  const score = calculateMatchScore(lostCalculator, foundCalculator);
  assert.ok(score > 0.6);
  assert.equal(calculateMatchScore(lostCalculator, { ...foundCalculator, kind: "LOST" }), 0);
});

test("returns opposing active matches ranked by score", () => {
  const matches = findMatches(lostCalculator, [
    lostCalculator,
    foundCalculator,
    { ...foundCalculator, id: "weak", category: "Umbrella", title: "Umbrella", description: "Red umbrella" },
  ]);
  assert.deepEqual(matches.map((match) => match.candidateId), ["found"]);
});

test("hashes passwords and rejects tampered access tokens", async () => {
  const stored = await hashPassword("strong-pass-123");
  assert.equal(await verifyPassword("strong-pass-123", stored), true);
  assert.equal(await verifyPassword("wrong-password", stored), false);

  const token = createAccessToken("user-1", "test-secret");
  assert.equal(readAccessToken(token, "test-secret")?.sub, "user-1");
  assert.equal(readAccessToken(`${token}tampered`, "test-secret"), null);
});

test("finds the match that pairs a listing with the claimant's own report", () => {
  const target = { id: "found", userId: "owner" };
  const own = { id: "lost", userId: "claimant" };
  const rows = [
    {
      id: "m1",
      lostListingId: "other-lost",
      foundListingId: "found",
      listings_matches_lostListingIdTolistings: { id: "other-lost", userId: "someone" },
      listings_matches_foundListingIdTolistings: target,
    },
    {
      id: "m2",
      lostListingId: "lost",
      foundListingId: "found",
      listings_matches_lostListingIdTolistings: own,
      listings_matches_foundListingIdTolistings: target,
    },
  ];

  const claimable = findClaimableMatch("found", "claimant", rows);
  assert.equal(claimable?.match.id, "m2");
  assert.equal(claimable?.counterpart.id, "lost");
  assert.equal(findClaimableMatch("found", "stranger", rows), null);
});
