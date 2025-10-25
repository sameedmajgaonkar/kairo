import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import MessageCard from "./message-card";
import MessageForm from "./message-form";
import { useEffect, useRef } from "react";
import { Fragment } from "@/lib/generated/prisma/client";
import MessageLoading from "./message-loading";
interface Props {
  projectId: string;
  activeFragment: Fragment | null;
  setActiveFragment: (fragment: Fragment | null) => void;
}
const MessagesContainer = ({
  projectId,
  activeFragment,
  setActiveFragment,
}: Props) => {
  const trpc = useTRPC();

  const { data: messages } = useSuspenseQuery(
    trpc.messages.getMany.queryOptions(
      {
        projectId,
      },
      { refetchInterval: 5000 }
    )
  );

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lastAssistantMessageWithFragment = messages.findLast(
      (message) => message.role === "ASSISTANT" && !!message.fragment
    );
    if (lastAssistantMessageWithFragment) {
      // TODO set to active fragment
      setActiveFragment(lastAssistantMessageWithFragment.fragment);
    }
  }, [messages, setActiveFragment]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [messages.length]);

  const lastMessage = messages[messages.length - 1];
  const islastMessageUser = lastMessage.role === "USER";
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4">
          {messages.map((message) => (
            <MessageCard
              key={message.id}
              message={message}
              isActiveFragment={activeFragment?.id === message.fragment?.id}
              onFragmentClick={() => {
                setActiveFragment(message.fragment);
              }}
            />
          ))}

          {islastMessageUser && <MessageLoading />}
          <div ref={bottomRef} />
        </div>
      </div>
      <div className="relative p-4">
        <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-background" />
        <MessageForm projectId={projectId} />
      </div>
    </div>
  );
};

export default MessagesContainer;
