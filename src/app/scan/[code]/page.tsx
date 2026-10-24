import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EmergencyClientView from "@/components/EmergencyClientView";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function ScanPage({ params }: PageProps) {
  const { code } = await params;

  // Retrieve profile from DB
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
        take: 3,
      },
      reunificationNotes: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!profile) {
    return notFound();
  }

  // Record an initial passive scan log entry (server side)
  try {
    await prisma.scanLog.create({
      data: {
        profileId: profile.id,
        scanType: "PUBLIC_QR",
        isSosAlert: false,
      },
    });
  } catch (err) {
    console.error("Passive scan log error:", err);
  }

  return <EmergencyClientView profile={JSON.parse(JSON.stringify(profile))} />;
}
