import { prisma } from "@/lib/prisma";

// Calculate Great-Circle Distance (Haversine Formula) in meters
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Locate nearest official assistance booth
export async function findNearestHelpdeskBooth(latitude: number, longitude: number) {
  try {
    const booths = await prisma.helpdeskBooth.findMany({
      where: { isOperational: true },
    });

    if (booths.length === 0) {
      // Seed default operational booths if table empty
      const defaultBooths = await prisma.helpdeskBooth.createMany({
        data: [
          {
            name: "Central Police Assistance & Medical Booth #1",
            zone: "Zone A - Main Concourse",
            latitude: 28.6445,
            longitude: 77.2165,
            contactName: "Inspector R. Verma",
            contactPhone: "+91 98450 12345",
          },
          {
            name: "Child & Senior Citizen Reunification Booth #2",
            zone: "Zone B - North Gate Exit",
            latitude: 28.646,
            longitude: 77.218,
            contactName: "Volunteer Aarti Deshmukh",
            contactPhone: "+91 98111 22334",
          },
          {
            name: "First-Aid Emergency Red Cross Desk #3",
            zone: "Zone C - Food Court",
            latitude: 28.643,
            longitude: 77.214,
            contactName: "Dr. K. Saxena",
            contactPhone: "+91 97111 99887",
          },
        ],
      });
      return findNearestHelpdeskBooth(latitude, longitude);
    }

    let nearest = booths[0];
    let minDistance = calculateHaversineDistance(
      latitude,
      longitude,
      booths[0].latitude,
      booths[0].longitude
    );

    for (let i = 1; i < booths.length; i++) {
      const dist = calculateHaversineDistance(
        latitude,
        longitude,
        booths[i].latitude,
        booths[i].longitude
      );
      if (dist < minDistance) {
        minDistance = dist;
        nearest = booths[i];
      }
    }

    const distString =
      minDistance > 1000
        ? `${(minDistance / 1000).toFixed(1)} km away`
        : `${minDistance} meters away`;

    return {
      booth: nearest,
      distanceMeters: minDistance,
      distanceFormatted: distString,
    };
  } catch (err) {
    console.error("Proximity routing error:", err);
    return null;
  }
}
