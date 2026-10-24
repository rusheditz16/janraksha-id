// Generates printable physical emergency intake & reunification slips for disaster camps
// For families and volunteers with no smartphone, dead battery, or damaged wristband

import jsPDF from "jspdf";

export function generateFamilyPaperSlip(profile: any, campDesk = "Disaster Camp Helpdesk Gate 1") {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a6", // Compact physical pocket slip
  });

  // Header
  doc.setFillColor(11, 31, 58);
  doc.rect(0, 0, 105, 18, "F");

  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("JANRAKSHA ID — EMERGENCY DESK SLIP", 6, 8);
  doc.setFontSize(7);
  doc.setTextColor(200, 220, 255);
  doc.text("Official Physical Token for Family Reunification", 6, 13);

  // Big UID Box
  doc.setFillColor(245, 248, 252);
  doc.setDrawColor(220, 229, 240);
  doc.roundedRect(6, 22, 93, 16, 2, 2, "FD");

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("EMERGENCY RECORD IDENTIFIER", 10, 27);
  doc.setFontSize(13);
  doc.setTextColor(23, 105, 224);
  doc.text(profile.janRakshaCode || "JR-EMERGENCY", 10, 34);

  // Details
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`Subject: ${profile.fullName} (${profile.personType || "Citizen"})`, 6, 44);
  doc.text(`Age: ${profile.age || "N/A"}  |  Gender: ${profile.gender || "N/A"}  |  Blood: ${profile.bloodGroup || "UNKNOWN"}`, 6, 49);

  if (profile.chronicIllness || profile.allergies) {
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(6, 52, 93, 10, 1, 1, "F");
    doc.setTextColor(229, 72, 77);
    doc.text(`MEDICAL ALERT: ${profile.chronicIllness || profile.allergies}`, 8, 58);
  }

  doc.setTextColor(15, 23, 42);
  doc.text(`Registered Kin: ${profile.guardianName}`, 6, 68);
  doc.text(`Guardian Contact: ${profile.guardianPhone}`, 6, 73);
  doc.text(`Assigned Station: ${campDesk}`, 6, 78);
  doc.text(`Issued On: ${new Date().toLocaleString()}`, 6, 83);

  // Instructions for family without phone
  doc.setFillColor(241, 245, 249);
  doc.rect(6, 88, 93, 26, "F");
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  doc.text("INSTRUCTIONS FOR FAMILIES WITHOUT SMARTPHONE:", 8, 93);
  doc.text("1. Keep this physical slip safe in your pocket or wrist pouch.", 8, 98);
  doc.text("2. Show this Record ID to any police officer or Red Cross worker.", 8, 103);
  doc.text("3. Proceed to the central assistance booth for family reunification.", 8, 108);

  doc.save(`Physical_Desk_Slip_${profile.janRakshaCode || "Record"}.pdf`);
}
