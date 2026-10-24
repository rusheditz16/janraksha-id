"use client";

import { useState } from "react";
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
  Shield
} from "lucide-react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Operations Dashboard", icon: LayoutDashboard },
    { href: "/scanner", label: "Volunteer Scanner", icon: QrCode },
    { href: "/register", label: "Register a Person", icon: UserPlus },
  ];

  return (
    <>
      {/* Official Government / Emergency Awareness Ribbon */}
      <div className="bg-[#0B1F3A] text-white text-xs py-1.5 px-4 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#138A62]" />
            <span className="font-semibold text-slate-200">
              National Emergency & Family Reunification Network
            </span>
            <span className="text-slate-400 hidden sm:inline">|</span>
            <span className="text-slate-300 hidden sm:inline text-[11px]">
              Simulated Demonstration Environment
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-300">
            <span className="flex items-center gap-1 font-medium">
              <Phone className="w-3 h-3 text-[#E5484D]" /> Police: <strong className="text-white">112</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-medium">
              Childline: <strong className="text-white">1098</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-medium text-emerald-400">
              System: Online
            </span>
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
