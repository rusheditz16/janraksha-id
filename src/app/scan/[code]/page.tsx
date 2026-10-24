import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { findProfileInMemory, saveProfileToMemory } from "@/lib/memoryStore";
import EmergencyClientView from "@/components/EmergencyClientView";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function ScanPage({ params }: PageProps) {
  const { code } = await params;
  let profile: any = null;

  // 1. Try finding in universal memory store first
  profile = findProfileInMemory(code);

  // 2. If not found in memory store, try database
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
          scanLogs: {
            orderBy: { scannedAt: "desc" },
            take: 3,
          },
          reunificationNotes: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (profile) {
        saveProfileToMemory(profile);
      }
    } catch (err) {
      console.warn("DB lookup exception caught, checking memory store:", err);
      profile = findProfileInMemory(code);
    }
  }

  // 3. Fallback not found
  if (!profile) {
    return notFound();
  }

  // 4. Record passive scan log if DB available
  try {
    await prisma.scanLog.create({
      data: {
        profileId: profile.id,
        scanType: "PUBLIC_QR",
        isSosAlert: false,
      },
    });
  } catch (err) {
    // Graceful skip
  }

  return <EmergencyClientView profile={JSON.parse(JSON.stringify(profile))} />;
}
