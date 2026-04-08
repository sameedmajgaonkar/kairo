"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { EyeIcon, CodeIcon, Sparkles } from "lucide-react";
import { Fragment } from "@/lib/generated/prisma/client";
import { UserControl } from "@/components/user-control";
import { FileExplorer } from "@/components/file-explorer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import MessagesContainer from "../components/messages-container";
import ProjectHeader from "../components/project-header";
import FragmentWeb from "../components/fragment-web";
import CodeReview from "../components/code-review";
import DeployButton from "../components/deploy-button";

interface Props {
  projectId: string;
}

const ProjectView = ({ projectId }: Props) => {
  const trpc = useTRPC();
  const { data: project } = useSuspenseQuery(
    trpc.projects.getOne.queryOptions({
      id: projectId,
    })
  );

  const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);
  const [tabState, setTabState] = useState<"preview" | "code" | "review">(
    "preview"
  );

  return (
    <div className="h-screen flex flex-col">
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        <ResizablePanel
          defaultSize={35}
          minSize={20}
          className="flex flex-col min-h-0"
        >
          <Suspense fallback={<p>Loading project...</p>}>
            <ProjectHeader projectId={projectId} />
          </Suspense>
          <Suspense fallback={<p>Loading Messages...</p>}>
            <MessagesContainer
              projectId={projectId}
              activeFragment={activeFragment}
              setActiveFragment={setActiveFragment}
            />
          </Suspense>
        </ResizablePanel>
        <ResizableHandle className="hover:bg-primary transition-colors" />
        <ResizablePanel defaultSize={65} minSize={50} className="flex flex-col min-h-0">
          <Tabs
            className="flex flex-col h-full gap-y-0"
            defaultValue="preview"
            value={tabState}
            onValueChange={(value) =>
              setTabState(value as "preview" | "code" | "review")
            }
          >
            <div className="w-full flex items-center p-2 border-b gap-x-2 shrink-0">
              <TabsList className="h-8 p-0 border rounded-md">
                <TabsTrigger value="preview" className="rounded-md">
                  <EyeIcon /> <span>Demo</span>
                </TabsTrigger>
                <TabsTrigger value="code" className="rounded-md">
                  <CodeIcon /> <span>Code</span>
                </TabsTrigger>
                <TabsTrigger value="review" className="rounded-md">
                  <Sparkles className="size-4" /> <span>Review</span>
                </TabsTrigger>
              </TabsList>
              <div className="ml-auto flex items-center gap-x-2">
                <DeployButton 
                  projectId={projectId}
                  projectName={project.name} 
                  files={activeFragment?.files ? (activeFragment.files as Record<string, string>) : null} 
                />
                <UserControl />
              </div>
            </div>
            <TabsContent value="preview" className="flex-1 min-h-0 overflow-hidden">
              {!!activeFragment && <FragmentWeb fragment={activeFragment} />}
            </TabsContent>
            <TabsContent value="code" className="flex-1 min-h-0 overflow-hidden">
              {!!activeFragment?.files && (
                <FileExplorer
                  files={
                    activeFragment.files as { [path: string]: string }
                  }
                />
              )}
            </TabsContent>
            <TabsContent value="review" className="flex-1 min-h-0 overflow-hidden">
              <CodeReview
                files={
                  activeFragment?.files
                    ? (activeFragment.files as Record<string, string>)
                    : null
                }
              />
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default ProjectView;
