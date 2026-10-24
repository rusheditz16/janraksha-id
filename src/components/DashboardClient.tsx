"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { encodeProfilePayload } from "@/lib/qrPayload";
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
  MessageSquare
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

  // RBAC Role Simulator
  const [activeRole, setActiveRole] = useState<"POLICE_OFFICER" | "EVENT_ADMIN" | "VOLUNTEER">("POLICE_OFFICER");

  // Audit Logs & Live Alerts Feed
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showAuditDrawer, setShowAuditDrawer] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [authorName, setAuthorName] = useState("Inspector R. Verma");

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

      // Merge with browser localStorage recent profiles so newly added persons are always visible
      try {
        const raw = localStorage.getItem("janraksha_recent_profiles");
        if (raw) {
          const localList: any[] = JSON.parse(raw);
          const map = new Map<string, any>();
          // Local registrations placed first
          localList.forEach((p) => {
            if (p.janRakshaCode) map.set(p.janRakshaCode.toUpperCase(), p);
          });
          // Then server list
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
        const updated = combined.find((p: any) => p.id === selectedProfile.id || p.janRakshaCode === selectedProfile.janRakshaCode);
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
        fetch("/api/audit?limit=15"),
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProfiles();
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedProfile) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/profiles/${selectedProfile.janRakshaCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reunificationNote: noteText || `Status transitioned to ${status}`,
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
      alert("Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  // Export Formal PDF Incident Report
  const handleExportPDF = async () => {
    try {
      const res = await fetch("/api/reports");
      const { report } = await res.json();

      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(16);
      doc.setTextColor(11, 31, 58);
      doc.text("JANRAKSHA ID — OFFICIAL REUNIFICATION & INCIDENT REPORT", 14, 18);

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Report ID: ${report.reportId}  |  Generated: ${new Date().toLocaleString()}`, 14, 25);
      doc.text(`Jurisdiction: ${report.jurisdiction}`, 14, 30);

      // Summary Table
      autoTable(doc, {
        startY: 36,
        head: [["Total Monitored", "Active Missing", "Located at Desks", "Reunited with Family", "Resolution Rate"]],
        body: [[
          report.executiveSummary.totalMonitored,
          report.executiveSummary.activeMissing,
          report.executiveSummary.locatedAtHelpdesks,
          report.executiveSummary.reunitedWithFamily,
          report.executiveSummary.resolutionRate,
        ]],
        theme: "grid",
        headStyles: { fillColor: [11, 31, 58], textColor: 255 },
      });

      // Individual Records Table
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [["ID Code", "Name", "Type", "Status", "Guardian", "Phone", "Medical Notes"]],
        body: report.records.map((r: any) => [
          r.code,
          r.name,
          r.classification,
          r.status,
          r.guardian,
          r.phone,
          r.medicalFlag,
        ]),
        theme: "striped",
        headStyles: { fillColor: [23, 105, 224], textColor: 255 },
        styles: { fontSize: 8 },
      });

      doc.save(`JanRaksha_Incident_Report_${Date.now().toString().slice(-6)}.pdf`);
    } catch (err) {
      console.error(err);
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
    { name: "Active Missing", count: counts.missing, color: "#E5484D" },
    { name: "Located / At Camp", count: counts.found, color: "#D97706" },
    { name: "Reunited", count: counts.reunited, color: "#138A62" },
    { name: "Safe Registered", count: counts.safe, color: "#1769E0" },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* RBAC Role Selector Ribbon & Operational Ticker */}
      <div className="bg-[#0B1F3A] text-white p-3 sm:p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#1769E0]" />
          <span className="font-semibold text-slate-200">Active Operator Session:</span>
          <span className="bg-blue-900/60 text-blue-200 px-2 py-0.5 rounded font-mono font-bold border border-blue-500/30">
            {activeRole}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Switch Role:</span>
          <select
            value={activeRole}
            onChange={(e: any) => {
              setActiveRole(e.target.value);
              setAuthorName(
                e.target.value === "POLICE_OFFICER"
                  ? "Inspector R. Verma"
                  : e.target.value === "EVENT_ADMIN"
                  ? "Admin Control Director"
                  : "Volunteer Aarti Deshmukh"
              );
            }}
            className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none"
          >
            <option value="POLICE_OFFICER">Police Officer (Law Enforcement)</option>
            <option value="EVENT_ADMIN">Event / Camp Administrator</option>
            <option value="VOLUNTEER">On-Ground Volunteer</option>
          </select>

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
              Live Feed
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Synchronized telemetry with automated WhatsApp/SMS dispatch and proximity booth routing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchProfiles}
            disabled={loading}
            className="p-2.5 rounded-lg border border-[#DCE5F0] text-[#64748B] hover:text-[#0B1F3A] hover:bg-slate-50 transition-colors"
            title="Refresh Feed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2.5 rounded-lg border border-[#DCE5F0] bg-white hover:bg-slate-50 text-[#172B4D] font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#1769E0]" />
            <span>Export Official PDF Report</span>
          </button>

          <Link
            href="/register"
            className="px-4 py-2.5 rounded-lg bg-[#1769E0] hover:bg-[#1255B8] text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Register Person</span>
          </Link>
        </div>
      </div>

      {/* Live Audit Ledger Dropdown Drawer */}
      {showAuditDrawer && (
        <div className="bg-white p-5 rounded-2xl border border-[#DCE5F0] shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0B1F3A]">
              <Lock className="w-4 h-4 text-[#1769E0]" />
              <span>Immutable Regulatory Audit Trail (Last 15 System Events)</span>
            </div>
            <span className="text-[11px] text-[#64748B]">Audited by Central Defense Registry</span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1 text-xs">
            {auditLogs.length > 0 ? (
              auditLogs.map((log) => (
                <div key={log.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-[#1769E0]">
                      {log.actionType}
                    </span>
                    <span className="font-mono font-bold text-[#0B1F3A]">{log.recordCode}</span>
                    <span className="text-slate-600">{log.details}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-xs italic">No audit records logged yet.</p>
            )}
          </div>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div
          onClick={() => setStatusFilter(statusFilter === "REPORTED_MISSING" ? "ALL" : "REPORTED_MISSING")}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            statusFilter === "REPORTED_MISSING"
              ? "bg-red-50/70 border-[#E5484D] shadow-sm ring-1 ring-[#E5484D]"
              : "bg-white border-[#DCE5F0] hover:border-red-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E5484D]">
              Active Missing
            </span>
            <AlertTriangle className="w-4 h-4 text-[#E5484D]" />
          </div>
          <div className="text-3xl font-extrabold text-[#0B1F3A] mt-2">{counts.missing}</div>
          <p className="text-xs text-[#64748B] mt-1">Requires immediate search</p>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "REPORTED_FOUND" ? "ALL" : "REPORTED_FOUND")}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            statusFilter === "REPORTED_FOUND"
              ? "bg-amber-50/70 border-[#D97706] shadow-sm ring-1 ring-[#D97706]"
              : "bg-white border-[#DCE5F0] hover:border-amber-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D97706]">
              Located / At Camp
            </span>
            <Clock className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="text-3xl font-extrabold text-[#0B1F3A] mt-2">{counts.found}</div>
          <p className="text-xs text-[#64748B] mt-1">Awaiting guardian pickup</p>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === "REUNITED" ? "ALL" : "REUNITED")}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            statusFilter === "REUNITED"
              ? "bg-emerald-50/70 border-[#138A62] shadow-sm ring-1 ring-[#138A62]"
              : "bg-white border-[#DCE5F0] hover:border-emerald-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#138A62]">
              Reunited Safely
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#138A62]" />
          </div>
          <div className="text-3xl font-extrabold text-[#0B1F3A] mt-2">{counts.reunited}</div>
          <p className="text-xs text-[#64748B] mt-1">Case closed successfully</p>
        </div>

        <div
          onClick={() => setStatusFilter("ALL")}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            statusFilter === "ALL"
              ? "bg-blue-50/70 border-[#1769E0] shadow-sm ring-1 ring-[#1769E0]"
              : "bg-white border-[#DCE5F0] hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1769E0]">
              Total Monitored
            </span>
            <LayoutDashboard className="w-4 h-4 text-[#1769E0]" />
          </div>
          <div className="text-3xl font-extrabold text-[#0B1F3A] mt-2">{profiles.length}</div>
          <p className="text-xs text-[#64748B] mt-1">Registered digital badges</p>
        </div>

      </div>

      {/* Incident Status Distribution Chart & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Status Chart Card */}
        <div className="bg-white p-5 rounded-2xl border border-[#DCE5F0] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Incident Distribution
            </div>
            <TrendingUp className="w-4 h-4 text-[#64748B]" />
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#64748B" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#DCE5F0", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-[#DCE5F0] shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-3">
              Search & Filter Criteria
            </div>
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#64748B]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, ID code, booth, or medical conditions..."
                  className="w-full bg-slate-50 border border-[#DCE5F0] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#172B4D] focus:outline-none focus:border-[#1769E0]"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#1769E0] text-white text-xs font-semibold transition-colors"
              >
                Apply Search
              </button>
            </form>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#64748B]">Category:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-50 border border-[#DCE5F0] rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#172B4D]"
              >
                <option value="ALL">All Categories</option>
                <option value="CHILD">Children</option>
                <option value="ELDERLY">Elderly / Seniors</option>
                <option value="PATIENT">Patients</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[#64748B]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-[#DCE5F0] rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#172B4D]"
              >
                <option value="ALL">All Statuses</option>
                <option value="REPORTED_MISSING">Reported Missing</option>
                <option value="REPORTED_FOUND">Reported Found</option>
                <option value="REUNITED">Reunited</option>
                <option value="SAFE">Safe / Monitored</option>
              </select>
            </div>
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
              const isSelected = selectedProfile?.id === p.id;
              return (
                <div
                  key={p.id}
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
                        <p className="text-xs text-[#64748B] mt-0.5">
                          {p.personType} {p.age ? `• ${p.age} yrs` : ""} • Guardian: {p.guardianName} ({p.guardianPhone})
                        </p>
                        {p.lastSeenLocation && (
                          <div className="flex items-center gap-1 text-[11px] text-[#D97706] mt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span>Location: {p.lastSeenLocation}</span>
                          </div>
                        )}
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
          <div className="bg-white p-6 rounded-2xl border border-[#DCE5F0] shadow-sm space-y-6 sticky top-24">
            
            {selectedProfile ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-[#0B1F3A]">{selectedProfile.fullName}</h2>
                    <p className="text-xs font-mono text-[#1769E0] font-semibold">{selectedProfile.janRakshaCode}</p>
                  </div>
                  <Link
                    href={`/scan/${encodeURIComponent(selectedProfile.janRakshaCode)}${
                      encodeProfilePayload(selectedProfile)
                        ? `?d=${encodeProfilePayload(selectedProfile)}`
                        : ""
                    }`}
                    target="_blank"
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-[#1769E0] hover:bg-blue-100 transition-colors"
                  >
                    View Emergency Card →
                  </Link>
                </div>

                {/* Workflow Status Controls */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#64748B] block">
                      Incident Progression Workflow
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">Logged as: {activeRole}</span>
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
                  </div>
                </div>

                {/* Automated Dispatched Notifications Log for this Case */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center justify-between">
                    <span>Automated Dispatched Alerts ({selectedProfile.dispatchAlerts?.length || 0})</span>
                    <span className="text-[10px] text-emerald-600 font-medium">WhatsApp & SMS</span>
                  </label>
                  {selectedProfile.dispatchAlerts?.length > 0 ? (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {selectedProfile.dispatchAlerts.map((alert: any) => (
                        <div key={alert.id} className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100 text-[11px] text-emerald-950 space-y-0.5">
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-emerald-700">{alert.channel} Dispatched</span>
                            <span className="text-[10px] font-mono text-emerald-600">{alert.status}</span>
                          </div>
                          <p className="line-clamp-2 text-slate-600">{alert.messageBody}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No automated alerts triggered yet.</p>
                  )}
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
                    placeholder="e.g. Accompanied by Volunteer Sharma. Family notified."
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

    </div>
  );
}
