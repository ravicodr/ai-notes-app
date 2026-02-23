"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Loader2, Tag, FileText, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AIButton } from "@/components/AIButton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  tags: string[];
}

interface NoteEditorProps {
  note?: Note;
  isNew?: boolean;
}

export function NoteEditor({ note, isNew = false }: NoteEditorProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [summary, setSummary] = useState(note?.summary || "");
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (note) {
      setHasChanges(title !== note.title || content !== note.content);
    } else {
      setHasChanges(title.trim().length > 0 || content.trim().length > 0);
    }
  }, [title, content, note]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Validation error",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      let res: Response;

      if (isNew) {
        res = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title.trim(), content: content.trim() }),
        });
      } else {
        res = await fetch(`/api/notes/${note!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
          }),
        });
      }

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Save failed");

      toast({ title: isNew ? "Note created!" : "Note saved!" });
      setHasChanges(false);

      if (isNew) {
        router.push(`/notes/${data.note.id}`);
      } else {
        router.refresh();
      }
    } catch (err: any) {
      toast({
        title: "Failed to save",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSummaryGenerated = (data: { summary: string }) => {
    setSummary(data.summary);
  };

  const handleContentImproved = (data: { content: string }) => {
    setContent(data.content);
    setHasChanges(true);
    toast({ title: "Content improved — remember to save!" });
  };

  const handleTagsGenerated = (data: { tags: string[] }) => {
    setTags(data.tags);
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/notes")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center gap-2 flex-wrap">
          {!isNew && note && (
            <>
              <AIButton
                noteId={note.id}
                action="summary"
                onSuccess={handleSummaryGenerated}
                disabled={content.length < 50}
              />
              <AIButton
                noteId={note.id}
                action="improve"
                onSuccess={handleContentImproved}
                disabled={!content.trim()}
              />
              <AIButton
                noteId={note.id}
                action="tags"
                onSuccess={handleTagsGenerated}
                disabled={!content.trim()}
              />
            </>
          )}

          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            size="sm"
            className="gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isNew ? "Create Note" : "Save"}
          </Button>
        </div>
      </div>

      {/* Title */}
      <Input
        placeholder="Note title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="text-xl font-semibold h-12 border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
      />

      {/* AI Notice for new notes */}
      {isNew && (
        <p className="text-xs text-muted-foreground">
          💡 Create the note first, then use AI features (Summary, Improve,
          Tags) to enhance it.
        </p>
      )}

      {/* Content */}
      <Textarea
        placeholder="Write your note here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1 min-h-[300px] resize-none border-0 rounded-none px-0 focus-visible:ring-0 text-base leading-relaxed"
      />

      {/* Word count */}
      <p className="text-xs text-muted-foreground text-right">
        {wordCount} words
      </p>

      {/* AI Results Section */}
      {(summary || tags.length > 0) && (
        <>
          <Separator />
          <div className="flex flex-col gap-4 pb-4">
            {summary && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-violet-500" />
                  <span className="text-sm font-semibold">AI Summary</span>
                </div>
                <p className="text-sm text-muted-foreground bg-muted rounded-md p-3 leading-relaxed">
                  {summary}
                </p>
              </div>
            )}

            {tags.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-violet-500" />
                  <span className="text-sm font-semibold">AI Tags</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
