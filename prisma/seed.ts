import { PrismaClient, PersonType, BloodGroup, CaseStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial JanRaksha ID demo data...');

  // Clean existing
  await prisma.scanLog.deleteMany();
  await prisma.reunificationNote.deleteMany();
  await prisma.personProfile.deleteMany();

  // Profile 1: Lost Child at Event
  const child = await prisma.personProfile.create({
    data: {
      janRakshaCode: 'JR-KID-4029',
      fullName: 'Aarav Sharma',
      age: 7,
      gender: 'Male',
      personType: PersonType.CHILD,
      photoUrl: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=400&auto=format&fit=crop&q=80',
      guardianName: 'Sunita Sharma (Mother)',
      guardianPhone: '+91 98765 43210',
      guardianAltPhone: '+91 91234 56789',
      guardianEmail: 'sunita.sharma@example.com',
      guardianAddress: 'Sector 14, Rohini, New Delhi',
      bloodGroup: BloodGroup.B_POSITIVE,
      allergies: 'Severe Peanut Allergy',
      chronicIllness: 'Mild Asthma (Carries Inhaler)',
      criticalNotes: 'Wears blue dinosaur t-shirt. Speaks Hindi & English. Responds gently to children stories.',
      eventName: 'Grand Diwali Mela 2026',
      assignedBooth: 'Helpdesk Booth #3, North Gate',
      wristbandUid: 'NFC-WB-8831',
      status: CaseStatus.REPORTED_MISSING,
      lastSeenLocation: 'Food Court Carousel Area',
      lastSeenTime: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    },
  });

  // Profile 2: Elderly Visitor with Alzheimer's
  const elder = await prisma.personProfile.create({
    data: {
      janRakshaCode: 'JR-ELD-7193',
      fullName: 'Rameshwar Nath Patel',
      age: 74,
      gender: 'Male',
      personType: PersonType.ELDERLY,
      photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
      guardianName: 'Vikas Patel (Son)',
      guardianPhone: '+91 98220 11223',
      guardianAltPhone: '+91 98220 99887',
      guardianEmail: 'vikas.patel@example.com',
      guardianAddress: '42, Anand Nagar, Station Road, Ahmedabad',
      bloodGroup: BloodGroup.O_POSITIVE,
      allergies: 'No known drug allergies',
      chronicIllness: 'Alzheimer’s Disease & Type 2 Diabetes',
      criticalNotes: 'May appear disoriented or confused about current year. Needs insulin by 8 PM. Speaks Gujarati & Hindi.',
      emergencyDoctor: 'Dr. K. Mehta (Civil Hospital)',
      doctorPhone: '+91 79 2658 0000',
      eventName: 'Pravasi Bharatiya Sammelan',
      assignedBooth: 'Senior Citizen Care Desk 1',
      wristbandUid: 'NFC-WB-9942',
      status: CaseStatus.REPORTED_FOUND,
      lastSeenLocation: 'Main Railway Concourse Platform 4',
      lastSeenTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  });

  // Profile 3: Emergency Patient / Non-verbal attendee
  const patient = await prisma.personProfile.create({
    data: {
      janRakshaCode: 'JR-MED-1108',
      fullName: 'Priya Mukherjee',
      age: 28,
      gender: 'Female',
      personType: PersonType.PATIENT,
      photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
      guardianName: 'Dr. Anirban Mukherjee (Spouse)',
      guardianPhone: '+91 97111 22334',
      guardianEmail: 'dr.anirban@example.com',
      guardianAddress: 'B-12 Salt Lake, Kolkata',
      bloodGroup: BloodGroup.AB_NEGATIVE,
      allergies: 'Penicillin, Sulfa drugs',
      chronicIllness: 'Epilepsy & Non-Verbal Speech condition',
      criticalNotes: 'Carry emergency Valium nasal spray in backpack. Patient communicates via phone text or gestures.',
      emergencyDoctor: 'Neuro Care Center Kolkata',
      doctorPhone: '+91 33 2450 1000',
      eventName: 'Kolkata Book Fair 2026',
      assignedBooth: 'First Aid St. John Booth',
      wristbandUid: 'NFC-WB-1029',
      status: CaseStatus.SAFE,
    },
  });

  // Seed sample scan logs
  await prisma.scanLog.create({
    data: {
      profileId: elder.id,
      scanType: 'VOLUNTEER_SCAN',
      finderName: 'Officer R. Verma',
      finderPhone: '+91 98450 12345',
      finderNotes: 'Found sitting near ticket counter 3 looking confused. Guided to Camp Booth 1.',
      latitude: 28.6448,
      longitude: 77.2167,
      locationAddress: 'New Delhi Railway Station - Exit Gate 2',
      isSosAlert: true,
    },
  });

  await prisma.reunificationNote.create({
    data: {
      profileId: elder.id,
      authorName: 'Volunteer Aarti Deshmukh',
      authorRole: 'CAMP_VOLUNTEER',
      note: 'Offered water and warm tea. Guardian contacted via automated SMS and call. Son is on his way.',
    },
  });

  console.log('Seed completed successfully with 3 diverse emergency profiles!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
