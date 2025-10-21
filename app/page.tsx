"use client";
import { Button } from "@/components/ui/button";
import { caller, getQueryClient, trpc } from "@/trpc/server";
import {
  dehydrate,
  HydrationBoundary,
  useMutation,
} from "@tanstack/react-query";
import { Client } from "./client";
import { Suspense, useState } from "react";
import { useTRPC } from "@/trpc/client";
import { Input } from "@/components/ui/input";

export default function Home() {
  // const queryClient = getQueryClient();

  // void queryClient.prefetchQuery(trpc.hello.queryOptions({ text: "Sameed" }));
  // const data = await caller.hello({ text: "Sameedd" });

  const [value, setValue] = useState("");
  const trpc = useTRPC();
  const invoke = useMutation(trpc.invoke.mutationOptions({}));
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
      <Button onClick={() => invoke.mutate({ text: value })}>
        Invoke Background Job
      </Button>
    </>
    //   </Suspense>
    // </HydrationBoundary>
  );
}
