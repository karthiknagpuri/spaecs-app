"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  Users,
  TrendingUp,
  Download,
  Loader2,
  Search,
  Filter,
  Calendar,
  ExternalLink,
  UserPlus,
  Send,
  Settings
} from "lucide-react";

interface EmailLead {
  id: string;
  email: string;
  source: string;
  metadata: any;
  status: string;
  created_at: string;
}

interface Subscriber {
  id: string;
  email: string;
  name?: string;
  status: string;
  tags?: string[];
  subscribed_at: string;
}

interface CommunityMember {
  id: string;
  email: string;
  name?: string;
  access_level: string;
  status: string;
  joined_at: string;
}

export default function LeadsPage() {
  const [activeTab, setActiveTab] = useState<'leads' | 'newsletter' | 'community'>('leads');
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<EmailLead[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');

  useEffect(() => {
    fetchData();
  }, [activeTab, sourceFilter, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'leads') {
        const params = new URLSearchParams();
        if (sourceFilter !== 'all') params.append('source', sourceFilter);
        if (statusFilter !== 'all') params.append('status', statusFilter);

        const response = await fetch(`/api/email-leads/collect?${params}`);
        const data = await response.json();
        setLeads(data.leads || []);
      } else if (activeTab === 'newsletter') {
        const response = await fetch(`/api/newsletter/subscribe?status=${statusFilter}`);
        const data = await response.json();
        setSubscribers(data.subscribers || []);
      } else if (activeTab === 'community') {
        const response = await fetch(`/api/community/join?status=${statusFilter}`);
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    let data: any[] = [];
    let filename = '';

    if (activeTab === 'leads') {
      data = leads;
      filename = 'email_leads.csv';
    } else if (activeTab === 'newsletter') {
      data = subscribers;
      filename = 'newsletter_subscribers.csv';
    } else {
      data = members;
      filename = 'community_members.csv';
    }

    if (data.length === 0) return;

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => Object.values(item).map(v =>
      typeof v === 'object' ? JSON.stringify(v) : v
    ).join(','));

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const filteredData = () => {
    let data: any[] = [];

    if (activeTab === 'leads') {
      data = leads;
    } else if (activeTab === 'newsletter') {
      data = subscribers;
    } else {
      data = members;
    }

    if (!searchQuery) return data;

    return data.filter(item =>
      item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const stats = {
    leads: leads.length,
    newsletter: subscribers.length,
    community: members.length,
    totalEmails: new Set([
      ...leads.map(l => l.email),
      ...subscribers.map(s => s.email),
      ...members.map(m => m.email)
    ]).size
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Email Leads & Community
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your email leads, newsletter subscribers, and community members
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalEmails}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Unique Emails</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.leads}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Email Leads</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <Send className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.newsletter}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Newsletter Subscribers</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.community}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Community Members</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('leads')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'leads'
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Email Leads
            </button>
            <button
              onClick={() => setActiveTab('newsletter')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'newsletter'
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Newsletter
            </button>
            <button
              onClick={() => setActiveTab('community')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'community'
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Community
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <a
              href="/dashboard/settings#email-collection"
              className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </a>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by email or name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>

          {activeTab === 'leads' && (
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            >
              <option value="all">All Sources</option>
              <option value="linktree">LinkTree</option>
              <option value="newsletter">Newsletter</option>
              <option value="community">Community</option>
            </select>
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          >
            <option value="active">Active</option>
            <option value="unsubscribed">Unsubscribed</option>
            <option value="bounced">Bounced</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : filteredData().length === 0 ? (
          <div className="text-center p-12">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No {activeTab} yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Start collecting emails by enabling features in settings
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  {activeTab !== 'leads' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                  )}
                  {activeTab === 'leads' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Source
                    </th>
                  )}
                  {activeTab === 'community' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Access Level
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredData().map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.email}
                    </td>
                    {activeTab !== 'leads' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {item.name || '-'}
                      </td>
                    )}
                    {activeTab === 'leads' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">
                          {item.source}
                        </span>
                      </td>
                    )}
                    {activeTab === 'community' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">
                          {item.access_level}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.status === 'active' || item.status === 'subscribed'
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {new Date(item.created_at || item.subscribed_at || item.joined_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
