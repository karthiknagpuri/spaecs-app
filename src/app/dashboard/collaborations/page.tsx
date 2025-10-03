'use client';

import { useState, useEffect } from 'react';
import { Handshake, Mail, Phone, Building2, Calendar, DollarSign, MessageSquare, Filter, Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface CollaborationRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
  message: string;
  budget_min?: number;
  budget_max?: number;
  budget_currency: string;
  collab_type: string;
  status: string;
  created_at: string;
}

export default function CollaborationsPage() {
  const [requests, setRequests] = useState<CollaborationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      const url = filter === 'all'
        ? '/api/collaboration-requests'
        : `/api/collaboration-requests?status=${filter}`;

      const response = await fetch(url);
      const data = await response.json();

      setRequests(data.requests || []);
    } catch (error) {
      console.error('Failed to fetch collaboration requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBudget = (min?: number, max?: number, currency: string = 'INR') => {
    if (!min && !max) return 'Not specified';

    const formatAmount = (amount: number) => {
      return `₹${(amount / 100).toLocaleString('en-IN')}`;
    };

    if (min && max) {
      return `${formatAmount(min)} - ${formatAmount(max)}`;
    } else if (min) {
      return `From ${formatAmount(min)}`;
    } else if (max) {
      return `Up to ${formatAmount(max)}`;
    }
    return 'Not specified';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'reviewed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'accepted': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getCollabTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      sponsorship: 'Sponsorship',
      partnership: 'Partnership',
      content: 'Content Collab',
      event: 'Event',
      other: 'Other'
    };
    return labels[type] || type;
  };

  const filteredRequests = requests.filter(request => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      request.name.toLowerCase().includes(query) ||
      request.email.toLowerCase().includes(query) ||
      request.company_name?.toLowerCase().includes(query) ||
      request.message.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
          <Handshake className="h-6 w-6 text-purple-600" />
          Collaboration Requests
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage collaboration opportunities from brands and creators
        </p>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {['all', 'pending', 'reviewed', 'accepted', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filter === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-neutral-800 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-neutral-900 rounded-xl">
          <Handshake className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No collaboration requests yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filter === 'all'
              ? "When brands reach out to collaborate, they'll appear here"
              : `No ${filter} requests found`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {request.name}
                  </h3>
                  {request.company_name && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                      <Building2 className="h-3 w-3" />
                      {request.company_name}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(request.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${request.email}`} className="hover:text-purple-600">
                    {request.email}
                  </a>
                </div>
                {request.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${request.phone}`} className="hover:text-purple-600">
                      {request.phone}
                    </a>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Type:</span>
                  <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded text-xs">
                    {getCollabTypeLabel(request.collab_type)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">Budget:</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatBudget(request.budget_min, request.budget_max, request.budget_currency)}
                  </span>
                </div>
              </div>

              {/* Message */}
              <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Message:</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {request.message}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
