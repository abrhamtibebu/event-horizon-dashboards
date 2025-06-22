
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Building2, Mail, Phone, MapPin, Hash, Upload, 
  Save, X, User, Users, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DashboardCard } from "@/components/DashboardCard";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AddOrganizer() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    tinNumber: "",
    email: "",
    phoneNumber: "",
    website: "",
    description: "",
    contactPersonName: "",
    contactPersonEmail: "",
    contactPersonPhone: "",
    contactPersonTitle: "",
    logo: null as File | null
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, logo: file }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast.success("Organizer created successfully!");
    navigate("/organizers");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/organizers" className="text-blue-600 hover:text-blue-800 text-sm">
              ← Back to Organizers
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Organizer</h1>
          <p className="text-gray-600 mt-1">Create a new organizer account in the system</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            <DashboardCard title="Organization Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Organization Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter organization name"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="organization@example.com"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number *
                  </Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="City, State, Country"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="tinNumber" className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    TIN Number
                  </Label>
                  <Input
                    id="tinNumber"
                    value={formData.tinNumber}
                    onChange={(e) => handleInputChange("tinNumber", e.target.value)}
                    placeholder="Tax Identification Number"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="website" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Website
                  </Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    placeholder="https://www.example.com"
                    className="mt-1"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">
                    Organization Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Brief description of the organization..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>
            </DashboardCard>

            <DashboardCard title="Primary Contact Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="contactPersonName" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Contact Person Name *
                  </Label>
                  <Input
                    id="contactPersonName"
                    value={formData.contactPersonName}
                    onChange={(e) => handleInputChange("contactPersonName", e.target.value)}
                    placeholder="John Doe"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="contactPersonTitle">
                    Job Title
                  </Label>
                  <Input
                    id="contactPersonTitle"
                    value={formData.contactPersonTitle}
                    onChange={(e) => handleInputChange("contactPersonTitle", e.target.value)}
                    placeholder="Event Manager"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="contactPersonEmail" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Contact Email *
                  </Label>
                  <Input
                    id="contactPersonEmail"
                    type="email"
                    value={formData.contactPersonEmail}
                    onChange={(e) => handleInputChange("contactPersonEmail", e.target.value)}
                    placeholder="john@example.com"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="contactPersonPhone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Contact Phone *
                  </Label>
                  <Input
                    id="contactPersonPhone"
                    value={formData.contactPersonPhone}
                    onChange={(e) => handleInputChange("contactPersonPhone", e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    required
                    className="mt-1"
                  />
                </div>
              </div>
            </DashboardCard>
          </div>

          {/* Logo Upload */}
          <div className="space-y-6">
            <DashboardCard title="Organization Logo">
              <div className="text-center">
                <div className="mb-4">
                  {logoPreview ? (
                    <div className="relative mx-auto w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setLogoPreview(null);
                          setFormData(prev => ({ ...prev, logo: null }));
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="mx-auto w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <input
                  type="file"
                  id="logo"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Label htmlFor="logo">
                  <Button type="button" variant="outline" asChild>
                    <span className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </span>
                  </Button>
                </Label>
                <p className="text-xs text-gray-500 mt-2">
                  PNG, JPG up to 2MB
                </p>
              </div>
            </DashboardCard>

            <DashboardCard title="Quick Stats">
              <div className="text-center space-y-3">
                <div>
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-gray-600">Events Created</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-sm text-gray-600">Total Attendees</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">New</div>
                  <div className="text-sm text-gray-600">Status</div>
                </div>
              </div>
            </DashboardCard>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => navigate("/organizers")}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Organizer
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
