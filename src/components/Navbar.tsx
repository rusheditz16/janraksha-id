"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  QrCode,
  UserPlus,
  Menu,
  X,
  Phone,
  Shield,
  Globe,
  Sun,
  Moon,
  Wifi,
  WifiOff
} from "lucide-react";
import { LanguageCode, getTranslation } from "@/lib/translations";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lang, setLang] = useState<LanguageCode>("en");
  const [highContrast, setHighContrast] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Load saved settings
    try {
      const savedLang = localStorage.getItem("janraksha_lang") as LanguageCode;
      if (savedLang) setLang(savedLang);
      const savedHC = localStorage.getItem("janraksha_high_contrast") === "true";
      setHighContrast(savedHC);
      if (savedHC) document.body.classList.add("field-high-contrast");
    } catch (e) {}

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleLangChange = (code: LanguageCode) => {
    setLang(code);
    if (typeof window !== "undefined") {
      localStorage.setItem("janraksha_lang", code);
      window.dispatchEvent(new Event("janraksha_lang_changed"));
    }
  };

  const toggleHighContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("janraksha_high_contrast", String(next));
      if (next) {
        document.body.classList.add("field-high-contrast");
      } else {
        document.body.classList.remove("field-high-contrast");
      }
    }
  };

  const t = getTranslation(lang);

  const navItems = [
    { href: "/", label: t.home },
    { href: "/dashboard", label: t.dashboard, icon: LayoutDashboard },
    { href: "/scanner", label: t.scanner, icon: QrCode },
    { href: "/register", label: t.registerPerson, icon: UserPlus },
  ];

  return (
    <>
      {/* Official Government / Emergency Awareness Ribbon */}
      <div className="bg-[#0B1F3A] text-white text-xs py-1.5 px-4 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">
              National Emergency & Family Reunification Network
            </span>
            <span className="text-slate-400 hidden sm:inline">|</span>
            <span className="text-slate-300 hidden sm:inline text-[11px]">
              Humanitarian Data & UNICEF CPMS Compliant
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-300">
            {/* Real-time Connectivity Indicator */}
            {isOnline ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span className="font-medium">Live Online</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/30 animate-pulse">
                <WifiOff className="w-3 h-3 text-amber-400" />
                <span className="font-bold">Offline Field Mode (Queued)</span>
              </span>
            )}

            {/* High Contrast / Field Visibility Toggle */}
            <button
              type="button"
              onClick={toggleHighContrast}
              title="Toggle Large-Text High-Contrast Field Mode"
              className={`px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
                highContrast
                  ? "bg-amber-400 text-black font-bold border-amber-300"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
              }`}
            >
              <Sun className="w-3 h-3" />
              <span className="hidden sm:inline">High Contrast</span>
            </button>

            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-slate-800 rounded px-1.5 py-0.5 border border-slate-700">
              <Globe className="w-3 h-3 text-blue-400" />
              <select
                value={lang}
                onChange={(e) => handleLangChange(e.target.value as LanguageCode)}
                className="bg-transparent text-white text-[11px] font-semibold focus:outline-none cursor-pointer"
              >
                <option value="en" className="text-slate-900">EN</option>
                <option value="hi" className="text-slate-900">हिन्दी</option>
                <option value="bn" className="text-slate-900">বাংলা</option>
                <option value="gu" className="text-slate-900">ગુજરાતી</option>
                <option value="mr" className="text-slate-900">मराठी</option>
                <option value="ta" className="text-slate-900">தமிழ்</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#DCE5F0] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo Branding */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-white border border-[#DCE5F0] flex items-center justify-center shadow-xs shrink-0 group-hover:border-[#1769E0] transition-colors">
                <Image
                  src="/logo.png"
                  alt="JanRaksha ID Logo"
                  width={44}
                  height={44}
                  className="object-cover w-full h-full"
                  priority
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg text-[#0B1F3A] tracking-tight">
                    JanRaksha <span className="text-[#1769E0]">ID</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-[#1769E0] border border-blue-200">
                    Official
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] font-medium leading-none">
                  Connecting people when they need help the most
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      active
                        ? "bg-blue-50 text-[#1769E0] font-semibold"
                        : "text-[#172B4D] hover:bg-slate-100 hover:text-[#0B1F3A]"
                    }`}
                  >
                    {Icon && <Icon className={`w-4 h-4 ${active ? "text-[#1769E0]" : "text-[#64748B]"}`} />}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Controls */}
            <div className="hidden sm:flex items-center space-x-3">
              <Link
                href="/scanner"
                className="px-4 py-2 rounded-lg text-xs font-semibold text-[#1769E0] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Quick Scan</span>
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#1769E0] hover:bg-[#1255B8] shadow-sm transition-colors flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register Person</span>
              </Link>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 rounded-lg text-[#64748B] hover:text-[#172B4D] hover:bg-slate-100"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-[#172B4D]" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[#DCE5F0] bg-white px-4 pt-3 pb-5 space-y-1 shadow-lg">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    active
                      ? "bg-blue-50 text-[#1769E0] font-semibold"
                      : "text-[#172B4D] hover:bg-slate-50"
                  }`}
                >
                  {Icon && <Icon className={`w-4 h-4 ${active ? "text-[#1769E0]" : "text-[#64748B]"}`} />}
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
              <Link
                href="/scanner"
                onClick={() => setMobileOpen(false)}
                className="w-full text-center py-2 px-3 rounded-lg text-xs font-semibold text-[#1769E0] bg-blue-50 border border-blue-200"
              >
                Quick Scan
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="w-full text-center py-2 px-3 rounded-lg text-xs font-semibold text-white bg-[#1769E0]"
              >
                Register Person
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
