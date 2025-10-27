"use client";
import { useUser } from "@clerk/nextjs";

export default function Greeting() {
  const { isSignedIn, user, isLoaded } = useUser();

  return isLoaded && isSignedIn ? (
    <>
      <h2 className="text-xl md:text-3xl flex gap-3">
        Welcome{" "}
        <span className="bg-linear-to-b from-zinc-100 to-zinc-400 text-transparent bg-clip-text">
          {user.firstName}
        </span>
        <span className="greet">👋</span>
      </h2>
    </>
  ) : null;
}
