"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { BookOpen, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  filePath: string;
  fileContent: string;
  allFiles?: Record<string, string>;
  onClose: () => void;
}

export default function ExplainPanel({
  filePath,
  fileContent,
  allFiles,
  onClose,
}: Props) {
  const trpc = useTRPC();
  const [explanation, setExplanation] = useState<string | null>(null);

  const explainMutation = useMutation(
    trpc.ai.explainFile.mutationOptions({
      onSuccess: (data) => {
        setExplanation(data.explanation);
      },
      onError: (error) => {
        toast.error(`Explain failed: ${error.message}`);
      }
    })
  );

  const handleExplain = () => {
    explainMutation.mutate({
      filePath,
      fileContent,
      projectFiles: allFiles,
    });
  };

  return (
    <div className="flex flex-col h-full border-l bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-sidebar">
        <div className="flex items-center gap-2">
          <BookOpen className="size-4 text-violet-500" />
          <span className="text-sm font-medium">Explain Code</span>
        </div>
        <Button variant="ghost" size="icon" className="size-7" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      {/* File name */}
      <div className="px-4 py-2 border-b">
        <p className="text-xs text-muted-foreground">
          {filePath}
        </p>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-4">
        {!explanation && !explainMutation.isPending && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="text-center space-y-2">
              <BookOpen className="size-10 mx-auto text-violet-500 opacity-70" />
              <h3 className="text-base font-semibold">
                Understand this file
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Get a plain-English explanation of what this file does, how it
                works, and how it connects to the rest of the project.
              </p>
            </div>
            <Button onClick={handleExplain} className="gap-2">
              <BookOpen className="size-4" />
              Explain This File
            </Button>
          </div>
        )}

        {explainMutation.isPending && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 className="size-8 animate-spin text-violet-500" />
            <p className="text-sm text-muted-foreground animate-pulse">
              Analyzing code...
            </p>
          </div>
        )}

        {explanation && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div
              className="space-y-4 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: formatMarkdown(explanation),
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Simple markdown → HTML for the explanation (handles headers, bold, code, lists)
function formatMarkdown(text: string): string {
  return text
    .replace(/### (.*)/g, '<h4 class="text-sm font-semibold mt-4 mb-1">$1</h4>')
    .replace(/## (.*)/g, '<h3 class="text-base font-semibold mt-5 mb-2">$1</h3>')
    .replace(/# (.*)/g, '<h2 class="text-lg font-bold mt-6 mb-2">$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-muted text-xs font-mono">$1</code>')
    .replace(/```[\s\S]*?```/g, (match) => {
      const code = match.replace(/```\w*\n?/g, "").replace(/```/g, "");
      return `<pre class="bg-muted rounded-md p-3 text-xs font-mono overflow-x-auto my-2"><code>${code}</code></pre>`;
    })
    .replace(/^\- (.*)/gm, '<li class="ml-4 list-disc text-sm">$1</li>')
    .replace(
      /^\d+\. (.*)/gm,
      '<li class="ml-4 list-decimal text-sm">$1</li>'
    )
    .replace(/\n\n/g, '<br class="my-2" />')
    .replace(/\n/g, "<br />");
}
