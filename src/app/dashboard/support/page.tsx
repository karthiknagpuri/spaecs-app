"use client";

import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { HelpCircle } from "lucide-react";

export default function SupportPage() {
  return (
    <ComingSoon
      title="Help & Support"
      description="Get help with your account, access documentation, submit support tickets, and find answers to frequently asked questions."
      icon={HelpCircle}
      estimatedDate="Q1 2025"
      features={[
        "Search comprehensive knowledge base and FAQs",
        "Submit and track support tickets",
        "Live chat support during business hours",
        "Video tutorials and getting started guides",
        "Community forum for creator discussions",
        "Report bugs and request new features",
        "Access to developer documentation and APIs",
      ]}
    />
  );
}
