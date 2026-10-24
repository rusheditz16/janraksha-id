import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();

    const profile = await prisma.personProfile.findFirst({
      where: {
        OR: [{ janRakshaCode: code }, { id: code }],
      },
    });

    if (!profile) {
      return Response.json({ success: false, error: "Profile not found" }, { status: 404 });
    }

    const note = await prisma.reunificationNote.create({
      data: {
        profileId: profile.id,
        authorName: body.authorName || "Officer / Volunteer",
        authorRole: body.authorRole || "CAMP_ADMIN",
        note: body.note,
      },
    });

    return Response.json({ success: true, data: note }, { status: 201 });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 400 });
  }
}
