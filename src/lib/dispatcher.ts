import { prisma } from "@/lib/prisma";

export interface DispatchPayload {
  profileId: string;
  janRakshaCode: string;
  fullName: string;
  guardianName: string;
  guardianPhone: string;
  finderName: string;
  finderPhone: string;
  finderNotes?: string;
  latitude?: number;
  longitude?: number;
  nearestBooth?: {
    name: string;
    distanceFormatted: string;
    contactPhone?: string;
  } | null;
}

export async function dispatchGuardianAlerts(payload: DispatchPayload) {
  const mapsUrl =
    payload.latitude && payload.longitude
      ? `https://maps.google.com/?q=${payload.latitude},${payload.longitude}`
      : undefined;

  const nearestBoothText = payload.nearestBooth
    ? `\nNearest Assistance Desk: ${payload.nearestBooth.name} (${payload.nearestBooth.distanceFormatted}).`
    : "";

  // 1. WhatsApp Formatted Message Body
  const whatsappBody = `🚨 *JANRAKSHA EMERGENCY REUNIFICATION ALERT* 🚨\n\nHello *${payload.guardianName}*,\n\nYour family member *${payload.fullName}* (ID: *${payload.janRakshaCode}*) has been located!\n\n• Finder: *${payload.finderName}* (${payload.finderPhone})\n• Notes: "${payload.finderNotes || "No specific note provided"}"${nearestBoothText}\n\n📍 Live Location: ${mapsUrl || "Coordinates pending"}\n\nPlease contact the finder or head to the nearest assistance booth immediately.`;

  // 2. High-Priority SMS Message Body
  const smsBody = `[JANRAKSHA ALERT] ${payload.fullName} (ID: ${payload.janRakshaCode}) is located by ${payload.finderName} (${payload.finderPhone}). Location: ${mapsUrl || "Pinned via app"}. Call now.`;

  // Record simulated automated WhatsApp dispatch
  const whatsappRecord = await prisma.dispatchNotification.create({
    data: {
      profileId: payload.profileId,
      channel: "WHATSAPP",
      recipient: payload.guardianPhone,
      messageBody: whatsappBody,
      status: "DELIVERED",
      mapsUrl: mapsUrl || null,
    },
  });

  // Record simulated automated SMS dispatch
  const smsRecord = await prisma.dispatchNotification.create({
    data: {
      profileId: payload.profileId,
      channel: "SMS",
      recipient: payload.guardianPhone,
      messageBody: smsBody,
      status: "DELIVERED",
      mapsUrl: mapsUrl || null,
    },
  });

  // Log in Audit Ledger
  await prisma.auditLedger.create({
    data: {
      actionType: "SOS_DISPATCHED",
      recordCode: payload.janRakshaCode,
      actorName: payload.finderName,
      actorRole: "PUBLIC_FINDER",
      details: `Automatic WhatsApp and SMS alerts dispatched to guardian (${payload.guardianPhone}). Lat: ${payload.latitude || "N/A"}, Lng: ${payload.longitude || "N/A"}.`,
    },
  });

  return {
    whatsapp: whatsappRecord,
    sms: smsRecord,
  };
}
