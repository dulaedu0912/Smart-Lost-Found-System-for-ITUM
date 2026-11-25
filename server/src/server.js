import { createServer } from "node:http";
import { randomBytes, randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { createAccessToken, hashPassword, readAccessToken, verifyPassword } from "./auth.js";
import { findClaimableMatch, findMatches } from "./matching.js";

const prisma = new PrismaClient();
const port = Number(process.env.PORT ?? 43127);
const host = process.env.HOST ?? "0.0.0.0";
const threshold = Number(process.env.MATCH_THRESHOLD ?? 0.6);
const jwtSecret = process.env.JWT_SECRET ?? randomBytes(32).toString("hex");
const universityDomain = (process.env.UNIVERSITY_EMAIL_DOMAIN ?? "itum.mrt.ac.lk").toLowerCase();
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS ?? "http://localhost:8081")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);
const claimAttempts = new Map();

function sendJson(response, status, payload, origin) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(payload));
}

function errorPayload(code, message, details) {
  return { error: { code, message, ...(details ? { details } : {}) } };
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 100_000) {
      throw Object.assign(new Error("Request body is too large"), { status: 413 });
    }
  }
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    throw Object.assign(new Error("Request body must be valid JSON"), { status: 422 });
  }
}

function getOrigin(request) {
  const requested = request.headers.origin;
  return requested && allowedOrigins.has(requested) ? requested : [...allowedOrigins][0];
}

async function getAuthenticatedUser(request) {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = readAccessToken(authorization.slice("Bearer ".length), jwtSecret);
  return token ? prisma.users.findUnique({ where: { id: token.sub } }) : null;
}

function isUniversityEmail(email) {
  return typeof email === "string" && email.toLowerCase().endsWith(`@${universityDomain}`);
}

function validateListing(input) {
  const required = ["kind", "category", "zone", "date", "colour", "title", "description"];
  const missing = required.filter((field) => typeof input[field] !== "string" || !input[field].trim());
  if (missing.length) return { valid: false, details: { missing } };
  if (!["LOST", "FOUND"].includes(input.kind)) {
    return { valid: false, details: { kind: "Expected LOST or FOUND" } };
  }
  if (input.title.length > 120 || input.description.length > 2_000) {
    return { valid: false, details: { text: "Title or description is too long" } };
  }
  if (Number.isNaN(new Date(input.date).getTime())) {
    return { valid: false, details: { date: "Expected an ISO date" } };
  }
  return { valid: true };
}

function listingToDomain(listing) {
  return {
    id: listing.id,
    kind: listing.type,
    category: listing.categories.name,
    zone: listing.zones.name,
    date: listing.date.toISOString().slice(0, 10),
    colour: listing.color,
    title: listing.title,
    description: listing.description,
    status: listing.status,
    ownerName: listing.users.fullName,
    photoUrl: listing.imageUrl,
    userId: listing.userId,
  };
}

function publicListing(listing) {
  const domain = listingToDomain(listing);
  const { userId, ...safeListing } = domain;
  return { ...safeListing, ownerId: userId };
}

const listingInclude = { categories: true, zones: true, users: true };

async function findOrCreateCategory(name) {
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return prisma.categories.upsert({
    where: { name },
    update: {},
    create: { id, name },
  });
}

async function findOrCreateZone(name) {
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return prisma.zones.upsert({
    where: { name },
    update: {},
    create: { id, name },
  });
}

async function activeListings() {
  return prisma.listings.findMany({
    where: { status: "ACTIVE" },
    include: listingInclude,
    orderBy: { createdAt: "desc" },
  });
}

async function persistMatches(listing, candidates) {
  const matches = findMatches(
    listingToDomain(listing),
    candidates.map(listingToDomain),
    threshold,
  );
  for (const match of matches) {
    const candidate = candidates.find((item) => item.id === match.candidateId);
    if (!candidate) continue;
    const existing = await prisma.matches.findFirst({
      where: {
        OR: [
          { lostListingId: listing.id, foundListingId: candidate.id },
          { lostListingId: candidate.id, foundListingId: listing.id },
        ],
      },
    });
    if (existing) continue;
    const saved = await prisma.matches.create({
      data: {
        id: randomUUID(),
        lostListingId: listing.type === "LOST" ? listing.id : candidate.id,
        foundListingId: listing.type === "FOUND" ? listing.id : candidate.id,
        score: match.score,
        userId: listing.userId,
        updatedAt: new Date(),
      },
    });
    const recipientIds = new Set([listing.userId, candidate.userId]);
    for (const userId of recipientIds) {
      await prisma.notifications.create({
        data: {
          id: randomUUID(),
          userId,
          type: "MATCH_FOUND",
          title: "Possible match found",
          message: `${candidate.categories.name} reported near ${candidate.zones.name}`,
          data: {
            matchId: saved.id,
            listingId: listing.id,
            candidateId: candidate.id,
            score: match.score,
          },
        },
      });
    }
  }
  return matches;
}

const server = createServer(async (request, response) => {
  const origin = getOrigin(request);
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {}, origin);
    return;
  }

  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
    if (request.method === "GET" && url.pathname === "/health") {
      await prisma.$queryRaw`SELECT 1`;
      sendJson(response, 200, { status: "ok", database: "connected", service: "smart-campus-lost-found" }, origin);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/auth/register") {
      const input = await readJson(request);
      const email = String(input.email ?? "").trim().toLowerCase();
      const displayName = String(input.displayName ?? "").trim();
      const password = String(input.password ?? "");
      if (!isUniversityEmail(email) || password.length < 8 || !displayName) {
        sendJson(response, 422, errorPayload("VALIDATION_ERROR", "Use a university email, display name, and password with at least 8 characters"), origin);
        return;
      }
      if (await prisma.users.findUnique({ where: { email } })) {
        sendJson(response, 409, errorPayload("EMAIL_IN_USE", "An account already exists for this email"), origin);
        return;
      }
      const user = await prisma.users.create({
        data: { id: randomUUID(), email, fullName: displayName, passwordHash: await hashPassword(password), updatedAt: new Date() },
      });
      sendJson(response, 201, { data: { id: user.id, email: user.email, displayName: user.fullName, accessToken: createAccessToken(user.id, jwtSecret) } }, origin);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/auth/login") {
      const input = await readJson(request);
      const user = await prisma.users.findUnique({ where: { email: String(input.email ?? "").trim().toLowerCase() } });
      if (!user || !(await verifyPassword(String(input.password ?? ""), user.passwordHash))) {
        sendJson(response, 401, errorPayload("INVALID_CREDENTIALS", "Email or password is incorrect"), origin);
        return;
      }
      sendJson(response, 200, { data: { id: user.id, email: user.email, displayName: user.fullName, accessToken: createAccessToken(user.id, jwtSecret) } }, origin);
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/listings") {
      const kind = url.searchParams.get("kind");
      if (kind && !["LOST", "FOUND"].includes(kind)) {
        sendJson(response, 422, errorPayload("VALIDATION_ERROR", "kind must be LOST or FOUND"), origin);
        return;
      }
      const rows = await prisma.listings.findMany({
        where: { ...(kind ? { type: kind } : {}) },
        include: listingInclude,
        orderBy: { createdAt: "desc" },
      });
      const data = rows.map(publicListing);
      sendJson(response, 200, { data, pagination: { page: 1, pageSize: data.length, totalItems: data.length, totalPages: 1 } }, origin);
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/notifications") {
      const user = await getAuthenticatedUser(request);
      if (!user) {
        sendJson(response, 401, errorPayload("UNAUTHENTICATED", "A valid access token is required"), origin);
        return;
      }
      const notifications = await prisma.notifications.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
      sendJson(response, 200, {
        data: notifications.map((notification) => ({
          id: notification.id,
          listingId: notification.data?.listingId ?? notification.data?.lostListingId,
          candidateId: notification.data?.candidateId ?? notification.data?.foundListingId,
          score: notification.data?.score ?? 0,
          read: notification.read,
          summary: notification.message,
        })),
      }, origin);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/listings") {
      const user = await getAuthenticatedUser(request);
      if (!user) {
        sendJson(response, 401, errorPayload("UNAUTHENTICATED", "A valid access token is required"), origin);
        return;
      }
      const input = await readJson(request);
      const validation = validateListing(input);
      if (!validation.valid) {
        sendJson(response, 422, errorPayload("VALIDATION_ERROR", "Invalid listing data", validation.details), origin);
        return;
      }
      const privateDetail = String(input.privateDetail ?? "").trim();
      if (!privateDetail) {
        sendJson(response, 422, errorPayload("VALIDATION_ERROR", "A private identifying detail is required"), origin);
        return;
      }
      const [category, zone] = await Promise.all([findOrCreateCategory(input.category), findOrCreateZone(input.zone)]);
      const listing = await prisma.listings.create({
        data: {
          id: randomUUID(),
          type: input.kind,
          title: input.title.trim(),
          description: input.description.trim(),
          color: input.colour.trim(),
          date: new Date(input.date),
          imageUrl: input.photoUrl || null,
          categoryId: category.id,
          zoneId: zone.id,
          userId: user.id,
          secretDetail: await hashPassword(privateDetail),
          updatedAt: new Date(),
        },
        include: listingInclude,
      });
      const candidates = await activeListings();
      const matches = await persistMatches(listing, candidates.filter((candidate) => candidate.id !== listing.id));
      sendJson(response, 201, { data: publicListing(listing), matches }, origin);
      return;
    }
    const matchRoute = url.pathname.match(/^\/api\/listings\/([^/]+)\/matches$/);
    if (request.method === "GET" && matchRoute) {
      const listing = await prisma.listings.findUnique({ where: { id: matchRoute[1] }, include: listingInclude });
      if (!listing) {
        sendJson(response, 404, errorPayload("NOT_FOUND", "Listing not found"), origin);
        return;
      }
      const candidates = await activeListings();
      const matches = findMatches(listingToDomain(listing), candidates.map(listingToDomain), threshold).map((match) => ({
        ...match,
        candidate: publicListing(candidates.find((candidate) => candidate.id === match.candidateId)),
      }));
      sendJson(response, 200, { data: matches }, origin);
      return;
    }
    const claimRoute = url.pathname.match(/^\/api\/listings\/([^/]+)\/claims$/);
    if (request.method === "POST" && claimRoute) {
      const user = await getAuthenticatedUser(request);
      if (!user) {
        sendJson(response, 401, errorPayload("UNAUTHENTICATED", "A valid access token is required"), origin);
        return;
      }
      const listing = await prisma.listings.findUnique({ where: { id: claimRoute[1] }, include: listingInclude });
      if (!listing) {
        sendJson(response, 404, errorPayload("NOT_FOUND", "Listing not found"), origin);
        return;
      }
      if (listing.userId === user.id) {
        sendJson(response, 403, errorPayload("SELF_CLAIM_FORBIDDEN", "A listing owner cannot claim their own report"), origin);
        return;
      }
      if (listing.status !== "ACTIVE") {
        sendJson(response, 409, errorPayload("ALREADY_CLAIMED", "This item is no longer open for claims"), origin);
        return;
      }
      const key = `${listing.id}:${user.id}`;
      const attempts = claimAttempts.get(key) ?? 0;
      if (attempts >= 3) {
        sendJson(response, 429, errorPayload("CLAIM_ATTEMPTS_EXCEEDED", "Claim verification is locked after three failed attempts"), origin);
        return;
      }
      const matchRows = await prisma.matches.findMany({
        where: { OR: [{ lostListingId: listing.id }, { foundListingId: listing.id }] },
        include: {
          listings_matches_lostListingIdTolistings: true,
          listings_matches_foundListingIdTolistings: true,
        },
      });
      const claimable = findClaimableMatch(listing.id, user.id, matchRows);
      if (!claimable) {
        sendJson(response, 409, errorPayload("NO_MATCH", "File a report for this item before claiming it"), origin);
        return;
      }
      if (await prisma.claims.findUnique({ where: { matchId: claimable.match.id } })) {
        sendJson(response, 409, errorPayload("ALREADY_CLAIMED", "This item has already been claimed"), origin);
        return;
      }
      const input = await readJson(request);
      const correct = listing.secretDetail && await verifyPassword(String(input.privateDetail ?? ""), listing.secretDetail);
      if (!correct) {
        claimAttempts.set(key, attempts + 1);
        sendJson(response, 422, errorPayload("CLAIM_VERIFICATION_FAILED", "The identifying detail did not match", { attemptsRemaining: Math.max(0, 2 - attempts) }), origin);
        return;
      }
      await prisma.$transaction([
        prisma.claims.create({
          data: { id: randomUUID(), matchId: claimable.match.id, claimantId: user.id, listingId: listing.id, status: "VERIFIED", resolvedAt: new Date() },
        }),
        prisma.matches.update({ where: { id: claimable.match.id }, data: { status: "ACCEPTED", updatedAt: new Date() } }),
        prisma.listings.update({ where: { id: listing.id }, data: { status: "CLAIMED", updatedAt: new Date() } }),
        prisma.listings.update({ where: { id: claimable.counterpart.id }, data: { status: "CLAIMED", updatedAt: new Date() } }),
        ...[listing.userId, user.id].map((userId) => prisma.notifications.create({
          data: {
            id: randomUUID(),
            userId,
            type: "CLAIM_VERIFIED",
            title: "Item claim verified",
            message: `A claim for "${listing.title}" was verified`,
            data: { matchId: claimable.match.id, listingId: listing.id, counterpartId: claimable.counterpart.id },
          },
        })),
      ]);
      claimAttempts.delete(key);
      sendJson(response, 200, { data: { listingId: listing.id, status: "VERIFIED" } }, origin);
      return;
    }
    sendJson(response, 404, errorPayload("NOT_FOUND", "Route not found"), origin);
  } catch (error) {
    console.error("API request failed:", error);
    const status = Number(error.status) || 500;
    sendJson(response, status, errorPayload(status === 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR", status === 500 ? "Internal server error" : error.message), origin);
  }
});

server.on("error", (error) => {
  console.error("API server failed to start:", error);
  process.exitCode = 1;
});

async function shutdown() {
  await prisma.$disconnect();
  server.close();
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
server.listen(port, host, () => {
  console.log(`Smart Campus API listening on http://localhost:${port} (${host})`);
});
