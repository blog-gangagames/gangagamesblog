import { 
  LayoutDashboard, 
  FileText, 
  BarChart3, 
  Users, 
  Search, 
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Edit,
  MessageSquare
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const menuItems = [
  { id: "overview", label: "Admin Dashboard", icon: LayoutDashboard },
  { id: "content", label: "Content", icon: FileText },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

export function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed }: SidebarProps) {
  const [storagePercent, setStoragePercent] = useState<number | null>(null);
  const [storageUsedMB, setStorageUsedMB] = useState<number>(0);
  const quotaFromEnv = Number((import.meta as any).env?.VITE_STORAGE_QUOTA_MB);
  const storageQuotaMB = Number.isFinite(quotaFromEnv) && quotaFromEnv > 0 ? quotaFromEnv : 1024; // default 1GB

  useEffect(() => {
    let active = true;
    const loadStorage = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        if (!user) return;
        // Prefer filtering by owner (Supabase sets owner to uploader's id). Fallback to path prefix.
        let usedBytes = 0;
        const { data: byOwner, error: ownerErr } = await supabase
          .from('storage.objects')
          .select('size, bucket_id, owner')
          .in('bucket_id', ['avatars', 'post_images'])
          .eq('owner', user.id);
        if (!ownerErr && byOwner && byOwner.length > 0) {
          usedBytes = byOwner.reduce((sum: number, o: any) => sum + (o?.size || 0), 0);
        } else {
          const { data: byName, error: nameErr } = await supabase
            .from('storage.objects')
            .select('size, name, bucket_id')
            .in('bucket_id', ['avatars', 'post_images'])
            .like('name', `${user.id}/%`);
          if (nameErr) throw nameErr;
          usedBytes = (byName || []).reduce((sum: number, o: any) => sum + (o?.size || 0), 0);
        }
        const quotaBytes = storageQuotaMB * 1024 * 1024;
        const percent = Math.min(100, Math.round((usedBytes / quotaBytes) * 100));
        if (!active) return;
        setStoragePercent(percent);
        setStorageUsedMB(Math.round(usedBytes / (1024 * 1024)));
      } catch {
        // leave default UI if storage query fails
      }
    };
    loadStorage();
    return () => { active = false; };
  }, [storageQuotaMB]);
  return (
    <div className={cn(
      "fixed left-0 top-0 h-screen bg-gradient-card border-r border-border transition-all duration-300 z-50",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed ? (
          <div className="flex items-center space-x-2">
            <img src="/gangalogo.png" alt="GangaGames" className="h-8 w-auto" />
          </div>
        ) : (
          <img src="/gangalogo.png" alt="GangaGames" className="h-6 w-auto" />
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="text-muted-foreground hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start transition-colors duration-200",
                collapsed ? "px-2" : "px-4",
                isActive && "bg-primary/10 text-primary hover:bg-primary/20"
              )}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon className={cn("w-5 h-5", !collapsed && "mr-3")} />
              {!collapsed && <span>{item.label}</span>}
            </Button>
          );
        })}
      </nav>

      {/* Quick Stats (when expanded) */}
      {!collapsed && (
        <div className="absolute bottom-4 left-4 right-4 space-y-3">
          <div className="bg-muted/20 rounded-lg p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Storage</span>
              <span>{storagePercent != null ? `${storagePercent}%` : '—'}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div 
                className="bg-gradient-primary h-1.5 rounded-full" 
                style={{ width: `${storagePercent != null ? storagePercent : 0}%` }}
              ></div>
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">
              {storagePercent != null 
                ? `${storageUsedMB} MB used • ${Math.max(0, storageQuotaMB - storageUsedMB)} MB left`
                : 'Sign in to view storage usage'}
            </div>
          </div>
          <div className="text-xs text-muted-foreground text-center">
            v2.1.0 - All systems operational
          </div>
        </div>
      )}
    </div>
  );
}