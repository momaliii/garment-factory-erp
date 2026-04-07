import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { OnboardingTour } from "@/components/shared/onboarding-tour";
import { HelpButton } from "@/components/shared/help-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const userRole = (session.user as { role?: string })?.role || "";

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 md:mr-[260px] transition-all duration-300">
        <Header />
        <main className="p-4 md:p-6">{children}</main>
      </div>
      <OnboardingTour userRole={userRole} />
      <HelpButton />
    </div>
  );
}
