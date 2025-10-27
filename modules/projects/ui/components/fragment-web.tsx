import { useState } from "react";
import { ExternalLink, RefreshCcwIcon } from "lucide-react";
import { Fragment } from "@/lib/generated/prisma/client";
import { Button } from "@/components/ui/button";
import Hint from "@/components/hint";

interface Props {
  fragment: Fragment;
}
const FragmentWeb = ({ fragment }: Props) => {
  const [fragmentKey, setFragmentKey] = useState(0);
  const [copied, setCopied] = useState(false);

  const onRefresh = () => {
    setFragmentKey((prev) => prev + 1);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fragment.sandboxUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex flex-col w-full h-full">
      <div className="p-2 border-b bg-sidebar flex items-center gap-x-2">
        <Hint text="Refresh" align="start" side="bottom">
          <Button size="sm" variant="outline" onClick={onRefresh}>
            <RefreshCcwIcon />
          </Button>
        </Hint>
        <Hint align="center" side="bottom" text="Copy">
          <Button
            size="sm"
            className="flex-1 justify-start font-normal"
            disabled={!fragment.sandboxUrl || copied}
            variant="outline"
            onClick={handleCopy}
          >
            <span className="truncate">{fragment.sandboxUrl}</span>
          </Button>
        </Hint>
        <Hint text="Open in a new tab" side="bottom" align="start">
          <Button
            size="sm"
            disabled={!fragment.sandboxUrl}
            variant="outline"
            onClick={() => {
              if (!fragment.sandboxUrl) return;
              window.open(fragment.sandboxUrl, "_blank");
            }}
          >
            <ExternalLink />
          </Button>
        </Hint>
      </div>
      <iframe
        key={fragmentKey}
        className="h-full w-full"
        sandbox="allow-forms allow-scripts allow-same-origin"
        loading="lazy"
        src={fragment.sandboxUrl}
      ></iframe>
    </div>
  );
};

export default FragmentWeb;
