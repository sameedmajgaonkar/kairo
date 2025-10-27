import { Orbitron } from "next/font/google";
import { BsLightningChargeFill } from "react-icons/bs";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

const obitron = Orbitron({
  weight: "600",
});

export default function NavBar() {
  return (
    <nav className="p-2 h-4 w-full">
      <ul
        className={`${obitron.className} flex gap-2 items-center justify-between tracking-widest`}
      >
        <li className="flex gap-2 md:text-2xl">
          <BsLightningChargeFill />
          <h3>Kairo</h3>
        </li>
        <li className="space-x-4">
          <SignedOut>
            <SignInButton>
              <button className="cursor-pointer">Sign In</button>
            </SignInButton>
            <SignUpButton>
              <button className="cursor-pointer">Sign Up</button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </li>
      </ul>
    </nav>
  );
}
