import { Bell, Search, User, LogOut, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getPublicSiteUrl } from "@/lib/siteConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

export function DashboardHeader() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [profile, setProfile] = useState<{
    name?: string;
    email?: string;
    userType?: string;
    phone?: string;
    country?: string;
    signupDate?: string;
    passwordLength?: number;
  } | null>(null);
  const [notifications, setNotifications] = useState<Array<{ id: number; title: string; comments: number; date: string }>>([]);

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return;
      // try to load from profiles table
      try {
        const { data: prof } = await supabase.from('profiles').select('name, user_type, phone, country, signup_date, password_length').eq('id', user.id).single();
        setProfile({
          name: prof?.name || user.email || '',
          email: user.email || '',
          userType: prof?.user_type || 'author',
          phone: prof?.phone || '',
          country: prof?.country || '',
          signupDate: prof?.signup_date || new Date(user.created_at || Date.now()).toISOString().split('T')[0],
          passwordLength: prof?.password_length || undefined,
        });
      } catch {
        const meta = user.user_metadata || {};
        setProfile({
          name: meta.name || user.email || '',
          email: user.email || meta.email || '',
          userType: meta.userType || meta.accountType || 'author',
          phone: meta.phone || '',
          country: meta.country || '',
          signupDate: new Date(user.created_at || Date.now()).toISOString().split('T')[0],
        });
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadCommentsPosts = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        let query = supabase
          .from('posts')
          .select('id, title, comments, created_at, author_id')
          .gt('comments', 0)
          .order('comments', { ascending: false })
          .limit(10);
        if (user) query = query.eq('author_id', user.id);
        const { data, error } = await query;
        if (!error && data) {
          const mapped = (data || []).map((p: any) => ({
            id: p.id,
            title: p.title,
            comments: Number(p.comments || 0),
            date: (p.created_at || '').slice(0, 10),
          }));
          setNotifications(mapped);
        }
      } catch {}
    };
    loadCommentsPosts();
    const channel = supabase
      .channel('realtime:posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => loadCommentsPosts())
      .subscribe();
    return () => { try { supabase.removeChannel(channel); } catch {} };
  }, []);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    try {
      localStorage.removeItem("gg_user_session");
    } catch {}
    try {
      const target = getPublicSiteUrl();
      // Hard redirect to main homepage
      window.location.href = target;
    } catch {
      window.location.href = "/";
    }
  };

  return (
    <header className="bg-card/50 backdrop-blur-sm border-b border-border sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Search */}
        <div className="flex items-center space-x-4 flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search posts, users, analytics..."
              value={searchTerm}
              onChange={(e) => {
                const val = e.target.value;
                setSearchTerm(val);
                try {
                  const evt = new CustomEvent('dashboard:search', { detail: val });
                  window.dispatchEvent(evt);
                } catch {}
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  try {
                    const navEvt = new CustomEvent('dashboard:navigate', { detail: 'content' });
                    window.dispatchEvent(navEvt);
                  } catch {}
                }
              }}
              className="pl-10 bg-muted/20 border-border"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 w-5 h-5 text-xs p-0 flex items-center justify-center"
                >
                  {notifications.length}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium">Recent Comments</p>
                <p className="text-xs text-muted-foreground">Posts receiving engagement</p>
              </div>
              {notifications.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">No comments yet.</div>
              ) : notifications.map((n) => (
                <DropdownMenuItem key={n.id} className="flex items-start space-x-2" onClick={() => {
                  try {
                    window.dispatchEvent(new CustomEvent('dashboard:navigate', { detail: 'content' }));
                    window.dispatchEvent(new CustomEvent('dashboard:search', { detail: n.title }));
                  } catch {}
                }}>
                  <div className="mt-0.5">
                    <MessageSquare className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium line-clamp-1">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.comments} comments • {n.date}</p>
                  </div>
                </DropdownMenuItem>
              ))}
              <div className="px-3 py-2 border-t border-border">
                <Button variant="ghost" className="w-full justify-start" onClick={() => {
                  try {
                    window.dispatchEvent(new CustomEvent('dashboard:navigate', { detail: 'content' }));
                  } catch {}
                }}>View all posts</Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 px-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/api/placeholder/32/32" alt="Admin" />
                  <AvatarFallback>{(profile?.name || 'User').slice(0,2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-medium">{profile?.name || 'Admin User'}</p>
                  <p className="text-xs text-muted-foreground">{profile?.userType ? (profile?.userType === 'admin' ? 'Admin' : 'Author') : 'Super Admin'}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="p-0 overflow-hidden">
          <div className="bg-gradient-primary p-6 text-white">
            <div className="flex items-center space-x-4">
              <Avatar className="w-14 h-14 ring-2 ring-white/50">
                <AvatarImage src="/api/placeholder/56/56" alt="Profile" />
                <AvatarFallback className="bg-white/20 text-white">{(profile?.name || "User").slice(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">{profile?.name || "Not set"}</h3>
                <p className="text-sm opacity-90">{profile?.email || "No email"}</p>
                <p className="text-xs opacity-80">{profile?.userType ? (profile.userType.charAt(0).toUpperCase() + profile.userType.slice(1)) : "—"}</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <p className="text-muted-foreground">Account Type</p>
                <p className="font-medium">{profile?.userType ? profile.userType.charAt(0).toUpperCase() + profile.userType.slice(1) : "—"}</p>
              </Card>
              <Card className="p-4">
                <p className="text-muted-foreground">Password Strength</p>
                <p className="font-medium">{profile?.passwordLength ? "•".repeat(Math.min(profile.passwordLength, 24)) : "—"}</p>
              </Card>
              <Card className="p-4">
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium">{profile?.phone || "—"}</p>
              </Card>
              <Card className="p-4">
                <p className="text-muted-foreground">Country</p>
                <p className="font-medium">{profile?.country || "—"}</p>
              </Card>
              <Card className="p-4 md:col-span-2">
                <p className="text-muted-foreground">Signed Up</p>
                <p className="font-medium">{profile?.signupDate || "—"}</p>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}