"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PlusCircle, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoteCard } from "@/components/NoteCard";
import { SearchBar } from "@/components/SearchBar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface Note {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

function NoteCardSkeleton() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-3/4" />
      </CardHeader>
      <CardContent className="flex-1 pb-2 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
      <CardFooter className="pt-2 flex flex-col items-start gap-2">
        <div className="flex gap-1">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-14" />
        </div>
        <Skeleton className="h-3 w-24" />
      </CardFooter>
    </Card>
  );
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const fetchNotes = useCallback(
    async (q = "") => {
      try {
        const url = q
          ? `/api/notes?q=${encodeURIComponent(q)}`
          : "/api/notes";
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setNotes(data.notes);
      } catch {
        toast({ title: "Failed to load notes", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchNotes(search);
    }, 300);
    return () => clearTimeout(debounce);
  }, [search, fetchNotes]);

  const handleDelete = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Notes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading
              ? "Loading..."
              : `${notes.length} note${notes.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <SearchBar value={search} onChange={setSearch} />
          <Link href="/notes/new">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              New Note
            </Button>
          </Link>
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <NoteCardSkeleton key={i} />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="rounded-full bg-muted p-4">
            <StickyNote className="h-8 w-8 text-muted-foreground" />
          </div>
          {search ? (
            <>
              <p className="text-lg font-medium">No notes found</p>
              <p className="text-sm text-muted-foreground">
                No notes match &quot;{search}&quot;. Try a different search.
              </p>
              <Button variant="outline" onClick={() => setSearch("")}>
                Clear search
              </Button>
            </>
          ) : (
            <>
              <p className="text-lg font-medium">No notes yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first note to get started
              </p>
              <Link href="/notes/new">
                <Button className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Create your first note
                </Button>
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
