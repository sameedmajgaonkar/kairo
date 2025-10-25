"use client";
import { Button } from "@/components/ui/button";
import { caller, getQueryClient, trpc } from "@/trpc/server";
import {
  dehydrate,
  HydrationBoundary,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { Client } from "./client";
import { Suspense, useState } from "react";
import { useTRPC } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Home() {
  // const queryClient = getQueryClient();

  // void queryClient.prefetchQuery(trpc.hello.queryOptions({ text: "Sameed" }));
  // const data = await caller.hello({ text: "Sameedd" });

  const [value, setValue] = useState("");

  const trpc = useTRPC();
  const { data: messages } = useQuery(trpc.messages.getMany.queryOptions());

  const createMessage = useMutation(
    trpc.messages.create.mutationOptions({
      onSuccess: () => {
        toast.success("Message created");
      },
    })
  );
  return (
    // <HydrationBoundary state={dehydrate(queryClient)}>
    //   <Suspense fallback={<p>Loading...</p>}>
    //     <Client />
    <>
      <Input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button
        disabled={createMessage.isPending}
        onClick={() => createMessage.mutate({ value })}
      >
        Invoke Background Job
      </Button>
      <p>{JSON.stringify(messages, null, 2)}</p>
    </>
    //   </Suspense>
    // </HydrationBoundary>
  );
}
