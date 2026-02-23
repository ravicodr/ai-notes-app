"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { User, Mail, FileText, Loader2, NotebookPen } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [noteCount, setNoteCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/notes");
        const data = await res.json();
        setNoteCount(data.notes?.length ?? 0);
      } catch {
        setNoteCount(0);
      } finally {
        setCountLoading(false);
      }
    };
    fetchCount();
  }, []);

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isLoading = status === "loading";

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your account information
        </p>
      </div>

      {/* Avatar + Name Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            {isLoading ? (
              <Skeleton className="h-16 w-16 rounded-full" />
            ) : (
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-violet-100 text-violet-700 text-xl font-bold dark:bg-violet-900 dark:text-violet-200">
                  {initials || "U"}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex flex-col gap-1">
              {isLoading ? (
                <>
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </>
              ) : (
                <>
                  <CardTitle className="text-xl">
                    {session?.user?.name}
                  </CardTitle>
                  <CardDescription>{session?.user?.email}</CardDescription>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="flex flex-col items-center justify-center p-4 gap-2 text-center">
          <NotebookPen className="h-5 w-5 text-violet-500" />
          <span className="text-2xl font-bold">
            {countLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              noteCount
            )}
          </span>
          <span className="text-xs text-muted-foreground">Total Notes</span>
        </Card>

        <Card className="flex flex-col items-center justify-center p-4 gap-2 text-center">
          <User className="h-5 w-5 text-violet-500" />
          <span className="text-sm font-semibold truncate max-w-full px-1">
            {isLoading ? (
              <Skeleton className="h-4 w-16" />
            ) : (
              session?.user?.name?.split(" ")[0]
            )}
          </span>
          <span className="text-xs text-muted-foreground">First Name</span>
        </Card>

        <Card className="flex flex-col items-center justify-center p-4 gap-2 text-center">
          <Mail className="h-5 w-5 text-violet-500" />
          <Badge variant="secondary" className="text-xs">
            Verified
          </Badge>
          <span className="text-xs text-muted-foreground">Email Status</span>
        </Card>
      </div>

      {/* Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-0">
          {/* Name Row */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Full Name</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-4 w-28" />
            ) : (
              <span className="text-sm text-muted-foreground">
                {session?.user?.name}
              </span>
            )}
          </div>
          <Separator />

          {/* Email Row */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Email Address</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-4 w-40" />
            ) : (
              <span className="text-sm text-muted-foreground">
                {session?.user?.email}
              </span>
            )}
          </div>
          <Separator />

          {/* Notes Row */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Notes Created</span>
            </div>
            {countLoading ? (
              <Skeleton className="h-5 w-16" />
            ) : (
              <Badge variant="secondary">
                {noteCount} {noteCount === 1 ? "note" : "notes"}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
