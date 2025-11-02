import { 
  TrendingUp, 
  Users, 
  FileText, 
  Eye, 
  MessageSquare, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Star,
  Heading1,
  Heading2,
  Heading3,
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Strikethrough as StrikethroughIcon,
  List as ListIcon,
  ListOrdered as ListOrderedIcon,
  Quote as QuoteIcon,
  Link as LinkIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Code as CodeIcon,
  Image as ImageIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MAIN_CATEGORIES, CATEGORY_TREE } from "@/lib/categories";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabaseClient";

const defaultStats = [
  {
    title: "Total Views",
    value: "2.1M",
    change: "+12.5%",
    trend: "up",
    icon: Eye,
    color: "text-primary",
    gradient: "bg-gradient-primary",
    shadow: "shadow-primary"
  },
  {
    title: "Published Posts",
    value: "1,247",
    change: "+23",
    trend: "up",
    icon: FileText,
    color: "text-success",
    gradient: "bg-gradient-success",
    shadow: "shadow-success"
  },
  {
    title: "Active Posts",
    value: "892",
    change: "+15",
    trend: "up",
    icon: TrendingUp,
    color: "text-warning",
    gradient: "bg-gradient-warning",
    shadow: "shadow-warning"
  },
  {
    title: "Posts in Draft",
    value: "47",
    change: "+8",
    trend: "up",
    icon: FileText,
    color: "text-accent",
    gradient: "bg-gradient-accent",
    shadow: "shadow-accent"
  }
];

// No default recent posts; start empty to reflect real DB state
const defaultRecentPosts: Array<{title: string; views: string; comments: number; status: string; author: string; date: string}> = [];

const quickActions = [
  { label: "New Post", action: "content", icon: FileText },
  { label: "View Analytics", action: "analytics", icon: TrendingUp }
];

function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function timeAgo(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  const diffMs = Date.now() - d;
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `${mins} min${mins>1?'s':''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs>1?'s':''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days>1?'s':''} ago`;
}

export function DashboardOverview() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [mainCategory, setMainCategory] = useState<string>(MAIN_CATEGORIES[0]);
  const [subcategory, setSubcategory] = useState<string>(CATEGORY_TREE[MAIN_CATEGORIES[0]][0]);
  const [tags, setTags] = useState("");
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled'>('draft');
  const [publishAt, setPublishAt] = useState<string>('');
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [currentBlockTag, setCurrentBlockTag] = useState<'p' | 'h1' | 'h2' | 'h3' | 'blockquote' | 'pre' | 'ul' | 'ol' | 'div'>('p');
  const [isUnorderedList, setIsUnorderedList] = useState(false);
  const [isOrderedList, setIsOrderedList] = useState(false);
  const lastRangeRef = useRef<Range | null>(null);
  const [seoStats, setSeoStats] = useState<{ words: number; h1: boolean; h2s: number; links: number }>({ words: 0, h1: false, h2s: 0, links: 0 });
  const [stats, setStats] = useState(defaultStats.map(s => ({ ...s, value: "0", change: "", trend: s.trend })));
  const [recentPosts, setRecentPosts] = useState(defaultRecentPosts);

  useEffect(() => {
    try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch {}
    const handleSelectionChange = () => {
      const editor = editorRef.current;
      const sel = window.getSelection();
      if (!editor || !sel || sel.rangeCount === 0) return;
      // Save selection for reliable formatting
      saveSelection();
      const block = getCurrentBlock();
      if (!block) {
        setCurrentBlockTag('p');
        setIsUnorderedList(false);
        setIsOrderedList(false);
        return;
      }
      const tag = block.tagName.toLowerCase();
      const inUl = !!block.closest('ul');
      const inOl = !!block.closest('ol');
      setIsUnorderedList(inUl);
      setIsOrderedList(inOl);
      if (tag === 'li') {
        setCurrentBlockTag(inOl ? 'ol' : inUl ? 'ul' : 'p');
      } else if (/^h[1-6]$/.test(tag)) {
        setCurrentBlockTag(tag as 'h1' | 'h2' | 'h3');
      } else if (tag === 'blockquote' || tag === 'pre' || tag === 'p') {
        setCurrentBlockTag(tag as 'blockquote' | 'pre' | 'p');
      } else {
        setCurrentBlockTag('div');
      }
      // Update SEO metrics on selection changes
      updateSeoStats();
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        let query = supabase
          .from('posts')
          .select('title, views, comments, status, author_id, created_at, featured')
          .order('published_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .limit(10);
        if (user) query = query.eq('author_id', user.id);
        const { data, error } = await query;
        if (error) throw error;
        const posts = data || [];
        const totalViews = posts.reduce((sum, p: any) => sum + (Number(p.views) || 0), 0);
        const published = posts.filter((p: any) => String(p.status) === 'published').length;
        const drafts = posts.filter((p: any) => String(p.status) === 'draft').length;
        const active = published; // simplistic metric
        setStats([
          { ...defaultStats[0], value: formatCount(totalViews), change: '', trend: 'up' },
          { ...defaultStats[1], value: String(published), change: '', trend: 'up' },
          { ...defaultStats[2], value: String(active), change: '', trend: 'up' },
          { ...defaultStats[3], value: String(drafts), change: '', trend: 'up' },
        ]);
        const mapped = posts.slice(0, 5).map((p: any) => ({
          title: p.title,
          views: formatCount(Number(p.views) || 0),
          comments: Number(p.comments) || 0,
          status: p.featured ? 'featured' : String(p.status || 'draft'),
          author: 'You',
          date: timeAgo(p.created_at),
        }));
        setRecentPosts(mapped);
      } catch {}
    };
    load();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFeaturedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    const editor = editorRef.current;
    if (!sel || sel.rangeCount === 0 || !editor) return;
    const range = sel.getRangeAt(0);
    if (editor.contains(range.startContainer)) {
      lastRangeRef.current = range.cloneRange();
    }
  };

  const restoreSelection = () => {
    const editor = editorRef.current;
    const sel = window.getSelection();
    const range = lastRangeRef.current;
    if (!editor || !sel || !range) return;
    sel.removeAllRanges();
    sel.addRange(range);
  };

  const updateSeoStats = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const text = editor.innerText || '';
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const html = editor.innerHTML || '';
    const h1 = /<h1\b/i.test(html);
    const h2s = (html.match(/<h2\b/gi) || []).length;
    const links = (html.match(/<a\b/gi) || []).length;
    setSeoStats({ words, h1, h2s, links });
  };

  const sanitizeIncomingHtml = (raw: string) => {
    let html = raw;
    // Convert block-level divs to paragraphs
    html = html.replace(/<div([^>]*)>/gi, '<p$1>');
    html = html.replace(/<\/div>/gi, '</p>');
    // Unwrap spans and font tags
    html = html.replace(/<span[^>]*>/gi, '');
    html = html.replace(/<\/span>/gi, '');
    html = html.replace(/<font[^>]*>/gi, '');
    html = html.replace(/<\/font>/gi, '');
    // Strip inline styles and classes (removes background colors etc.)
    html = html.replace(/\sstyle="[^"]*"/gi, '');
    html = html.replace(/\sclass="[^"]*"/gi, '');
    // Ensure links open safely
    html = html.replace(/<a([^>]*)>/gi, (m) => {
      let tag = m;
      if (!/\btarget=/i.test(tag)) tag = tag.replace('<a', '<a target="_blank"');
      if (!/\brel=/i.test(tag)) tag = tag.replace('<a', '<a rel="noopener noreferrer"');
      return tag;
    });
    return html;
  };

  const applyFormat = (cmd: string, value?: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    // Restore last selection to keep formatting on user selection
    restoreSelection();
    const sel = window.getSelection();
    if (sel) {
      const needsSet = sel.rangeCount === 0 || (sel.anchorNode && !editor.contains(sel.anchorNode));
      if (needsSet) {
        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
    document.execCommand(cmd, false, value ?? undefined);
  };

  const formatBlockRobust = (tag: string) => {
    // Try multiple variants for broader browser support
    const variants = [
      tag.toLowerCase(),
      tag.toUpperCase(),
      `<${tag.toLowerCase()}>`,
      `<${tag.toUpperCase()}>`
    ];
    variants.forEach(v => applyFormat('formatBlock', v));
  };

  const getCurrentBlock = (): HTMLElement | null => {
    const sel = window.getSelection();
    const editor = editorRef.current;
    if (!sel || sel.rangeCount === 0 || !editor) return null;
    const range = sel.getRangeAt(0);
    let node: Node | null = range.startContainer;
    if (!node) return null;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
    let el = node as HTMLElement | null;
    while (el && el !== editor && !/^(P|H1|H2|H3|H4|H5|H6|BLOCKQUOTE|PRE|LI)$/i.test(el.tagName)) {
      el = el.parentElement as HTMLElement | null;
    }
    return el && el !== editor ? el : null;
  };

  const setBlockTag = (tag: 'p' | 'h1' | 'h2' | 'h3' | 'blockquote' | 'pre') => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const block = getCurrentBlock();
    if (!block || block === editor) {
      // If no block, create one and insert into editor
      const el = document.createElement(tag);
      el.innerHTML = sel.toString() || '';
      editor.appendChild(el);
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }
    if (block.tagName.toLowerCase() === tag) return; // already desired tag
    const replacement = document.createElement(tag);
    replacement.innerHTML = block.innerHTML;
    block.replaceWith(replacement);
    const range = document.createRange();
    range.selectNodeContents(replacement);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  };

  const applyHeading = (level: 1 | 2 | 3) => {
    restoreSelection();
    // Try execCommand variants, then fallback to manual block replacement
    formatBlockRobust(`h${level}`);
    setBlockTag((`h${level}`) as 'h1' | 'h2' | 'h3');
  };

  const applyParagraph = () => {
    restoreSelection();
    formatBlockRobust('p');
    setBlockTag('p');
  };

  const applyBlockquote = () => {
    restoreSelection();
    formatBlockRobust('blockquote');
    setBlockTag('blockquote');
  };

  const applyCodeBlock = () => {
    restoreSelection();
    formatBlockRobust('pre');
    setBlockTag('pre');
  };

  const clearFormatting = () => {
    // Remove inline styles and links
    applyFormat('removeFormat');
    applyFormat('unlink');
    // Normalize to paragraph
    formatBlockRobust('p');
    const block = getCurrentBlock();
    if (block && /^(H1|H2|H3|H4|H5|H6|BLOCKQUOTE|PRE)$/i.test(block.tagName)) {
      const p = document.createElement('p');
      p.innerHTML = block.innerHTML;
      block.replaceWith(p);
    }
  };

  const insertLink = () => {
    const url = window.prompt('Enter URL');
    if (!url) return;
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      // No selection, append link with URL text
      const a = document.createElement('a');
      a.href = url;
      a.textContent = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      editor.appendChild(a);
      return;
    }
    const range = sel.getRangeAt(0);
    const hadSelection = !sel.isCollapsed && sel.toString().length > 0;
    if (hadSelection) {
      // Try native execCommand first
      applyFormat('createLink', url);
      // If anchor not created, do manual replacement
      const anchorInSelection = () => {
        const node = sel.anchorNode as Node | null;
        const el = node && node.nodeType === Node.TEXT_NODE ? node.parentNode as HTMLElement : node as HTMLElement;
        return el && el.closest && el.closest('a');
      };
      if (!anchorInSelection()) {
        const text = sel.toString();
        const a = document.createElement('a');
        a.href = url;
        a.textContent = text;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        range.deleteContents();
        range.insertNode(a);
        range.setStartAfter(a);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    } else {
      // Collapsed caret: insert a link node with URL text at caret
      const a = document.createElement('a');
      a.href = url;
      a.textContent = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      range.insertNode(a);
      range.setStartAfter(a);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');
    const content = html && html.trim().length > 0
      ? sanitizeIncomingHtml(html)
      : (text || '').replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br/>');
    applyFormat('insertHTML', content);
    updateSeoStats();
  };

  const insertImageToEditor = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      applyFormat('insertImage', reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSubmit = async () => {
    const contentHtml = editorRef.current?.innerHTML || "";
    try {
      setIsPublishing(true);
      // Remove sign-in requirement; allow publishing without a Supabase session
      const safeMain = mainCategory || MAIN_CATEGORIES[0];
      const safeSub = subcategory || (CATEGORY_TREE[safeMain]?.[0] ?? null);
      const insertPayload: any = {
        title: title || 'Untitled',
        content_html: contentHtml,
        excerpt: '',
        main_category: safeMain,
        subcategory: safeSub,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        featured: false,
        status,
        published_at: status === 'scheduled' ? (publishAt || null) : (status === 'published' ? new Date().toISOString() : null),
        image_url: featuredImage || null,
        // author_id intentionally omitted when unauthenticated
      };
      const { error } = await supabase
        .from('posts')
        .insert(insertPayload)
        .select('id')
        .single();
      if (error) throw error;
      // reset on success
      setTitle("");
      setMainCategory(MAIN_CATEGORIES[0]);
      setSubcategory(CATEGORY_TREE[MAIN_CATEGORIES[0]][0]);
      setTags("");
      setFeaturedImage(null);
      setStatus('draft');
      setPublishAt('');
      if (editorRef.current) editorRef.current.innerHTML = "";
      setOpen(false);
    } catch (e: any) {
      alert('Failed to publish: ' + (e?.message || e));
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening with your sports blog.
          </p>
        </div>
        <Button className="bg-gradient-primary shadow-primary" onClick={() => setOpen(true)}>
          <FileText className="w-4 h-4 mr-2" />
          Create New Post
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl md:max-w-4xl p-0 max-h-[85vh] overflow-y-auto overflow-x-hidden">
          <div className="bg-gradient-to-r from-primary to-[#357abd] px-6 py-5 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl text-white">Create New Post</DialogTitle>
              <DialogDescription className="opacity-90 text-white">Craft your article with title, content, images and metadata.</DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="post-title">Title</Label>
              <Input id="post-title" placeholder="Enter post title (catchy and descriptive)" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-muted/20 border-border" />
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Main Category</Label>
                <Select value={mainCategory} onValueChange={(val) => {
                  setMainCategory(val);
                  const firstSub = CATEGORY_TREE[val]?.[0];
                  if (firstSub) setSubcategory(firstSub);
                }}>
                  <SelectTrigger className="bg-muted/20 border-border">
                    <SelectValue placeholder="Select main category" />
                  </SelectTrigger>
                  <SelectContent>
                    {MAIN_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subcategory</Label>
                  <Select value={subcategory} onValueChange={setSubcategory}>
                    <SelectTrigger className="bg-muted/20 border-border">
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {(CATEGORY_TREE[mainCategory] || []).map((sc) => (
                        <SelectItem key={sc} value={sc}>{sc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(val) => setStatus(val as 'draft' | 'published' | 'scheduled')}>
                    <SelectTrigger className="bg-muted/20 border-border">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {status === 'scheduled' && (
                <div className="space-y-2">
                  <Label>Schedule publish time</Label>
                  <Input type="datetime-local" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} className="bg-muted/20 border-border" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" placeholder="e.g. betting, guide (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} className="bg-muted/20 border-border" />
            </div>
          </div>

            <div className="space-y-2">
              <Label>Featured Image</Label>
              <div className="rounded-lg border border-dashed border-border bg-muted/10 p-4 flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">Upload a high-resolution cover image (1200x630 recommended)</div>
                <div className="flex items-center gap-3">
                  <Input type="file" accept="image/*" onChange={handleImageUpload} className="max-w-xs" />
                  {featuredImage && (
                    <img src={featuredImage} alt="Preview" className="h-12 w-auto rounded shadow" />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                <Button type="button" size="icon" variant={currentBlockTag==='h1' ? 'default' : 'outline'} onClick={() => applyHeading(1)} title="Heading 1"><Heading1 className="w-4 h-4" /></Button>
                <Button type="button" size="icon" variant={currentBlockTag==='h2' ? 'default' : 'outline'} onClick={() => applyHeading(2)} title="Heading 2"><Heading2 className="w-4 h-4" /></Button>
                <Button type="button" size="icon" variant={currentBlockTag==='h3' ? 'default' : 'outline'} onClick={() => applyHeading(3)} title="Heading 3"><Heading3 className="w-4 h-4" /></Button>
                <Button type="button" size="icon" variant={currentBlockTag==='p' ? 'default' : 'outline'} onClick={applyParagraph} title="Paragraph">P</Button>
                <Button type="button" size="icon" variant="outline" onClick={() => applyFormat('bold')} title="Bold"><BoldIcon className="w-4 h-4" /></Button>
                <Button type="button" size="icon" variant="outline" onClick={() => applyFormat('italic')} title="Italic"><ItalicIcon className="w-4 h-4" /></Button>
                <Button type="button" size="icon" variant="outline" onClick={() => applyFormat('underline')} title="Underline"><UnderlineIcon className="w-4 h-4" /></Button>
                <Button type="button" size="icon" variant="outline" onClick={() => applyFormat('strikeThrough')} title="Strikethrough"><StrikethroughIcon className="w-4 h-4" /></Button>
                <Button type="button" size="icon" variant={isUnorderedList ? 'default' : 'outline'} onClick={() => {
                  applyFormat('insertUnorderedList');
                  // Ensure list items are paragraphs for consistency
                  applyParagraph();
                }} title="Bulleted list"><ListIcon className="w-4 h-4" /></Button>
                <Button type="button" size="icon" variant={isOrderedList ? 'default' : 'outline'} onClick={() => {
                  applyFormat('insertOrderedList');
                  applyParagraph();
                }} title="Numbered list"><ListOrderedIcon className="w-4 h-4" /></Button>
                <Button type="button" size="icon" variant="outline" onClick={applyBlockquote} title="Blockquote"><QuoteIcon className="w-4 h-4" /></Button>
                <Button type="button" size="icon" variant="outline" onClick={applyCodeBlock} title="Code block"><CodeIcon className="w-4 h-4" /></Button>
                <Button type="button" size="icon" variant="outline" onClick={insertLink} title="Insert link"><LinkIcon className="w-4 h-4" /></Button>
                <Button type="button" size="icon" variant="outline" onClick={() => applyFormat('undo')} title="Undo"><UndoIcon className="w-4 h-4" /></Button>
                <Button type="button" size="icon" variant="outline" onClick={() => applyFormat('redo')} title="Redo"><RedoIcon className="w-4 h-4" /></Button>
                <Button type="button" size="icon" variant="outline" onClick={clearFormatting} title="Clear formatting">CLR</Button>
                <label className="inline-flex items-center">
                  <span className="sr-only">Insert image</span>
                  <Input type="file" accept="image/*" onChange={insertImageToEditor} className="hidden" />
                  <Button type="button" size="icon" variant="outline" asChild title="Insert image">
                    <span><ImageIcon className="w-4 h-4" /></span>
                  </Button>
                </label>
              </div>
              <div
                ref={editorRef}
                className="content-editor min-h-[260px] max-h-[50vh] w-full max-w-full overflow-auto overflow-x-hidden whitespace-pre-wrap break-words rounded-md border border-border bg-background p-4 focus:outline-none focus:ring-2 focus:ring-primary/30 prose prose-invert"
                style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                contentEditable
                suppressContentEditableWarning
                aria-busy={isPublishing}
                aria-disabled={isPublishing}
                onPaste={handlePaste}
                onInput={() => { saveSelection(); updateSeoStats(); }}
                onKeyUp={() => { saveSelection(); updateSeoStats(); }}
                onMouseUp={() => { saveSelection(); updateSeoStats(); }}
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">Tip: Use the toolbar to format content. You can paste images too.</p>
                <div className="text-xs text-muted-foreground flex gap-3">
                  <span>Words: {seoStats.words}</span>
                  <span>H1: {seoStats.h1 ? 'Yes' : 'No'}</span>
                  <span>H2s: {seoStats.h2s}</span>
                  <span>Links: {seoStats.links}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPublishing}>Cancel</Button>
            <Button className="bg-gradient-primary" onClick={handleSubmit} disabled={isPublishing}>{isPublishing ? 'Publishing…' : 'Publish'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
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
                        <ArrowDownRight className="w-4 h-4 text-destructive mr-1" />
                      )}
                      <span className={`text-sm ${stat.trend === "up" ? "text-success" : "text-destructive"}`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.gradient} ${stat.shadow}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Posts */}
        <Card className="lg:col-span-2 bg-gradient-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Posts
              <Button variant="ghost" size="sm" onClick={() => {
                window.dispatchEvent(new CustomEvent('dashboard:navigate', { detail: 'content' }));
              }}>View All</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentPosts.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No recent posts yet.</div>
            ) : (
            <div className="space-y-4">
              {recentPosts.map((post, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-4 bg-muted/10 rounded-lg hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('dashboard:navigate', { detail: 'content' }));
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-foreground">{post.title}</h4>
                      {post.status === "featured" && (
                        <Badge variant="secondary" className="bg-gradient-success">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {post.views}
                      </span>
                      <span className="flex items-center">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        {post.comments}
                      </span>
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {post.author}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 mr-1" />
                      {post.date}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.label}
                    variant="ghost"
                    className="w-full justify-start hover:bg-muted/20"
                    onClick={() => {
                      if (action.action === 'content') {
                        setOpen(true);
                      } else if (action.action === 'analytics') {
                        window.dispatchEvent(new CustomEvent('dashboard:navigate', { detail: 'analytics' }));
                      }
                    }}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {action.label}
                  </Button>
                );
              })}
            </div>
            
            <div className="mt-6 p-4 bg-primary/10 rounded-lg">
              <h4 className="font-medium text-primary mb-2">Performance Tip</h4>
              <p className="text-sm text-muted-foreground">
                Your top performing posts get 3x more engagement when published on Sundays between 2-4 PM.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
