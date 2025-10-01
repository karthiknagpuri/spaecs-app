"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Calendar,
  Plus,
  Search,
  MapPin,
  Clock,
  Users,
  Video,
  Edit2,
  Trash2,
  MoreVertical,
  Ticket,
  TrendingUp,
  Globe,
  Eye
} from "lucide-react";
import { ResponsiveButton } from "@/components/ui/responsive/ResponsiveButton";
import { EventModal } from "@/components/events/EventModal";

interface Event {
  id: string;
  title: string;
  description: string;
  type: 'online' | 'offline' | 'hybrid';
  start_date: string;
  end_date: string;
  location?: string;
  meeting_url?: string;
  max_attendees: number;
  current_attendees: number;
  price: number;
  image_url?: string;
  is_published: boolean;
  created_at: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  const supabase = createClient();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Mock events for demo
      const mockEvents: Event[] = [
        {
          id: '1',
          title: 'Community Meetup 2024',
          description: 'Join us for our annual community meetup where we discuss the future of content creation.',
          type: 'hybrid',
          start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
          location: 'Mumbai, India',
          meeting_url: 'https://meet.google.com/abc-defg-hij',
          max_attendees: 100,
          current_attendees: 45,
          price: 500,
          is_published: true,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Creator Workshop: Monetization Strategies',
          description: 'Learn the best strategies to monetize your content and grow your revenue.',
          type: 'online',
          start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
          meeting_url: 'https://zoom.us/j/123456789',
          max_attendees: 200,
          current_attendees: 120,
          price: 0,
          is_published: true,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          title: 'Exclusive Fan Meet',
          description: 'A special meet and greet event for our top supporters.',
          type: 'offline',
          start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
          location: 'Bangalore, India',
          max_attendees: 50,
          current_attendees: 30,
          price: 1500,
          is_published: true,
          created_at: new Date().toISOString()
        }
      ];

      setEvents(mockEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      // In production, delete from database
      setEvents(events.filter(e => e.id !== eventId));
      setActiveDropdown(null);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'online':
        return <Video className="h-4 w-4" />;
      case 'offline':
        return <MapPin className="h-4 w-4" />;
      case 'hybrid':
        return <Globe className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'online':
        return 'bg-blue-500/20 text-blue-300';
      case 'offline':
        return 'bg-green-500/20 text-green-300';
      case 'hybrid':
        return 'bg-purple-500/20 text-purple-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase());

    const now = new Date();
    const eventDate = new Date(event.start_date);

    if (filterType === 'upcoming') {
      return matchesSearch && eventDate >= now;
    } else if (filterType === 'past') {
      return matchesSearch && eventDate < now;
    }
    return matchesSearch;
  });

  const stats = {
    totalEvents: events.length,
    upcomingEvents: events.filter(e => new Date(e.start_date) >= new Date()).length,
    totalAttendees: events.reduce((acc, e) => acc + e.current_attendees, 0),
    totalRevenue: events.reduce((acc, e) => acc + (e.price * e.current_attendees), 0)
  };

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Events
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Host and manage events for your community
          </p>
        </div>
        <ResponsiveButton
          onClick={() => setShowCreateModal(true)}
          className="mt-4 md:mt-0"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Event
        </ResponsiveButton>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 bg-opacity-10">
              <Calendar className="h-5 w-5 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalEvents}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total Events
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 bg-opacity-10">
              <Clock className="h-5 w-5 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.upcomingEvents}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upcoming Events
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 bg-opacity-10">
              <Users className="h-5 w-5 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalAttendees}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total Attendees
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 bg-opacity-10">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            ₹{stats.totalRevenue.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Event Revenue
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex gap-2 flex-1">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-indigo-500 text-white'
                : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-700'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilterType('upcoming')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterType === 'upcoming'
                ? 'bg-indigo-500 text-white'
                : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-700'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilterType('past')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterType === 'past'
                ? 'bg-indigo-500 text-white'
                : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-700'
            }`}
          >
            Past
          </button>
        </div>

        <div className="relative flex-1 md:max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-12 text-center border border-gray-200 dark:border-neutral-700">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No events found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchQuery ? 'Try adjusting your search' : 'Create your first event to engage with your community'}
          </p>
          {!searchQuery && (
            <ResponsiveButton onClick={() => setShowCreateModal(true)}>
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Event
            </ResponsiveButton>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Event Image */}
              <div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 relative">
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Calendar className="h-16 w-16 text-white/50" />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm flex items-center gap-1 ${getEventTypeColor(event.type)}`}>
                    {getEventTypeIcon(event.type)}
                    {event.type}
                  </span>
                </div>
              </div>

              {/* Event Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {event.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {event.description}
                    </p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === event.id ? null : event.id)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-500" />
                    </button>
                    {activeDropdown === event.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-gray-200 dark:border-neutral-700 z-10">
                        <button
                          onClick={() => {
                            setActiveDropdown(null);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </button>
                        <button
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowCreateModal(true);
                            setActiveDropdown(null);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Event Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(event.start_date).toLocaleString()}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Users className="h-4 w-4" />
                    <span>{event.current_attendees} / {event.max_attendees} attendees</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Ticket className="h-4 w-4" />
                    <span>{event.price === 0 ? 'Free' : `₹${event.price}`}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full"
                      style={{ width: `${(event.current_attendees / event.max_attendees) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {Math.round((event.current_attendees / event.max_attendees) * 100)}% full
                  </p>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    event.is_published
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                  }`}>
                    {event.is_published ? 'Published' : 'Draft'}
                  </span>
                  {new Date(event.start_date) >= new Date() ? (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                      Upcoming
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Past Event
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Event Modal */}
      {showCreateModal && (
        <EventModal
          event={selectedEvent}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedEvent(null);
          }}
          onSave={() => {
            setShowCreateModal(false);
            setSelectedEvent(null);
            fetchEvents();
          }}
        />
      )}
    </div>
  );
}