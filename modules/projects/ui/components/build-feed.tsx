"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  Pencil,
  Package,
  FileCode2,
  Terminal,
  ScanSearch,
  CheckCircle2,
  XCircle,
  Rocket,
  Circle,
} from "lucide-react";
import { BsLightningChargeFill } from "react-icons/bs";
import { cn } from "@/lib/utils";

interface BuildFeedProps {
  projectId: string;
  isActive: boolean;
}

interface StepData {
  id: string;
  stepType: string;
  label: string;
  detail: string | null;
  completedAt: Date | string | null;
  createdAt: Date | string;
}

const stepConfig: Record<
  string,
  { icon: React.ReactNode; color: string; bgColor: string }
> = {
  initializing: {
    icon: <Rocket className="size-3.5" />,
    color: "text-sky-500",
    bgColor: "bg-sky-500/10",
  },
  planning: {
    icon: <Pencil className="size-3.5" />,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  installing: {
    icon: <Package className="size-3.5" />,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  generating: {
    icon: <FileCode2 className="size-3.5" />,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
  executing: {
    icon: <Terminal className="size-3.5" />,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  analyzing: {
    icon: <ScanSearch className="size-3.5" />,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  success: {
    icon: <CheckCircle2 className="size-3.5" />,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  error: {
    icon: <XCircle className="size-3.5" />,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
};

function StepItem({
  step,
  isLast,
  isActive,
}: {
  step: StepData;
  isLast: boolean;
  isActive: boolean;
}) {
  const config = stepConfig[step.stepType] || {
    icon: <Circle className="size-3.5" />,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  };

  const isInProgress = isLast && isActive && !step.completedAt;

  return (
    <div className="flex items-start gap-3 animate-in slide-in-from-bottom-2 fade-in duration-300">
      {/* Step icon */}
      <div
        className={cn(
          "mt-0.5 flex items-center justify-center rounded-full size-6 shrink-0",
          config.bgColor
        )}
      >
        {isInProgress ? (
          <Loader2 className={cn("size-3.5 animate-spin", config.color)} />
        ) : (
          <span className={config.color}>{config.icon}</span>
        )}
      </div>

      {/* Step content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium leading-tight",
            isInProgress && "text-foreground",
            !isInProgress && "text-muted-foreground"
          )}
        >
          {step.label}
        </p>
        {step.detail && (
          <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">
            {step.detail}
          </p>
        )}
      </div>
    </div>
  );
}

export default function BuildFeed({ projectId, isActive }: BuildFeedProps) {
  const trpc = useTRPC();

  const { data: steps } = useQuery(
    trpc.projects.getSteps.queryOptions(
      { projectId },
      {
        refetchInterval: isActive ? 1000 : false,
        enabled: isActive || undefined,
      }
    )
  );

  if (!steps || steps.length === 0) {
    return (
      <div className="flex flex-col group px-2 pb-4">
        <div className="flex items-center gap-2 pl-2 mb-3">
          <BsLightningChargeFill className="size-4 shrink-0" />
          <span className="text-sm font-medium tracking-wider">Kairo</span>
        </div>
        <div className="pl-8 flex items-center gap-2">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground animate-pulse">
            Starting up...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col group px-2 pb-4">
      {/* Header */}
      <div className="flex items-center gap-2 pl-2 mb-3">
        <BsLightningChargeFill className="size-4 shrink-0" />
        <span className="text-sm font-medium tracking-wider">Kairo</span>
        {!isActive && steps.length > 0 && (
          <span className="text-xs text-muted-foreground">
            — {steps.length} steps completed
          </span>
        )}
      </div>

      {/* Steps feed */}
      <div className="pl-8 space-y-2.5">
        {steps.map((step, idx) => (
          <StepItem
            key={step.id}
            step={step}
            isLast={idx === steps.length - 1}
            isActive={isActive}
          />
        ))}

        {/* Active building indicator */}
        {isActive &&
          steps.length > 0 &&
          !steps.some((s) => s.stepType === "success" || s.stepType === "error") && (
            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center justify-center size-6 shrink-0">
                <div className="flex gap-0.5">
                  <span className="size-1 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                  <span className="size-1 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                  <span className="size-1 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                Building...
              </span>
            </div>
          )}
      </div>
    </div>
  );
}
