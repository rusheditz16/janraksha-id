import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId");

    const alerts = await prisma.dispatchNotification.findMany({
      where: {
        ...(profileId ? { profileId } : {}),
      },
      include: {
        profile: {
          select: {
            janRakshaCode: true,
            fullName: true,
            guardianName: true,
          },
        },
      },
      orderBy: { sentAt: "desc" },
      take: 20,
    });

    return Response.json({ success: true, count: alerts.length, data: alerts });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
