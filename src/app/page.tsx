import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import {
  Shield,
  QrCode,
  LayoutDashboard,
  HeartPulse,
  PhoneCall,
  MapPin,
  CheckCircle2,
  Lock,
  ArrowRight,
  Users,
  Building2,
  Clock,
  Compass,
  FileCheck,
  Search,
  AlertTriangle,
  Sparkles
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F5F8FC] text-[#172B4D] flex flex-col font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-[#F5F8FC] border-b border-[#DCE5F0] py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-[#1769E0]">
                <Image src="/logo.png" alt="JanRaksha Logo" width={18} height={18} className="rounded-full" />
                <span>Humanitarian Public Safety Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0B1F3A] tracking-tight leading-[1.15]">
                Every Identity Connected. <br />
                <span className="text-[#1769E0]">Every Family Closer.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#64748B] leading-relaxed max-w-2xl">
                Connecting people when they need help the most. Powered by privacy-safe QR/NFC wristbands, authorized volunteer verification, emergency medical notes, and a synchronized incident command dashboard.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/register"
                  className="px-6 py-3.5 rounded-lg bg-[#1769E0] hover:bg-[#1255B8] text-white font-semibold text-sm shadow-sm transition-all flex items-center gap-2"
                >
                  <span>Register a Person</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="#how-it-works"
                  className="px-6 py-3.5 rounded-lg bg-white hover:bg-slate-50 text-[#172B4D] font-semibold text-sm border border-[#DCE5F0] shadow-sm transition-colors"
                >
                  Explore How It Works
                </Link>

                <Link
                  href="/dashboard"
                  className="px-5 py-3.5 rounded-lg text-sm font-semibold text-[#1769E0] hover:bg-blue-50 transition-colors"
                >
                  Operations Dashboard →
                </Link>
              </div>

              {/* Verification & Trust Metrics */}
              <div className="pt-6 border-t border-[#DCE5F0] grid grid-cols-3 gap-4 max-w-lg">
                <div>
                  <div className="text-2xl font-bold text-[#0B1F3A]">12,500+</div>
                  <div className="text-xs text-[#64748B]">IDs Generated</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#138A62]">8,900+</div>
                  <div className="text-xs text-[#64748B]">Families Reunited</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#1769E0]">&lt; 8 Mins</div>
                  <div className="text-xs text-[#64748B]">Average Triage</div>
                </div>
              </div>
            </div>

            {/* Right Interactive Product Preview Column with Official Logo */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl border border-[#DCE5F0] p-6 shadow-xl relative">
                
                {/* Header Badge */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#DCE5F0] bg-white p-0.5 flex items-center justify-center">
                      <Image
                        src="/logo.png"
                        alt="JanRaksha ID Badge"
                        width={40}
                        height={40}
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#0B1F3A]">JanRaksha Identity Card</div>
                      <div className="text-[10px] text-[#64748B]">Connecting people in emergencies</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Active Verification
                  </span>
                </div>

                {/* Person Profile Preview */}
                <div className="flex items-center gap-4">
                  <img
                    src="https://images.unsplash.com/photo-1543332164-6e82f355badc?w=160&auto=format&fit=crop&q=80"
                    alt="Aarav Sharma"
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                  />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1769E0] bg-blue-50 px-2 py-0.5 rounded">
                      Child / Minor
                    </span>
                    <h3 className="text-base font-bold text-[#0B1F3A] mt-1">Aarav Sharma (7 yrs)</h3>
                    <p className="text-xs text-[#64748B]">Kumbh Mela North Camp • Booth 4</p>
                  </div>
                </div>

                {/* Medical Alert Note Preview */}
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#E5484D]">
                    <HeartPulse className="w-4 h-4" />
                    <span>Emergency Medical Alert</span>
                  </div>
                  <p className="text-[#64748B]">Peanut Allergy • Mild Asthma (Carries Inhaler)</p>
                </div>

                {/* QR Code Simulation Area */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs space-y-0.5">
                    <div className="font-semibold text-[#0B1F3A]">Secure Lookup ID:</div>
                    <div className="font-mono text-xs text-[#1769E0] font-bold">JR-KID-4029</div>
                    <div className="text-[10px] text-[#64748B]">Opaque token, 0 private data exposed</div>
                  </div>
                  <Link
                    href="/scan/JR-KID-4029"
                    className="px-3.5 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#1769E0] text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Simulate Scan</span>
                  </Link>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5-Step Unified Process Flow */}
      <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1769E0] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Systematic Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F3A]">
            The 5-Step Reunification Journey
          </h2>
          <p className="text-sm sm:text-base text-[#64748B]">
            From on-site registration to verified handover, every step is coordinated through protected digital tokens.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          
          <div className="bg-white p-5 rounded-xl border border-[#DCE5F0] shadow-sm space-y-2 relative">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1769E0] font-bold text-sm flex items-center justify-center border border-blue-200">
              01
            </div>
            <h3 className="font-bold text-sm text-[#0B1F3A]">Registration</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Family or camp organizers register the individual with consented emergency contacts and critical medical flags.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#DCE5F0] shadow-sm space-y-2 relative">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1769E0] font-bold text-sm flex items-center justify-center border border-blue-200">
              02
            </div>
            <h3 className="font-bold text-sm text-[#0B1F3A]">ID Generation</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              System generates a secure, opaque QR identity card or wristband. No personal or contact numbers are embedded directly.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#DCE5F0] shadow-sm space-y-2 relative">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1769E0] font-bold text-sm flex items-center justify-center border border-blue-200">
              03
            </div>
            <h3 className="font-bold text-sm text-[#0B1F3A]">Volunteer Scan</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Good Samaritan or authorized volunteer points their camera to scan the badge. No app installation needed.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#DCE5F0] shadow-sm space-y-2 relative">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1769E0] font-bold text-sm flex items-center justify-center border border-blue-200">
              04
            </div>
            <h3 className="font-bold text-sm text-[#0B1F3A]">Contact Verification</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Finder connects directly with guardians via 1-touch dial. GPS telemetry is securely pinned to the incident log.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#DCE5F0] shadow-sm space-y-2 relative">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#138A62] font-bold text-sm flex items-center justify-center border border-emerald-200">
              05
            </div>
            <h3 className="font-bold text-sm text-[#0B1F3A]">Reunification</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Authorized camp personnel record handover, verify identity, and close the incident with an audit history.
            </p>
          </div>

        </div>
      </section>

      {/* Target Use-Case Applications */}
      <section className="bg-white py-20 border-y border-[#DCE5F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <h2 className="text-3xl font-extrabold text-[#0B1F3A]">
              Engineered for Critical Environments
            </h2>
            <p className="text-sm text-[#64748B]">
              Purpose-built for public safety authorities managing high-stress, dense crowd logistics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-[#F5F8FC] border border-[#DCE5F0] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1769E0] flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#0B1F3A]">Public Gatherings & Melas</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Protects children and vulnerable attendees at cultural festivals, fairs, and sports stadiums.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F5F8FC] border border-[#DCE5F0] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-[#D97706] flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#0B1F3A]">Transit & Railway Stations</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Instant identification for disoriented senior citizens with dementia or Alzheimer's on busy platforms.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F5F8FC] border border-[#DCE5F0] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#138A62] flex items-center justify-center">
                <HeartPulse className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#0B1F3A]">Hospitals & Triage Wards</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Flags drug allergies and chronic conditions for non-verbal or unconscious patients.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F5F8FC] border border-[#DCE5F0] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-[#E5484D] flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#0B1F3A]">Disaster Relief Camps</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Organizes central lost-and-found tracking during floods, earthquakes, and emergency shelter operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy, Ethics, and Security Guarantee */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0B1F3A] rounded-2xl p-8 sm:p-12 text-white grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-xs font-semibold text-emerald-400 border border-slate-700">
              <Lock className="w-3.5 h-3.5" />
              <span>Privacy & Data Protection First</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Ethical Public Safety Architecture
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              JanRaksha ID utilizes data minimization. QR codes only contain an opaque cryptographic token. Private addresses, complete medical files, and full guardian contact networks are never revealed on unverified public scans.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-400">
              <span>✓ No sensitive data inside QR</span>
              <span>✓ Role-based staff access</span>
              <span>✓ Audit-ready timestamping</span>
            </div>
          </div>

          <div className="bg-slate-900/90 rounded-xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-200">Demonstration Quick Links</h3>
            <div className="space-y-2">
              <Link
                href="/scan/JR-KID-4029"
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700 transition-colors text-xs"
              >
                <div>
                  <span className="font-bold text-white">Scenario A: Separated Child</span>
                  <div className="text-[11px] text-slate-400">Grand Diwali Mela (JR-KID-4029)</div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#1769E0]" />
              </Link>

              <Link
                href="/scan/JR-ELD-7193"
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700 transition-colors text-xs"
              >
                <div>
                  <span className="font-bold text-white">Scenario B: Senior Citizen</span>
                  <div className="text-[11px] text-slate-400">Railway Station Concourse (JR-ELD-7193)</div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </Link>

              <Link
                href="/dashboard"
                className="flex items-center justify-between p-3 rounded-lg bg-[#1769E0]/20 hover:bg-[#1769E0]/30 border border-[#1769E0]/40 transition-colors text-xs"
              >
                <div>
                  <span className="font-bold text-white">Command Center Dashboard</span>
                  <div className="text-[11px] text-blue-200">Incident Triage & Active Stream</div>
                </div>
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-10 bg-white border-t border-[#DCE5F0] text-xs text-[#64748B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="JanRaksha Logo" width={24} height={24} className="rounded-full" />
              <span className="font-bold text-[#0B1F3A]">JanRaksha ID</span>
              <span>— Connecting people when they need help the most</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="hover:text-[#0B1F3A]">Operations Dashboard</Link>
              <Link href="/register" className="hover:text-[#0B1F3A]">Registration Wizard</Link>
              <Link href="/scanner" className="hover:text-[#0B1F3A]">Volunteer Scanner</Link>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between text-[11px] text-slate-400">
            <p>Developed for humanitarian emergency response, public safety, and family reunification.</p>
            <p className="font-mono">Demonstration Environment • Not an Official Government ID</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
