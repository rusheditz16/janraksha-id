import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const profiles = await prisma.personProfile.findMany({
      include: {
        scanLogs: {
          orderBy: { scannedAt: "desc" },
          take: 2,
        },
        reunificationNotes: true,
        dispatchAlerts: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    const activeMissing = profiles.filter((p) => p.status === "REPORTED_MISSING").length;
    const located = profiles.filter((p) => p.status === "REPORTED_FOUND").length;
    const reunited = profiles.filter((p) => p.status === "REUNITED").length;

    // Build formal report structure
    const reportData = {
      reportId: `JANRAKSHA-INCIDENT-REP-${Date.now().toString().slice(-6)}`,
      generatedAt: new Date().toISOString(),
      organization: "National Emergency Response & Crowd Reunification Desk",
      jurisdiction: "All Active Zones (Melas, Stations, Camps)",
      executiveSummary: {
        totalMonitored: profiles.length,
        activeMissing,
        locatedAtHelpdesks: located,
        reunitedWithFamily: reunited,
        resolutionRate: profiles.length > 0 ? `${Math.round((reunited / profiles.length) * 100)}%` : "0%",
      },
      records: profiles.map((p) => ({
        code: p.janRakshaCode,
        name: p.fullName,
        age: p.age,
        gender: p.gender,
        classification: p.personType,
        status: p.status,
        guardian: p.guardianName,
        phone: p.guardianPhone,
        medicalFlag: p.chronicIllness || p.allergies || "None",
        lastKnownLocation: p.lastSeenLocation || "Unpinned",
        notesLogged: p.reunificationNotes.length,
        automatedAlertsSent: p.dispatchAlerts.length,
      })),
    };

    return Response.json({ success: true, report: reportData });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
