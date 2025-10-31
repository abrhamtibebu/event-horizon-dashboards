import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/use-auth';
import api from '../lib/api';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Users, 
  Link, 
  Briefcase, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  Copy,
  Download,
  Filter,
  Search,
  MoreVertical,
  UserPlus,
  FileText,
  Star,
  Target,
  BarChart3,
  Settings,
  RefreshCw,
  User,
  Phone,
  Shield,
  Upload,
  Check
} from 'lucide-react';

interface SalespersonJob {
  id: number;
  title: string;
  description: string;
  commission_rate: number;
  status: 'active' | 'inactive' | 'closed';
  max_applications?: number;
  current_applications?: number;
  application_deadline?: string;
  location?: string;
  employment_type?: string;
  created_at: string;
  created_by: {
    name: string;
  };
}

interface SalespersonInvitation {
  id: number;
  job_id: number;
  code: string;
  link: string;
  expires_at: string | null;
  status: 'active' | 'inactive' | 'expired';
  max_registrations?: number;
  current_registrations?: number;
  created_at: string;
  job: {
    title: string;
  };
}

interface SalespersonRegistration {
  id: number;
  invitation_id: number;
  job_id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  experience: string | null;
  skills?: string | null;
  motivation?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'interview_scheduled';
  verification_status?: 'unverified' | 'verified' | 'rejected';
  interview_scheduled_at: string | null;
  created_at: string;
  job: {
    title: string;
  };
}

const SalespersonManagement: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'invitations' | 'registrations'>('overview');
  const [jobs, setJobs] = useState<SalespersonJob[]>([]);
  const [invitations, setInvitations] = useState<SalespersonInvitation[]>([]);
  const [registrations, setRegistrations] = useState<SalespersonRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeInvitations: 0,
    totalRegistrations: 0,
    pendingRegistrations: 0,
    approvedRegistrations: 0,
    recentRegistrations: 0
  });

  // Form states
  const [showJobForm, setShowJobForm] = useState(false);
  const [showInvitationForm, setShowInvitationForm] = useState(false);
  const [showBulkInvitationForm, setShowBulkInvitationForm] = useState(false);
  const [editingJob, setEditingJob] = useState<SalespersonJob | null>(null);
  const [editingInvitation, setEditingInvitation] = useState<SalespersonInvitation | null>(null);
  const [showEditInvitationForm, setShowEditInvitationForm] = useState(false);
  const [editingInvitationData, setEditingInvitationData] = useState<SalespersonInvitation | null>(null);
  const [showRegistrationDetails, setShowRegistrationDetails] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<SalespersonRegistration | null>(null);

  // Job form state
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    commission_rate: '',
    status: 'active' as const,
    max_applications: '',
    application_deadline: '',
    location: '',
    employment_type: 'contract',
    requirements: '',
    benefits: ''
  });

  // Invitation form state
  const [invitationForm, setInvitationForm] = useState({
    job_id: '',
    expires_at: '',
    status: 'active' as const,
    max_registrations: '1'
  });

  // Bulk invitation form state
  const [bulkInvitationForm, setBulkInvitationForm] = useState({
    job_id: '',
    count: '1',
    expires_at: '',
  });

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Initialize state from URL parameters
  useEffect(() => {
    const tab = searchParams.get('tab') as 'overview' | 'jobs' | 'invitations' | 'registrations' || 'overview';
    const page = parseInt(searchParams.get('page') || '1');
    const perPageParam = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    setActiveTab(tab);
    setCurrentPage(page);
    setPerPage(perPageParam);
    setSearchTerm(search);
    setStatusFilter(status);
  }, []);

  // Update URL when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('tab', activeTab);
    if (activeTab === 'registrations') {
      params.set('page', currentPage.toString());
      params.set('per_page', perPage.toString());
      if (searchTerm) params.set('search', searchTerm);
      if (statusFilter !== 'all') params.set('status', statusFilter);
    }
    setSearchParams(params, { replace: true });
  }, [activeTab, currentPage, perPage, searchTerm, statusFilter, setSearchParams]);

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [activeTab, currentPage, perPage, searchTerm, statusFilter]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Clear error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'jobs') {
        const response = await api.get('/salesperson/jobs');
        setJobs(response.data.data || response.data);
      } else if (activeTab === 'invitations') {
        const response = await api.get('/salesperson/invitations');
        setInvitations(response.data.data || response.data);
      } else if (activeTab === 'registrations') {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          per_page: perPage.toString(),
        });
        
        if (searchTerm) {
          params.append('search', searchTerm);
        }
        
        if (statusFilter !== 'all') {
          params.append('status', statusFilter);
        }
        
        const response = await api.get(`/salesperson/registrations?${params.toString()}`);
        const data = response.data;
        
        setRegistrations(data.data || []);
        setTotalPages(data.last_page || 1);
        setTotalRecords(data.total || 0);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/salesperson/overview');
      const data = response.data;
      
      setStats({
        totalJobs: data.totalJobs,
        activeInvitations: data.activeInvitations,
        totalRegistrations: data.totalRegistrations,
        pendingRegistrations: data.pendingRegistrations,
        approvedRegistrations: data.approvedRegistrations,
        recentRegistrations: data.recentRegistrations
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const jobData = {
        ...jobForm,
        commission_rate: parseFloat(jobForm.commission_rate) || 0,
        max_applications: parseInt(jobForm.max_applications) || 0,
      };
      await api.post('/salesperson/jobs', jobData);
      setShowJobForm(false);
      setJobForm({
        title: '',
        description: '',
        commission_rate: '',
        status: 'active',
        max_applications: '',
        application_deadline: '',
        location: '',
        employment_type: 'contract',
        requirements: '',
        benefits: ''
      });
      fetchData();
      fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create job');
    }
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const invitationData = {
        ...invitationForm,
        max_registrations: parseInt(invitationForm.max_registrations) || 1,
      };
      await api.post('/salesperson/invitations', invitationData);
      setShowInvitationForm(false);
      setInvitationForm({
        job_id: '',
        expires_at: '',
        status: 'active',
        max_registrations: '1'
      });
      fetchData();
      fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create invitation');
    }
  };

  const handleGenerateBulkInvitations = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const bulkData = {
        ...bulkInvitationForm,
        count: parseInt(bulkInvitationForm.count) || 1,
      };
      await api.post('/salesperson/invitations/generate-multiple', bulkData);
      setShowBulkInvitationForm(false);
      setBulkInvitationForm({
        job_id: '',
        count: '1',
        expires_at: '',
      });
      fetchData();
      fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate bulk invitations');
    }
  };

  const handleApproveRegistration = async (id: number) => {
    try {
      await api.post(`/salesperson/registrations/${id}/approve`);
      fetchData();
      fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve registration');
    }
  };

  const handleRejectRegistration = async (id: number) => {
    try {
      await api.post(`/salesperson/registrations/${id}/reject`);
      fetchData();
      fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject registration');
    }
  };

  const handleEditInvitation = (invitation: SalespersonInvitation) => {
    setEditingInvitationData(invitation);
    setShowEditInvitationForm(true);
  };

  const handleDeleteInvitation = async (invitationId: number) => {
    if (!confirm('Are you sure you want to delete this invitation? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/salesperson/invitations/${invitationId}`);
      await fetchInvitations();
      setSuccess('Invitation deleted successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete invitation');
    }
  };

  const handleExportJobs = () => {
    if (jobs.length === 0) {
      setError('No jobs to export');
      return;
    }

    // Prepare CSV data
    const csvHeaders = [
      'ID',
      'Title',
      'Description',
      'Commission Rate',
      'Status',
      'Location',
      'Employment Type',
      'Max Applications',
      'Application Deadline',
      'Requirements',
      'Benefits',
      'Created At',
      'Updated At'
    ];

    const csvData = jobs.map(job => [
      job.id,
      job.title,
      job.description || '',
      job.commission_rate,
      job.status,
      job.location || '',
      job.employment_type || '',
      job.max_applications || '',
      job.application_deadline || '',
      job.requirements || '',
      job.benefits || '',
      new Date(job.created_at).toLocaleDateString(),
      new Date(job.updated_at).toLocaleDateString()
    ]);

    // Create CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `salesperson_jobs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSuccess(`Exported ${jobs.length} jobs successfully`);
  };

  const handleExportInvitations = () => {
    if (invitations.length === 0) {
      setError('No invitations to export');
      return;
    }

    // Prepare CSV data
    const csvHeaders = [
      'ID',
      'Code',
      'Job Title',
      'Status',
      'Expires At',
      'Max Registrations',
      'Registration Link',
      'Created At',
      'Updated At'
    ];

    const csvData = invitations.map(invitation => [
      invitation.id,
      invitation.code,
      invitation.job?.title || '',
      invitation.status,
      invitation.expires_at ? new Date(invitation.expires_at).toLocaleDateString() : '',
      invitation.max_registrations,
      invitation.link,
      new Date(invitation.created_at).toLocaleDateString(),
      new Date(invitation.updated_at).toLocaleDateString()
    ]);

    // Create CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `salesperson_invitations_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSuccess(`Exported ${invitations.length} invitations successfully`);
  };

  const handleExportRegistrations = () => {
    if (registrations.length === 0) {
      setError('No registrations to export');
      return;
    }

    // Prepare CSV data
    const csvHeaders = [
      'ID',
      'Name',
      'Email',
      'Phone',
      'Status',
      'Job Title',
      'Experience',
      'Skills',
      'Motivation',
      'Expected Commission',
      'Availability Start',
      'Availability End',
      'Created At',
      'Updated At'
    ];

    const csvData = registrations.map(registration => [
      registration.id,
      registration.name,
      registration.email,
      registration.phone || '',
      registration.status,
      registration.job?.title || '',
      registration.experience || '',
      registration.skills || '',
      registration.motivation || '',
      registration.expected_commission || '',
      registration.availability_start || '',
      registration.availability_end || '',
      new Date(registration.created_at).toLocaleDateString(),
      new Date(registration.updated_at).toLocaleDateString()
    ]);

    // Create CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `salesperson_registrations_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSuccess(`Exported ${registrations.length} registrations successfully`);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Link copied to clipboard');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setSuccess('Link copied to clipboard');
    }
  };

  const handleViewRegistrationDetails = (registration: SalespersonRegistration) => {
    setSelectedRegistration(registration);
    setShowRegistrationDetails(true);
  };

  const handleUpdateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvitationData) return;

    try {
      await api.put(`/salesperson/invitations/${editingInvitationData.id}`, {
        expires_at: editingInvitationData.expires_at,
        status: editingInvitationData.status,
      });

      setSuccess('Invitation updated successfully');
      setShowEditInvitationForm(false);
      setEditingInvitationData(null);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update invitation');
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setCurrentPage(1); // Reset to first page when changing per page
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'interview_scheduled': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }: {
    title: string;
    value: number;
    icon: React.ComponentType<any>;
    color: string;
    trend?: string;
  }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className="text-xs text-green-600 mt-1">{trend}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const TabButton = ({ id, label, icon: Icon, isActive, onClick }: {
    id: string;
    label: string;
    icon: React.ComponentType<any>;
    isActive: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
        isActive
          ? 'bg-blue-50 text-blue-700 border border-blue-200'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );

  const PaginationComponent = () => {
    // Always show pagination component, even with 1 page
    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 7;
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      // Add first page and ellipsis if needed
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push('...');
        }
      }

      // Add visible pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Add last page and ellipsis if needed
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('...');
        }
        pages.push(totalPages);
      }

      return pages;
    };

    return (
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Results Summary */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">
                  Showing <span className="font-semibold text-gray-900">{((currentPage - 1) * perPage) + 1}</span> to{' '}
                  <span className="font-semibold text-gray-900">{Math.min(currentPage * perPage, totalRecords)}</span> of{' '}
                  <span className="font-semibold text-gray-900">{totalRecords}</span> results
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">Records per page:</span>
              <select
                value={perPage}
                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-center space-x-2">
            {/* First Page Button */}
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1 || totalPages <= 1}
              className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group"
              title="First page"
            >
              <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>

            {/* Previous Page Button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || totalPages <= 1}
              className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group"
              title="Previous page"
            >
              <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Page Numbers */}
            <div className="flex items-center space-x-1">
              {getPageNumbers().map((page, index) => {
                if (page === '...') {
                  return (
                    <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400 font-medium">
                      ...
                    </span>
                  );
                }

                const isCurrentPage = page === currentPage;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page as number)}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg font-medium transition-all duration-200 ${
                      isCurrentPage
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200 transform scale-105'
                        : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            {/* Next Page Button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages <= 1}
              className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group"
              title="Next page"
            >
              <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Last Page Button */}
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages || totalPages <= 1}
              className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group"
              title="Last page"
            >
              <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Page Info */}
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-500">
              Page <span className="font-semibold text-gray-700">{currentPage}</span> of{' '}
              <span className="font-semibold text-gray-700">{totalPages}</span>
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Salesperson Management</h1>
              <p className="text-gray-600 mt-1">Manage sales jobs, invitations, and registrations</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchData}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setShowJobForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>New Job</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Stats Overview */}
        {activeTab === 'overview' && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              <StatCard
                title="Total Jobs"
                value={stats.totalJobs}
                icon={Briefcase}
                color="bg-blue-500"
              />
              <StatCard
                title="Active Invitations"
                value={stats.activeInvitations}
                icon={Link}
                color="bg-purple-500"
              />
              <StatCard
                title="Total Registrations"
                value={stats.totalRegistrations}
                icon={Users}
                color="bg-green-500"
              />
              <StatCard
                title="Pending Reviews"
                value={stats.pendingRegistrations}
                icon={Clock}
                color="bg-yellow-500"
              />
              <StatCard
                title="Approved"
                value={stats.approvedRegistrations}
                icon={CheckCircle}
                color="bg-emerald-500"
              />
              <StatCard
                title="This Week"
                value={stats.recentRegistrations}
                icon={TrendingUp}
                color="bg-indigo-500"
                trend="+12% from last week"
              />
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl p-2 mb-6 shadow-sm border border-gray-100">
          <div className="flex space-x-2">
            <TabButton
              id="overview"
              label="Overview"
              icon={BarChart3}
              isActive={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            />
            <TabButton
              id="jobs"
              label="Jobs"
              icon={Briefcase}
              isActive={activeTab === 'jobs'}
              onClick={() => setActiveTab('jobs')}
            />
            <TabButton
              id="invitations"
              label="Invitations"
              icon={Link}
              isActive={activeTab === 'invitations'}
              onClick={() => setActiveTab('invitations')}
            />
            <TabButton
              id="registrations"
              label="Registrations"
              icon={Users}
              isActive={activeTab === 'registrations'}
              onClick={() => setActiveTab('registrations')}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <XCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'jobs' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Sales Jobs</h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleExportJobs}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                    title="Export jobs to CSV"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export CSV</span>
                  </button>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search jobs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading jobs...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {jobs.map((job) => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">{job.title}</h4>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{job.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {/* Edit job */}}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Commission Rate</span>
                          <span className="text-sm font-semibold text-green-600">{job.commission_rate}%</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Applications</span>
                          <span className="text-sm font-semibold">
                            {job.current_applications || 0} / {job.max_applications || '∞'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Status</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                        </div>

                        {job.location && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Location</span>
                            <span className="text-sm font-medium">{job.location}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Created by {job.created_by.name}</span>
                          <span>{new Date(job.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Similar modern designs for invitations and registrations tabs would go here */}
        {/* I'll continue with the invitations tab */}
        {activeTab === 'invitations' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Invitations</h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleExportInvitations}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                    title="Export invitations to CSV"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => setShowInvitationForm(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New Invitation</span>
                  </button>
                  <button
                    onClick={() => setShowBulkInvitationForm(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Bulk Generate</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading invitations...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {invitations.map((invitation) => (
                    <div key={invitation.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">{invitation.job.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                              {invitation.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div>
                              <p className="text-sm text-gray-600">Invitation Code</p>
                              <p className="font-mono text-sm font-semibold text-gray-900">{invitation.code}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Registrations</p>
                              <p className="text-sm font-semibold">
                                {invitation.current_registrations || 0} / {invitation.max_registrations || '∞'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Expires</p>
                              <p className="text-sm font-semibold">
                                {invitation.expires_at ? new Date(invitation.expires_at).toLocaleDateString() : 'Never'}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Invitation Link</span>
                              <button
                                onClick={() => copyToClipboard(invitation.link)}
                                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                              >
                                <Copy className="h-4 w-4" />
                                <span>Copy Link</span>
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 break-all">{invitation.link}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <button 
                            onClick={() => handleEditInvitation(invitation)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit Invitation"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteInvitation(invitation.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Invitation"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Registrations tab with modern design */}
        {activeTab === 'registrations' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Registrations</h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleExportRegistrations}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                    title="Export registrations to CSV"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export CSV</span>
                  </button>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search registrations..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => handleStatusFilterChange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="interview_scheduled">Interview Scheduled</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading registrations...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {registrations.map((registration) => (
                    <div key={registration.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">
                                {registration.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">{registration.name}</h4>
                              <p className="text-sm text-gray-600">{registration.email}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(registration.status)}`}>
                              {registration.status}
                            </span>
                            {registration.verification_status && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                registration.verification_status === 'verified' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {registration.verification_status}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                            <div>
                              <p className="text-sm text-gray-600">Job Position</p>
                              <p className="text-sm font-semibold text-gray-900">{registration.job.title}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Phone</p>
                              <p className="text-sm font-semibold text-gray-900">{registration.phone || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Applied</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {new Date(registration.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Experience</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {registration.experience ? 'Yes' : 'No'}
                              </p>
                            </div>
                          </div>

                          {registration.skills && (
                            <div className="mt-4">
                              <p className="text-sm text-gray-600 mb-2">Skills</p>
                              <p className="text-sm text-gray-900">{registration.skills}</p>
                            </div>
                          )}

                          {registration.motivation && (
                            <div className="mt-4">
                              <p className="text-sm text-gray-600 mb-2">Motivation</p>
                              <p className="text-sm text-gray-900 line-clamp-2">{registration.motivation}</p>
                            </div>
                          )}

                          <div className="mt-4 flex items-center space-x-3">
                            {registration.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveRegistration(registration.id)}
                                  className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleRejectRegistration(registration.id)}
                                  className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                                >
                                  <XCircle className="h-4 w-4" />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}
                            <button 
                              onClick={() => handleViewRegistrationDetails(registration)}
                              className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                            >
                              <Eye className="h-4 w-4" />
                              <span>View Details</span>
                            </button>
                            <button className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                              <FileText className="h-4 w-4" />
                              <span>Download Resume</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Pagination Component */}
            <PaginationComponent />
          </div>
        )}
      </div>

      {/* Invitation Form Modal */}
      {showInvitationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Create New Invitation</h3>
              <button
                onClick={() => setShowInvitationForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateInvitation} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Job *</label>
                <select
                  value={invitationForm.job_id}
                  onChange={(e) => setInvitationForm({ ...invitationForm, job_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose a job...</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>{job.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiration Date</label>
                  <input
                    type="datetime-local"
                    value={invitationForm.expires_at}
                    onChange={(e) => setInvitationForm({ ...invitationForm, expires_at: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Registrations</label>
                    <input
                      type="number"
                      min="1"
                      value={invitationForm.max_registrations}
                      onChange={(e) => setInvitationForm({ ...invitationForm, max_registrations: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowInvitationForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Create Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Invitation Form Modal */}
      {showBulkInvitationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Generate Bulk Invitations</h3>
              <button
                onClick={() => setShowBulkInvitationForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleGenerateBulkInvitations} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Job *</label>
                <select
                  value={bulkInvitationForm.job_id}
                  onChange={(e) => setBulkInvitationForm({ ...bulkInvitationForm, job_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose a job...</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>{job.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Invitations *</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={bulkInvitationForm.count}
                      onChange={(e) => setBulkInvitationForm({ ...bulkInvitationForm, count: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiration Date</label>
                  <input
                    type="datetime-local"
                    value={bulkInvitationForm.expires_at}
                    onChange={(e) => setBulkInvitationForm({ ...bulkInvitationForm, expires_at: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <p className="text-sm text-blue-800">
                    This will generate {bulkInvitationForm.count} unique invitation links for the selected job.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowBulkInvitationForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Generate Invitations
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Registration Details Modal */}
      {showRegistrationDetails && selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Registration Details</h3>
              <button
                onClick={() => setShowRegistrationDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Name</label>
                    <p className="text-sm text-gray-900">{selectedRegistration.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Email</label>
                    <p className="text-sm text-gray-900">{selectedRegistration.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-sm text-gray-900">{selectedRegistration.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Address</label>
                    <p className="text-sm text-gray-900">{selectedRegistration.address || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
                  Professional Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Experience</label>
                    <p className="text-sm text-gray-900">{selectedRegistration.experience || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Skills</label>
                    <p className="text-sm text-gray-900">{selectedRegistration.skills || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Motivation</label>
                    <p className="text-sm text-gray-900">{selectedRegistration.motivation || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Expected Commission</label>
                    <p className="text-sm text-gray-900">{selectedRegistration.expected_commission || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  Availability
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Start Date</label>
                    <p className="text-sm text-gray-900">{selectedRegistration.availability_start || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">End Date</label>
                    <p className="text-sm text-gray-900">{selectedRegistration.availability_end || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Documents
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Resume</label>
                    {selectedRegistration.resume_path ? (
                      <a 
                        href={`/api/salesperson/registrations/${selectedRegistration.id}/resume`}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Download Resume
                      </a>
                    ) : (
                      <p className="text-sm text-gray-500">No resume uploaded</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Cover Letter</label>
                    {selectedRegistration.cover_letter_path ? (
                      <a 
                        href={`/api/salesperson/registrations/${selectedRegistration.id}/cover-letter`}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Download Cover Letter
                      </a>
                    ) : (
                      <p className="text-sm text-gray-500">No cover letter uploaded</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status and Actions */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
                  Status & Actions
                </h4>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Current Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedRegistration.status)}`}>
                      {selectedRegistration.status}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    {selectedRegistration.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            handleApproveRegistration(selectedRegistration.id);
                            setShowRegistrationDetails(false);
                          }}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => {
                            handleRejectRegistration(selectedRegistration.id);
                            setShowRegistrationDetails(false);
                          }}
                          className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end mt-6">
              <button
                onClick={() => setShowRegistrationDetails(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Invitation Modal */}
      {showEditInvitationForm && editingInvitationData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Edit Invitation</h3>
              <button
                onClick={() => {
                  setShowEditInvitationForm(false);
                  setEditingInvitationData(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateInvitation} className="space-y-6">
              {/* Invitation Code (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Invitation Code</label>
                <input
                  type="text"
                  value={editingInvitationData.code}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Invitation code cannot be changed</p>
              </div>

              {/* Job Information (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job</label>
                <input
                  type="text"
                  value={editingInvitationData.job?.title || 'Unknown Job'}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Job cannot be changed</p>
              </div>

              {/* Expiration Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiration Date</label>
                <input
                  type="datetime-local"
                  value={editingInvitationData.expires_at ? new Date(editingInvitationData.expires_at).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditingInvitationData({
                    ...editingInvitationData,
                    expires_at: e.target.value ? new Date(e.target.value).toISOString() : null
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for no expiration</p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={editingInvitationData.status}
                  onChange={(e) => setEditingInvitationData({
                    ...editingInvitationData,
                    status: e.target.value as 'active' | 'inactive' | 'expired'
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              {/* Current Link (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Registration Link</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={editingInvitationData.link}
                    disabled
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(editingInvitationData.link);
                      setSuccess('Link copied to clipboard');
                    }}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Registration link (read-only)</p>
              </div>

              {/* Statistics */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Invitation Statistics</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Max Registrations:</span>
                    <span className="ml-2 font-semibold">{editingInvitationData.max_registrations}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2 font-semibold">
                      {new Date(editingInvitationData.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditInvitationForm(false);
                    setEditingInvitationData(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Update Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Job Form Modal */}
      {showJobForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Create New Job</h3>
              <button
                onClick={() => setShowJobForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                  <input
                    type="text"
                    value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Commission Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={jobForm.commission_rate}
                    onChange={(e) => setJobForm({ ...jobForm, commission_rate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                  <select
                    value={jobForm.employment_type}
                    onChange={(e) => setJobForm({ ...jobForm, employment_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="contract">Contract</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="freelance">Freelance</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowJobForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalespersonManagement;