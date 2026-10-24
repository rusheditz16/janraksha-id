// Universal persistent storage for serverless runtime (Vercel) + local
// Uses globalThis so all API routes and server components share the exact same profiles
const globalProfiles = globalThis as unknown as {
  __JANRAKSHA_PROFILES__?: Map<string, any>;
};

if (!globalProfiles.__JANRAKSHA_PROFILES__) {
  globalProfiles.__JANRAKSHA_PROFILES__ = new Map();
}

export const inMemoryStore = globalProfiles.__JANRAKSHA_PROFILES__;

// Seed initial default profiles into memory if not present
const DEFAULT_SEEDS = [
  {
    id: "profile-seed-1",
    janRakshaCode: "JR-KID-4029",
    fullName: "Aarav Sharma",
    age: 7,
    gender: "Male",
    personType: "CHILD",
    photoUrl: "https://images.unsplash.com/photo-1543332164-6e82f355badc?w=400&auto=format&fit=crop&q=80",
    guardianName: "Sunita Sharma (Mother)",
    guardianPhone: "+91 98765 43210",
    guardianAltPhone: "+91 91234 56789",
    guardianEmail: "sunita.sharma@example.com",
    guardianAddress: "Sector 14, Rohini, New Delhi",
    bloodGroup: "B_POSITIVE",
    allergies: "Severe Peanut Allergy",
    chronicIllness: "Mild Asthma (Carries Inhaler)",
    criticalNotes: "Wears blue dinosaur t-shirt. Speaks Hindi & English. Responds gently to children stories.",
    eventName: "Grand Diwali Mela 2026",
    assignedBooth: "Helpdesk Booth #3, North Gate",
    wristbandUid: "NFC-WB-8831",
    status: "REPORTED_MISSING",
    lastSeenLocation: "Food Court Carousel Area",
    lastSeenTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    scanLogs: [],
    reunificationNotes: [],
    dispatchAlerts: [],
  },
  {
    id: "profile-seed-2",
    janRakshaCode: "JR-ELD-7193",
    fullName: "Rameshwar Nath Patel",
    age: 74,
    gender: "Male",
    personType: "ELDERLY",
    photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
    guardianName: "Vikas Patel (Son)",
    guardianPhone: "+91 98220 11223",
    guardianAltPhone: "+91 98220 99887",
    guardianEmail: "vikas.patel@example.com",
    guardianAddress: "42, Anand Nagar, Station Road, Ahmedabad",
    bloodGroup: "O_POSITIVE",
    allergies: "No known drug allergies",
    chronicIllness: "Alzheimer’s Disease & Type 2 Diabetes",
    criticalNotes: "May appear disoriented or confused about current year. Needs insulin by 8 PM. Speaks Gujarati & Hindi.",
    emergencyDoctor: "Dr. K. Mehta (Civil Hospital)",
    doctorPhone: "+91 79 2658 0000",
    eventName: "Pravasi Bharatiya Sammelan",
    assignedBooth: "Senior Citizen Care Desk 1",
    wristbandUid: "NFC-WB-9942",
    status: "REPORTED_FOUND",
    lastSeenLocation: "Main Railway Concourse Platform 4",
    lastSeenTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    scanLogs: [],
    reunificationNotes: [],
    dispatchAlerts: [],
  },
  {
    id: "profile-seed-3",
    janRakshaCode: "JR-MED-1108",
    fullName: "Priya Mukherjee",
    age: 28,
    gender: "Female",
    personType: "PATIENT",
    photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80",
    guardianName: "Dr. Anirban Mukherjee (Spouse)",
    guardianPhone: "+91 97111 22334",
    guardianEmail: "dr.anirban@example.com",
    guardianAddress: "B-12 Salt Lake, Kolkata",
    bloodGroup: "AB_NEGATIVE",
    allergies: "Penicillin, Sulfa drugs",
    chronicIllness: "Epilepsy & Non-Verbal Speech condition",
    criticalNotes: "Carry emergency Valium nasal spray in backpack. Patient communicates via phone text or gestures.",
    emergencyDoctor: "Neuro Care Center Kolkata",
    doctorPhone: "+91 33 2450 1000",
    eventName: "Kolkata Book Fair 2026",
    assignedBooth: "First Aid St. John Booth",
    wristbandUid: "NFC-WB-1029",
    status: "SAFE",
    scanLogs: [],
    reunificationNotes: [],
    dispatchAlerts: [],
  },
];

// Initialize seeds
DEFAULT_SEEDS.forEach((p) => {
  if (!inMemoryStore.has(p.janRakshaCode.toUpperCase())) {
    inMemoryStore.set(p.janRakshaCode.toUpperCase(), p);
    inMemoryStore.set(p.id, p);
    if (p.wristbandUid) inMemoryStore.set(p.wristbandUid.toUpperCase(), p);
  }
});

export function saveProfileToMemory(profile: any) {
  const code = profile.janRakshaCode ? profile.janRakshaCode.toUpperCase() : "";
  if (code) inMemoryStore.set(code, profile);
  if (profile.id) inMemoryStore.set(profile.id, profile);
  if (profile.wristbandUid) inMemoryStore.set(profile.wristbandUid.toUpperCase(), profile);
}

export function findProfileInMemory(codeOrId: string) {
  const query = codeOrId ? codeOrId.trim().toUpperCase() : "";
  if (!query) return null;

  if (inMemoryStore.has(query)) {
    return inMemoryStore.get(query);
  }

  // Linear scan across values if direct key lookup misses
  for (const profile of inMemoryStore.values()) {
    if (
      profile.janRakshaCode?.toUpperCase() === query ||
      profile.id === codeOrId ||
      profile.wristbandUid?.toUpperCase() === query
    ) {
      return profile;
    }
  }

  return null;
}

export function getAllProfilesFromMemory() {
  const unique = new Map<string, any>();
  for (const profile of inMemoryStore.values()) {
    if (profile.janRakshaCode) {
      unique.set(profile.janRakshaCode, profile);
    }
  }
  return Array.from(unique.values());
}
