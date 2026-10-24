import { prisma } from "@/lib/prisma";

// GET: Profile by Code or ID with RBAC data filtration
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "PUBLIC_FINDER"; // PUBLIC_FINDER, VOLUNTEER, POLICE_OFFICER, EVENT_ADMIN

    const profile = await prisma.personProfile.findFirst({
      where: {
        OR: [
          { janRakshaCode: { equals: code } },
          { id: { equals: code } },
          { wristbandUid: { equals: code } },
        ],
      },
      include: {
        scanLogs: {
          orderBy: { scannedAt: "desc" },
          take: 5,
        },
        reunificationNotes: {
          orderBy: { createdAt: "desc" },
        },
        dispatchAlerts: {
          orderBy: { sentAt: "desc" },
          take: 3,
        },
      },
    });

    if (!profile) {
      return Response.json(
        { success: false, error: "JanRaksha profile not found" },
        { status: 404 }
      );
    }

    // Audit log this retrieval
    await prisma.auditLedger.create({
      data: {
        actionType: "PROFILE_VIEW",
        recordCode: profile.janRakshaCode,
        actorName: role === "PUBLIC_FINDER" ? "Anonymous Finder" : `Staff (${role})`,
        actorRole: (role as any) || "PUBLIC_FINDER",
        details: `Profile retrieved under role: ${role}`,
      },
    });

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

    const profile = await prisma.personProfile.findFirst({
      where: {
        OR: [{ janRakshaCode: code }, { id: code }],
      },
    });

    if (!profile) {
      return Response.json({ success: false, error: "Profile not found" }, { status: 404 });
    }

    const updated = await prisma.personProfile.update({
      where: { id: profile.id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.lastSeenLocation !== undefined && { lastSeenLocation: body.lastSeenLocation }),
        ...(body.lastSeenTime !== undefined && { lastSeenTime: body.lastSeenTime ? new Date(body.lastSeenTime) : null }),
        ...(body.criticalNotes !== undefined && { criticalNotes: body.criticalNotes }),
        ...(body.assignedBooth !== undefined && { assignedBooth: body.assignedBooth }),
      },
    });

    // Record in Audit Ledger
    await prisma.auditLedger.create({
      data: {
        actionType: "STATUS_CHANGE",
        recordCode: profile.janRakshaCode,
        actorName: body.authorName || "Officer",
        actorRole: (userRole as any) || "EVENT_ADMIN",
        details: `Case status changed to ${body.status || "UPDATED"}. Note: ${body.reunificationNote || "None"}`,
      },
    });

    if (body.reunificationNote && body.authorName) {
      await prisma.reunificationNote.create({
        data: {
          profileId: profile.id,
          authorName: body.authorName,
          authorRole: userRole,
          note: body.reunificationNote,
        },
      });
    }

    return Response.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return Response.json({ success: false, error: error.message }, { status: 400 });
  }
}
