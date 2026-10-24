import { prisma } from "@/lib/prisma";
import { findNearestHelpdeskBooth } from "@/lib/geofence";
import { dispatchGuardianAlerts } from "@/lib/dispatcher";

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
    const profile = await prisma.personProfile.findFirst({
      where: {
        OR: [
          ...(profileId ? [{ id: profileId }] : []),
          ...(code ? [{ janRakshaCode: code }] : []),
        ],
      },
    });

    if (!profile) {
      return Response.json(
        { success: false, error: "Person profile not found to link scan" },
        { status: 404 }
      );
    }

    // 1. Proximity Routing: Find closest official helpdesk booth if GPS available
    let nearestBoothResult = null;
    if (latitude && longitude) {
      nearestBoothResult = await findNearestHelpdeskBooth(
        parseFloat(latitude),
        parseFloat(longitude)
      );
    }

    // 2. Create Scan Log
    const scanLog = await prisma.scanLog.create({
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

    // 3. Automated Alerting & Telemetry Dispatch if SOS
    let dispatchResults = null;
    if (isSosAlert) {
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

      // Update case status to REPORTED_FOUND
      await prisma.personProfile.update({
        where: { id: profile.id },
        data: {
          status: "REPORTED_FOUND",
          lastSeenLocation:
            locationAddress ||
            (nearestBoothResult
              ? `${nearestBoothResult.distanceFormatted} from ${nearestBoothResult.booth.name}`
              : `GPS: ${latitude || ""}, ${longitude || ""}`),
          lastSeenTime: new Date(),
        },
      });

      // Append incident note
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
