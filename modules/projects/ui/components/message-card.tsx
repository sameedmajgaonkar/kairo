import React from "react";
import { Message, Fragment } from "@/lib/generated/prisma/client";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ChevronRightIcon, Code2Icon, Gitlab } from "lucide-react";
type Prop = {
  message: Message & { fragment: Fragment | null };
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
};

interface UserMessageProps {
  content: string;
}
const UserMessage = ({ content }: UserMessageProps) => {
  return (
    <div className="flex justify-end pb-4 pr-2 pl-10">
      <Card className="rounded-lg bg-muted p-3 shadow-none border-none maw-w-[80%] break-words">
        {content}
      </Card>
    </div>
  );
};

type AssistantMessageProps = {
  message: Message;
  fragment: Fragment | null;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
};

const AssistantMessage = ({
  message,
  fragment,
  isActiveFragment,
  onFragmentClick,
}: AssistantMessageProps) => {
  return (
    <div
      className={cn(
        "flex group flex-col justify-start px-2 pb-4",
        message.type == "ERROR" && "text-red-700 dark:text-red-500"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium flex gap-1 tracking-widest">
          <Gitlab /> CODEX
        </span>
        <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          {format(message.createdAt, "HH:mm 'on' MMM dd, yyyy")}
        </span>
      </div>
      <div className="p-2 flex flex-col gap-y-4">
        {message.content}
        {fragment && (
          <FragmentCard
            fragment={fragment}
            isActiveFragment={false}
            onFragmentClick={() => {}}
          />
        )}
      </div>
    </div>
  );
};
interface FragmentCardProps {
  fragment: Fragment;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
}
const FragmentCard = ({
  fragment,
  isActiveFragment,
  onFragmentClick,
}: FragmentCardProps) => {
  return (
    <button
      className={cn(
        "flex items-start text-start gap-2 border rounded-lg bg-muted w-fit p-3 hover:bg-secondary transition-colors",
        isActiveFragment &&
          "bg-primary text-primary-foreground border-primary hover:bg-primary"
      )}
      onClick={() => onFragmentClick(fragment)}
    >
      <Code2Icon className="size-4 mt-0.5" />
      <div className="flex flex-col flex-1">
        <span className="text-sm line-clamp-1 font-medium">
          {fragment.title}
        </span>
        <span className="text-sm">Preview</span>
      </div>
      <div className="flex items-center justify-center mt-0.5">
        <ChevronRightIcon />
      </div>
    </button>
  );
};
const MessageCard = ({ message, isActiveFragment, onFragmentClick }: Prop) => {
  if (message.role == "ASSISTANT") {
    return (
      <AssistantMessage
        message={message}
        isActiveFragment={isActiveFragment}
        fragment={message.fragment}
        onFragmentClick={onFragmentClick}
      />
    );
  }
  return <UserMessage content={message.content} />;
};

export default MessageCard;
