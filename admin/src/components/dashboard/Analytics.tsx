import { Eye, FileText, Star, ArrowUpRight, ArrowDownRight, Calendar, TrendingUp, Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type PostRow = {
  id: number;
  title: string;
  views: number | null;
  comments: number | null;
  status: string | null;
  author_id: string | null;
  created_at: string | null;
  subcategory?: string | null;
  featured?: boolean | null;
};

function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function Analytics() {
  const [range, setRange] = useState("30days");
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [customOpen, setCustomOpen] = useState(false);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const overview = useMemo(() => {
    const totalViews = posts.reduce((sum, p) => sum + (Number(p.views) || 0), 0);
    const published = posts.filter(p => String(p.status) === "published").length;
    const drafts = posts.filter(p => String(p.status) === "draft").length;
    const featured = posts.filter(p => !!p.featured).length;
    return [
      { title: "Total Views", value: formatCount(totalViews), change: "", trend: "up", icon: Eye, description: "Total views across your posts" },
      { title: "Published Posts", value: String(published), change: "", trend: "up", icon: FileText, description: "Posts currently published" },
      { title: "Drafts", value: String(drafts), change: "", trend: "up", icon: FileText, description: "Posts saved as drafts" },
      { title: "Featured Posts", value: String(featured), change: "", trend: "up", icon: Star, description: "Posts marked as featured" },
    ];
  }, [posts]);

  const topPosts = useMemo(() => {
    const sorted = [...posts].sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0));
    return sorted.slice(0, 5).map(p => ({
      title: p.title,
      views: formatCount(Number(p.views) || 0),
      comments: Number(p.comments) || 0,
      avgTime: "—",
    }));
  }, [posts]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    posts.forEach(p => {
      const cat = (p.subcategory || "General").toString();
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    const total = posts.length || 1;
    return Array.from(map.entries()).map(([source, count]) => ({
      source,
      percentage: Math.round((count / total) * 100),
      visits: `${count} posts`,
      color: "bg-primary",
    })).sort((a, b) => b.percentage - a.percentage);
  }, [posts]);

  const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      let query = supabase
        .from('posts')
        .select('id, title, views, comments, status, author_id, created_at, subcategory, featured, published_at')
        .order('created_at', { ascending: false });
      if (user) query = query.eq('author_id', user.id);
      // Apply range filter
      const now = new Date();
      let start: Date | null = null;
      if (range === '7days') start = new Date(now.getTime() - 7*24*60*60*1000);
      else if (range === '30days') start = new Date(now.getTime() - 30*24*60*60*1000);
      else if (range === '90days') start = new Date(now.getTime() - 90*24*60*60*1000);
      else if (range === '1year') start = new Date(now.getTime() - 365*24*60*60*1000);
      if (start) {
        query = query.gte('created_at', start.toISOString());
      }
      // Custom range
      if (fromDate && toDate) {
        try {
          const fromIso = new Date(fromDate).toISOString();
          const toIso = new Date(toDate).toISOString();
          query = query.gte('created_at', fromIso).lte('created_at', toIso);
        } catch {}
      }
      const { data, error } = await query;
      if (!error && data) setPosts(data as PostRow[]);
    };
  
  useEffect(() => {
    load();

    const channel = supabase
      .channel('realtime:posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => load())
      .subscribe();

    return () => { try { supabase.removeChannel(channel); } catch {} };
  }, [range, fromDate, toDate]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">Real-time metrics from your content.</p>
        </div>
        <div className="flex space-x-2">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[140px] bg-muted/20 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="1year">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setCustomOpen(true)}>
            <Calendar className="w-4 h-4 mr-2" />
            Custom Range
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overview.map((stat) => {
          const Icon = stat.icon as any;
          return (
            <Card key={stat.title} className="bg-gradient-card border-border hover:shadow-glow transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      {stat.trend === "up" ? (
                        <ArrowUpRight className="w-4 h-4 text-success mr-1" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-success mr-1" />
                      )}
                      <span className="text-sm text-success">{stat.change}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select custom range</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">From</p>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">To</p>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => { setFromDate(""); setToDate(""); setCustomOpen(false); }}>Clear</Button>
              <Button onClick={() => setCustomOpen(false)}>Apply</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle>Top Performing Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPosts.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No posts yet.</div>
              ) : topPosts.map((post, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-muted/10 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground text-sm">{post.title}</h4>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {post.views} views
                      </span>
                      <span className="flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {post.comments} comments
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {post.avgTime}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">#{index + 1}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryBreakdown.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No data yet.</div>
              ) : categoryBreakdown.map((source, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{source.source}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-foreground">{source.percentage}%</span>
                      <p className="text-xs text-muted-foreground">{source.visits}</p>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className={`h-2 rounded-full ${source.color}`} style={{ width: `${source.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}