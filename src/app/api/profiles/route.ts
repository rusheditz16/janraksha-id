import { prisma } from "@/lib/prisma";
import { saveProfileToMemory, getAllProfilesFromMemory } from "@/lib/memoryStore";

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

      // Synchronize found profiles with in-memory store
      profiles.forEach((p) => saveProfileToMemory(p));

      // Also include any profiles registered in memory that aren't in SQLite
      const memoryProfiles = getAllProfilesFromMemory();
      const combinedMap = new Map();
      profiles.forEach((p) => combinedMap.set(p.janRakshaCode, p));
      memoryProfiles.forEach((p) => {
        if (!combinedMap.has(p.janRakshaCode)) {
          combinedMap.set(p.janRakshaCode, p);
        }
      });

      let combined = Array.from(combinedMap.values());
      if (query) {
        combined = combined.filter(
          (p) =>
            p.fullName?.toLowerCase().includes(query.toLowerCase()) ||
            p.janRakshaCode?.toLowerCase().includes(query.toLowerCase())
        );
      }
      if (status && status !== "ALL") combined = combined.filter((p) => p.status === status);
      if (personType && personType !== "ALL") combined = combined.filter((p) => p.personType === personType);

      return Response.json({ success: true, count: combined.length, data: combined });
    } catch (dbError) {
      // Memory Store Fallback
      let combined = getAllProfilesFromMemory();
      if (query) {
        combined = combined.filter(
          (p) =>
            p.fullName?.toLowerCase().includes(query.toLowerCase()) ||
            p.janRakshaCode?.toLowerCase().includes(query.toLowerCase())
        );
      }
      if (status && status !== "ALL") combined = combined.filter((p) => p.status === status);
      if (personType && personType !== "ALL") combined = combined.filter((p) => p.personType === personType);

      return Response.json({ success: true, count: combined.length, data: combined });
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

    // Save into universal memory store immediately so scan page and search can find it
    saveProfileToMemory(profileData);

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

      saveProfileToMemory(newProfile);
      return Response.json({ success: true, data: newProfile }, { status: 201 });
    } catch (dbErr: any) {
      console.warn("Prisma write notice (using universal storage):", dbErr.message);
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
