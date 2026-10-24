import { prisma } from "@/lib/prisma";
import { findProfileInMemory, saveProfileToMemory } from "@/lib/memoryStore";

// GET: Profile by Code or ID with RBAC data filtration
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "PUBLIC_FINDER";

    let profile: any = findProfileInMemory(code);

    if (!profile) {
      try {
        profile = await prisma.personProfile.findFirst({
          where: {
            OR: [
              { janRakshaCode: { equals: code } },
              { id: { equals: code } },
              { wristbandUid: { equals: code } },
            ],
          },
          include: {
            scanLogs: { orderBy: { scannedAt: "desc" }, take: 5 },
            reunificationNotes: { orderBy: { createdAt: "desc" } },
            dispatchAlerts: { orderBy: { sentAt: "desc" }, take: 3 },
          },
        });
        if (profile) {
          saveProfileToMemory(profile);
        }
      } catch (e) {
        profile = findProfileInMemory(code);
      }
    }

    if (!profile) {
      return Response.json(
        { success: false, error: "JanRaksha profile not found" },
        { status: 404 }
      );
    }

    // DATA MINIMIZATION: If role is PUBLIC_FINDER, mask sensitive home address
    const responseData = { ...profile };
    if (role === "PUBLIC_FINDER") {
      responseData.guardianAddress = "Protected under Privacy Shield (Authorized Booth Personnel Only)";
    }

    return Response.json({ success: true, role, data: responseData });
  } catch (error: any) {
    console.error("Profile detail error:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Update status, location, or details
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const userRole = body.authorRole || "POLICE_OFFICER";

    let profile: any = findProfileInMemory(code);

    if (profile) {
      if (body.status) profile.status = body.status;
      if (body.lastSeenLocation !== undefined) profile.lastSeenLocation = body.lastSeenLocation;
      if (body.reunificationNote && body.authorName) {
        if (!profile.reunificationNotes) profile.reunificationNotes = [];
        profile.reunificationNotes.unshift({
          id: `note-${Date.now()}`,
          authorName: body.authorName,
          authorRole: userRole,
          note: body.reunificationNote,
          createdAt: new Date().toISOString(),
        });
      }
      saveProfileToMemory(profile);
    }

    try {
      const dbProfile = await prisma.personProfile.findFirst({
        where: { OR: [{ janRakshaCode: code }, { id: code }] },
      });

      if (dbProfile) {
        await prisma.personProfile.update({
          where: { id: dbProfile.id },
          data: {
            ...(body.status && { status: body.status }),
            ...(body.lastSeenLocation !== undefined && { lastSeenLocation: body.lastSeenLocation }),
          },
        });
        if (body.reunificationNote && body.authorName) {
          await prisma.reunificationNote.create({
            data: {
              profileId: dbProfile.id,
              authorName: body.authorName,
              authorRole: userRole,
              note: body.reunificationNote,
            },
          });
        }
      }
    } catch (dbErr) {
      // Memory store already updated above
    }

    return Response.json({ success: true, data: profile });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return Response.json({ success: false, error: error.message }, { status: 400 });
  }
}
