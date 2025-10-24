import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { ContentManager } from "@/components/dashboard/ContentManager";
import { Analytics } from "@/components/dashboard/Analytics";
import { supabase } from "@/lib/supabaseClient";

// Settings removed from admin dashboard

const Index = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<string>;
      const targetTab = ce.detail;
      if (typeof targetTab === "string") {
        setActiveTab(targetTab);
      }
    };
    window.addEventListener("dashboard:navigate", handler as EventListener);
    return () => window.removeEventListener("dashboard:navigate", handler as EventListener);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const email = data?.session?.user?.email ?? null;
      setSessionEmail(email);
    });
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <DashboardOverview />;
      case "content":
        return <ContentManager />;
      case "analytics":
        return <Analytics />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="flex">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
        
        <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          <DashboardHeader />
          <main className="p-6 space-y-4">
            {/* Supabase status indicator for quick connectivity confirmation */}
            <div className="text-xs text-muted-foreground border rounded p-2">
              <div>Supabase URL: {supabaseUrl ? supabaseUrl : 'not configured'}</div>
              <div>Auth session: {sessionEmail ? `signed in as ${sessionEmail}` : 'no active session'}</div>
            </div>
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Index;