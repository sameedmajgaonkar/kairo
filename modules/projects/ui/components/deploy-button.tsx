"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  Loader2,
  Rocket,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
} from "lucide-react";
import { SiVercel } from "react-icons/si";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface DeployButtonProps {
  projectId: string;
  projectName: string;
  files: Record<string, string> | null;
}

type DeployState =
  | { status: "idle" }
  | { status: "deploying" }
  | { status: "ready"; url: string }
  | { status: "error"; message: string };

export default function DeployButton({
  projectId,
  projectName,
  files,
}: DeployButtonProps) {
  const trpc = useTRPC();
  const [deployState, setDeployState] = useState<DeployState>({
    status: "idle",
  });
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const deployMutation = useMutation(
    trpc.deploy.deployToVercel.mutationOptions({
      onSuccess: (data) => {
        setDeployState({ status: "ready", url: data.url });
      },
      onError: (error) => {
        setDeployState({ status: "error", message: error.message });
        toast.error(error.message);
      },
    })
  );

  const handleDeploy = () => {
    if (!files) return;
    setDeployState({ status: "deploying" });
    deployMutation.mutate({
      projectId,
      projectName,
    });
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={!files}
          onClick={() => {
            setOpen(true);
            if (deployState.status !== "ready") {
              setDeployState({ status: "idle" });
            }
          }}
        >
          <Rocket className="size-4" />
          Deploy
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SiVercel className="size-5" />
            Deploy to Vercel
          </DialogTitle>
          <DialogDescription>
            Deploy your code directly from the sandbox to Vercel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Idle state */}
          {deployState.status === "idle" && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 bg-sidebar space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Project
                  </span>
                  <span className="text-sm font-medium">{projectName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Files</span>
                  <span className="text-sm font-medium">
                    {files ? Object.keys(files).length : 0}
                  </span>
                </div>
              </div>
              <Button
                onClick={handleDeploy}
                className="w-full gap-2"
                disabled={!files}
              >
                <Rocket className="size-4" />
                Deploy Now
              </Button>
            </div>
          )}

          {/* Deploying state */}
          {deployState.status === "deploying" && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="relative">
                <SiVercel className="size-10 text-foreground" />
                <Loader2 className="size-5 animate-spin text-muted-foreground absolute -bottom-1 -right-1" />
              </div>
              <p className="text-sm text-muted-foreground animate-pulse mt-4">
                Executing Vercel CLI in Sandbox...
              </p>
              <p className="text-xs text-muted-foreground/60">
                This process usually takes 60-90 seconds. Please wait.
              </p>
            </div>
          )}

          {/* Ready state */}
          {deployState.status === "ready" && (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-4 gap-3">
                <CheckCircle2 className="size-12 text-green-500" />
                <p className="text-sm font-semibold">Deployed successfully!</p>
              </div>
              <div className="rounded-lg border p-3 bg-sidebar flex items-center justify-between gap-2">
                <a
                  href={deployState.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline truncate flex-1"
                >
                  {deployState.url}
                </a>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => handleCopy(deployState.url)}
                  >
                    {copied ? (
                      <Check className="size-4 text-green-500" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    asChild
                  >
                    <a
                      href={deployState.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
            </div>
          )}

          {/* Error state */}
          {deployState.status === "error" && (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-4 gap-3">
                <XCircle className="size-12 text-red-500" />
                <p className="text-sm font-semibold">Deployment failed</p>
                <div className="max-h-32 overflow-y-auto w-full p-2 bg-red-500/10 border border-red-500/20 rounded-md">
                   <p className="text-xs text-red-500 whitespace-pre-wrap font-mono">
                     {deployState.message}
                   </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setDeployState({ status: "idle" })}
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
