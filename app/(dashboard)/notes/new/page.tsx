import { NoteEditor } from "@/components/NoteEditor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Note | AI Notes",
};

export default function NewNotePage() {
  return (
    <div className="max-w-3xl mx-auto h-full">
      <NoteEditor isNew />
    </div>
  );
}
