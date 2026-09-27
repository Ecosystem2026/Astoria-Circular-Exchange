import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, businessesTable, matchRequestsTable } from "@workspace/db";
import {
  CreateBusinessBody,
  CreateBusinessResponse,
  GetDashboardResponse,
  GetBusinessParams,
  GetBusinessResponse,
  ListBusinessesResponse,
  ListMatchesParams,
  ListMatchesResponse,
  RequestMatchBody,
  RequestMatchParams,
  RequestMatchResponse,
  UpdateBusinessBody,
  UpdateBusinessParams,
  UpdateBusinessResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const seedBusinesses = [
  {
    name: "Astoria Coffee Lab",
    type: "Coffee shop",
    address: "31-07 Ditmars Blvd",
    neighborhood: "Ditmars",
    wasteMaterial: "Coffee grounds",
    wasteQuantity: "45 lb / week",
    wantedMaterial: "Cardboard boxes",
    pickupWindow: "Tue / Thu · mornings",
    initials: "AC",
  },
  {
    name: "The Garden School",
    type: "Community garden",
    address: "29-15 Ditmars Blvd",
    neighborhood: "Ditmars",
    wasteMaterial: "Finished compost",
    wasteQuantity: "80 lb / week",
    wantedMaterial: "Coffee grounds",
    pickupWindow: "Tue / Thu · mornings",
    initials: "GS",
  },
  {
    name: "Borough Bakery",
    type: "Bakery",
    address: "31-19 23rd Ave",
    neighborhood: "Ditmars",
    wasteMaterial: "Cardboard boxes",
    wasteQuantity: "60 lb / week",
    wantedMaterial: "Coffee grounds",
    pickupWindow: "Tue / Thu · mornings",
    initials: "BB",
  },
  {
    name: "Mosaic Makers",
    type: "Maker studio",
    address: "36-01 34th St",
    neighborhood: "Central Astoria",
    wasteMaterial: "Glass jars",
    wasteQuantity: "25 lb / week",
    wantedMaterial: "Cardboard boxes",
    pickupWindow: "Wed · afternoons",
    initials: "MM",
  },
  {
    name: "Raaka Chocolate",
    type: "Food producer",
    address: "39-01 Main Ave",
    neighborhood: "Ravenswood",
    wasteMaterial: "Cocoa husks",
    wasteQuantity: "35 lb / week",
    wantedMaterial: "Coffee grounds",
    pickupWindow: "Fri · mornings",
    initials: "RC",
  },
];

const distanceById: Record<number, number> = {
  1: 0,
  2: 1.1,
  3: 1.9,
  4: 3.1,
  5: 4.4,
};

type BusinessRow = typeof businessesTable.$inferSelect;

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

async function ensureSeedData(): Promise<void> {
  const existing = await db.select({ id: businessesTable.id }).from(businessesTable);
  if (existing.length > 0) {
    return;
  }
  await db.insert(businessesTable).values(seedBusinesses);
}

function asBusiness(business: BusinessRow) {
  return {
    id: business.id,
    name: business.name,
    type: business.type,
    address: business.address,
    neighborhood: business.neighborhood,
    wasteMaterial: business.wasteMaterial,
    wasteQuantity: business.wasteQuantity,
    wantedMaterial: business.wantedMaterial,
    pickupWindow: business.pickupWindow,
    initials: business.initials,
  };
}

function normalized(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function materialMatches(left: string, right: string): boolean {
  const leftWords = new Set(normalized(left).split(" "));
  const rightWords = normalized(right).split(" ");
  return rightWords.some((word) => word.length > 3 && leftWords.has(word));
}

function distanceFor(businessId: number, partnerId: number): number {
  if (businessId === partnerId) return 0;
  const knownBusiness = distanceById[businessId] ?? 1.5;
  const knownPartner = distanceById[partnerId] ?? 1.5;
  return Math.max(0.8, Math.abs(knownBusiness - knownPartner) + 0.4);
}

function distanceScore(distance: number): number {
  if (distance <= 1.5) return 40;
  if (distance <= 2.5) return 30;
  if (distance <= 3.5) return 20;
  if (distance <= 4.5) return 10;
  return 0;
}

function timingScore(left: string, right: string): number {
  const leftNormalized = normalized(left);
  const rightNormalized = normalized(right);
  if (leftNormalized === rightNormalized) return 20;
  if (
    leftNormalized.includes("morning") &&
    rightNormalized.includes("morning")
  ) {
    return 14;
  }
  if (
    leftNormalized.includes("afternoon") &&
    rightNormalized.includes("afternoon")
  ) {
    return 14;
  }
  return 8;
}

async function rankedMatches(business: BusinessRow) {
  const partners = await db
    .select()
    .from(businessesTable)
    .where((table) => undefined);
  const requests = await db
    .select()
    .from(matchRequestsTable)
    .where(eq(matchRequestsTable.businessId, business.id))
    .orderBy(desc(matchRequestsTable.createdAt));

  return partners
    .filter((partner) => partner.id !== business.id)
    .map((partner) => {
      const outgoingCompatibility = materialMatches(
        business.wasteMaterial,
        partner.wantedMaterial,
      );
      const incomingCompatibility = materialMatches(
        partner.wasteMaterial,
        business.wantedMaterial,
      );
      const compatibilityPoints =
        outgoingCompatibility && incomingCompatibility
          ? 40
          : outgoingCompatibility || incomingCompatibility
            ? 30
            : 0;
      const distance = distanceFor(business.id, partner.id);
      const timingPoints = timingScore(
        business.pickupWindow,
        partner.pickupWindow,
      );
      const id = business.id * 1000 + partner.id;
      const request = requests.find((entry) => entry.partnerId === partner.id);

      return {
        id,
        partner: asBusiness(partner),
        score: compatibilityPoints + distanceScore(distance) + timingPoints,
        compatibilityScore: compatibilityPoints,
        distanceScore: distanceScore(distance),
        timingScore: timingPoints,
        distance: `${distance.toFixed(1)} mi`,
        route: `${business.neighborhood} → ${partner.neighborhood}`,
        material: outgoingCompatibility
          ? `${business.wasteMaterial} → ${partner.name}`
          : `${partner.wasteMaterial} → ${business.name}`,
        quantity: outgoingCompatibility
          ? business.wasteQuantity
          : partner.wasteQuantity,
        pickupWindow: partner.pickupWindow,
        status: request?.status === "confirmed" ? "confirmed" : request ? "requested" : "available",
      };
    })
    .sort((a, b) => b.score - a.score);
}

async function currentBusiness(): Promise<BusinessRow> {
  await ensureSeedData();
  const [business] = await db
    .select()
    .from(businessesTable)
    .orderBy(businessesTable.id)
    .limit(1);
  if (!business) {
    throw new Error("Unable to initialize the Astoria exchange");
  }
  return business;
}

router.get("/dashboard", async (_req, res): Promise<void> => {
  const business = await currentBusiness();
  const matches = await rankedMatches(business);
  const businesses = await db.select().from(businessesTable);
  const requested = matches.filter((match) => match.status !== "available");

  const data = {
    currentBusiness: asBusiness(business),
    matches,
    stats: {
      activeMatches: matches.filter((match) => match.score >= 70).length,
      divertedThisMonth: "1,140 lb",
      localPartners: Math.max(0, businesses.length - 1),
      wasteAvoided: "45 lb / week",
    },
    activity: [
      {
        id: 1,
        title: "Your exchange profile is live",
        description: "Astoria businesses can now find your coffee grounds.",
        time: "Just now",
        kind: "profile",
      },
      {
        id: 2,
        title: "New high-fit match found",
        description: `${matches[0]?.partner.name ?? "A local partner"} is ${matches[0]?.distance ?? "nearby"}.`,
        time: "Today",
        kind: "match",
      },
      ...(requested.length > 0
        ? [
            {
              id: 3,
              title: "Pickup request sent",
              description: "A partner has your request to coordinate pickup.",
              time: "Earlier this week",
              kind: "pickup",
            },
          ]
        : [
            {
              id: 3,
              title: "You could divert 45 lb this week",
              description: "Keep materials moving through the neighborhood.",
              time: "This week",
              kind: "impact",
            },
          ]),
    ],
  };

  res.json(GetDashboardResponse.parse(data));
});

router.get("/businesses", async (_req, res): Promise<void> => {
  await ensureSeedData();
  const businesses = await db.select().from(businessesTable);
  res.json(ListBusinessesResponse.parse(businesses.map(asBusiness)));
});

router.post("/businesses", async (req, res): Promise<void> => {
  const parsed = CreateBusinessBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const input = parsed.data;
  const [business] = await db
    .insert(businessesTable)
    .values({
      ...input,
      neighborhood: "Astoria",
      initials: initialsFor(input.name),
    })
    .returning();

  res.status(201).json(CreateBusinessResponse.parse(asBusiness(business)));
});

router.get("/businesses/:businessId", async (req, res): Promise<void> => {
  const parsed = GetBusinessParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [business] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.id, parsed.data.businessId));
  if (!business) {
    res.status(404).json({ error: "Business not found" });
    return;
  }
  res.json(GetBusinessResponse.parse(asBusiness(business)));
});

router.patch("/businesses/:businessId", async (req, res): Promise<void> => {
  const parsedParams = UpdateBusinessParams.safeParse(req.params);
  const parsedBody = UpdateBusinessBody.safeParse(req.body);
  if (!parsedParams.success || !parsedBody.success) {
    res.status(400).json({ error: "Invalid business profile" });
    return;
  }

  const [business] = await db
    .update(businessesTable)
    .set({
      ...parsedBody.data,
      initials: initialsFor(parsedBody.data.name),
    })
    .where(eq(businessesTable.id, parsedParams.data.businessId))
    .returning();
  if (!business) {
    res.status(404).json({ error: "Business not found" });
    return;
  }
  res.json(UpdateBusinessResponse.parse(asBusiness(business)));
});

router.get(
  "/businesses/:businessId/matches",
  async (req, res): Promise<void> => {
    const parsed = ListMatchesParams.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [business] = await db
      .select()
      .from(businessesTable)
      .where(eq(businessesTable.id, parsed.data.businessId));
    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    res.json(ListMatchesResponse.parse(await rankedMatches(business)));
  },
);

router.post("/matches/:matchId/request", async (req, res): Promise<void> => {
  const parsedParams = RequestMatchParams.safeParse(req.params);
  const parsedBody = RequestMatchBody.safeParse(req.body ?? {});
  if (!parsedParams.success || !parsedBody.success) {
    res.status(400).json({ error: "Invalid match request" });
    return;
  }

  const matchId = parsedParams.data.matchId;
  const businessId = Math.floor(matchId / 1000);
  const partnerId = matchId % 1000;
  const [business] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId));
  const [partner] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.id, partnerId));
  if (!business || !partner) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  const [existing] = await db
    .select()
    .from(matchRequestsTable)
    .where(
      and(
        eq(matchRequestsTable.businessId, businessId),
        eq(matchRequestsTable.partnerId, partnerId),
      ),
    )
    .limit(1);

  if (!existing) {
    await db.insert(matchRequestsTable).values({
      businessId,
      partnerId,
      note: parsedBody.data.note ?? null,
      status: "requested",
    });
  }

  const match = (await rankedMatches(business)).find(
    (entry) => entry.id === matchId,
  );
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }
  res.json(RequestMatchResponse.parse({ ...match, status: "requested" }));
});

router.delete("/matches/:matchId/request", async (req, res): Promise<void> => {
  const parsedParams = RequestMatchParams.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ error: "Invalid match request" });
    return;
  }

  const matchId = parsedParams.data.matchId;
  const businessId = Math.floor(matchId / 1000);
  const partnerId = matchId % 1000;
  const [deleted] = await db
    .delete(matchRequestsTable)
    .where(
      and(
        eq(matchRequestsTable.businessId, businessId),
        eq(matchRequestsTable.partnerId, partnerId),
      ),
    )
    .returning({ id: matchRequestsTable.id });

  if (!deleted) {
    res.status(404).json({ error: "Pickup request not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;