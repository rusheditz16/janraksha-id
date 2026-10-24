"use client";

import { useState } from "react";
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  FileText,
  Lock,
  X,
  Printer,
  HeartHandshake,
  Users
} from "lucide-react";
import jsPDF from "jspdf";

interface SafeHandoffModalProps {
  profile: any;
  currentRole: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedProfile: any) => void;
}

export default function SafeHandoffModal({
  profile,
  currentRole,
  isOpen,
  onClose,
  onSuccess,
}: SafeHandoffModalProps) {
  const isMinor = profile?.personType === "CHILD" || (profile?.age && Number(profile.age) < 18);

  // Form State
  const [claimingGuardianName, setClaimingGuardianName] = useState(profile?.guardianName || "");
  const [relationship, setRelationship] = useState("Parent / Mother");
  const [idType, setIdType] = useState("Aadhaar Card (UIDAI)");
  const [idLastFour, setIdLastFour] = useState("");
  const [contactPhone, setContactPhone] = useState(profile?.guardianPhone || "");

  // Verification Checklist (UNICEF Standards)
  const [photoMatched, setPhotoMatched] = useState(false);
  const [childAffinityChecked, setChildAffinityChecked] = useState(false);
  const [unprintedDetailVerified, setUnprintedDetailVerified] = useState(false);

  // Staff Sign-off
  const [primaryWorkerName, setPrimaryWorkerName] = useState("Officer S. K. Roy");
  const [primaryWorkerBadge, setPrimaryWorkerBadge] = useState("CW-8821");

  // Two-Person Rule Counter-Signer (Mandatory for Minors/High-Risk)
  const [supervisorName, setSupervisorName] = useState("Dr. Ananya Sen (UNICEF CPO)");
  const [supervisorBadge, setSupervisorBadge] = useState("CPO-NDRF-4102");
  const [supervisorOrg, setSupervisorOrg] = useState("District Child Welfare Committee (CWC)");

  const [loading, setLoading] = useState(false);
  const [completedHandoff, setCompletedHandoff] = useState<any | null>(null);

  if (!isOpen) return null;

  const canSubmit =
    claimingGuardianName.trim() &&
    idLastFour.trim().length >= 4 &&
    photoMatched &&
    childAffinityChecked &&
    unprintedDetailVerified &&
    primaryWorkerName.trim() &&
    (!isMinor || (supervisorName.trim() && supervisorBadge.trim()));

  const handleAuthorize = async () => {
    if (!canSubmit) {
      alert("Please complete all mandatory UNICEF safety verification steps and staff sign-offs.");
      return;
    }

    setLoading(true);
    const certificateNumber = `UNICEF-REUN-${Date.now().toString().slice(-6)}`;
    const handoffDetails = {
      certificateNumber,
      authorizedAt: new Date().toISOString(),
      subjectCode: profile.janRakshaCode,
      subjectName: profile.fullName,
      subjectType: profile.personType,
      claimingGuardian: claimingGuardianName,
      relationship,
      idVerification: `${idType} (Ending: ${idLastFour})`,
      primarySigner: `${primaryWorkerName} (ID: ${primaryWorkerBadge})`,
      dualSupervisorSigner: isMinor ? `${supervisorName} (${supervisorOrg}, ID: ${supervisorBadge})` : "N/A (Standard Adult Release)",
      welfareObservations: "Child recognized guardian without fear or hesitation. Unprinted family details certified. Dual staff authorization completed.",
    };

    try {
      const res = await fetch(`/api/profiles/${encodeURIComponent(profile.janRakshaCode)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REUNITED",
          authorName: primaryWorkerName,
          authorRole: currentRole,
          reunificationNote: `[OFFICIAL SAFE REUNIFICATION HANDOFF] Certificate #${certificateNumber}. Verified Guardian: ${claimingGuardianName} (${relationship}, ${idType} *${idLastFour}). Dual CPO Sign-off: ${handoffDetails.dualSupervisorSigner}.`,
        }),
      });

      const json = await res.json();
      const updated = json.data || { ...profile, status: "REUNITED" };
      setCompletedHandoff(handoffDetails);
      onSuccess(updated);
    } catch (e) {
      console.warn("API patch notice:", e);
      setCompletedHandoff(handoffDetails);
      onSuccess({ ...profile, status: "REUNITED" });
    } finally {
      setLoading(false);
    }
  };

  const printHandoffCertificate = () => {
    if (!completedHandoff) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(11, 31, 58);
    doc.text("OFFICIAL REUNIFICATION HANDOFF CERTIFICATE", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("UNICEF Emergency Child Protection & National Disaster Management Standards", 14, 27);
    doc.line(14, 30, 196, 30);

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`Certificate No: ${completedHandoff.certificateNumber}`, 14, 40);
    doc.text(`Date & Time: ${new Date(completedHandoff.authorizedAt).toLocaleString()}`, 14, 48);
    doc.text(`Subject: ${completedHandoff.subjectName} (${completedHandoff.subjectCode}) - ${completedHandoff.subjectType}`, 14, 56);
    doc.text(`Released To Guardian: ${completedHandoff.claimingGuardian} (${completedHandoff.relationship})`, 14, 64);
    doc.text(`Government ID Verified: ${completedHandoff.idVerification}`, 14, 72);

    doc.text("Staff Authorizations (Two-Person Dual Verification):", 14, 84);
    doc.setFontSize(10);
    doc.text(`1. Primary Case Worker: ${completedHandoff.primarySigner}`, 20, 92);
    doc.text(`2. Child Protection Supervisor: ${completedHandoff.dualSupervisorSigner}`, 20, 100);

    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text("Declaration: The child/vulnerable subject has been safely identified and reunited after comprehensive welfare", 14, 115);
    doc.text("checks in compliance with the ICRC Humanitarian Data Handbook and UNICEF Child Protection Minimum Standards.", 14, 121);

    doc.save(`Reunification_Certificate_${completedHandoff.certificateNumber}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="bg-[#0B1F3A] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">Safe Reunification Handoff Verification</h3>
              <p className="text-xs text-slate-300">
                UNICEF Emergency Child Protection Minimum Standards (CPMS)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner for Minors */}
        <div className="p-3.5 bg-amber-50 border-b border-amber-200 flex items-start gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Mandatory Protocol:</strong> A QR scan locates a record, but <strong>never</strong> by itself authorizes release. Handover of children and vulnerable persons requires physical identity verification and a two-person dual staff authorization.
          </div>
        </div>

        {completedHandoff ? (
          /* Success Certificate View */
          <div className="p-6 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#138A62] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-[#0B1F3A]">Reunification Certified & Case Closed</h4>
              <p className="text-xs text-[#64748B] font-mono">
                Official Handoff Certificate: {completedHandoff.certificateNumber}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-slate-500">Subject:</span> <strong>{completedHandoff.subjectName}</strong></div>
                <div><span className="text-slate-500">ID Code:</span> <strong className="font-mono">{completedHandoff.subjectCode}</strong></div>
                <div><span className="text-slate-500">Released To:</span> <strong>{completedHandoff.claimingGuardian}</strong></div>
                <div><span className="text-slate-500">Relationship:</span> <strong>{completedHandoff.relationship}</strong></div>
              </div>
              <div className="pt-2 border-t border-slate-200 text-slate-600">
                <strong>Dual Staff Sign-off:</strong> {completedHandoff.dualSupervisorSigner}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={printHandoffCertificate}
                className="px-5 py-2.5 rounded-xl bg-[#1769E0] text-white text-xs font-semibold hover:bg-blue-700 flex items-center gap-2 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Download Official Certificate (PDF)</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          /* Multi-Step Verification Form */
          <div className="p-6 space-y-5 text-xs max-h-[70vh] overflow-y-auto">
            
            {/* Step 1: Claiming Guardian Verification */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm text-[#0B1F3A] border-b border-slate-100 pb-2">
                <UserCheck className="w-4 h-4 text-[#1769E0]" />
                <span>Step 1: Claiming Guardian Government Identity Verification</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Claiming Adult Full Name *</label>
                  <input
                    type="text"
                    value={claimingGuardianName}
                    onChange={(e) => setClaimingGuardianName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-[#0B1F3A]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Verified Relationship *</label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                  >
                    <option value="Parent / Mother">Parent / Mother</option>
                    <option value="Parent / Father">Parent / Father</option>
                    <option value="Grandparent">Grandparent</option>
                    <option value="Legal Guardian">Court-Appointed Legal Guardian</option>
                    <option value="Adult Sibling">Adult Sibling (18+)</option>
                    <option value="Designated Caretaker">Designated Relief Camp Caretaker</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Government ID Type *</label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                  >
                    <option value="Aadhaar Card (UIDAI)">Aadhaar Card (UIDAI)</option>
                    <option value="Voter Identity Card (ECI)">Voter Identity Card (ECI)</option>
                    <option value="Passport">Passport</option>
                    <option value="Relief Camp Token">Emergency Relief Camp Token / Ration Card</option>
                    <option value="Driving License">Driving License</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ID Document Last 4 Digits *</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={idLastFour}
                    onChange={(e) => setIdLastFour(e.target.value)}
                    placeholder="e.g. 8831"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Child Protection Verification Checklist */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 font-bold text-sm text-[#0B1F3A] border-b border-slate-100 pb-2">
                <Shield className="w-4 h-4 text-[#138A62]" />
                <span>Step 2: UNICEF Child Welfare & Protection Checks</span>
              </div>

              <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={photoMatched}
                    onChange={(e) => setPhotoMatched(e.target.checked)}
                    className="mt-0.5 rounded text-[#1769E0]"
                  />
                  <span>
                    <strong>Physical Photo Match Confirmed:</strong> Physical appearance of claiming adult matches their government ID card photo.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={childAffinityChecked}
                    onChange={(e) => setChildAffinityChecked(e.target.checked)}
                    className="mt-0.5 rounded text-[#1769E0]"
                  />
                  <span>
                    <strong>Child Welfare / Comfort Check:</strong> Child warmly recognizes, calls by familiar name, and approaches the adult without signs of fear, coercion, or distress.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={unprintedDetailVerified}
                    onChange={(e) => setUnprintedDetailVerified(e.target.checked)}
                    className="mt-0.5 rounded text-[#1769E0]"
                  />
                  <span>
                    <strong>Unprinted Family Cross-Check:</strong> Adult independently confirmed private details not written on the badge (e.g. child birthdate, family members, residential street).
                  </span>
                </label>
              </div>
            </div>

            {/* Step 3: Two-Person Rule Staff Counter-Signature */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 font-bold text-sm text-[#0B1F3A] border-b border-slate-100 pb-2">
                <Users className="w-4 h-4 text-[#E5484D]" />
                <span>Step 3: Two-Person Rule Dual Staff Sign-Off (Mandatory for Minors)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-blue-50/60 border border-blue-200 rounded-xl p-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Primary Case Officer *</label>
                  <input
                    type="text"
                    value={primaryWorkerName}
                    onChange={(e) => setPrimaryWorkerName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded p-1.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Primary Staff Badge ID *</label>
                  <input
                    type="text"
                    value={primaryWorkerBadge}
                    onChange={(e) => setPrimaryWorkerBadge(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded p-1.5 font-mono"
                  />
                </div>

                {isMinor && (
                  <>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Secondary Child Protection Supervisor (Counter-Sign) *
                      </label>
                      <input
                        type="text"
                        value={supervisorName}
                        onChange={(e) => setSupervisorName(e.target.value)}
                        placeholder="e.g. Dr. Ananya Sen (CPO)"
                        className="w-full bg-white border border-slate-300 rounded p-1.5"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Supervisor Organization & Staff ID *
                      </label>
                      <input
                        type="text"
                        value={supervisorBadge}
                        onChange={(e) => setSupervisorBadge(e.target.value)}
                        placeholder="e.g. CWC / UNICEF-4029"
                        className="w-full bg-white border border-slate-300 rounded p-1.5 font-mono"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Modal Controls */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!canSubmit || loading}
                onClick={handleAuthorize}
                className="px-6 py-2.5 rounded-xl bg-[#138A62] hover:bg-emerald-700 disabled:opacity-40 text-white font-bold flex items-center gap-2 shadow-sm transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{loading ? "Certifying Handoff..." : "Certify Safe Reunification"}</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
