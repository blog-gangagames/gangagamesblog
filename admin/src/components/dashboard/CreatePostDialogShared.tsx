import React, { useEffect, useRef, useState } from "react";
import { 
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
  Image as ImageIcon,
  FileText
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MAIN_CATEGORIES, CATEGORY_TREE } from "@/lib/categories";

export type NewPostPayload = {
  title: string;
  mainCategory: string;
  subcategory: string;
  tags: string[];
  featuredImage: string | null;
  contentHtml: string;
  status: 'draft' | 'published' | 'scheduled';
  publishAt?: string | null;
};

export function CreatePostDialogShared({
  open,
  onOpenChange,
  onSubmit,
  mode = 'create',
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: NewPostPayload) => void;
  mode?: 'create' | 'edit';
  initial?: Partial<NewPostPayload> & { contentHtml?: string };
}) {
  const [title, setTitle] = useState("");
  const [mainCategory, setMainCategory] = useState<string>(MAIN_CATEGORIES[0]);
  const [subcategory, setSubcategory] = useState<string>(CATEGORY_TREE[MAIN_CATEGORIES[0]][0]);
  const [tags, setTags] = useState("");
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled'>('draft');
  const [publishAt, setPublishAt] = useState<string>('');
  const editorRef = useRef<HTMLDivElement | null>(null);
  const lastRangeRef = useRef<Range | null>(null);
  const [seoStats, setSeoStats] = useState<{ words: number; h1: boolean; h2s: number; links: number }>({ words: 0, h1: false, h2s: 0, links: 0 });
  const [currentBlockTag, setCurrentBlockTag] = useState<'p' | 'h1' | 'h2' | 'h3' | 'blockquote' | 'pre' | 'ul' | 'ol' | 'div'>('p');
  const [isUnorderedList, setIsUnorderedList] = useState(false);
  const [isOrderedList, setIsOrderedList] = useState(false);

  useEffect(() => {
    try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch {}
    const handleSelectionChange = () => {
      const editor = editorRef.current;
      const sel = window.getSelection();
      if (!editor || !sel || sel.rangeCount === 0) return;
      // Save selection for reliable formatting
      if (editor.contains(sel.anchorNode as Node)) {
        const range = sel.getRangeAt(0);
        lastRangeRef.current = range.cloneRange();
      }
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
      const text = editor.innerText || '';
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      const html = editor.innerHTML || '';
      const h1 = /<h1\b/i.test(html);
      const h2s = (html.match(/<h2\b/gi) || []).length;
      const links = (html.match(/<a\b/gi) || []).length;
      setSeoStats({ words, h1, h2s, links });
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  useEffect(() => {
    if (open && mode === 'edit' && initial) {
      const safeMain = initial.mainCategory || MAIN_CATEGORIES[0];
      const safeSub = initial.subcategory || (CATEGORY_TREE[safeMain]?.[0] ?? CATEGORY_TREE[MAIN_CATEGORIES[0]][0]);
      setTitle(initial.title ?? "");
      setMainCategory(safeMain);
      setSubcategory(safeSub);
      setTags((initial.tags ?? []).join(", "));
      setFeaturedImage(initial.featuredImage ?? null);
      setStatus((initial as any).status ?? 'draft');
      setPublishAt(((initial as any).publishAt as string) ?? '');
      if (editorRef.current) editorRef.current.innerHTML = initial.contentHtml ?? "";
    }
  }, [open, mode, initial]);

  // Ensure editor content loads reliably after mount when editing existing posts
  useEffect(() => {
    if (!open || mode !== 'edit') return;
    const html = (initial && initial.contentHtml) ? initial.contentHtml : "";
    const apply = () => {
      const editor = editorRef.current;
      if (!editor) return;
      if (html && editor.innerHTML !== html) {
        editor.innerHTML = html;
        updateSeoStats();
      }
    };
    // Apply immediately and again on next tick/frame to catch mount timing
    apply();
    const t = setTimeout(apply, 0);
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(apply);
    }
    return () => { clearTimeout(t); };
  }, [open, mode, initial?.contentHtml]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFeaturedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const restoreSelection = () => {
    const editor = editorRef.current;
    const sel = window.getSelection();
    const range = lastRangeRef.current;
    if (!editor || !sel || !range) return;
    if (!editor.contains(range.startContainer)) return;
    try {
      sel.removeAllRanges();
      sel.addRange(range);
    } catch {}
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

  const applyFormat = (cmd: string, value?: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const isHistoryCmd = cmd === 'undo' || cmd === 'redo';
    if (!isHistoryCmd) {
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
    }
    document.execCommand(cmd, false, value ?? undefined);
    updateSeoStats();
  };

  const formatBlockRobust = (tag: string) => {
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
    if (block.tagName.toLowerCase() === tag) return;
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
    formatBlockRobust(`h${level}`);
    setBlockTag((`h${level}`) as 'h1' | 'h2' | 'h3');
  };

  const applyParagraph = () => {
    formatBlockRobust('p');
    setBlockTag('p');
  };

  const applyBlockquote = () => {
    restoreSelection();
    const block = getCurrentBlock();
    const isBlockquote = !!(block && block.tagName.toLowerCase() === 'blockquote');
    formatBlockRobust(isBlockquote ? 'p' : 'blockquote');
    setBlockTag(isBlockquote ? 'p' : 'blockquote');
  };

  const applyCodeBlock = () => {
    restoreSelection();
    const block = getCurrentBlock();
    const isPre = !!(block && block.tagName.toLowerCase() === 'pre');
    formatBlockRobust(isPre ? 'p' : 'pre');
    setBlockTag(isPre ? 'p' : 'pre');
  };

  const clearFormatting = () => {
    restoreSelection();
    applyFormat('removeFormat');
    applyFormat('unlink');
    const block = getCurrentBlock();
    if (block && /^(H1|H2|H3|H4|H5|H6|BLOCKQUOTE|PRE)$/i.test(block.tagName)) {
      const html = block.innerHTML;
      const sel = window.getSelection();
      if (sel) {
        const range = document.createRange();
        range.selectNode(block);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      document.execCommand('insertHTML', false, `<p>${html}</p>`);
    } else {
      formatBlockRobust('p');
    }
    updateSeoStats();
  };

  const insertLink = () => {
    const raw = window.prompt('Enter URL');
    if (!raw) return;
    const url = raw.trim();
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      document.execCommand('insertHTML', false, `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
      updateSeoStats();
      return;
    }
    const hadSelection = !sel.isCollapsed && sel.toString().length > 0;
    if (hadSelection) {
      applyFormat('createLink', url);
      const node = sel.anchorNode as Node | null;
      const el = node && node.nodeType === Node.TEXT_NODE ? (node.parentNode as HTMLElement) : (node as HTMLElement);
      const anchor = el && el.closest && el.closest('a');
      if (anchor) {
        try {
          (anchor as HTMLAnchorElement).target = '_blank';
          (anchor as HTMLAnchorElement).rel = 'noopener noreferrer';
        } catch {}
      } else {
        const text = sel.toString();
        document.execCommand('insertHTML', false, `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`);
      }
    } else {
      document.execCommand('insertHTML', false, `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
    }
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

  const handleSubmit = () => {
    const contentHtml = editorRef.current?.innerHTML || "";
    onSubmit({
      title,
      mainCategory,
      subcategory,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      featuredImage,
      contentHtml,
      status,
      publishAt: status === 'scheduled' ? (publishAt || null) : (status === 'published' ? new Date().toISOString() : null),
    });
    onOpenChange(false);
    // reset
    setTitle("");
    setMainCategory(MAIN_CATEGORIES[0]);
    setSubcategory(CATEGORY_TREE[MAIN_CATEGORIES[0]][0]);
    setTags("");
    setFeaturedImage(null);
    setStatus('draft');
    setPublishAt('');
    if (editorRef.current) editorRef.current.innerHTML = "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-2xl md:max-w-4xl p-0 max-h-[85vh] overflow-y-auto overflow-x-hidden">
        <div className="bg-gradient-to-r from-primary to-[#357abd] px-6 py-5 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">{mode === 'edit' ? 'Edit Post' : 'Create New Post'}</DialogTitle>
            <DialogDescription className="opacity-90 text-white">{mode === 'edit' ? 'Update your article content and metadata.' : 'Craft your article with title, content, images and metadata.'}</DialogDescription>
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
              onPaste={(e) => {
                e.preventDefault();
                const html = e.clipboardData.getData('text/html');
                const text = e.clipboardData.getData('text/plain');
                const sanitize = (raw: string) => {
                  let h = raw;
                  h = h.replace(/<div([^>]*)>/gi, '<p$1>');
                  h = h.replace(/<\/div>/gi, '</p>');
                  h = h.replace(/<span[^>]*>/gi, '');
                  h = h.replace(/<\/span>/gi, '');
                  h = h.replace(/<font[^>]*>/gi, '');
                  h = h.replace(/<\/font>/gi, '');
                  h = h.replace(/\sstyle="[^"]*"/gi, '');
                  h = h.replace(/\sclass="[^"]*"/gi, '');
                  h = h.replace(/<a([^>]*)>/gi, (m) => {
                    let tag = m;
                    if (!/\btarget=/i.test(tag)) tag = tag.replace('<a', '<a target="_blank"');
                    if (!/\brel=/i.test(tag)) tag = tag.replace('<a', '<a rel="noopener noreferrer"');
                    return tag;
                  });
                  return h;
                };
                const content = html && html.trim().length > 0
                  ? sanitize(html)
                  : (text || '').replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br/>');
                document.execCommand('insertHTML', false, content);
                updateSeoStats();
              }}
              onInput={() => {
                const editor = editorRef.current;
                if (!editor) return;
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) {
                  lastRangeRef.current = sel.getRangeAt(0).cloneRange();
                }
                updateSeoStats();
              }}
              onKeyUp={() => { updateSeoStats(); }}
              onMouseUp={() => { updateSeoStats(); }}
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
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-gradient-primary" onClick={handleSubmit}>{mode === 'edit' ? 'Update' : 'Publish'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CreatePostDialogShared;