"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { encodeProfilePayload } from "@/lib/qrPayload";
import {
  getOfflineQueue,
  enqueueOfflineIncident,
  syncOfflineQueue,
  savePaperIntakeEntry,
  getPaperIntakeEntries,
  OfflineIncident,
} from "@/lib/offlineQueue";
import { generateFamilyPaperSlip } from "@/lib/paperSlipGenerator";
import {
  QrCode,
  Camera,
  AlertCircle,
  ArrowRight,
  Radio,
  Search,
  CheckCircle2,
  X,
  Shield,
  HelpCircle,
  Clock,
  User,
  Wifi,
  WifiOff,
  RefreshCw,
  FileSpreadsheet,
  Printer,
  Sparkles
} from "lucide-react";

export default function ScannerComponent() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"CAMERA" | "MANUAL" | "PAPER_INTAKE">("CAMERA");
  const [manualCode, setManualCode] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [nfcReading, setNfcReading] = useState(false);
  const [nfcMessage, setNfcMessage] = useState<string | null>(null);
  const [recentLocal, setRecentLocal] = useState<any[]>([]);

  // Connectivity & Offline Queuing
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<OfflineIncident[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Paper Intake / Damaged Band State
  const [paperForm, setPaperForm] = useState({
    wristbandSerial: "",
    personName: "",
    approxAge: "",
    gender: "Male",
    guardianName: "",
    guardianContact: "",
    physicalDescription: "",
    clothingNotes: "",
    campDesk: "Zone B - Relief Camp Helpdesk #2",
    workerBadge: "VOL-7712",
    isBandDamaged: true,
  });
  const [paperIntakeSaved, setPaperIntakeSaved] = useState(false);

  const scannerRef = useRef<any>(null);

  const updateQueueState = () => {
    setOfflineQueue(getOfflineQueue());
  };

  useEffect(() => {
    setIsOnline(navigator.onLine);
    updateQueueState();

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-trigger sync when connectivity returns
      handleSyncQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("janraksha_queue_updated", updateQueueState);

    try {
      const raw = localStorage.getItem("janraksha_recent_profiles");
      if (raw) setRecentLocal(JSON.parse(raw));
    } catch (e) {}

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("janraksha_queue_updated", updateQueueState);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleSyncQueue = async () => {
    if (!navigator.onLine) {
      setSyncNotice("Cannot sync: Device is still offline.");
      return;
    }
    setSyncing(true);
    setSyncNotice("Syncing queued incidents with central server...");
    const res = await syncOfflineQueue();
    setSyncing(false);
    updateQueueState();
    setSyncNotice(`Sync Complete: ${res.success} synced successfully, ${res.failed} remaining.`);
    setTimeout(() => setSyncNotice(null), 4000);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const query = manualCode.trim().toUpperCase();
    const match = recentLocal.find(
      (p) => p.janRakshaCode?.toUpperCase() === query || p.id === manualCode.trim()
    );

    // If offline, queue the manual lookup incident
    if (!isOnline) {
      enqueueOfflineIncident({
        type: "MANUAL_INTAKE",
        code: query,
        finderName: "Volunteer Field Desk",
        finderPhone: "Camp Desk",
        finderNotes: "Looked up while device was offline in disaster camp",
        intakeWorkerName: "Volunteer Desk",
      });
    }

    if (match) {
      const token = encodeProfilePayload(match);
      router.push(`/scan/${encodeURIComponent(match.janRakshaCode)}${token ? `?d=${token}` : ""}`);
    } else {
      router.push(`/scan/${encodeURIComponent(manualCode.trim())}`);
    }
  };

  const startCamera = async () => {
    setErrorMsg(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      setCameraActive(true);

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          html5QrCode.stop().then(() => {
            // If offline, queue the scan incident locally
            if (!navigator.onLine) {
              enqueueOfflineIncident({
                type: "QR_SCAN",
                code: decodedText.includes("/scan/")
                  ? decodedText.split("/scan/")[1].split("?")[0]
                  : decodedText.trim(),
                finderName: "Volunteer Offline Scanner",
                finderPhone: "Field Unit",
                finderNotes: "Scanned in zero-connectivity zone",
                intakeWorkerName: "Volunteer Field Unit",
              });
            }

            if (decodedText.startsWith("http://") || decodedText.startsWith("https://")) {
              try {
                const url = new URL(decodedText);
                router.push(url.pathname + url.search);
                return;
              } catch (e) {}
            }
            if (decodedText.includes("/scan/")) {
              const rel = decodedText.substring(decodedText.indexOf("/scan/"));
              router.push(rel);
              return;
            }
            router.push(`/scan/${encodeURIComponent(decodedText.trim())}`);
          });
        },
        () => {}
      );
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        "Camera permission was denied or unsupported. Use manual lookup or paper intake below."
      );
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.error(e);
      }
      setCameraActive(false);
    }
  };

  const handleNfcScan = async () => {
    if (!("NDEFReader" in window)) {
      setNfcMessage("Web NFC supported on Chromium on Android. On other devices, use camera scan!");
      return;
    }

    try {
      setNfcReading(true);
      setNfcMessage("Approach device to wristband or NFC badge...");
      // @ts-ignore
      const ndef = new NDEFReader();
      await ndef.scan();

      ndef.addEventListener("reading", ({ serialNumber }: any) => {
        setNfcMessage(`NFC detected (${serialNumber})! Loading record...`);
        setTimeout(() => {
          router.push(`/scan/${serialNumber}`);
        }, 800);
      });
    } catch (err: any) {
      console.error("NFC Error:", err);
      setNfcMessage("NFC error: " + (err.message || "Failed to read tag"));
      setNfcReading(false);
    }
  };

  const handlePaperIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry = savePaperIntakeEntry(paperForm);
    setPaperIntakeSaved(true);

    // Queue for sync
    enqueueOfflineIncident({
      type: "DAMAGED_BAND",
      code: paperForm.wristbandSerial || `MANUAL-${Date.now().toString().slice(-4)}`,
      finderName: paperForm.workerBadge,
      finderPhone: paperForm.guardianContact,
      finderNotes: `[Paper Intake] ${paperForm.physicalDescription} - Clothing: ${paperForm.clothingNotes}`,
      intakeWorkerName: paperForm.workerBadge,
      locationAddress: paperForm.campDesk,
    });
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4 sm:px-6 space-y-5">
      
      {/* Header with Connectivity Status */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1769E0] text-xs font-semibold">
            <QrCode className="w-3.5 h-3.5" />
            <span>Authorized Volunteer Scanner</span>
          </div>

          {isOnline ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <Wifi className="w-3 h-3 text-emerald-600" />
              <span>Online (Live Sync)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-300 animate-pulse">
              <WifiOff className="w-3 h-3 text-amber-600" />
              <span>Offline Mode (Queue Active)</span>
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A]">
          Field Identification & Intake
        </h1>
        <p className="text-xs text-[#64748B] max-w-sm mx-auto">
          Scan QR wristbands, look up codes manually, or log paper fallback entries in disaster zones.
        </p>
      </div>

      {/* Offline Sync Status Banner */}
      {offlineQueue.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>{offlineQueue.length}</strong> incident(s) stored locally in encrypted queue.
            </span>
          </div>
          <button
            type="button"
            disabled={syncing}
            onClick={handleSyncQueue}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center gap-1 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
            <span>{syncing ? "Syncing..." : "Sync Now"}</span>
          </button>
        </div>
      )}

      {syncNotice && (
        <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs text-center font-medium">
          {syncNotice}
        </div>
      )}

      {/* 3-Mode Tab Navigation */}
      <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("CAMERA")}
          className={`py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === "CAMERA"
              ? "bg-white text-[#0B1F3A] shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Camera Scan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("MANUAL")}
          className={`py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === "MANUAL"
              ? "bg-white text-[#0B1F3A] shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Manual UID</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("PAPER_INTAKE")}
          className={`py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === "PAPER_INTAKE"
              ? "bg-white text-[#0B1F3A] shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-[#E5484D]" />
          <span>Paper Fallback</span>
        </button>
      </div>

      {/* Tab 1: Camera Scanner */}
      {activeTab === "CAMERA" && (
        <div className="bg-white rounded-2xl border border-[#DCE5F0] p-6 shadow-sm text-center space-y-5">
          <div
            id="qr-reader"
            className={`w-full overflow-hidden rounded-xl bg-slate-950 ${
              cameraActive ? "min-h-[300px]" : "hidden"
            }`}
          />

          {!cameraActive && (
            <div className="py-8 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#1769E0] border border-blue-100 flex items-center justify-center mx-auto">
                <Camera className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-bold text-[#0B1F3A] text-base">In-Browser Camera Scanner</h3>
                <p className="text-xs text-[#64748B] max-w-xs mx-auto mt-0.5">
                  Works online & offline. Decodes QR wristbands instantly across iOS Safari & Android.
                </p>
              </div>

              <button
                onClick={startCamera}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#1769E0] hover:bg-[#1255B8] text-white font-semibold text-xs transition-colors shadow-sm"
              >
                <Camera className="w-4 h-4" />
                <span>Start Camera Scanner</span>
              </button>
            </div>
          )}

          {cameraActive && (
            <button
              onClick={stopCamera}
              className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#0B1F3A] px-3 py-1.5 rounded-lg border border-slate-200"
            >
              <X className="w-3.5 h-3.5" />
              <span>Stop Camera</span>
            </button>
          )}

          {errorMsg && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-800 flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex flex-col items-center gap-1.5">
            <button
              onClick={handleNfcScan}
              disabled={nfcReading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1769E0] hover:underline py-1 px-3"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{nfcReading ? "Holding for NFC contact..." : "Or Tap NFC Wristband"}</span>
            </button>
            {nfcMessage && (
              <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
                {nfcMessage}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Manual Search */}
      {activeTab === "MANUAL" && (
        <div className="bg-white rounded-2xl border border-[#DCE5F0] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0B1F3A] uppercase tracking-wider">
              <Search className="w-4 h-4 text-[#1769E0]" />
              <span>Manual Identity Lookup</span>
            </div>
            <span className="text-[11px] text-[#64748B]">Case-insensitive</span>
          </div>

          <form onSubmit={handleManualSearch} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="e.g. JR-KID-4029"
              className="flex-1 bg-slate-50 border border-[#DCE5F0] rounded-lg px-3.5 py-2.5 text-xs text-[#172B4D] focus:outline-none focus:border-[#1769E0] font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg bg-[#0B1F3A] hover:bg-[#1769E0] text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <span>Verify</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {recentLocal.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <span className="text-[11px] font-bold text-[#0B1F3A] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#1769E0]" />
                <span>Recently Registered Records ({recentLocal.length}):</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {recentLocal.slice(0, 6).map((p) => {
                  const token = encodeProfilePayload(p);
                  return (
                    <button
                      key={p.janRakshaCode || p.id}
                      type="button"
                      onClick={() =>
                        router.push(
                          `/scan/${encodeURIComponent(p.janRakshaCode)}${token ? `?d=${token}` : ""}`
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1769E0] font-mono text-[11px] font-bold border border-blue-200 transition-colors flex items-center gap-1"
                    >
                      <span>{p.janRakshaCode}</span>
                      <span className="font-sans font-normal text-slate-500">
                        ({p.fullName.split(" ")[0]})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-2 text-xs text-[#64748B] flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
            <span>Demo Verification Records:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => router.push("/scan/JR-KID-4029")}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-50 text-[#1769E0] font-mono text-[11px] font-semibold border border-slate-200"
              >
                JR-KID-4029
              </button>
              <button
                type="button"
                onClick={() => router.push("/scan/JR-ELD-7193")}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-amber-50 text-amber-700 font-mono text-[11px] font-semibold border border-slate-200"
              >
                JR-ELD-7193
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Damaged Band & Paper Intake Fallback */}
      {activeTab === "PAPER_INTAKE" && (
        <div className="bg-white rounded-2xl border border-[#DCE5F0] p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#E5484D] flex items-center justify-center border border-rose-200">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0B1F3A]">Paper Intake & Damaged Band Fallback</h3>
              <p className="text-[11px] text-[#64748B]">
                For dead phone batteries, damaged wristbands, or non-smartphone family registration.
              </p>
            </div>
          </div>

          {paperIntakeSaved ? (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#138A62] mx-auto" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-[#0B1F3A]">Emergency Intake Logged & Queued</h4>
                <p className="text-xs text-[#138A62]">
                  Incident record created for <strong>{paperForm.personName}</strong> and queued for central sync.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    generateFamilyPaperSlip({
                      janRakshaCode: paperForm.wristbandSerial || "JR-PAPER-FALLBACK",
                      fullName: paperForm.personName,
                      age: paperForm.approxAge,
                      gender: paperForm.gender,
                      guardianName: paperForm.guardianName,
                      guardianPhone: paperForm.guardianContact,
                      criticalNotes: paperForm.physicalDescription,
                    })
                  }
                  className="px-4 py-2 rounded-lg bg-[#1769E0] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Physical Family Pocket Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaperIntakeSaved(false);
                    setPaperForm({
                      wristbandSerial: "",
                      personName: "",
                      approxAge: "",
                      gender: "Male",
                      guardianName: "",
                      guardianContact: "",
                      physicalDescription: "",
                      clothingNotes: "",
                      campDesk: "Zone B - Relief Camp Helpdesk #2",
                      workerBadge: "VOL-7712",
                      isBandDamaged: true,
                    });
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Log Another
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePaperIntakeSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Damaged Wristband Serial (If readable)
                  </label>
                  <input
                    type="text"
                    value={paperForm.wristbandSerial}
                    onChange={(e) => setPaperForm({ ...paperForm, wristbandSerial: e.target.value })}
                    placeholder="e.g. WB-8831 or Torn"
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subject Name *</label>
                  <input
                    type="text"
                    required
                    value={paperForm.personName}
                    onChange={(e) => setPaperForm({ ...paperForm, personName: e.target.value })}
                    placeholder="e.g. Child or Senior Name"
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Approximate Age *</label>
                  <input
                    type="text"
                    required
                    value={paperForm.approxAge}
                    onChange={(e) => setPaperForm({ ...paperForm, approxAge: e.target.value })}
                    placeholder="e.g. ~8 years"
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={paperForm.gender}
                    onChange={(e) => setPaperForm({ ...paperForm, gender: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Claimed Guardian Name *</label>
                  <input
                    type="text"
                    required
                    value={paperForm.guardianName}
                    onChange={(e) => setPaperForm({ ...paperForm, guardianName: e.target.value })}
                    placeholder="e.g. Sunita Sharma"
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Guardian Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={paperForm.guardianContact}
                    onChange={(e) => setPaperForm({ ...paperForm, guardianContact: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Physical Descriptors & Clothing (Crucial for Assisted Matching) *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={paperForm.clothingNotes}
                    onChange={(e) => setPaperForm({ ...paperForm, clothingNotes: e.target.value })}
                    placeholder="e.g. Yellow kurta, blue cap, scar on left cheek, carries silver water bottle"
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-[11px] text-slate-500">
                  Officer: <strong>{paperForm.workerBadge}</strong> ({paperForm.campDesk})
                </span>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#E5484D] hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Log Paper Intake & Queue</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

    </div>
  );
}
