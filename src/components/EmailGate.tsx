"use client";

import { useState } from "react";
import { Mail, Loader2, CheckCircle } from "lucide-react";

interface EmailGateProps {
  creatorId: string;
  message?: string;
  onSubmit: (email: string) => Promise<void>;
  source: 'linktree' | 'newsletter' | 'community';
}

export default function EmailGate({ creatorId, message, onSubmit, source }: EmailGateProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      await onSubmit(email);
      setSubmitted(true);

      // Store in localStorage to prevent re-asking
      const storedEmails = JSON.parse(localStorage.getItem('submitted_emails') || '{}');
      storedEmails[`${creatorId}_${source}`] = email;
      localStorage.setItem('submitted_emails', JSON.stringify(storedEmails));
    } catch (err: any) {
      setError(err.message || "Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-xl">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Thank you!
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center">
          You&apos;re all set. Continue exploring...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-xl">
      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-black dark:bg-white rounded-2xl">
        <Mail className="w-8 h-8 text-white dark:text-black" />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
        {source === 'newsletter' ? 'Subscribe to Newsletter' :
         source === 'community' ? 'Join Community' :
         'Join to Continue'}
      </h2>

      <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
        {message || "Enter your email to access exclusive content"}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {source !== 'linktree' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              placeholder="Your name"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            placeholder="your@email.com"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Continue
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          We respect your privacy. Unsubscribe anytime.
        </p>
      </form>
    </div>
  );
}
