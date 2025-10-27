"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { GrArchlinux } from "react-icons/gr";
import Greeting from "./Greeting";
import NavBar from "./NavBar";

export default function Home() {
  const router = useRouter();

  const [value, setValue] = useState("");

  const trpc = useTRPC();

  const createProject = useMutation(
    trpc.projects.create.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
      },
      onSuccess: (data) => {
        router.push(`projects/${data.id}`);
      },
    })
  );
  return (
    <>
      <NavBar />
      <div className="flex items-center flex-col gap-10 justify-center h-full home">
        <Greeting />
        <h1 className="text-xl md:text-5xl text-center font-bold bg-linear-to-b from-zinc-100 to-zinc-400 text-transparent bg-clip-text">
          TURN YOUR IDEAS INTO REALITY
        </h1>
        <div className="bg-zinc-300 rounded-xl w-full md:w-1/2 flex flex-col items-end p-4">
          <textarea
            name="query"
            onChange={(e) => {
              setValue(e.target.value);
            }}
            value={value}
            className="resize-none p-2 text-zinc-900 w-full md:text-xl outline-0"
            placeholder="Ask Kairo to build your website..."
          ></textarea>
          <Button
            disabled={createProject.isPending}
            onClick={() => createProject.mutate({ value })}
          >
            <GrArchlinux className="text-zinc-950" />
          </Button>
        </div>
      </div>
    </>
  );
}
