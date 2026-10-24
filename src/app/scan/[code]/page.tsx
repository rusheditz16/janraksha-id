import { prisma } from "@/lib/prisma";
import { findProfileInMemory, saveProfileToMemory } from "@/lib/memoryStore";
import { decodeProfilePayload } from "@/lib/qrPayload";
import EmergencyClientView from "@/components/EmergencyClientView";
import ScanClientFallback from "@/components/ScanClientFallback";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ScanPage({ params, searchParams }: PageProps) {
  const { code } = await params;
  const sParams = await searchParams;

  // 1. Check for encoded profile payload from QR code
  const rawToken = sParams?.d || sParams?.data;
  const token = typeof rawToken === "string" ? rawToken : Array.isArray(rawToken) ? rawToken[0] : null;

  let profile: any = null;

  if (token) {
    profile = decodeProfilePayload(token);
    if (profile) {
      saveProfileToMemory(profile);
    }
  }

  // 2. Try universal in-memory store
  if (!profile) {
    profile = findProfileInMemory(code);
  }

  // 3. Try database lookup
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
      console.warn("Database lookup failed in scan page:", err);
      profile = findProfileInMemory(code);
    }
  }

  // 4. If not found on server, render resilient client resolver (checks localStorage and API)
  if (!profile) {
    return <ScanClientFallback code={code} />;
  }

  // 5. Record passive scan log if DB is writable
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
