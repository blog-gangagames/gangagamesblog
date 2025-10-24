import { useEffect, useState } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Calendar,
  Tag,
  Star,
  Clock,
  MoreHorizontal,
  FileText,
  Eye,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreatePostDialogShared, NewPostPayload } from "@/components/dashboard/CreatePostDialogShared";
import { supabase } from "@/lib/supabaseClient";

type PostItem = {
  id: string;
  title: string;
  category: string;
  author: string;
  status: string;
  views: string;
  comments: number;
  date: string;
  featured: boolean;
  tags: string[];
};

import { MAIN_CATEGORIES, CATEGORY_TREE } from "@/lib/categories";
const mainCategories = ["All", ...MAIN_CATEGORIES];
const subcategoriesFor = (main: string) => main === "All" ? ["All"] : CATEGORY_TREE[main] ?? ["All"];
const statuses = ["All", "Published", "Draft", "Scheduled"];

export function ContentManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMain, setSelectedMain] = useState<string>("All");
  const [selectedSub, setSelectedSub] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [items, setItems] = useState<PostItem[]>([]);
  const [editingPost, setEditingPost] = useState<PostItem | null>(null);
  const [editingOpen, setEditingOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editContentHtml, setEditContentHtml] = useState<string>("");
  const [editFeaturedImage, setEditFeaturedImage] = useState<string | null>(null);
  const [editMainCategory, setEditMainCategory] = useState<string>(MAIN_CATEGORIES[0]);
  const [editStatus, setEditStatus] = useState<'draft' | 'published' | 'scheduled'>("draft");
  const [editPublishAt, setEditPublishAt] = useState<string>("");
  const [creatingOpen, setCreatingOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelectAll = (checked: boolean) => {
    if (!checked) {
      setSelectedIds([]);
    } else {
      // Select all currently filtered posts
      setSelectedIds((prev) => {
        const ids = filteredPosts.map(p => p.id);
        return ids;
      });
    }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const set = new Set(prev);
      if (checked) set.add(id); else set.delete(id);
      return Array.from(set);
    });
  };

  useEffect(() => {
    const loadEdit = async () => {
      if (!editingPost) return;
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('title, main_category, subcategory, tags, content_html, image_url, status, published_at')
          .eq('id', editingPost.id)
          .single();
        if (error) throw error;
        setEditTitle(data?.title ?? editingPost.title ?? "");
        setEditMainCategory(data?.main_category ?? MAIN_CATEGORIES[0]);
        setEditCategory(data?.subcategory ?? editingPost.category ?? "");
        setEditTags(Array.isArray(data?.tags) ? data!.tags : []);
        setEditContentHtml(data?.content_html ?? "");
        setEditFeaturedImage(data?.image_url ?? null);
        setEditStatus(String(data?.status || editingPost.status || 'draft') as 'draft' | 'published' | 'scheduled');
        setEditPublishAt((data?.published_at as string) ?? "");
        setEditingOpen(true);
      } catch (e) {
        // Fallback to whatever we have locally
        setEditTitle(editingPost.title);
        setEditCategory(editingPost.category);
        setEditTags(editingPost.tags);
        setEditContentHtml("");
        setEditFeaturedImage(null);
        setEditMainCategory(MAIN_CATEGORIES.find(m => (CATEGORY_TREE[m] || []).includes(editingPost.category)) || MAIN_CATEGORIES[0]);
        setEditStatus(editingPost.status as 'draft' | 'published' | 'scheduled');
        setEditPublishAt("");
        setEditingOpen(true);
      }
    };
    loadEdit();
  }, [editingPost]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        let query = supabase
          .from('posts')
          .select('id, title, main_category, subcategory, tags, featured, status, views, comments, created_at, published_at, author_id')
          .order('published_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false });
        if (user) query = query.eq('author_id', user.id);
        const { data, error } = await query;
        if (error) throw error;
        const mapped = (data || []).map((p: any) => ({
          id: String(p.id),
          title: p.title,
          category: p.subcategory || p.main_category || 'General',
          author: 'You',
          status: String(p.status || 'draft'),
          views: String(p.views ?? 0),
          comments: Number(p.comments ?? 0),
          date: ((p.published_at || p.created_at) || new Date().toISOString()).slice(0,10),
          featured: !!p.featured,
          tags: Array.isArray(p.tags) ? p.tags : [],
        })) as PostItem[];
        setItems(mapped);
      } catch {}
    };
    load();
  }, []);

  // Listen to global dashboard search events (from header)
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<string>;
      const term = ce.detail;
      if (typeof term === 'string') setSearchTerm(term);
    };
    window.addEventListener('dashboard:search', handler as EventListener);
    return () => window.removeEventListener('dashboard:search', handler as EventListener);
  }, []);

  // DB-backed search and filtering
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        let query = supabase
          .from('posts')
          .select('id, title, main_category, subcategory, tags, featured, status, views, comments, created_at, published_at, author_id')
          .order('published_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false });
        if (user) query = query.eq('author_id', user.id);
        const term = searchTerm.trim();
        if (term.length > 0) {
          query = query.or(`title.ilike.%${term}%,content_html.ilike.%${term}%`);
        }
        if (selectedMain !== 'All') query = query.eq('main_category', selectedMain);
        if (selectedSub !== 'All') query = query.eq('subcategory', selectedSub);
        if (selectedStatus !== 'All') query = query.eq('status', selectedStatus.toLowerCase());
        const { data, error } = await query;
        if (error) throw error;
        if (cancelled) return;
        const mapped = (data || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          category: p.subcategory || p.main_category || 'General',
          author: 'You',
          status: String(p.status || 'draft'),
          views: String(p.views ?? 0),
          comments: Number(p.comments ?? 0),
          date: ((p.published_at || p.created_at) || new Date().toISOString()).slice(0,10),
          featured: !!p.featured,
          tags: Array.isArray(p.tags) ? p.tags : [],
        })) as PostItem[];
        setItems(mapped);
      } catch {}
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [searchTerm, selectedMain, selectedSub, selectedStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-success/20 text-success";
      case "draft":
        return "bg-warning/20 text-warning";
      case "scheduled":
        return "bg-info/20 text-info";
      default:
        return "bg-muted/20 text-muted-foreground";
    }
  };

  const filteredPosts = items.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMain = selectedMain === "All" || (CATEGORY_TREE[selectedMain] || []).includes(post.category);
    const matchesSub = selectedSub === "All" || post.category === selectedSub;
    const matchesStatus = selectedStatus === "All" || post.status === selectedStatus.toLowerCase();
    
    return matchesSearch && matchesMain && matchesSub && matchesStatus;
  });

  const allSelected = filteredPosts.length > 0 && selectedIds.length === filteredPosts.length;

  // Refresh posts from the database using current filters
  const refreshPosts = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      let query = supabase
        .from('posts')
        .select('id, title, main_category, subcategory, tags, featured, status, views, comments, created_at, published_at, author_id')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });
      if (user) query = query.eq('author_id', user.id);
      // Apply current filters
      const term = searchTerm.trim();
      if (term.length > 0) {
        query = query.or(`title.ilike.%${term}%,content_html.ilike.%${term}%`);
      }
      if (selectedMain !== 'All') query = query.eq('main_category', selectedMain);
      if (selectedSub !== 'All') query = query.eq('subcategory', selectedSub);
      if (selectedStatus !== 'All') query = query.eq('status', selectedStatus.toLowerCase());
      const { data, error } = await query;
      if (error) throw error;
      const mapped = (data || []).map((p: any) => ({
        id: String(p.id),
        title: p.title,
        category: p.subcategory || p.main_category || 'General',
        author: 'You',
        status: String(p.status || 'draft'),
        views: String(p.views ?? 0),
        comments: Number(p.comments ?? 0),
        date: ((p.published_at || p.created_at) || new Date().toISOString()).slice(0,10),
        featured: !!p.featured,
        tags: Array.isArray(p.tags) ? p.tags : [],
      })) as PostItem[];
      setItems(mapped);
    } catch {}
  };

  const runBulkAction = async (action: 'publish' | 'draft' | 'feature' | 'unfeature' | 'delete') => {
    if (selectedIds.length === 0) return;
    try {
      // Remove auth requirement; allow bulk actions without a Supabase session

      if (action === 'delete') {
        const { data, error } = await supabase
          .from('posts')
          .delete()
          .in('id', selectedIds)
          .select('id');
        if (error) throw error;
        const deletedIds = (data || []).map((r: any) => String(r.id));
        if (deletedIds.length === 0) {
          alert('No posts were deleted. You may not have permission to delete these posts.');
          return;
        }
        if (deletedIds.length < selectedIds.length) {
          alert(`Deleted ${deletedIds.length} of ${selectedIds.length} selected posts due to permissions.`);
        }
        setItems(prev => prev.filter(p => !deletedIds.includes(p.id)));
      } else if (action === 'feature') {
        const { data, error } = await supabase
          .from('posts')
          .update({ featured: true })
          .in('id', selectedIds)
          .select('id');
        if (error) throw error;
        const updatedIds = (data || []).map((r: any) => String(r.id));
        if (updatedIds.length === 0) { alert('No posts were updated. Check permissions.'); return; }
        if (updatedIds.length < selectedIds.length) { alert(`Updated ${updatedIds.length} of ${selectedIds.length} posts due to permissions.`); }
        setItems(prev => prev.map(p => updatedIds.includes(p.id) ? { ...p, featured: true } : p));
      } else if (action === 'unfeature') {
        const { data, error } = await supabase
          .from('posts')
          .update({ featured: false })
          .in('id', selectedIds)
          .select('id');
        if (error) throw error;
        const updatedIds = (data || []).map((r: any) => String(r.id));
        if (updatedIds.length === 0) { alert('No posts were updated. Check permissions.'); return; }
        if (updatedIds.length < selectedIds.length) { alert(`Updated ${updatedIds.length} of ${selectedIds.length} posts due to permissions.`); }
        setItems(prev => prev.map(p => updatedIds.includes(p.id) ? { ...p, featured: false } : p));
      } else if (action === 'publish') {
        const nowIso = new Date().toISOString();
        const { data, error } = await supabase
          .from('posts')
          .update({ status: 'published', published_at: nowIso })
          .in('id', selectedIds)
          .select('id');
        if (error) throw error;
        const updatedIds = (data || []).map((r: any) => String(r.id));
        if (updatedIds.length === 0) { alert('No posts were updated. Check permissions.'); return; }
        if (updatedIds.length < selectedIds.length) { alert(`Updated ${updatedIds.length} of ${selectedIds.length} posts due to permissions.`); }
        setItems(prev => prev.map(p => updatedIds.includes(p.id) ? { ...p, status: 'published', date: nowIso.slice(0,10) } : p));
      } else if (action === 'draft') {
        const { data, error } = await supabase
          .from('posts')
          .update({ status: 'draft', published_at: null })
          .in('id', selectedIds)
          .select('id');
        if (error) throw error;
        const updatedIds = (data || []).map((r: any) => String(r.id));
        if (updatedIds.length === 0) { alert('No posts were updated. Check permissions.'); return; }
        if (updatedIds.length < selectedIds.length) { alert(`Updated ${updatedIds.length} of ${selectedIds.length} posts due to permissions.`); }
        setItems(prev => prev.map(p => updatedIds.includes(p.id) ? { ...p, status: 'draft' } : p));
      }
      setSelectedIds([]);
      await refreshPosts();
    } catch (e: any) {
      alert('Bulk action failed: ' + (e?.message || e));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Content Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your blog posts, categories, and content strategy.
          </p>
        </div>
        <Button className="bg-gradient-primary shadow-primary" onClick={() => setCreatingOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Post
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts, authors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-muted/20 border-border"
                />
              </div>
            </div>
            <Select value={selectedMain} onValueChange={(val) => {
              setSelectedMain(val);
              setSelectedSub("All");
            }}>
              <SelectTrigger className="w-full md:w-[200px] bg-muted/20 border-border">
                <SelectValue placeholder="Main Category" />
              </SelectTrigger>
              <SelectContent>
                {mainCategories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedSub} onValueChange={setSelectedSub}>
              <SelectTrigger className="w-full md:w-[220px] bg-muted/20 border-border">
                <SelectValue placeholder="Subcategory" />
              </SelectTrigger>
              <SelectContent>
                {subcategoriesFor(selectedMain).map(sub => (
                  <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-[180px] bg-muted/20 border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Posts ({filteredPosts.length})</span>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => runBulkAction('publish')} disabled={selectedIds.length===0}>
                Publish Selected
              </Button>
              <Button variant="outline" size="sm" onClick={() => runBulkAction('draft')} disabled={selectedIds.length===0}>
                Move to Draft
              </Button>
              <Button variant="outline" size="sm" onClick={() => runBulkAction('feature')} disabled={selectedIds.length===0}>
                Feature
              </Button>
              <Button variant="outline" size="sm" onClick={() => runBulkAction('unfeature')} disabled={selectedIds.length===0}>
                Unfeature
              </Button>
              <Button variant="destructive" size="sm" onClick={() => runBulkAction('delete')} disabled={selectedIds.length===0}>
                Delete
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPosts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No posts yet. Click "Create New Post" to get started.
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(val) => toggleSelectAll(Boolean(val))}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Post</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.map((post) => (
                <TableRow key={post.id} className="hover:bg-muted/10">
                  <TableCell className="w-[40px]">
                    <Checkbox
                      checked={selectedIds.includes(post.id)}
                      onCheckedChange={(val) => toggleSelect(post.id, Boolean(val))}
                      aria-label={`Select ${post.title}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-muted/20 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-foreground line-clamp-1">
                            {post.title}
                          </h4>
                          {post.featured && (
                            <Star className="w-4 h-4 text-warning fill-current" />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {post.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {post.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{post.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{post.category}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {post.author}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(post.status)}>
                      {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Eye className="w-4 h-4 mr-1" />
                        {post.views}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        {post.comments}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(post.date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setCreatingOpen(false); setEditingPost(post); setEditingOpen(true); }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={async () => {
                          try {
                            const { error } = await supabase
                              .from('posts')
                              .update({ featured: !post.featured })
                              .eq('id', post.id);
                            if (error) throw error;
                            setItems(prev => prev.map(p => p.id === post.id ? { ...p, featured: !p.featured } : p));
                          } catch (e: any) {
                            alert('Failed to update featured status: ' + (e?.message || e));
                          }
                        }}>
                          <Star className="mr-2 h-4 w-4" />
                          {post.featured ? "Remove Featured" : "Make Featured"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={async () => {
                          try {
                            const { error } = await supabase
                              .from('posts')
                              .delete()
                              .eq('id', post.id);
                            if (error) throw error;
                            setItems(prev => prev.filter(p => p.id !== post.id));
                          } catch (e: any) {
                            alert('Failed to delete post: ' + (e?.message || e));
                          }
                        }}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    {/* Edit via Shared Create Dialog */}
    {editingOpen && editingPost && (
      <CreatePostDialogShared
        open={editingOpen}
        onOpenChange={(open) => { setEditingOpen(open); if (!open) setEditingPost(null); }}
        mode="edit"
        initial={{
          title: editTitle,
          mainCategory: editMainCategory,
          subcategory: editCategory,
          tags: editTags,
          featuredImage: editFeaturedImage,
          contentHtml: editContentHtml,
          status: editStatus,
          publishAt: editPublishAt
        }}
        onSubmit={async (payload: NewPostPayload) => {
          try {
            const { error } = await supabase
              .from('posts')
              .update({
                title: payload.title,
                main_category: payload.mainCategory,
                subcategory: payload.subcategory,
                tags: payload.tags,
                content_html: payload.contentHtml,
                image_url: payload.featuredImage,
                status: payload.status,
                published_at: payload.publishAt || null,
              })
              .eq('id', editingPost.id);
            if (error) throw error;
            setItems(prev => prev.map(p => p.id === editingPost.id ? {
              ...p,
              title: payload.title,
              category: payload.subcategory || payload.mainCategory,
              tags: payload.tags,
              status: payload.status,
              date: (payload.publishAt || p.date),
            } : p));
            setEditingPost(null);
            setEditingOpen(false);
          } catch (e: any) {
            alert('Failed to update post: ' + (e?.message || e));
          }
        }}
      />
    )}

    {/* Create Dialog (Shared) */}
  <CreatePostDialogShared
      open={creatingOpen}
      onOpenChange={setCreatingOpen}
      onSubmit={(payload: NewPostPayload) => {
        const create = async () => {
          try {
            // Remove auth requirement; allow publishing without a Supabase session
            const safeMain = payload.mainCategory || MAIN_CATEGORIES[0];
            const safeSub = payload.subcategory || (CATEGORY_TREE[safeMain]?.[0] ?? null);
            const insertPayload: any = {
              title: payload.title || 'Untitled',
              content_html: payload.contentHtml || '<p></p>',
              excerpt: '',
              main_category: safeMain,
              subcategory: safeSub,
              tags: payload.tags || [],
              featured: false,
              status: payload.status || 'draft',
              image_url: payload.featuredImage || null,
              // author_id intentionally omitted when unauthenticated
              published_at: payload.publishAt || null,
            };
            const { data, error } = await supabase
              .from('posts')
              .insert(insertPayload)
              .select('id, title, main_category, subcategory, status, views, comments, created_at, published_at, featured, tags')
              .single();
            if (error) throw error;
            const newItem: PostItem = {
              id: String(data.id),
              title: data.title,
              category: data.subcategory || data.main_category || 'General',
              author: 'You',
              status: String(data.status || 'published'),
              views: String(data.views ?? 0),
              comments: Number(data.comments ?? 0),
              date: ((data.published_at || data.created_at) || new Date().toISOString()).slice(0,10),
              featured: !!data.featured,
              tags: Array.isArray(data.tags) ? data.tags : [],
            };
            setItems(prev => [newItem, ...prev]);
          } catch (e: any) {
            alert('Failed to create post: ' + (e?.message || e));
          }
        };
        create();
      }}
    />

    </div>
  );
}