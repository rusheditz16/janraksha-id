"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { encodeProfilePayload } from "@/lib/qrPayload";
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
  User
} from "lucide-react";

export default function ScannerComponent() {
  const router = useRouter();
  const [manualCode, setManualCode] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [nfcReading, setNfcReading] = useState(false);
  const [nfcMessage, setNfcMessage] = useState<string | null>(null);
  const [recentLocal, setRecentLocal] = useState<any[]>([]);

  const scannerRef = useRef<any>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("janraksha_recent_profiles");
      if (raw) {
        setRecentLocal(JSON.parse(raw));
      }
    } catch (e) {}
  }, []);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const query = manualCode.trim().toUpperCase();
    const match = recentLocal.find(
      (p) => p.janRakshaCode?.toUpperCase() === query || p.id === manualCode.trim()
    );
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
        "Camera permission was denied or is unsupported on this device. You can look up the identity code manually below."
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

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleNfcScan = async () => {
    if (!("NDEFReader" in window)) {
      setNfcMessage("Web NFC is supported on Chromium on Android. On other devices, use camera scan above!");
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

  return (
    <div className="max-w-xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1769E0] text-xs font-semibold">
          <QrCode className="w-3.5 h-3.5" />
          <span>Authorized Volunteer Scanner</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A]">
          Scan JanRaksha Wristband
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-sm mx-auto">
          Point camera at the emergency card or wristband QR code to access verified contacts.
        </p>
      </div>

      {/* Main Camera Box */}
      <div className="bg-white rounded-2xl border border-[#DCE5F0] p-6 shadow-sm text-center space-y-5">
        
        {/* Camera Viewport */}
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
                Instant decoding across iOS Safari and Android Chrome. No app download required.
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

        {/* NFC Optional Button */}
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

      {/* Fallback Manual Entry */}
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

        {/* Recently Registered Quick Access Chips */}
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

        {/* Quick Simulation Chips */}
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

    </div>
  );
}
