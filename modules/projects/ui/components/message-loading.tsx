import { Gitlab } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";

const ShimmerMessages = () => {
  const messages = [
    "Thinking...",
    "Installing dependencies...",
    "Generating...",
    "Crafting components...",
    "Optimizing layout...",
    "Analyzing your request...",
    "Building your website...",
    "Adding Final touches...",
    "Almost ready...",
  ];

  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((prev) => prev + 1);
    }, 2000);

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-base text-muted-foreground animate-pulse">
        {messages[msgIdx]}
      </span>
    </div>
  );
};
const MessageLoading = () => {
  return (
    <div className="flex flex-col group px-2 pb-4 mb-4">
      <div className="flex items-center gap-2 pl-2 mb-2">
        <Gitlab />
        <span className="text-sm font-medium tracking-widest">CODEX</span>
      </div>
      <div className="flex flex-col gap-y-4">
        <ShimmerMessages />
      </div>
    </div>
  );
};

export default MessageLoading;
