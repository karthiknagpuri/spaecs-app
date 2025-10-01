"use client";

import Hero from "@/components/ui/neural-network-hero";
import { AuthModal } from "@/components/auth/AuthModal";
import { useState } from "react";

export default function Home() {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleAuthClick = () => {
    setAuthModalOpen(true);
  };

  return (
    <>
      <div className="w-screen h-screen flex flex-col relative">
        <Hero
          title="Home for Creators & Community"
          description="Monetise your loyal followers into paying customers"
          ctaButtons={[
            { text: "Get Started", onClick: handleAuthClick, primary: true },
          ]}
          microDetails={["Collect Payments", "Scale your Community", "Host Events"]}
        />
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}
