"use client";

import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <ComingSoon
      title="Account Settings"
      description="Manage your account preferences, notification settings, payment methods, and security options."
      icon={Settings}
      estimatedDate="Q1 2025"
      features={[
        "Update account information and email preferences",
        "Manage notification settings (email, SMS, push)",
        "Configure payment methods and payout preferences",
        "Two-factor authentication and security settings",
        "Privacy controls and data management",
        "API keys and developer settings",
        "Language and regional preferences",
      ]}
    />
  );
}
