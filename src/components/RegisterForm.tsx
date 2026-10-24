"use client";

import { useState } from "react";
import {
  User,
  Phone,
  HeartPulse,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Shield,
  AlertCircle,
  FileCheck,
  Building2,
  Lock,
  ExternalLink
} from "lucide-react";
import IdCardPreview from "@/components/IdCardPreview";

export default function RegisterForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [createdProfile, setCreatedProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [consentGiven, setConsentGiven] = useState(true);

  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    gender: "Male",
    personType: "CHILD",
    photoUrl: "",
    guardianName: "",
    guardianPhone: "",
    guardianAltPhone: "",
    guardianEmail: "",
    guardianAddress: "",
    bloodGroup: "UNKNOWN",
    allergies: "",
    chronicIllness: "",
    criticalNotes: "",
    emergencyDoctor: "",
    doctorPhone: "",
    eventName: "Grand Public Gathering 2026",
    assignedBooth: "Helpdesk Gate 3",
    wristbandUid: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePreload = (type: string) => {
    if (type === "CHILD") {
      setFormData({
        fullName: "Aarav Sharma",
        age: "7",
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
        criticalNotes: "Speaks Hindi & English. Responds gently to children stories.",
        emergencyDoctor: "Dr. K. Mehta",
        doctorPhone: "+91 11 2789 0000",
        eventName: "Kumbh Mela North Camp",
        assignedBooth: "Helpdesk Gate 4",
        wristbandUid: `WB-${Math.floor(1000 + Math.random() * 9000)}`,
      });
    } else if (type === "ELDERLY") {
      setFormData({
        fullName: "Rameshwar Nath Patel",
        age: "74",
        gender: "Male",
        personType: "ELDERLY",
        photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
        guardianName: "Vikas Patel (Son)",
        guardianPhone: "+91 98220 11223",
        guardianAltPhone: "+91 98220 99887",
        guardianEmail: "vikas.patel@example.com",
        guardianAddress: "42 Anand Nagar, Ahmedabad",
        bloodGroup: "O_POSITIVE",
        allergies: "No known drug allergies",
        chronicIllness: "Alzheimer’s Disease & Type 2 Diabetes",
        criticalNotes: "May appear disoriented. Needs insulin by 8 PM. Speaks Gujarati & Hindi.",
        emergencyDoctor: "Civil Hospital Ahmedabad",
        doctorPhone: "+91 79 2658 0000",
        eventName: "Central Railway Concourse Camp",
        assignedBooth: "Senior Citizen Desk 1",
        wristbandUid: `WB-${Math.floor(1000 + Math.random() * 9000)}`,
      });
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && !formData.fullName.trim()) {
      alert("Please provide the full name.");
      return;
    }
    if (currentStep === 2 && (!formData.guardianName.trim() || !formData.guardianPhone.trim())) {
      alert("Please enter both Guardian Name and Primary Phone Number.");
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentGiven) {
      alert("Consent is required to register and generate an emergency digital identity.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        setCreatedProfile(json.data);
      } else {
        alert("Registration failed: " + json.error);
      }
    } catch (err: any) {
      alert("Error submitting registration: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, title: "Basic Information" },
    { num: 2, title: "Emergency Contacts" },
    { num: 3, title: "Medical & Accessibility" },
    { num: 4, title: "Event & Wristband" },
    { num: 5, title: "Review & Generate" },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      
      {createdProfile ? (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#138A62] text-white flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#0B1F3A]">
                  Registration Complete & Identity Generated
                </h2>
                <p className="text-xs text-[#138A62] font-mono font-semibold">
                  Unique Secure Identifier: {createdProfile.janRakshaCode}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`/scan/${createdProfile.janRakshaCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold px-4 py-2 rounded-lg bg-[#1769E0] text-white hover:bg-[#1255B8] flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <span>Open Emergency View</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => {
                  setCreatedProfile(null);
                  setCurrentStep(1);
                }}
                className="text-xs font-semibold px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-[#172B4D]"
              >
                Register Another Person
              </button>
            </div>
          </div>

          <IdCardPreview profile={createdProfile} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#DCE5F0] p-6 sm:p-8 shadow-sm space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#1769E0]" />
                <h1 className="text-xl font-bold text-[#0B1F3A]">Person Registration Wizard</h1>
              </div>
              <p className="text-xs text-[#64748B] mt-1">
                Creates a privacy-first emergency QR badge with verified kin contacts and medical alert notes.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#64748B] font-medium hidden sm:inline">Preload:</span>
              <button
                type="button"
                onClick={() => handlePreload("CHILD")}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-[#1769E0] border border-blue-200 hover:bg-blue-100"
              >
                + Child Demo
              </button>
              <button
                type="button"
                onClick={() => handlePreload("ELDERLY")}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
              >
                + Senior Demo
              </button>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-5 gap-2">
            {steps.map((s) => {
              const isPassed = currentStep > s.num;
              const isCurrent = currentStep === s.num;
              return (
                <div key={s.num} className="space-y-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-colors ${
                      isPassed ? "bg-[#138A62]" : isCurrent ? "bg-[#1769E0]" : "bg-slate-200"
                    }`}
                  />
                  <div className="text-[11px] font-semibold hidden sm:block truncate text-[#64748B]">
                    {s.title}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Form Step Contents */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <User className="w-4 h-4 text-[#1769E0]" />
                  <h3 className="font-bold text-sm text-[#0B1F3A]">Step 1: Basic Information</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full bg-slate-50 border border-[#DCE5F0] rounded-lg px-3.5 py-2.5 text-xs text-[#172B4D] focus:outline-none focus:border-[#1769E0]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                      Classification *
                    </label>
                    <select
                      name="personType"
                      value={formData.personType}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-[#DCE5F0] rounded-lg px-3 py-2.5 text-xs text-[#172B4D] focus:outline-none focus:border-[#1769E0]"
                    >
                      <option value="CHILD">Child / Minor</option>
                      <option value="ELDERLY">Elderly / Senior Citizen</option>
                      <option value="PATIENT">Hospital Patient</option>
                      <option value="EVENT_ATTENDEE">Event Attendee</option>
                      <option value="GENERAL">General Public</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] mb-1">Age</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      placeholder="e.g. 7"
                      className="w-full bg-slate-50 border border-[#DCE5F0] rounded-lg px-3.5 py-2.5 text-xs text-[#172B4D] focus:outline-none focus:border-[#1769E0]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] mb-1">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-[#DCE5F0] rounded-lg px-3 py-2.5 text-xs text-[#172B4D] focus:outline-none focus:border-[#1769E0]"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] mb-1">Blood Group</label>
                    <select
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-[#DCE5F0] rounded-lg px-3 py-2.5 text-xs text-[#172B4D] focus:outline-none focus:border-[#1769E0]"
                    >
                      <option value="UNKNOWN">Select Group</option>
                      <option value="A_POSITIVE">A+</option>
                      <option value="A_NEGATIVE">A-</option>
                      <option value="B_POSITIVE">B+</option>
                      <option value="B_NEGATIVE">B-</option>
                      <option value="AB_POSITIVE">AB+</option>
                      <option value="AB_NEGATIVE">AB-</option>
                      <option value="O_POSITIVE">O+</option>
                      <option value="O_NEGATIVE">O-</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                      Identification Photograph (Optional Image URL)
                    </label>
                    <input
                      type="url"
                      name="photoUrl"
                      value={formData.photoUrl}
                      onChange={handleChange}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full bg-slate-50 border border-[#DCE5F0] rounded-lg px-3.5 py-2.5 text-xs text-[#172B4D] font-mono focus:outline-none focus:border-[#1769E0]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Emergency Contacts */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Phone className="w-4 h-4 text-[#1769E0]" />
                  <h3 className="font-bold text-sm text-[#0B1F3A]">Step 2: Emergency Contacts</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                      Primary Guardian Name & Relationship *
                    </label>
                    <input
                      type="text"
                      required
                      name="guardianName"
                      value={formData.guardianName}
                      onChange={handleChange}
                      placeholder="e.g. Sunita Sharma (Mother)"
                      className="w-full bg-slate-50 border border-[#DCE5F0] rounded-lg px-3.5 py-2.5 text-xs text-[#172B4D] focus:outline-none focus:border-[#1769E0]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                      Primary Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      name="guardianPhone"
                      value={formData.guardianPhone}
                      onChange={handleChange}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full bg-slate-50 border border-[#DCE5F0] rounded-lg px-3.5 py-2.5 text-xs text-[#172B4D] focus:outline-none focus:border-[#1769E0]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                      Secondary Contact Phone
                    </label>
                    <input
                      type="tel"
                      name="guardianAltPhone"
                      value={formData.guardianAltPhone}
                      onChange={handleChange}
                      placeholder="e.g. +91 91234 56789"
                      className="w-full bg-slate-50 border border-[#DCE5F0] rounded-lg px-3.5 py-2.5 text-xs text-[#172B4D] focus:outline-none focus:border-[#1769E0]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                      Guardian Email
                    </label>
                    <input
                      type="email"
                      name="guardianEmail"
                      value={formData.guardianEmail}
                      onChange={handleChange}
                      placeholder="e.g. sunita@example.com"
                      className="w-full bg-slate-50 border border-[#DCE5F0] rounded-lg px-3.5 py-2.5 text-xs text-[#172B4D] focus:outline-none focus:border-[#1769E0]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                      Home Address / City
                    </label>
                    <input
                      type="text"
                      name="guardianAddress"
                      value={formData.guardianAddress}
                      onChange={handleChange}
                      placeholder="e.g. Sector 14, Rohini, New Delhi"
                      className="w-full bg-slate-50 border border-[#DCE5F0] rounded-lg px-3.5 py-2.5 text-xs text-[#172B4D] focus:outline-none focus:border-[#1769E0]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Medical and Accessibility Information */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <HeartPulse className="w-4 h-4 text-[#1769E0]" />
                  <h3 className="font-bold text-sm text-[#0B1F3A]">Step 3: Medical & Accessibility Notes</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                      Known Allergies
                    </label>
                    <input
                      type="text"
                      name="allergies"
                      value={formData.allergies}
                      onChange={handleChange}
                      placeholder="e.g. Penicillin, Peanuts"
                      className="w-full bg-slate-50 border border-[#DCE5F0] rounded-lg px-3.5 py-2.5 text-xs text-[#172B4D] focus:outline-none focus:border-[#1769E0]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                      Chronic Illness / Conditions
                    </label>
                    <input
                      type="text"
                      name="chronicIllness"
                      value={formData.chronicIllness}
                      onChange={handleChange}
                      placeholder="e.g. Asthma, Alzheimer's, Diabetes"
                      className="w-full bg-slate-50 border border-[#DCE5F0] rounded-lg px-3.5 py-2.5 text-xs text-[#172B4D] focus:outline-none focus:border-[#1769E0]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                      Critical First-Aid & Behavioral Handling Advice
                    </label>
                    <textarea
                      rows={2}
                      name="criticalNotes"
                      value={formData.criticalNotes}
                      onChange={handleChange}
                      placeholder="e.g. Non-verbal communication, responds calmly to soft voice, carries emergency inhaler."
                      className="w-full bg-slate-50 border border-[#DCE5F0] rounded-lg p-2.5 text-xs text-[#172B4D] focus:outline-none focus:border-[#1769E0]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Event Information */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Building2 className="w-4 h-4 text-[#1769E0]" />
                  <h3 className="font-bold text-sm text-[#0B1F3A]">Step 4: Event & Facility Allocation</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                      Event / Facility Name
                    </label>
                    <input
                      type="text"
                      name="eventName"
                      value={formData.eventName}
                      onChange={handleChange}
                      placeholder="e.g. Kumbh Mela 2026"
                      className="w-full bg-slate-50 border border-[#DCE5F0] rounded-lg px-3.5 py-2.5 text-xs text-[#172B4D] focus:outline-none focus:border-[#1769E0]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                      Assigned Helpdesk Booth
                    </label>
                    <input
                      type="text"
                      name="assignedBooth"
                      value={formData.assignedBooth}
                      onChange={handleChange}
                      placeholder="e.g. North Gate Booth #4"
                      className="w-full bg-slate-50 border border-[#DCE5F0] rounded-lg px-3.5 py-2.5 text-xs text-[#172B4D] focus:outline-none focus:border-[#1769E0]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                      Optional Wristband / RFID Serial
                    </label>
                    <input
                      type="text"
                      name="wristbandUid"
                      value={formData.wristbandUid}
                      onChange={handleChange}
                      placeholder="e.g. WB-9912"
                      className="w-full bg-slate-50 border border-[#DCE5F0] rounded-lg px-3.5 py-2.5 text-xs text-[#172B4D] font-mono focus:outline-none focus:border-[#1769E0]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Review & Consent Confirmation */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <FileCheck className="w-4 h-4 text-[#1769E0]" />
                  <h3 className="font-bold text-sm text-[#0B1F3A]">Step 5: Review & Consent</h3>
                </div>

                <div className="bg-[#F5F8FC] p-4 rounded-xl border border-[#DCE5F0] space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[#64748B]">Name: </span>
                      <strong className="text-[#0B1F3A]">{formData.fullName}</strong>
                    </div>
                    <div>
                      <span className="text-[#64748B]">Category: </span>
                      <strong className="text-[#0B1F3A]">{formData.personType}</strong>
                    </div>
                    <div>
                      <span className="text-[#64748B]">Guardian: </span>
                      <strong className="text-[#0B1F3A]">{formData.guardianName}</strong>
                    </div>
                    <div>
                      <span className="text-[#64748B]">Phone: </span>
                      <strong className="text-[#0B1F3A]">{formData.guardianPhone}</strong>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="consentCheck"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="mt-0.5 rounded text-[#1769E0] focus:ring-[#1769E0]"
                  />
                  <label htmlFor="consentCheck" className="text-xs text-[#172B4D] cursor-pointer">
                    <strong>Consent & Privacy Notice:</strong> I authorize registration of this record for emergency reunification and triage. Contact numbers will remain protected and only accessible during active scans.
                  </label>
                </div>
              </div>
            )}

            {/* Step Navigation Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-4 py-2 rounded-lg border border-[#DCE5F0] text-xs font-semibold text-[#172B4D] hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
              ) : <div />}

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-5 py-2.5 rounded-lg bg-[#1769E0] hover:bg-[#1255B8] text-xs font-semibold text-white shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !consentGiven}
                  className="px-6 py-2.5 rounded-lg bg-[#138A62] hover:bg-emerald-700 disabled:opacity-50 text-xs font-bold text-white shadow-sm transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{loading ? "Generating Record..." : "Confirm & Generate Digital ID"}</span>
                </button>
              )}
            </div>

          </form>

        </div>
      )}

    </div>
  );
}
