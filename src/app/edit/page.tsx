import { Metadata } from "next";
import EditProfileComponent from "@/components/EditProfileComponent";

export const metadata: Metadata = {
  title: "Edit & Update Person Details | JanRaksha ID",
  description: "Update given personal details, emergency guardian contacts, camp tent locations, and medical notes for different days and event sessions.",
};

export default function EditPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <EditProfileComponent />
    </main>
  );
}
