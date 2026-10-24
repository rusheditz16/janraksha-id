import Navbar from "@/components/Navbar";
import RegisterForm from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <main className="flex-1 py-6">
        <RegisterForm />
      </main>
    </div>
  );
}
