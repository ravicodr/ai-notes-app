"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, FileText, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatDate, truncate } from "@/lib/utils";

interface Note {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
}

export function NoteCard({ note, onDelete }: NoteCardProps) {
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(true);

    try {
      const res = await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      onDelete(note.id);
      toast({ title: "Note deleted" });
    } catch {
      toast({
        title: "Failed to delete note",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const preview = note.summary
    ? note.summary
    : truncate(note.content, 120);

  return (
    <Link href={`/notes/${note.id}`}>
      <Card className="h-full flex flex-col hover:shadow-md transition-shadow cursor-pointer group border-border">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-semibold line-clamp-2 flex-1">
              {note.title}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 pb-2">
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {preview}
          </p>
          {note.summary && (
            <div className="flex items-center gap-1 mt-2">
              <FileText className="h-3 w-3 text-violet-500" />
              <span className="text-xs text-violet-500 font-medium">
                AI Summary
              </span>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-2 flex flex-col items-start gap-2">
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {note.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
              {note.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  +{note.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {formatDate(note.updatedAt)}
          </p>
        </CardFooter>
      </Card>
    </Link>
  );
}
