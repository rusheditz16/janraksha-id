"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  User,
  Phone,
  HeartPulse,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Save,
  Search,
  RefreshCw,
  ExternalLink,
  Shield,
  Edit3,
  Calendar,
  AlertCircle,
  FileCheck,
  Radio
} from "lucide-react";
import { encodeProfilePayload } from "@/lib/qrPayload";

function EditProfileContent() {
  const searchParams = useSearchParams();
  const codeParam = searchParams.get("code") || "";

  const [searchQuery, setSearchQuery] = useState(codeParam);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [recentProfiles, setRecentProfiles] = useState<any[]>([]);

  // Form State
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
    eventName: "",
    assignedBooth: "",
    wristbandUid: "",
    status: "SAFE",
    lastSeenLocation: "",
  });

  // Load recent profiles from browser
  useEffect(() => {
    try {
      const raw = localStorage.getItem("janraksha_recent_profiles");
      if (raw) {
        setRecentProfiles(JSON.parse(raw));
      }
    } catch (e) {}
  }, []);

  // Fetch profile if code is provided in URL
  useEffect(() => {
    if (codeParam) {
      fetchProfile(codeParam);
    }
  }, [codeParam]);

  const fetchProfile = async (codeToFetch: string) => {
    const clean = codeToFetch.trim();
    if (!clean) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/profiles/${encodeURIComponent(clean)}?role=POLICE_OFFICER`);
      const json = await res.json();

      if (json.success && json.data) {
        const p = json.data;
        setProfile(p);
        setSearchQuery(p.janRakshaCode);
        setFormData({
          fullName: p.fullName || "",
          age: p.age ? String(p.age) : "",
          gender: p.gender || "Male",
          personType: p.personType || "CHILD",
          photoUrl: p.photoUrl || "",
          guardianName: p.guardianName || "",
          guardianPhone: p.guardianPhone || "",
          guardianAltPhone: p.guardianAltPhone || "",
          guardianEmail: p.guardianEmail || "",
          guardianAddress: p.guardianAddress || "",
          bloodGroup: p.bloodGroup || "UNKNOWN",
          allergies: p.allergies || "",
          chronicIllness: p.chronicIllness || "",
          criticalNotes: p.criticalNotes || "",
          emergencyDoctor: p.emergencyDoctor || "",
          doctorPhone: p.doctorPhone || "",
          eventName: p.eventName || "",
          assignedBooth: p.assignedBooth || "",
          wristbandUid: p.wristbandUid || "",
          status: p.status || "SAFE",
          lastSeenLocation: p.lastSeenLocation || "",
        });
      } else {
        // Fallback search in recent profiles cache if API is offline
        const local = recentProfiles.find(
          (rp) =>
            rp.janRakshaCode?.toUpperCase() === clean.toUpperCase() ||
            rp.id === clean ||
            rp.wristbandUid?.toUpperCase() === clean.toUpperCase()
        );
        if (local) {
          setProfile(local);
          setFormData({
            fullName: local.fullName || "",
            age: local.age ? String(local.age) : "",
            gender: local.gender || "Male",
            personType: local.personType || "CHILD",
            photoUrl: local.photoUrl || "",
            guardianName: local.guardianName || "",
            guardianPhone: local.guardianPhone || "",
            guardianAltPhone: local.guardianAltPhone || "",
            guardianEmail: local.guardianEmail || "",
            guardianAddress: local.guardianAddress || "",
            bloodGroup: local.bloodGroup || "UNKNOWN",
            allergies: local.allergies || "",
            chronicIllness: local.chronicIllness || "",
            criticalNotes: local.criticalNotes || "",
            emergencyDoctor: local.emergencyDoctor || "",
            doctorPhone: local.doctorPhone || "",
            eventName: local.eventName || "",
            assignedBooth: local.assignedBooth || "",
            wristbandUid: local.wristbandUid || "",
            status: local.status || "SAFE",
            lastSeenLocation: local.lastSeenLocation || "",
          });
        } else {
          setErrorMsg(json.error || `No JanRaksha profile found for "${clean}". Check the ID and try again.`);
          setProfile(null);
        }
      }
    } catch (err: any) {
      setErrorMsg("Failed to connect to server: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!formData.fullName.trim()) {
      alert("Full Name is required.");
      return;
    }
    if (!formData.guardianName.trim() || !formData.guardianPhone.trim()) {
      alert("Guardian Name and Primary Phone are required.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/profiles/${encodeURIComponent(profile.janRakshaCode)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          age: formData.age ? parseInt(formData.age, 10) : null,
          authorName: "Self-Service Guardian / Responders",
          authorRole: "POLICE_OFFICER",
          reunificationNote: `Details updated for session: ${formData.eventName || "General"} at ${new Date().toLocaleTimeString()}`,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const updated = json.data;
        setProfile(updated);
        setSuccessMsg("Details successfully updated! The emergency QR and dashboard now reflect these new details.");

        // Update local storage so recent lists stay current
        try {
          const raw = localStorage.getItem("janraksha_recent_profiles");
          const existing = raw ? JSON.parse(raw) : [];
          const updatedList = [
            updated,
            ...existing.filter((p: any) => p.janRakshaCode !== updated.janRakshaCode),
          ].slice(0, 20);
          localStorage.setItem("janraksha_recent_profiles", JSON.stringify(updatedList));
          setRecentProfiles(updatedList);
        } catch (storageErr) {}
      } else {
        setErrorMsg(json.error || "Failed to update profile details.");
      }
    } catch (err: any) {
      setErrorMsg("Error saving updates: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Edit3 className="w-6 h-6 text-[#1769E0]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#0B1F3A]">
              Edit & Update Given Details
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Update personal appearance, camp location, emergency contact, or medical notes for different days and sessions.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Operations</span>
        </Link>
      </div>

      {/* Profile Search / Selector Bar */}
      <div className="bg-white border border-[#DCE5F0] rounded-2xl p-5 shadow-xs space-y-4">
        <label className="block text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
          Find Person Profile To Edit
        </label>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  fetchProfile(searchQuery);
                }
              }}
              placeholder="Enter JanRaksha ID (e.g. JR-KID-4029) or Wristband UID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
            />
          </div>
          <button
            type="button"
            onClick={() => fetchProfile(searchQuery)}
            disabled={loading || !searchQuery.trim()}
            className="px-5 py-2.5 rounded-xl bg-[#1769E0] text-white text-xs font-semibold hover:bg-[#1255B8] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Load Profile</span>
          </button>
        </div>

        {/* Recent profiles quick select */}
        {recentProfiles.length > 0 && !profile && (
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 mr-2">Or select recent person:</span>
            <div className="inline-flex flex-wrap gap-1.5 mt-1 sm:mt-0">
              {recentProfiles.slice(0, 5).map((rp) => (
                <button
                  key={rp.id || rp.janRakshaCode}
                  type="button"
                  onClick={() => {
                    setSearchQuery(rp.janRakshaCode);
                    fetchProfile(rp.janRakshaCode);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 hover:bg-blue-50 hover:text-[#1769E0] text-slate-700 font-medium border border-slate-200 transition-colors"
                >
                  {rp.fullName} ({rp.janRakshaCode})
                </button>
              ))}
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            {profile && (
              <a
                href={`/scan/${encodeURIComponent(profile.janRakshaCode)}?d=${encodeProfilePayload(profile)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline flex items-center gap-1 hover:text-emerald-950"
              >
                <span>View Emergency QR View</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Main Edit Form */}
      {profile && (
        <form onSubmit={handleSave} className="bg-white border border-[#DCE5F0] rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
          {/* Active Profile Info Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#1769E0] flex items-center justify-center font-bold text-lg overflow-hidden border border-blue-200">
                {formData.photoUrl ? (
                  <img
                    src={formData.photoUrl}
                    alt={formData.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  formData.fullName.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#0B1F3A]">{formData.fullName}</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0B1F3A] text-white">
                    {profile.janRakshaCode}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Editing record for {formData.personType} | Wristband: {formData.wristbandUid || "Unassigned"}
                </p>
              </div>
            </div>

            {/* Emergency Status Quick Toggle */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600">Reunification Status:</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border focus:outline-none ${
                  formData.status === "REPORTED_MISSING"
                    ? "bg-red-50 text-red-700 border-red-300"
                    : formData.status === "REPORTED_FOUND"
                    ? "bg-blue-50 text-blue-700 border-blue-300"
                    : formData.status === "REUNITED"
                    ? "bg-purple-50 text-purple-700 border-purple-300"
                    : "bg-emerald-50 text-emerald-700 border-emerald-300"
                }`}
              >
                <option value="SAFE">🟢 SAFE / ACTIVE</option>
                <option value="REPORTED_MISSING">🚨 REPORTED MISSING</option>
                <option value="REPORTED_FOUND">🔵 LOCATED AT BOOTH</option>
                <option value="REUNITED">🤝 SAFELY REUNITED</option>
              </select>
            </div>
          </div>

          {/* Section 1: Basic Person Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-[#1769E0]" />
              <h3 className="text-sm font-bold text-[#0B1F3A] uppercase tracking-wider">
                1. Basic Personal Information
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="e.g. 7"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Person Category</label>
                <select
                  name="personType"
                  value={formData.personType}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                >
                  <option value="CHILD">Child (Vulnerable / Minor)</option>
                  <option value="ELDERLY">Elderly (Senior Citizen)</option>
                  <option value="PATIENT">Patient / Special Needs</option>
                  <option value="EVENT_ATTENDEE">Event Attendee / Pilgrim</option>
                  <option value="GENERAL">General Public</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Photo URL (Optional)</label>
                <input
                  type="url"
                  name="photoUrl"
                  value={formData.photoUrl}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Emergency Guardian & Contacts */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Phone className="w-4 h-4 text-[#1769E0]" />
              <h3 className="text-sm font-bold text-[#0B1F3A] uppercase tracking-wider">
                2. Emergency Guardian & Kin Contacts
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Guardian / Kin Name *</label>
                <input
                  type="text"
                  name="guardianName"
                  value={formData.guardianName}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Sunita Sharma (Mother)"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Primary Mobile Number *</label>
                <input
                  type="tel"
                  name="guardianPhone"
                  value={formData.guardianPhone}
                  onChange={handleInputChange}
                  required
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Alternate / Camp Phone</label>
                <input
                  type="tel"
                  name="guardianAltPhone"
                  value={formData.guardianAltPhone}
                  onChange={handleInputChange}
                  placeholder="+91 91234 56789"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Guardian Email (Optional)</label>
                <input
                  type="email"
                  name="guardianEmail"
                  value={formData.guardianEmail}
                  onChange={handleInputChange}
                  placeholder="guardian@example.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-700">Home Address / Camp Tent Location</label>
                <input
                  type="text"
                  name="guardianAddress"
                  value={formData.guardianAddress}
                  onChange={handleInputChange}
                  placeholder="Permanent home address or temporary camp shelter location"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Medical Alert & Daily Appearance */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <HeartPulse className="w-4 h-4 text-[#1769E0]" />
              <h3 className="text-sm font-bold text-[#0B1F3A] uppercase tracking-wider">
                3. Medical Alert & Today's Clothing / Appearance
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Blood Group</label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                >
                  <option value="UNKNOWN">Unknown / Not Tested</option>
                  <option value="A_POSITIVE">A + (Positive)</option>
                  <option value="A_NEGATIVE">A - (Negative)</option>
                  <option value="B_POSITIVE">B + (Positive)</option>
                  <option value="B_NEGATIVE">B - (Negative)</option>
                  <option value="AB_POSITIVE">AB + (Positive)</option>
                  <option value="AB_NEGATIVE">AB - (Negative)</option>
                  <option value="O_POSITIVE">O + (Positive)</option>
                  <option value="O_NEGATIVE">O - (Negative)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Known Allergies</label>
                <input
                  type="text"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleInputChange}
                  placeholder="e.g. Peanut allergy, Penicillin"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Chronic Illness / Medication</label>
                <input
                  type="text"
                  name="chronicIllness"
                  value={formData.chronicIllness}
                  onChange={handleInputChange}
                  placeholder="e.g. Asthma, Insulin dependent"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                />
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Today's Clothing, Identifying Marks & Appearance Notes (Crucial for Assisted Matching)
                </label>
                <textarea
                  name="criticalNotes"
                  value={formData.criticalNotes}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="e.g. Wearing yellow sweater, black shorts, red sneakers. Has small scar on left forehead. Speaks Hindi & Bengali."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Emergency Doctor (Optional)</label>
                <input
                  type="text"
                  name="emergencyDoctor"
                  value={formData.emergencyDoctor}
                  onChange={handleInputChange}
                  placeholder="Doctor / Clinic name"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Doctor Phone (Optional)</label>
                <input
                  type="tel"
                  name="doctorPhone"
                  value={formData.doctorPhone}
                  onChange={handleInputChange}
                  placeholder="+91..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Event & Camp Session Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Building2 className="w-4 h-4 text-[#1769E0]" />
              <h3 className="text-sm font-bold text-[#0B1F3A] uppercase tracking-wider">
                4. Event, Camp Session & Wristband Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Current Event / Occasion</label>
                <input
                  type="text"
                  name="eventName"
                  value={formData.eventName}
                  onChange={handleInputChange}
                  placeholder="e.g. Kumbh Mela 2026 - Day 2 Session"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Assigned Helpdesk / Booth / Tent</label>
                <input
                  type="text"
                  name="assignedBooth"
                  value={formData.assignedBooth}
                  onChange={handleInputChange}
                  placeholder="e.g. Tent 14, Sector 3"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Wristband UID / NFC Tag</label>
                <input
                  type="text"
                  name="wristbandUid"
                  value={formData.wristbandUid}
                  onChange={handleInputChange}
                  placeholder="e.g. WB-8831"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                />
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="text-xs font-semibold text-slate-700">Last Known Location in Camp</label>
                <input
                  type="text"
                  name="lastSeenLocation"
                  value={formData.lastSeenLocation}
                  onChange={handleInputChange}
                  placeholder="e.g. Sector 4 Food Hall / Ghat Stairs"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <a
                href={`/scan/${encodeURIComponent(profile.janRakshaCode)}?d=${encodeProfilePayload(profile)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#1769E0]" />
                <span>View Emergency Card</span>
              </a>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => fetchProfile(profile.janRakshaCode)}
                disabled={saving}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Reset Changes
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#1769E0] text-white text-xs font-bold hover:bg-[#1255B8] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Updates...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save & Update Profile</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

export default function EditProfileComponent() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading edit form...</div>}>
      <EditProfileContent />
    </Suspense>
  );
}
