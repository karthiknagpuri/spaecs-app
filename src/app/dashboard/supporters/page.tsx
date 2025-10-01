"use client";

import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { Heart } from "lucide-react";

export default function SupportersPage() {
  return (
    <ComingSoon
      title="Supporters Hub"
      description="View and manage your supporters, track contributions, and engage with your community members who support your work."
      icon={Heart}
      estimatedDate="Q2 2025"
      features={[
        "View all your supporters with contribution history",
        "Filter by support type (tips, memberships, gifts)",
        "Send thank you messages and exclusive updates",
        "Track supporter engagement and retention metrics",
        "Manage recurring memberships and renewals",
        "Export supporter data for analysis",
      ]}
    />
  );
}
