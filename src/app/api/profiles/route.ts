import { prisma } from "@/lib/prisma";

// GET: fetch profiles with search & filter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const status = searchParams.get("status");
    const personType = searchParams.get("personType");

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

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (personType && personType !== "ALL") {
      where.personType = personType;
    }

    const profiles = await prisma.personProfile.findMany({
      where,
      include: {
        scanLogs: {
          orderBy: { scannedAt: "desc" },
          take: 3,
        },
        reunificationNotes: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return Response.json({ success: true, count: profiles.length, data: profiles });
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

    // Generate unique short code if not provided
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const typePrefix = body.personType ? body.personType.substring(0, 3).toUpperCase() : "GEN";
    const janRakshaCode = body.janRakshaCode || `JR-${typePrefix}-${randomSuffix}`;

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

    return Response.json({ success: true, data: newProfile }, { status: 201 });
  } catch (error: any) {
    console.error("Profile creation error:", error);
    return Response.json(
      { success: false, error: error.message || "Failed to create profile" },
      { status: 400 }
    );
  }
}
