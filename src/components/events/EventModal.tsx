"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Calendar, MapPin, Video, Globe, Upload } from "lucide-react";
import { ResponsiveButton } from "@/components/ui/responsive/ResponsiveButton";

interface Event {
  id?: string;
  title: string;
  description: string;
  type: 'online' | 'offline' | 'hybrid';
  start_date: string;
  end_date: string;
  location?: string;
  meeting_url?: string;
  max_attendees: number;
  price: number;
  is_published?: boolean;
}

interface EventModalProps {
  event?: Event | null;
  onClose: () => void;
  onSave: () => void;
}

export function EventModal({ event, onClose, onSave }: EventModalProps) {
  const [formData, setFormData] = useState<Event>({
    title: '',
    description: '',
    type: 'online',
    start_date: '',
    end_date: '',
    location: '',
    meeting_url: '',
    max_attendees: 50,
    price: 0,
    is_published: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (event) {
      setFormData(event);
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // In production, save to database
      console.log('Saving event:', formData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      onSave();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {event ? 'Edit Event' : 'Create New Event'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                placeholder="Enter event title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                placeholder="Describe your event"
                rows={4}
                required
              />
            </div>

            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Type
              </label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'online' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.type === 'online'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300'
                  }`}
                >
                  <Video className={`h-6 w-6 mx-auto mb-2 ${
                    formData.type === 'online' ? 'text-indigo-500' : 'text-gray-400'
                  }`} />
                  <p className={`text-sm font-medium ${
                    formData.type === 'online' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    Online
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Virtual event
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'offline' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.type === 'offline'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300'
                  }`}
                >
                  <MapPin className={`h-6 w-6 mx-auto mb-2 ${
                    formData.type === 'offline' ? 'text-indigo-500' : 'text-gray-400'
                  }`} />
                  <p className={`text-sm font-medium ${
                    formData.type === 'offline' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    Offline
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    In-person event
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'hybrid' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.type === 'hybrid'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300'
                  }`}
                >
                  <Globe className={`h-6 w-6 mx-auto mb-2 ${
                    formData.type === 'hybrid' ? 'text-indigo-500' : 'text-gray-400'
                  }`} />
                  <p className={`text-sm font-medium ${
                    formData.type === 'hybrid' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    Hybrid
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Both online & offline
                  </p>
                </button>
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_date ? formData.start_date.slice(0, 16) : ''}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_date ? formData.end_date.slice(0, 16) : ''}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Location (for offline/hybrid) */}
            {(formData.type === 'offline' || formData.type === 'hybrid') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  placeholder="Enter venue address"
                  required={formData.type === 'offline'}
                />
              </div>
            )}

            {/* Meeting URL (for online/hybrid) */}
            {(formData.type === 'online' || formData.type === 'hybrid') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Meeting URL
                </label>
                <input
                  type="url"
                  value={formData.meeting_url}
                  onChange={(e) => setFormData({ ...formData, meeting_url: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  placeholder="https://zoom.us/j/..."
                  required={formData.type === 'online'}
                />
              </div>
            )}

            {/* Attendees and Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maximum Attendees
                </label>
                <input
                  type="number"
                  value={formData.max_attendees}
                  onChange={(e) => setFormData({ ...formData, max_attendees: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ticket Price (₹)
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  min="0"
                  step="1"
                  required
                />
              </div>
            </div>

            {/* Event Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Banner
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-neutral-600 transition-colors cursor-pointer">
                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  PNG, JPG up to 5MB
                </p>
              </div>
            </div>

            {/* Publish Status */}
            {event && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="is_published" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Publish event (make visible to attendees)
                </label>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <ResponsiveButton
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </ResponsiveButton>
              <ResponsiveButton
                type="submit"
                loading={loading}
                className="flex-1"
              >
                {event ? 'Update Event' : 'Create Event'}
              </ResponsiveButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}