import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { ContentManager } from "@/components/dashboard/ContentManager";
import { Analytics } from "@/components/dashboard/Analytics";
// Settings removed from admin dashboard

const Index = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
          <main className="p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Index;