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

// PATCH: Update status, location, or full details
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const userRole = body.authorRole || "POLICE_OFFICER";

    let profile: any = findProfileInMemory(code);

    if (!profile) {
      try {
        const found = await prisma.personProfile.findFirst({
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
        if (found) {
          profile = found;
          saveProfileToMemory(profile);
        }
      } catch (err) {}
    }

    // Apply all field updates to memory
    if (profile) {
      if (body.fullName !== undefined) profile.fullName = body.fullName;
      if (body.age !== undefined) profile.age = body.age ? parseInt(body.age, 10) : null;
      if (body.gender !== undefined) profile.gender = body.gender;
      if (body.personType !== undefined) profile.personType = body.personType;
      if (body.photoUrl !== undefined) profile.photoUrl = body.photoUrl;
      if (body.guardianName !== undefined) profile.guardianName = body.guardianName;
      if (body.guardianPhone !== undefined) profile.guardianPhone = body.guardianPhone;
      if (body.guardianAltPhone !== undefined) profile.guardianAltPhone = body.guardianAltPhone;
      if (body.guardianEmail !== undefined) profile.guardianEmail = body.guardianEmail;
      if (body.guardianAddress !== undefined) profile.guardianAddress = body.guardianAddress;
      if (body.bloodGroup !== undefined) profile.bloodGroup = body.bloodGroup;
      if (body.allergies !== undefined) profile.allergies = body.allergies;
      if (body.chronicIllness !== undefined) profile.chronicIllness = body.chronicIllness;
      if (body.criticalNotes !== undefined) profile.criticalNotes = body.criticalNotes;
      if (body.emergencyDoctor !== undefined) profile.emergencyDoctor = body.emergencyDoctor;
      if (body.doctorPhone !== undefined) profile.doctorPhone = body.doctorPhone;
      if (body.eventName !== undefined) profile.eventName = body.eventName;
      if (body.assignedBooth !== undefined) profile.assignedBooth = body.assignedBooth;
      if (body.wristbandUid !== undefined) profile.wristbandUid = body.wristbandUid;
      if (body.status !== undefined) profile.status = body.status;
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
        const updateData: any = {};
        if (body.fullName !== undefined) updateData.fullName = body.fullName;
        if (body.age !== undefined) updateData.age = body.age ? parseInt(body.age, 10) : null;
        if (body.gender !== undefined) updateData.gender = body.gender;
        if (body.personType !== undefined) updateData.personType = body.personType;
        if (body.photoUrl !== undefined) updateData.photoUrl = body.photoUrl;
        if (body.guardianName !== undefined) updateData.guardianName = body.guardianName;
        if (body.guardianPhone !== undefined) updateData.guardianPhone = body.guardianPhone;
        if (body.guardianAltPhone !== undefined) updateData.guardianAltPhone = body.guardianAltPhone;
        if (body.guardianEmail !== undefined) updateData.guardianEmail = body.guardianEmail;
        if (body.guardianAddress !== undefined) updateData.guardianAddress = body.guardianAddress;
        if (body.bloodGroup !== undefined) updateData.bloodGroup = body.bloodGroup;
        if (body.allergies !== undefined) updateData.allergies = body.allergies;
        if (body.chronicIllness !== undefined) updateData.chronicIllness = body.chronicIllness;
        if (body.criticalNotes !== undefined) updateData.criticalNotes = body.criticalNotes;
        if (body.emergencyDoctor !== undefined) updateData.emergencyDoctor = body.emergencyDoctor;
        if (body.doctorPhone !== undefined) updateData.doctorPhone = body.doctorPhone;
        if (body.eventName !== undefined) updateData.eventName = body.eventName;
        if (body.assignedBooth !== undefined) updateData.assignedBooth = body.assignedBooth;
        if (body.wristbandUid !== undefined) updateData.wristbandUid = body.wristbandUid;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.lastSeenLocation !== undefined) updateData.lastSeenLocation = body.lastSeenLocation;

        await prisma.personProfile.update({
          where: { id: dbProfile.id },
          data: updateData,
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

    if (!profile) {
      return Response.json(
        { success: false, error: "JanRaksha profile not found to update" },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: profile });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return Response.json({ success: false, error: error.message }, { status: 400 });
  }
}
