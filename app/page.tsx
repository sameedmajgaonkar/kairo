"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

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
    <div className="h-screen w-full flex items-center justify-center">
      <div className="w-1/2 flex items-center justify-center flex-col gap-y-5">
        <Input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button
          disabled={createProject.isPending}
          onClick={() => createProject.mutate({ value })}
        >
          Submit
        </Button>
      </div>
    </div>
  );
}
