import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Star,
  Calendar,
  Upload,
  Link as LinkIcon,
  AlertCircle,
  Loader2,
  FileText,
  ExternalLink,
  Check,
  Shield,
  UserCheck
} from 'lucide-react';

interface Job {
  id: number;
  title: string;
  description: string;
  commission_rate: number;
  location?: string;
  employment_type?: string;
  requirements?: string;
  benefits?: string;
}

interface Invitation {
  id: number;
  job_id: number;
  code: string;
  link: string;
  expires_at: string | null;
  status: string;
  job: Job;
}

const SalespersonRegistration: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    dob: '',
    phone: '',
    email: '',
    address: '',
    idNumber: '',
    emergencyName: '',
    emergencyPhone: '',
    experience: '',
    referral: '',
    skills: '',
    motivation: '',
    expectedCommission: '',
    availabilityStart: '',
    availabilityEnd: '',
    portfolioUrl: '',
    linkedinUrl: '',
    resume: null as File | null,
    coverLetter: null as File | null,
    termsAccepted: false,
    privacyAccepted: false,
  });

  useEffect(() => {
    if (code) {
      fetchInvitation();
    }
  }, [code]);

  const fetchInvitation = async () => {
    try {
      const response = await api.get(`/public/salesperson/invitations/${code}`);
      setInvitation(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid invitation code');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const submitData = new FormData();
      submitData.append('invitation_code', code!);
      submitData.append('name', `${formData.firstName} ${formData.middleName} ${formData.lastName}`.trim());
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('address', formData.address);
      submitData.append('experience', formData.experience);
      submitData.append('skills', formData.skills);
      submitData.append('motivation', formData.motivation);
      submitData.append('expected_commission', formData.expectedCommission);
      submitData.append('availability_start', formData.availabilityStart);
      submitData.append('availability_end', formData.availabilityEnd);
      submitData.append('portfolio_url', formData.portfolioUrl);
      submitData.append('linkedin_url', formData.linkedinUrl);
      submitData.append('gender', formData.gender);
      submitData.append('dob', formData.dob);
      submitData.append('id_number', formData.idNumber);
      submitData.append('emergency_name', formData.emergencyName);
      submitData.append('emergency_phone', formData.emergencyPhone);
      submitData.append('referral', formData.referral);

      if (formData.resume) {
        submitData.append('resume', formData.resume);
      }
      if (formData.coverLetter) {
        submitData.append('cover_letter', formData.coverLetter);
      }

      await api.post('/public/salesperson/registrations', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit registration');
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              currentStep >= step 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {step}
            </div>
            {step < 3 && (
              <div className={`w-16 h-1 mx-2 ${
                currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        <div className="relative text-center max-w-md w-full">
          <div className="relative mb-8">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-20"></div>
            <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Loading Invitation</h2>
              <p className="text-gray-600 leading-relaxed">Please wait while we verify your invitation...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23F87171' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        <div className="relative max-w-md w-full text-center">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-pink-500 rounded-3xl blur opacity-20"></div>
            <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <XCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Invalid Invitation</h2>
              <p className="text-gray-600 leading-relaxed mb-6">{error}</p>
              {/* <button
                onClick={() => navigate('/')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg"
              >
                Return Home
              </button> */}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310B981' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        <div className="relative max-w-lg w-full text-center">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl blur opacity-20"></div>
            <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Application Submitted!</h2>
              <p className="text-gray-600 leading-relaxed mb-8 text-base">
                Thank you for your interest in joining our sales team. We'll review your application and get back to you within 2-3 business days.
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Application received successfully</span>
                </div>
                {/* <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg"
                >
                  Return Home
                </button> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      {/* Header */}
      <div className="relative bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <UserCheck className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                    Sales Representative
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 font-medium">Join our dynamic sales team</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm sm:text-base max-w-2xl leading-relaxed">
                Take the next step in your career with our innovative sales platform. 
                Join a team that values growth, innovation, and success.
              </p>
            </div>
            <div className="lg:text-right">
              <div className="inline-flex flex-col items-center lg:items-end gap-2 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 shadow-sm">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Invitation Code</p>
                <p className="font-mono text-lg sm:text-xl font-bold text-blue-600 break-all bg-blue-50 px-3 py-1 rounded-lg">
                  {code}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Job Information Card */}
        {invitation && (
          <div className="group relative mb-8 sm:mb-12">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/30 overflow-hidden">
              <div className="p-6 sm:p-8 lg:p-10">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-8">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Briefcase className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="mb-6">
                      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{invitation.job.title}</h2>
                      <p className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-3xl">
                        {invitation.job.description}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Star className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Commission</p>
                          <p className="text-sm font-bold text-green-800">{invitation.job.commission_rate}%</p>
                        </div>
                      </div>
                      
                      {invitation.job.location && (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Location</p>
                            <p className="text-sm font-semibold text-blue-800 truncate">{invitation.job.location}</p>
                          </div>
                        </div>
                      )}
                      
                      {invitation.job.employment_type && (
                        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-purple-700 uppercase tracking-wide">Type</p>
                            <p className="text-sm font-semibold text-purple-800 capitalize">{invitation.job.employment_type}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {invitation.expires_at && (
                      <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-amber-800">Invitation Expires</p>
                            <p className="text-sm text-amber-700">
                              {new Date(invitation.expires_at).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Form */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur opacity-30"></div>
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Application Form</h2>
                <p className="text-gray-600 text-sm sm:text-base">Please fill out the form below to complete your application</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 lg:space-y-10">
                {/* Personal Information */}
                <section className="group">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="w-12 h-12 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <User className="h-5 w-5 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Personal Information</h3>
                      <p className="text-sm sm:text-base text-gray-600">Tell us about yourself</p>
                    </div>
                  </div>
                  <div className="bg-gray-50/50 rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
                      <div className="space-y-2 sm:space-y-3">
                        <Label className="text-sm sm:text-base font-semibold text-gray-700">First Name *</Label>
                        <Input 
                          name="firstName" 
                          value={formData.firstName}
                          onChange={handleInputChange} 
                          required 
                          className="h-11 sm:h-12 lg:h-13 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl text-sm sm:text-base"
                        />
                      </div>
                      <div className="space-y-2 sm:space-y-3">
                        <Label className="text-sm sm:text-base font-semibold text-gray-700">Middle Name</Label>
                        <Input 
                          name="middleName" 
                          value={formData.middleName}
                          onChange={handleInputChange} 
                          className="h-11 sm:h-12 lg:h-13 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl text-sm sm:text-base"
                        />
                      </div>
                      <div className="space-y-2 sm:space-y-3">
                        <Label className="text-sm sm:text-base font-semibold text-gray-700">Last Name *</Label>
                        <Input 
                          name="lastName" 
                          value={formData.lastName}
                          onChange={handleInputChange} 
                          required 
                          className="h-11 sm:h-12 lg:h-13 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl text-sm sm:text-base"
                        />
                      </div>
                      <div className="space-y-2 sm:space-y-3">
                        <Label className="text-sm sm:text-base font-semibold text-gray-700">Gender</Label>
                        <Select 
                          value={formData.gender} 
                          onValueChange={(value) => setFormData({ ...formData, gender: value })}
                        >
                          <SelectTrigger className="h-11 sm:h-12 lg:h-13 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl text-sm sm:text-base">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 sm:space-y-3">
                        <Label className="text-sm sm:text-base font-semibold text-gray-700">Date of Birth</Label>
                        <Input 
                          type="date" 
                          name="dob" 
                          value={formData.dob}
                          onChange={handleInputChange} 
                          className="h-11 sm:h-12 lg:h-13 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl text-sm sm:text-base"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Contact Details */}
                <section className="group">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="w-12 h-12 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <Phone className="h-5 w-5 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Contact Details</h3>
                      <p className="text-sm sm:text-base text-gray-600">How can we reach you?</p>
                    </div>
                  </div>
                  <div className="bg-gray-50/50 rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
                      <div className="space-y-2 sm:space-y-3">
                        <Label className="text-sm sm:text-base font-semibold text-gray-700">Phone Number *</Label>
                        <Input 
                          name="phone" 
                          type="tel" 
                          value={formData.phone}
                          onChange={handleInputChange} 
                          required 
                          className="h-11 sm:h-12 lg:h-13 border-gray-200 focus:border-green-500 focus:ring-green-500/20 rounded-xl text-sm sm:text-base"
                        />
                      </div>
                      <div className="space-y-2 sm:space-y-3">
                        <Label className="text-sm sm:text-base font-semibold text-gray-700">Email Address *</Label>
                        <Input 
                          name="email" 
                          type="email" 
                          value={formData.email}
                          onChange={handleInputChange} 
                          required 
                          className="h-11 sm:h-12 lg:h-13 border-gray-200 focus:border-green-500 focus:ring-green-500/20 rounded-xl text-sm sm:text-base"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-2 sm:space-y-3">
                        <Label className="text-sm sm:text-base font-semibold text-gray-700">Residential Address</Label>
                        <Textarea 
                          name="address" 
                          value={formData.address}
                          onChange={handleInputChange}
                          className="min-h-[90px] sm:min-h-[110px] lg:min-h-[120px] border-gray-200 focus:border-green-500 focus:ring-green-500/20 rounded-xl resize-none text-sm sm:text-base"
                          placeholder="Enter your full residential address..."
                        />
                      </div>
                    </div>
                  </div>
                </section>

              {/* Identification & Verification */}
              {/* <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-blue-600" />
                  Identification & Verification
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>National ID / Passport Number</Label>
                    <Input 
                      name="idNumber" 
                      value={formData.idNumber}
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div>
                    <Label>Emergency Contact Name</Label>
                    <Input 
                      name="emergencyName" 
                      value={formData.emergencyName}
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div>
                    <Label>Emergency Contact Phone</Label>
                    <Input 
                      name="emergencyPhone" 
                      type="tel" 
                      value={formData.emergencyPhone}
                      onChange={handleInputChange} 
                    />
                  </div>
                </div>
              </section> */}

                {/* Professional Details */}
                <section className="group">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="w-12 h-12 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <Briefcase className="h-5 w-5 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Professional Details</h3>
                      <p className="text-sm sm:text-base text-gray-600">Tell us about your experience</p>
                    </div>
                  </div>
                  <div className="bg-gray-50/50 rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
                      <div className="space-y-2 sm:space-y-3">
                        <Label className="text-sm sm:text-base font-semibold text-gray-700">Previous Sales Experience</Label>
                        <Select 
                          value={formData.experience} 
                          onValueChange={(value) => setFormData({ ...formData, experience: value })}
                        >
                          <SelectTrigger className="h-11 sm:h-12 lg:h-13 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl text-sm sm:text-base">
                            <SelectValue placeholder="Select experience" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 sm:space-y-3">
                        <Label className="text-sm sm:text-base font-semibold text-gray-700">Referral (if any)</Label>
                        <Input 
                          name="referral" 
                          value={formData.referral}
                          onChange={handleInputChange} 
                          className="h-11 sm:h-12 lg:h-13 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl text-sm sm:text-base"
                          placeholder="Who referred you?"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-2 sm:space-y-3">
                        <Label className="text-sm sm:text-base font-semibold text-gray-700">Skills & Expertise</Label>
                        <Textarea 
                          name="skills" 
                          value={formData.skills}
                          onChange={handleInputChange}
                          placeholder="List your key skills and areas of expertise..."
                          className="min-h-[90px] sm:min-h-[110px] lg:min-h-[120px] border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl resize-none text-sm sm:text-base"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-2 sm:space-y-3">
                        <Label className="text-sm sm:text-base font-semibold text-gray-700">Motivation</Label>
                        <Textarea 
                          name="motivation" 
                          value={formData.motivation}
                          onChange={handleInputChange}
                          placeholder="Why do you want to join our sales team? What motivates you?"
                          className="min-h-[90px] sm:min-h-[110px] lg:min-h-[120px] border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl resize-none text-sm sm:text-base"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Document Upload - Commented Out */}
                {/* <section>
                  <h2 className="text-lg font-semibold mb-4 flex items-center">
                    <Upload className="h-5 w-5 mr-2 text-blue-600" />
                    Document Upload
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Resume (PDF, DOC, DOCX)</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                        <input
                          type="file"
                          name="resume"
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          id="resume-upload"
                        />
                        <label htmlFor="resume-upload" className="cursor-pointer">
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">
                            {formData.resume ? formData.resume.name : 'Click to upload resume'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Max file size: 10MB</p>
                        </label>
                      </div>
                    </div>
                    <div>
                      <Label>Cover Letter (Optional)</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                        <input
                          type="file"
                          name="coverLetter"
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          id="cover-letter-upload"
                        />
                        <label htmlFor="cover-letter-upload" className="cursor-pointer">
                          <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">
                            {formData.coverLetter ? formData.coverLetter.name : 'Click to upload cover letter'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Max file size: 10MB</p>
                        </label>
                      </div>
                    </div>
                  </div>
                </section> */}


                {/* Consent */}
                <section className="group">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="w-12 h-12 sm:w-10 sm:h-10 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <Check className="h-5 w-5 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Consent & Agreement</h3>
                      <p className="text-sm sm:text-base text-gray-600">Please review and accept our terms</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-indigo-50/50 to-blue-50/50 rounded-2xl p-4 sm:p-6 lg:p-8 border border-indigo-100">
                    <div className="space-y-3 sm:space-y-4">
                      <label className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-white/60 rounded-xl border border-white/50 hover:bg-white/80 transition-all duration-200 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={formData.termsAccepted}
                          onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                          required 
                          className="mt-1 w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 flex-shrink-0" 
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs sm:text-sm lg:text-base text-gray-700 group-hover:text-gray-900 transition-colors leading-relaxed">
                            I agree to the company's <Link to="/terms" className="text-indigo-600 underline hover:text-indigo-800 transition-colors font-semibold" target="_blank" rel="noopener noreferrer">Terms and Conditions</Link>.
                          </span>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-white/60 rounded-xl border border-white/50 hover:bg-white/80 transition-all duration-200 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={formData.privacyAccepted}
                          onChange={(e) => setFormData({ ...formData, privacyAccepted: e.target.checked })}
                          required 
                          className="mt-1 w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 flex-shrink-0" 
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs sm:text-sm lg:text-base text-gray-700 group-hover:text-gray-900 transition-colors leading-relaxed">
                            I have read and accept the <Link to="/privacy" className="text-indigo-600 underline hover:text-indigo-800 transition-colors font-semibold" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </section>

                {/* Submit Button */}
                <div className="text-center pt-6 sm:pt-8 lg:pt-10">
                  <div className="relative inline-block w-full sm:w-auto">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                    <Button 
                      type="submit" 
                      className="relative w-full sm:w-auto px-6 sm:px-8 lg:px-12 py-3 sm:py-4 lg:py-5 text-sm sm:text-base lg:text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      disabled={submitting || !formData.termsAccepted || !formData.privacyAccepted}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin mr-2 sm:mr-3" />
                          <span className="hidden sm:inline">Submitting Application...</span>
                          <span className="sm:hidden">Submitting...</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                          <span className="hidden sm:inline">Submit Application</span>
                          <span className="sm:hidden">Submit</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4 px-4 sm:px-0">
                    By submitting, you agree to our terms and confirm all information is accurate.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 sm:mt-8">
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-4 sm:p-6 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm sm:text-base font-semibold text-red-800">Error</p>
                  <p className="text-xs sm:text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalespersonRegistration;