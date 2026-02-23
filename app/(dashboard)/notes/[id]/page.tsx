"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { Loader2 } from "lucide-react";
import { NoteEditor } from "@/components/NoteEditor";

interface Note {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  tags: string[];
}

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound404, setNotFound404] = useState(false);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const res = await fetch(`/api/notes/${id}`);
        if (res.status === 404) {
          setNotFound404(true);
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setNote(data.note);
      } catch {
        setNotFound404(true);
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound404 || !note) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2 text-center">
        <p className="text-lg font-medium">Note not found</p>
        <p className="text-sm text-muted-foreground">
          This note doesn&apos;t exist or was deleted.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <NoteEditor note={note} />
    </div>
  );
}
