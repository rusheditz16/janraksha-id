import { prisma } from "@/lib/prisma";

// Fallback in-memory storage for serverless environments (like Vercel) where SQLite file write is restricted
let inMemoryProfiles: any[] = [];

// GET: fetch profiles with search & filter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const status = searchParams.get("status");
    const personType = searchParams.get("personType");

    try {
      const where: any = {};
      if (query) {
        where.OR = [
          { fullName: { contains: query } },
          { janRakshaCode: { contains: query } },
          { guardianName: { contains: query } },
          { eventName: { contains: query } },
          { criticalNotes: { contains: query } },
        ];
      }
      if (status && status !== "ALL") where.status = status;
      if (personType && personType !== "ALL") where.personType = personType;

      const profiles = await prisma.personProfile.findMany({
        where,
        include: {
          scanLogs: { orderBy: { scannedAt: "desc" }, take: 3 },
          reunificationNotes: { orderBy: { createdAt: "desc" } },
        },
        orderBy: { updatedAt: "desc" },
      });

      return Response.json({ success: true, count: profiles.length, data: profiles });
    } catch (dbError) {
      // Graceful fallback to memory storage on read failure
      let filtered = [...inMemoryProfiles];
      if (query) {
        filtered = filtered.filter(
          (p) =>
            p.fullName.toLowerCase().includes(query.toLowerCase()) ||
            p.janRakshaCode.toLowerCase().includes(query.toLowerCase())
        );
      }
      if (status && status !== "ALL") filtered = filtered.filter((p) => p.status === status);
      if (personType && personType !== "ALL") filtered = filtered.filter((p) => p.personType === personType);

      return Response.json({ success: true, count: filtered.length, data: filtered });
    }
  } catch (error: any) {
    console.error("Profiles fetch error:", error);
    return Response.json(
      { success: false, error: "Failed to fetch profiles" },
      { status: 500 }
    );
  }
}

// POST: Create a new JanRaksha Profile
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const typePrefix = body.personType ? body.personType.substring(0, 3).toUpperCase() : "GEN";
    const janRakshaCode = body.janRakshaCode || `JR-${typePrefix}-${randomSuffix}`;

    const profileData = {
      id: `profile-${Date.now()}`,
      janRakshaCode,
      fullName: body.fullName,
      age: body.age ? parseInt(body.age, 10) : null,
      gender: body.gender || null,
      personType: body.personType || "GENERAL",
      photoUrl: body.photoUrl || null,
      guardianName: body.guardianName,
      guardianPhone: body.guardianPhone,
      guardianAltPhone: body.guardianAltPhone || null,
      guardianEmail: body.guardianEmail || null,
      guardianAddress: body.guardianAddress || null,
      bloodGroup: body.bloodGroup || "UNKNOWN",
      allergies: body.allergies || null,
      chronicIllness: body.chronicIllness || null,
      criticalNotes: body.criticalNotes || null,
      emergencyDoctor: body.emergencyDoctor || null,
      doctorPhone: body.doctorPhone || null,
      eventName: body.eventName || null,
      assignedBooth: body.assignedBooth || null,
      wristbandUid: body.wristbandUid || null,
      status: body.status || "SAFE",
      lastSeenLocation: body.lastSeenLocation || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scanLogs: [],
      reunificationNotes: [],
      dispatchAlerts: [],
    };

    try {
      const newProfile = await prisma.personProfile.create({
        data: {
          janRakshaCode,
          fullName: body.fullName,
          age: body.age ? parseInt(body.age, 10) : null,
          gender: body.gender || null,
          personType: body.personType || "GENERAL",
          photoUrl: body.photoUrl || null,
          guardianName: body.guardianName,
          guardianPhone: body.guardianPhone,
          guardianAltPhone: body.guardianAltPhone || null,
          guardianEmail: body.guardianEmail || null,
          guardianAddress: body.guardianAddress || null,
          bloodGroup: body.bloodGroup || "UNKNOWN",
          allergies: body.allergies || null,
          chronicIllness: body.chronicIllness || null,
          criticalNotes: body.criticalNotes || null,
          emergencyDoctor: body.emergencyDoctor || null,
          doctorPhone: body.doctorPhone || null,
          eventName: body.eventName || null,
          assignedBooth: body.assignedBooth || null,
          wristbandUid: body.wristbandUid || null,
          status: body.status || "SAFE",
          lastSeenLocation: body.lastSeenLocation || null,
        },
      });

      inMemoryProfiles.unshift(newProfile);
      return Response.json({ success: true, data: newProfile }, { status: 201 });
    } catch (dbErr: any) {
      console.warn("Prisma write warning (fallback to serverless session storage):", dbErr.message);
      inMemoryProfiles.unshift(profileData);
      return Response.json({ success: true, data: profileData, fallback: true }, { status: 201 });
    }
  } catch (error: any) {
    console.error("Profile creation error:", error);
    return Response.json(
      { success: false, error: error.message || "Failed to create profile" },
      { status: 400 }
    );
  }
}
