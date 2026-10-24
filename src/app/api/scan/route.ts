import { prisma } from "@/lib/prisma";
import { findNearestHelpdeskBooth } from "@/lib/geofence";
import { dispatchGuardianAlerts } from "@/lib/dispatcher";
import { findProfileInMemory, saveProfileToMemory } from "@/lib/memoryStore";

// POST: Log a public scan or SOS trigger
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      profileId,
      code,
      scanType = "PUBLIC_QR",
      finderName = "Good Samaritan",
      finderPhone = "Not provided",
      finderNotes,
      latitude,
      longitude,
      locationAddress,
      isSosAlert = false,
    } = body;

    // Find profile
    let profile: any = null;
    try {
      profile = await prisma.personProfile.findFirst({
        where: {
          OR: [
            ...(profileId ? [{ id: profileId }] : []),
            ...(code ? [{ janRakshaCode: code }] : []),
          ],
        },
      });
    } catch (e) {
      console.warn("DB profile lookup failed in scan route:", e);
    }

    if (!profile) {
      profile = findProfileInMemory(code || profileId);
    }

    if (!profile) {
      return Response.json(
        { success: false, error: "Person profile not found to link scan" },
        { status: 404 }
      );
    }

    // 1. Proximity Routing: Find closest official helpdesk booth if GPS available
    let nearestBoothResult = null;
    if (latitude && longitude) {
      try {
        nearestBoothResult = await findNearestHelpdeskBooth(
          parseFloat(latitude),
          parseFloat(longitude)
        );
      } catch (e) {
        console.warn("Proximity calc failed:", e);
      }
    }

    // 2. Create Scan Log
    let scanLog: any = {
      id: "scan-" + Date.now(),
      profileId: profile.id,
      scanType,
      createdAt: new Date().toISOString(),
    };
    try {
      scanLog = await prisma.scanLog.create({
        data: {
          profileId: profile.id,
          scanType,
          finderName: finderName || null,
          finderPhone: finderPhone || null,
          finderNotes: finderNotes || null,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          locationAddress: locationAddress || null,
          nearestBoothId: nearestBoothResult?.booth.id || null,
          nearestBoothDist: nearestBoothResult?.distanceFormatted || null,
          isSosAlert: Boolean(isSosAlert),
        },
      });
    } catch (e) {
      console.warn("Could not write scan log to database:", e);
    }

    // 3. Automated Alerting & Telemetry Dispatch if SOS
    let dispatchResults: any = null;
    if (isSosAlert) {
      try {
        dispatchResults = await dispatchGuardianAlerts({
          profileId: profile.id,
          janRakshaCode: profile.janRakshaCode,
          fullName: profile.fullName,
          guardianName: profile.guardianName,
          guardianPhone: profile.guardianPhone,
          finderName,
          finderPhone,
          finderNotes,
          latitude: latitude ? parseFloat(latitude) : undefined,
          longitude: longitude ? parseFloat(longitude) : undefined,
          nearestBooth: nearestBoothResult
            ? {
                name: nearestBoothResult.booth.name,
                distanceFormatted: nearestBoothResult.distanceFormatted,
                contactPhone: nearestBoothResult.booth.contactPhone || undefined,
              }
            : null,
        });
      } catch (e) {
        console.warn("Dispatch guardian alerts failed:", e);
      }

      // Update in-memory profile
      const computedLoc =
        locationAddress ||
        (nearestBoothResult
          ? `${nearestBoothResult.distanceFormatted} from ${nearestBoothResult.booth.name}`
          : latitude && longitude
          ? `GPS: ${latitude}, ${longitude}`
          : "Location recorded");

      profile.status = "REPORTED_FOUND";
      profile.lastSeenLocation = computedLoc;
      profile.lastSeenTime = new Date().toISOString();
      saveProfileToMemory(profile);

      // Attempt DB updates
      try {
        await prisma.personProfile.update({
          where: { id: profile.id },
          data: {
            status: "REPORTED_FOUND",
            lastSeenLocation: computedLoc,
            lastSeenTime: new Date(),
          },
        });
      } catch (e) {
        console.warn("Could not update profile status in db:", e);
      }

      // Append incident note
      try {
        await prisma.reunificationNote.create({
          data: {
            profileId: profile.id,
            authorName: finderName,
            authorRole: "FINDER_PUBLIC",
            note: `Emergency SOS triggered via QR Scan. Nearest desk: ${
              nearestBoothResult?.booth.name || "None"
            } (${nearestBoothResult?.distanceFormatted || "Distance pending"}). Finder: ${finderName} (${finderPhone}).`,
          },
        });
      } catch (e) {
        console.warn("Could not create note in db:", e);
      }
    }

    return Response.json({
      success: true,
      message: isSosAlert
        ? "Emergency telemetry & automated WhatsApp/SMS alerts dispatched to guardian and central desk!"
        : "Scan recorded successfully",
      scanId: scanLog.id,
      nearestBooth: nearestBoothResult
        ? {
            name: nearestBoothResult.booth.name,
            zone: nearestBoothResult.booth.zone,
            distance: nearestBoothResult.distanceFormatted,
            contactPhone: nearestBoothResult.booth.contactPhone,
          }
        : null,
      dispatch: dispatchResults,
      guardianContact: {
        name: profile.guardianName,
        phone: profile.guardianPhone,
        altPhone: profile.guardianAltPhone,
      },
    });
  } catch (error: any) {
    console.error("Scan recording error:", error);
    return Response.json(
      { success: false, error: error.message || "Failed to log scan" },
      { status: 500 }
    );
  }
}
