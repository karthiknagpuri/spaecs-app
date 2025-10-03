'use client';

import { useState } from 'react';
import { X, Send, Handshake, Mail, User, DollarSign, MessageSquare, Building2, Sparkles, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CollabModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorName: string;
  creatorId: string;
}

export default function CollabModal({ isOpen, onClose, creatorName, creatorId }: CollabModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    message: '',
    budget_min: '',
    budget_max: '',
    collab_type: 'sponsorship'
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      console.log('Submitting collaboration request:', {
        creator_id: creatorId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company_name: formData.company_name,
        message: formData.message,
        budget_min: formData.budget_min,
        budget_max: formData.budget_max,
        collab_type: formData.collab_type
      });

      const response = await fetch('/api/collaboration-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creator_id: creatorId,
          ...formData,
          budget_min: formData.budget_min ? parseInt(formData.budget_min) * 100 : null, // Convert to paise
          budget_max: formData.budget_max ? parseInt(formData.budget_max) * 100 : null
        })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || errorData.message || 'Failed to submit collaboration request');
      }

      const result = await response.json();
      console.log('Success:', result);

      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          company_name: '',
          message: '',
          budget_min: '',
          budget_max: '',
          collab_type: 'sponsorship'
        });
      }, 2000);
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center sm:justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-neutral-900 w-full sm:max-w-md sm:w-full max-h-[85vh] sm:max-h-[90vh] overflow-hidden sm:rounded-xl rounded-t-2xl shadow-2xl flex flex-col"
        >
          {submitted ? (
            <div className="p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Sparkles className="h-10 w-10 text-green-600 dark:text-green-400" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Request Sent!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {creatorName} will review your collaboration request and get back to you soon.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Handshake className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    Collaborate with {creatorName}
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    Share your idea and budget
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {/* Name */}
                  <div>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm bg-white dark:bg-neutral-800 rounded-lg border border-gray-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-gray-900 dark:text-white"
                      placeholder="Your Name *"
                      maxLength={100}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm bg-white dark:bg-neutral-800 rounded-lg border border-gray-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-gray-900 dark:text-white"
                      placeholder="Email *"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm bg-white dark:bg-neutral-800 rounded-lg border border-gray-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-gray-900 dark:text-white"
                      placeholder="Phone Number (Optional)"
                      maxLength={20}
                    />
                  </div>

                  {/* Company & Type */}
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm bg-white dark:bg-neutral-800 rounded-lg border border-gray-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-gray-900 dark:text-white"
                      placeholder="Company/Brand"
                      maxLength={200}
                    />
                    <select
                      required
                      value={formData.collab_type}
                      onChange={(e) => setFormData({ ...formData, collab_type: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm bg-white dark:bg-neutral-800 rounded-lg border border-gray-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-gray-900 dark:text-white"
                    >
                      <option value="sponsorship">Sponsorship</option>
                      <option value="partnership">Partnership</option>
                      <option value="content">Content Collab</option>
                      <option value="event">Event</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Budget Range */}
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={formData.budget_min}
                      onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm bg-white dark:bg-neutral-800 rounded-lg border border-gray-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-gray-900 dark:text-white"
                      placeholder="Min Budget ₹"
                      min="0"
                    />
                    <input
                      type="number"
                      value={formData.budget_max}
                      onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm bg-white dark:bg-neutral-800 rounded-lg border border-gray-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-gray-900 dark:text-white"
                      placeholder="Max Budget ₹"
                      min="0"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <textarea
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm bg-white dark:bg-neutral-800 rounded-lg border border-gray-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-gray-900 dark:text-white resize-none"
                      rows={4}
                      placeholder="Tell us about your collaboration idea, campaign details, timeline... *"
                      maxLength={2000}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                      {formData.message.length}/2000
                    </p>
                  </div>

                  {error && (
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  )}
                </div>

                {/* Submit Button - Fixed at bottom */}
                <div className="p-4 border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                  <button
                    type="submit"
                    disabled={submitting || !formData.name || !formData.email || !formData.message}
                    className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                  >
                    {submitting ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Send Collaboration Request</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
