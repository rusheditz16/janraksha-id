"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { encodeProfilePayload } from "@/lib/qrPayload";
import SafeHandoffModal from "@/components/SafeHandoffModal";
import {
  ROLE_PERMISSIONS,
  ScopedRole,
  getDefaultEventConfig,
  checkRecordExpiry,
  purgeGuardianPII,
  generateCrossOrgShareToken,
  CrossOrgShareToken,
} from "@/lib/governance";
import { findAssistedMatches, MatchCandidate } from "@/lib/assistedMatching";
import { generateFamilyPaperSlip } from "@/lib/paperSlipGenerator";
import {
  Shield,
  LayoutDashboard,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  User,
  HeartPulse,
  Eye,
  Plus,
  RefreshCw,
  Send,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  Activity,
  ArrowRight,
  Download,
  FileText,
  Radio,
  Lock,
  MessageSquare,
  HeartHandshake,
  Users,
  Share2,
  Trash2,
  Printer,
  Sparkles,
  KeyRound,
  Copy,
  Check,
  Building,
  X,
  Edit3
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function DashboardClient() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);

  // Scoped Role-Based Access Control (RBAC) & Humanitarian Governance
  const [activeRole, setActiveRole] = useState<ScopedRole>("POLICE_OFFICER");
  const permissions = ROLE_PERMISSIONS[activeRole];

  // Event Governance Config
  const [eventConfig] = useState(getDefaultEventConfig());

  // Safe Reunification Modal (UNICEF Child Protection Standards)
  const [handoffModalOpen, setHandoffModalOpen] = useState(false);

  // Cross-Organization Case Sharing Token Modal
  const [shareToken, setShareToken] = useState<CrossOrgShareToken | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Audit Logs & Live Alerts Feed
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showAuditDrawer, setShowAuditDrawer] = useState(false);
  const [showGovernanceModal, setShowGovernanceModal] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [authorName, setAuthorName] = useState("Inspector R. Verma");

  // Assisted Case Matches (ICRC Rule-Based, No Biometrics)
  const [assistedMatches, setAssistedMatches] = useState<MatchCandidate[]>([]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append("query", searchQuery);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (typeFilter !== "ALL") params.append("personType", typeFilter);

      const res = await fetch(`/api/profiles?${params.toString()}`);
      const data = await res.json();
      let combined: any[] = data.success && Array.isArray(data.data) ? data.data : [];

      // Merge with browser localStorage recent profiles
      try {
        const raw = localStorage.getItem("janraksha_recent_profiles");
        if (raw) {
          const localList: any[] = JSON.parse(raw);
          const map = new Map<string, any>();
          localList.forEach((p) => {
            if (p.janRakshaCode) map.set(p.janRakshaCode.toUpperCase(), p);
          });
          combined.forEach((p) => {
            const key = p.janRakshaCode?.toUpperCase();
            if (key && !map.has(key)) {
              map.set(key, p);
            }
          });
          combined = Array.from(map.values());
        }
      } catch (storageErr) {
        console.warn("Storage merge notice:", storageErr);
      }

      // Filter locally in case query or filters are active
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        combined = combined.filter(
          (p) =>
            p.fullName?.toLowerCase().includes(q) ||
            p.janRakshaCode?.toLowerCase().includes(q) ||
            p.guardianName?.toLowerCase().includes(q)
        );
      }
      if (statusFilter !== "ALL") {
        combined = combined.filter((p) => p.status === statusFilter);
      }
      if (typeFilter !== "ALL") {
        combined = combined.filter((p) => p.personType === typeFilter);
      }

      setProfiles(combined);
      if (selectedProfile) {
        const updated = combined.find(
          (p: any) => p.id === selectedProfile.id || p.janRakshaCode === selectedProfile.janRakshaCode
        );
        if (updated) setSelectedProfile(updated);
      } else if (combined.length > 0) {
        setSelectedProfile(combined[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTelemetryFeeds = async () => {
    try {
      const [alertRes, auditRes] = await Promise.all([
        fetch("/api/dispatch"),
        fetch("/api/audit?limit=25"),
      ]);
      const alertData = await alertRes.json();
      const auditData = await auditRes.json();
      if (alertData.success) setLiveAlerts(alertData.data);
      if (auditData.success) setAuditLogs(auditData.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProfiles();
    fetchTelemetryFeeds();
  }, [statusFilter, typeFilter]);

  // Recalculate Assisted Matches when selectedProfile or profiles change
  useEffect(() => {
    if (selectedProfile && profiles.length > 0) {
      const matches = findAssistedMatches(selectedProfile, profiles);
      setAssistedMatches(matches);
    } else {
      setAssistedMatches([]);
    }
  }, [selectedProfile, profiles]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProfiles();
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedProfile) return;

    // UNICEF CPMS Enforcement: Children and minors CANNOT be closed as REUNITED via simple toggle
    const isMinor = selectedProfile.personType === "CHILD" || (selectedProfile.age && Number(selectedProfile.age) < 18);
    if (status === "REUNITED" && isMinor) {
      if (!permissions.canAuthorizeChildHandoff) {
        alert("UNICEF Child Protection Protocol: Volunteers cannot authorize the release of minors alone. Please escalate to a Child Protection Worker or Police Officer.");
        return;
      }
      // Open Safe Reunification Verification Modal
      setHandoffModalOpen(true);
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/profiles/${selectedProfile.janRakshaCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reunificationNote: noteText || `Case status transitioned to ${status} by ${authorName} (${permissions.title})`,
          authorName,
          authorRole: activeRole,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNoteText("");
        await fetchProfiles();
        await fetchTelemetryFeeds();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Guardian Consent Withdrawal & Humanitarian Data Erasure (ICRC Standard)
  const handleWithdrawConsent = async () => {
    if (!selectedProfile) return;
    const confirm = window.confirm(
      `ICRC Humanitarian Data Protection: Withdraw consent and purge identifying contact/medical data for ${selectedProfile.fullName}? An anonymized case token will be retained for camp headcount records.`
    );
    if (!confirm) return;

    setActionLoading(true);
    const purged = purgeGuardianPII(selectedProfile, authorName, "Guardian requested data withdrawal upon camp departure");

    try {
      await fetch(`/api/profiles/${selectedProfile.janRakshaCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REUNITED",
          reunificationNote: `[ICRC DATA PURGE] Identifying contacts & medical alert notes erased at guardian request. Anonymized hash created.`,
          authorName,
          authorRole: activeRole,
        }),
      });

      // Update local storage
      try {
        const raw = localStorage.getItem("janraksha_recent_profiles");
        if (raw) {
          const list = JSON.parse(raw);
          const updated = list.map((p: any) =>
            p.janRakshaCode === selectedProfile.janRakshaCode ? purged : p
          );
          localStorage.setItem("janraksha_recent_profiles", JSON.stringify(updated));
        }
      } catch (e) {}

      setSelectedProfile(purged);
      await fetchProfiles();
      alert("Identifying personal data purged in compliance with the ICRC Humanitarian Data Handbook.");
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Controlled Cross-Organization Case Sharing (Hospital <-> Police <-> Camp Shelter)
  const handleCreateShareToken = (destOrg: string) => {
    if (!selectedProfile) return;
    const tokenObj = generateCrossOrgShareToken(
      selectedProfile.id,
      selectedProfile.janRakshaCode,
      permissions.organization,
      destOrg,
      authorName
    );
    setShareToken(tokenObj);
  };

  // Export Formal PDF Incident Report
  const handleExportPDF = async () => {
    try {
      const doc = new jsPDF();
      
      const total = profiles.length;
      const activeMissing = profiles.filter((p) => p.status === "REPORTED_MISSING").length;
      const located = profiles.filter((p) => p.status === "REPORTED_FOUND").length;
      const reunited = profiles.filter((p) => p.status === "REUNITED").length;
      const resRate = total > 0 ? `${Math.round((reunited / total) * 100)}%` : "0%";
      const reportId = `JANRAKSHA-REP-${Date.now().toString().slice(-6)}`;

      // Header
      doc.setFontSize(15);
      doc.setTextColor(11, 31, 58);
      doc.text("JANRAKSHA ID — OFFICIAL REUNIFICATION & INCIDENT REPORT", 14, 18);

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Report ID: ${reportId}  |  Generated: ${new Date().toLocaleString()}`, 14, 25);
      doc.text(`Lead Authority: ${eventConfig.leadOrganization}`, 14, 30);
      doc.text(`Event ID: ${eventConfig.eventId} (${eventConfig.eventName})`, 14, 35);

      // Summary Table
      autoTable(doc, {
        startY: 40,
        head: [["Total Monitored", "Active Missing", "Located at Desks", "Reunited with Family", "Resolution Rate"]],
        body: [[
          total,
          activeMissing,
          located,
          reunited,
          resRate,
        ]],
        theme: "grid",
        headStyles: { fillColor: [11, 31, 58], textColor: 255 },
      });

      // Individual Records Table
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [["ID Code", "Name", "Type", "Status", "Guardian", "Phone", "Medical Notes"]],
        body: profiles.map((r: any) => [
          r.janRakshaCode || r.id,
          r.fullName,
          r.personType || "GENERAL",
          r.status || "SAFE",
          r.guardianName,
          r.guardianPhone,
          r.chronicIllness || r.allergies || r.criticalNotes || "None",
        ]),
        theme: "striped",
        headStyles: { fillColor: [23, 105, 224], textColor: 255 },
        styles: { fontSize: 8 },
      });

      doc.save(`JanRaksha_Incident_Report_${Date.now().toString().slice(-6)}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate PDF report.");
    }
  };

  const counts = {
    missing: profiles.filter((p) => p.status === "REPORTED_MISSING").length,
    found: profiles.filter((p) => p.status === "REPORTED_FOUND").length,
    reunited: profiles.filter((p) => p.status === "REUNITED").length,
    safe: profiles.filter((p) => p.status === "SAFE").length,
  };

  const chartData = [
    { name: "Reported Missing", count: counts.missing, color: "#E5484D" },
    { name: "Located At Camp", count: counts.found, color: "#D97706" },
    { name: "Safely Reunited", count: counts.reunited, color: "#138A62" },
    { name: "Monitored Safe", count: counts.safe, color: "#1769E0" },
  ];

  const expiryInfo = selectedProfile ? checkRecordExpiry(selectedProfile.createdAt, eventConfig.retentionWindowHours) : null;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* RBAC Role Selector Ribbon & Multi-Org Workspace Header */}
      <div className="bg-[#0B1F3A] text-white p-3 sm:p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Shield className="w-4 h-4 text-[#1769E0]" />
          <span className="font-semibold text-slate-200">Active Workspace:</span>
          <span className="bg-blue-900/60 text-blue-200 px-2 py-0.5 rounded font-mono font-bold border border-blue-500/30">
            {permissions.organization}
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-emerald-400 font-semibold">{permissions.title}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Switch Role:</span>
          <select
            value={activeRole}
            onChange={(e: any) => {
              const role = e.target.value as ScopedRole;
              setActiveRole(role);
              const p = ROLE_PERMISSIONS[role];
              setAuthorName(
                role === "POLICE_OFFICER"
                  ? "Inspector R. Verma (SJPU)"
                  : role === "RELIEF_CAMP_WORKER"
                  ? "Dr. Ananya Sen (UNICEF CPO)"
                  : role === "HOSPITAL_TRIAGE"
                  ? "Dr. K. Saxena (Civil Hospital)"
                  : role === "EVENT_ADMIN"
                  ? "Admin Control Director"
                  : "Volunteer Aarti Deshmukh"
              );
            }}
            className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="POLICE_OFFICER">Police Officer (Special Juvenile Police Unit)</option>
            <option value="RELIEF_CAMP_WORKER">Child Protection Worker (UNICEF / Red Cross)</option>
            <option value="HOSPITAL_TRIAGE">Hospital Triage Officer (Medical & Allergies)</option>
            <option value="EVENT_ADMIN">Event Command Administrator</option>
            <option value="VOLUNTEER">On-Ground Volunteer (Field Scanner)</option>
          </select>

          <button
            onClick={() => setShowGovernanceModal(true)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 font-semibold border border-slate-700 transition-colors flex items-center gap-1"
          >
            <Lock className="w-3 h-3" />
            <span>Event Governance</span>
          </button>

          <button
            onClick={() => setShowAuditDrawer(!showAuditDrawer)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 transition-colors"
          >
            {showAuditDrawer ? "Hide Audit Feed" : "Live Audit Ledger"}
          </button>
        </div>
      </div>

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#DCE5F0] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#0B1F3A]">
              Operations Command Dashboard
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-[#1769E0] font-semibold border border-blue-200">
              {eventConfig.eventId}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            ICRC Humanitarian Data Handbook & UNICEF Child Protection Protocol compliant incident stream.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchProfiles}
            disabled={loading}
            className="p-2.5 rounded-xl border border-[#DCE5F0] hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleExportPDF}
            className="px-4 py-2.5 rounded-xl border border-[#DCE5F0] hover:bg-slate-50 text-xs font-semibold text-[#172B4D] transition-colors flex items-center gap-2 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#1769E0]" />
            <span>Export Official PDF Report</span>
          </button>

          <Link
            href="/register"
            className="px-4 py-2.5 rounded-xl bg-[#1769E0] hover:bg-[#1255B8] text-xs font-semibold text-white transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Person</span>
          </Link>
        </div>
      </div>

      {/* KPI Status Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#E5484D] block mb-1">
              Active Missing
            </span>
            <span className="text-3xl font-extrabold text-[#0B1F3A]">{counts.missing}</span>
            <p className="text-[11px] text-[#64748B] mt-1">Requires immediate search</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E5484D] flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D97706] block mb-1">
              Located / At Camp
            </span>
            <span className="text-3xl font-extrabold text-[#0B1F3A]">{counts.found}</span>
            <p className="text-[11px] text-[#64748B] mt-1">Awaiting guardian verification</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D97706] flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#138A62] block mb-1">
              Reunited Safely
            </span>
            <span className="text-3xl font-extrabold text-[#0B1F3A]">{counts.reunited}</span>
            <p className="text-[11px] text-[#64748B] mt-1">UNICEF handoff certified</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#138A62] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1769E0] block mb-1">
              Total Monitored
            </span>
            <span className="text-3xl font-extrabold text-[#0B1F3A]">{profiles.length}</span>
            <p className="text-[11px] text-[#64748B] mt-1">Active event digital tokens</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1769E0] flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Split Operations Grid: Feed vs Case Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Recent Registrations & Active Incident Table */}
        <div className="lg:col-span-7 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[#64748B] px-1 flex items-center justify-between">
            <span>Active Incident Records ({profiles.length})</span>
            <span className="text-[11px] text-[#1769E0] font-normal">Auto-synced</span>
          </div>

          {profiles.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-[#DCE5F0] text-center text-[#64748B]">
              No identity records match the selected filters.
            </div>
          ) : (
            profiles.map((p) => {
              const isSelected = selectedProfile?.id === p.id || selectedProfile?.janRakshaCode === p.janRakshaCode;
              return (
                <div
                  key={p.id || p.janRakshaCode}
                  onClick={() => setSelectedProfile(p)}
                  className={`cursor-pointer bg-white p-4 rounded-xl border transition-all ${
                    isSelected
                      ? "border-[#1769E0] ring-2 ring-blue-100 shadow-sm"
                      : "border-[#DCE5F0] hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      {p.photoUrl ? (
                        <img
                          src={p.photoUrl}
                          alt={p.fullName}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                          <User className="w-6 h-6 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#0B1F3A]">{p.fullName}</span>
                          <span className="font-mono text-[10px] text-[#1769E0] bg-blue-50 px-2 py-0.5 rounded font-bold">
                            {p.janRakshaCode}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B] mt-0.5">
                          <span>{p.personType}</span>
                          {p.age && <span>• {p.age} yrs</span>}
                          {p.bloodGroup && p.bloodGroup !== "UNKNOWN" && (
                            <span className="text-[#E5484D] font-semibold">
                              • {p.bloodGroup.replace("_", " ")}
                            </span>
                          )}
                          {p.isConsentWithdrawn && (
                            <span className="text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded font-semibold text-[10px]">
                              PII Purged
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {p.status === "REPORTED_MISSING" && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-[#E5484D] border border-red-200">
                          Missing
                        </span>
                      )}
                      {p.status === "REPORTED_FOUND" && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-[#D97706] border border-amber-200">
                          Located
                        </span>
                      )}
                      {p.status === "REUNITED" && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#138A62] border border-emerald-200">
                          Reunited
                        </span>
                      )}
                      {p.status === "SAFE" && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200">
                          Safe
                        </span>
                      )}
                      <Link
                        href={`/edit?code=${encodeURIComponent(p.janRakshaCode)}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#1769E0] hover:bg-slate-100"
                        title="Edit Given Details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/scan/${encodeURIComponent(p.janRakshaCode)}${
                          encodeProfilePayload(p) ? `?d=${encodeProfilePayload(p)}` : ""
                        }`}
                        target="_blank"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#0B1F3A] hover:bg-slate-100"
                        title="Open Scan Verification"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Case Management Workspace */}
        <div className="lg:col-span-5">
          <div className="bg-white p-6 rounded-2xl border border-[#DCE5F0] shadow-sm space-y-6 sticky top-24 max-h-[85vh] overflow-y-auto">
            
            {selectedProfile ? (
              <div className="space-y-6">
                
                {/* Header Profile Title */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-[#0B1F3A]">{selectedProfile.fullName}</h2>
                    <p className="text-xs font-mono text-[#1769E0] font-semibold">{selectedProfile.janRakshaCode}</p>
                    {expiryInfo && (
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                        Retention: {expiryInfo.hoursRemaining}h remaining before scheduled purge
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => generateFamilyPaperSlip(selectedProfile)}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1"
                      title="Print Pocket Intake Slip for Family without Smartphone"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Paper Slip</span>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/edit?code=${encodeURIComponent(selectedProfile.janRakshaCode)}`}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#1769E0]" />
                        <span>Edit Details</span>
                      </Link>
                      <Link
                        href={`/scan/${encodeURIComponent(selectedProfile.janRakshaCode)}${
                          encodeProfilePayload(selectedProfile) ? `?d=${encodeProfilePayload(selectedProfile)}` : ""
                        }`}
                        target="_blank"
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-[#1769E0] hover:bg-blue-100 transition-colors"
                      >
                        View Card →
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Workflow Status Controls (UNICEF & RBAC Enforced) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#64748B] block">
                      Incident Progression Workflow
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">Role: {activeRole}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      disabled={actionLoading}
                      onClick={() => handleUpdateStatus("REPORTED_MISSING")}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                        selectedProfile.status === "REPORTED_MISSING"
                          ? "bg-red-50 text-[#E5484D] border-red-300 font-bold"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      Report Missing
                    </button>

                    <button
                      disabled={actionLoading}
                      onClick={() => handleUpdateStatus("REPORTED_FOUND")}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                        selectedProfile.status === "REPORTED_FOUND"
                          ? "bg-amber-50 text-[#D97706] border-amber-300 font-bold"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      Record Located
                    </button>

                    {/* UNICEF Child Protection Safe Handoff Trigger */}
                    {selectedProfile.personType === "CHILD" ? (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus("REUNITED")}
                        className="col-span-2 py-2.5 px-3 rounded-lg text-xs font-bold bg-[#138A62] hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                      >
                        <HeartHandshake className="w-4 h-4" />
                        <span>Authorize Safe Child Handoff (Dual-Sign UNICEF Verification)</span>
                      </button>
                    ) : (
                      <button
                        disabled={actionLoading}
                        onClick={() => handleUpdateStatus("REUNITED")}
                        className={`col-span-2 py-2.5 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                          selectedProfile.status === "REUNITED"
                            ? "bg-emerald-50 text-[#138A62] border-emerald-300 font-bold"
                            : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                        }`}
                      >
                        ✓ Confirm Reunified with Family
                      </button>
                    )}
                  </div>
                </div>

                {/* Assisted Matching Panel (ICRC Rule-Based, No Biometrics) */}
                {assistedMatches.length > 0 && (
                  <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#0B1F3A] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#1769E0]" />
                        <span>Assisted Case Matching (ICRC Rule-Based)</span>
                      </span>
                      <span className="text-[10px] text-[#1769E0] font-semibold">
                        {assistedMatches.length} Candidate(s)
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-600 leading-tight">
                      Identified potential correlation based on age brackets, gender, and clothing notes. <strong>Automated biometric matching is disabled. Human operator decision mandatory.</strong>
                    </p>

                    <div className="space-y-1.5">
                      {assistedMatches.map((match, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedProfile(match.profile)}
                          className="bg-white p-2.5 rounded-lg border border-blue-200 cursor-pointer hover:border-[#1769E0] transition-colors text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-[#0B1F3A]">{match.profile.fullName}</span>
                            <span className="px-2 py-0.5 rounded bg-blue-100 text-[#1769E0] font-mono text-[10px]">
                              {match.score}% Score
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600">
                            {match.reasons.join(" • ")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cross-Organization Controlled Case Sharing */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1">
                      <Share2 className="w-3.5 h-3.5 text-[#1769E0]" />
                      <span>Controlled Case Sharing</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Time-limited PIN</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleCreateShareToken("Civil Hospital Emergency Triage")}
                      className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-left"
                    >
                      <Building className="w-3 h-3 text-[#1769E0] inline mr-1" />
                      <span>Share with Hospital</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCreateShareToken("District Disaster Relief Camp")}
                      className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-left"
                    >
                      <Users className="w-3 h-3 text-emerald-600 inline mr-1" />
                      <span>Share with Camp</span>
                    </button>
                  </div>
                </div>

                {/* Privacy & Guardian Consent Withdrawal (ICRC Standard) */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#64748B] block">
                    Data Protection & Consent
                  </label>
                  <button
                    type="button"
                    disabled={selectedProfile.isConsentWithdrawn || actionLoading}
                    onClick={handleWithdrawConsent}
                    className="w-full py-2 px-3 rounded-lg border border-rose-200 text-rose-800 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{selectedProfile.isConsentWithdrawn ? "Personal Data Already Purged" : "Withdraw Consent & Purge Emergency Data (ICRC)"}</span>
                  </button>
                </div>

                {/* Log Incident Note */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#64748B] block">
                    Add Coordinator / Police Note
                  </label>
                  <textarea
                    rows={2}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="e.g. Verified by Child Protection Officer. Family notified."
                    className="w-full bg-slate-50 border border-[#DCE5F0] rounded-lg p-2.5 text-xs text-[#172B4D] focus:outline-none focus:border-[#1769E0]"
                  />
                  <button
                    disabled={actionLoading || !noteText.trim()}
                    onClick={() => handleUpdateStatus(selectedProfile.status)}
                    className="w-full py-2 bg-[#0B1F3A] hover:bg-[#1769E0] disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Save Note & Log to Audit Ledger</span>
                  </button>
                </div>

                {/* Audit Trail Timeline */}
                <div className="space-y-2 pt-2 border-t border-slate-100 max-h-48 overflow-y-auto pr-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#64748B] block">
                    Action History ({selectedProfile.reunificationNotes?.length || 0})
                  </label>
                  {selectedProfile.reunificationNotes?.length > 0 ? (
                    selectedProfile.reunificationNotes.map((note: any) => (
                      <div key={note.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-semibold text-slate-700">{note.authorName} ({note.authorRole})</span>
                          <span>{new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-600">{note.note}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No notes recorded yet.</p>
                  )}
                </div>

              </div>
            ) : (
              <div className="text-center py-12 text-[#64748B]">
                <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold">Select a record</p>
                <p className="text-xs">Click any incident on the left to review details and update status.</p>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Safe Reunification Verification Modal (UNICEF Standards) */}
      <SafeHandoffModal
        profile={selectedProfile}
        currentRole={activeRole}
        isOpen={handoffModalOpen}
        onClose={() => setHandoffModalOpen(false)}
        onSuccess={async (updated) => {
          setSelectedProfile(updated);
          await fetchProfiles();
          await fetchTelemetryFeeds();
          setHandoffModalOpen(false);
        }}
      />

      {/* Cross-Organization Share Token Modal */}
      {shareToken && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#1769E0]" />
                <h3 className="font-bold text-sm text-[#0B1F3A]">Controlled Cross-Org Case Sharing</h3>
              </div>
              <button onClick={() => setShareToken(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <p>
                Authorized transfer from <strong>{shareToken.sourceOrg}</strong> to <strong>{shareToken.destinationOrg}</strong>.
              </p>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 font-mono">
                <div>Token: <strong className="text-[#0B1F3A]">{shareToken.token}</strong></div>
                <div>Security PIN: <strong className="text-[#1769E0]">{shareToken.pin}</strong></div>
                <div className="text-[10px] text-slate-400">Expires: {new Date(shareToken.expiresAt).toLocaleTimeString()} (24h)</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`JANRAKSHA CASE SHARE:\nCode: ${shareToken.janRakshaCode}\nToken: ${shareToken.token}\nPIN: ${shareToken.pin}`);
                  setCopiedToken(true);
                  setTimeout(() => setCopiedToken(false), 2000);
                }}
                className="px-4 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-semibold flex items-center gap-1.5"
              >
                {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedToken ? "Copied" : "Copy Token & PIN"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Governance & Retention Schedule Modal */}
      {showGovernanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 p-6 space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#1769E0]" />
                <h3 className="font-bold text-sm text-[#0B1F3A]">Event Data Governance & ICRC Schedule</h3>
              </div>
              <button onClick={() => setShowGovernanceModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-slate-700">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                <div><strong>Event Workspace:</strong> {eventConfig.eventName} ({eventConfig.eventId})</div>
                <div><strong>Lead Organization:</strong> {eventConfig.leadOrganization}</div>
                <div><strong>Event Schedule:</strong> {new Date(eventConfig.eventStartDate).toLocaleDateString()} to {new Date(eventConfig.eventEndDate).toLocaleDateString()}</div>
                <div><strong>Data Retention Window:</strong> {eventConfig.retentionWindowHours} hours grace period post-event</div>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-[#0B1F3A]">ICRC Humanitarian Protection Standards:</h4>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                  <li>Temporary event IDs expire automatically when the grace period elapses.</li>
                  <li>No permanent centralized citizen database is constructed.</li>
                  <li>Guardians possess the humanitarian right to withdraw consent and purge emergency identifying records upon reunification.</li>
                  <li>Biometric face recognition and automated identity resolution are explicitly restricted.</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowGovernanceModal(false)}
                className="px-4 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
