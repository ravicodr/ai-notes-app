"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AIButtonProps {
  noteId: string;
  action: "summary" | "improve" | "tags";
  onSuccess: (result: any) => void;
  disabled?: boolean;
  className?: string;
}

const ACTION_CONFIG = {
  summary: {
    label: "Summarize",
    loadingLabel: "Summarizing...",
    successMsg: "Summary generated!",
    errorPrefix: "Summary failed",
  },
  improve: {
    label: "Improve Writing",
    loadingLabel: "Improving...",
    successMsg: "Content improved!",
    errorPrefix: "Improvement failed",
  },
  tags: {
    label: "Generate Tags",
    loadingLabel: "Tagging...",
    successMsg: "Tags generated!",
    errorPrefix: "Tag generation failed",
  },
};

export function AIButton({
  noteId,
  action,
  onSuccess,
  disabled,
  className,
}: AIButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const config = ACTION_CONFIG[action];

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/${noteId}/ai/${action}`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || config.errorPrefix);
      }

      onSuccess(data);
      toast({ title: "✨ " + config.successMsg });
    } catch (err: any) {
      toast({
        title: config.errorPrefix,
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading || disabled}
      className={cn("gap-2", className)}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Sparkles className="h-3.5 w-3.5 text-violet-500" />
      )}
      {loading ? config.loadingLabel : config.label}
    </Button>
  );
}
