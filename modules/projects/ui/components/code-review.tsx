"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  Gauge,
  Info,
  Loader2,
  Shield,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Finding {
  severity: "critical" | "warning" | "info";
  category: "bug" | "performance" | "best-practice" | "security";
  file: string;
  line: number | null;
  title: string;
  description: string;
  suggestion: string;
}

interface ReviewResult {
  score: number;
  summary: string;
  findings: Finding[];
}

interface Props {
  files: Record<string, string> | null;
}

const severityConfig = {
  critical: {
    icon: <XCircle className="size-4" />,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    label: "Critical",
  },
  warning: {
    icon: <AlertTriangle className="size-4" />,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    label: "Warning",
  },
  info: {
    icon: <Info className="size-4" />,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    label: "Info",
  },
};

const categoryConfig = {
  bug: { icon: <Bug className="size-3.5" />, label: "Bug" },
  performance: { icon: <Gauge className="size-3.5" />, label: "Performance" },
  "best-practice": {
    icon: <Sparkles className="size-3.5" />,
    label: "Best Practice",
  },
  security: { icon: <Shield className="size-3.5" />, label: "Security" },
};

function ScoreBadge({ score }: { score: number }) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-green-500 border-green-500/30 bg-green-500/10";
    if (s >= 60) return "text-amber-500 border-amber-500/30 bg-amber-500/10";
    return "text-red-500 border-red-500/30 bg-red-500/10";
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-lg font-bold",
        getScoreColor(score)
      )}
    >
      {score}
      <span className="text-xs font-normal opacity-70">/100</span>
    </div>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  const severity = severityConfig[finding.severity];
  const category = categoryConfig[finding.category];
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className={cn(
        "w-full text-left border rounded-lg p-3 transition-all hover:shadow-sm",
        severity.border
      )}
    >
      <div className="flex items-start gap-2">
        <span className={cn("mt-0.5 shrink-0", severity.color)}>
          {severity.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">{finding.title}</span>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full",
                severity.bg,
                severity.color
              )}
            >
              {severity.label}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              {category.icon}
              {category.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {finding.file}
            {finding.line ? `:${finding.line}` : ""}
          </p>
          {expanded && (
            <div className="mt-3 space-y-2 animate-in slide-in-from-top-1 fade-in duration-200">
              <p className="text-sm text-foreground/80">
                {finding.description}
              </p>
              <div className="bg-muted/50 rounded-md p-2.5">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  💡 Suggestion
                </p>
                <p className="text-sm">{finding.suggestion}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export default function CodeReview({ files }: Props) {
  const trpc = useTRPC();
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  const reviewMutation = useMutation(
    trpc.ai.reviewCode.mutationOptions({
      onSuccess: (data) => {
        if (!data || data.score === 0) {
          toast.error("Code review failed or returned no results.");
        }
        setReview(data as ReviewResult);
      },
      onError: (error) => {
        toast.error(`Code review failed: ${error.message}`);
      }
    })
  );

  if (!files) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <Sparkles className="size-8 opacity-50" />
        <p className="text-sm">Select a fragment to review its code</p>
      </div>
    );
  }

  if (!review && !reviewMutation.isPending) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-center space-y-2">
          <Sparkles className="size-10 mx-auto text-violet-500 opacity-70" />
          <h3 className="text-lg font-semibold">AI Code Review</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Get an instant code review from AI — covering bugs, performance,
            best practices, and security.
          </p>
        </div>
        <Button
          onClick={() => reviewMutation.mutate({ files })}
          className="gap-2"
          variant="default"
        >
          <Sparkles className="size-4" />
          Run Code Review
        </Button>
      </div>
    );
  }

  if (reviewMutation.isPending) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 className="size-8 animate-spin text-violet-500" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Analyzing code quality...
        </p>
      </div>
    );
  }

  if (!review) return null;

  const filteredFindings = filter
    ? review.findings.filter((f) => f.severity === filter)
    : review.findings;

  const criticalCount = review.findings.filter(
    (f) => f.severity === "critical"
  ).length;
  const warningCount = review.findings.filter(
    (f) => f.severity === "warning"
  ).length;
  const infoCount = review.findings.filter(
    (f) => f.severity === "info"
  ).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header with score */}
      <div className="p-4 border-b bg-sidebar space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ScoreBadge score={review.score} />
            <div>
              <h3 className="text-sm font-semibold">Code Quality Score</h3>
              <p className="text-xs text-muted-foreground">
                {review.findings.length} findings
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setReview(null);
              reviewMutation.mutate({ files });
            }}
          >
            Re-run
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{review.summary}</p>

        {/* Filter pills */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter(null)}
            className={cn(
              "text-xs px-2.5 py-1 rounded-full border transition-colors",
              !filter
                ? "bg-foreground text-background"
                : "hover:bg-muted"
            )}
          >
            All ({review.findings.length})
          </button>
          {criticalCount > 0 && (
            <button
              onClick={() =>
                setFilter(filter === "critical" ? null : "critical")
              }
              className={cn(
                "text-xs px-2.5 py-1 rounded-full border transition-colors",
                filter === "critical"
                  ? "bg-red-500 text-white border-red-500"
                  : "text-red-500 border-red-500/30 hover:bg-red-500/10"
              )}
            >
              Critical ({criticalCount})
            </button>
          )}
          {warningCount > 0 && (
            <button
              onClick={() =>
                setFilter(filter === "warning" ? null : "warning")
              }
              className={cn(
                "text-xs px-2.5 py-1 rounded-full border transition-colors",
                filter === "warning"
                  ? "bg-amber-500 text-white border-amber-500"
                  : "text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
              )}
            >
              Warning ({warningCount})
            </button>
          )}
          {infoCount > 0 && (
            <button
              onClick={() => setFilter(filter === "info" ? null : "info")}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full border transition-colors",
                filter === "info"
                  ? "bg-blue-500 text-white border-blue-500"
                  : "text-blue-500 border-blue-500/30 hover:bg-blue-500/10"
              )}
            >
              Info ({infoCount})
            </button>
          )}
        </div>
      </div>

      {/* Findings list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredFindings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
            <CheckCircle2 className="size-8 text-green-500" />
            <p className="text-sm font-medium">No issues found!</p>
          </div>
        ) : (
          filteredFindings.map((finding, idx) => (
            <FindingCard key={idx} finding={finding} />
          ))
        )}
      </div>
    </div>
  );
}
