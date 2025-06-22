import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Calendar, Clock, MapPin, Users, Upload, Save, X, 
  Image, FileText, Settings, Tag, Building2
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

export default function CreateEvent() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    location: "",
    maxGuests: "",
    registrationStartDate: "",
    registrationEndDate: "",
    eventTypeId: "",
    eventCategoryId: "",
    organizerId: "",
    status: "draft",
    eventImage: null as File | null,
    registrationFee: "",
    currency: "USD",
    tags: "",
    requirements: "",
    agenda: ""
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock data for dropdowns
  const eventTypes = [
    { id: "1", name: "Conference" },
    { id: "2", name: "Workshop" },
    { id: "3", name: "Seminar" },
    { id: "4", name: "Festival" },
    { id: "5", name: "Exhibition" }
  ];

  const eventCategories = [
    { id: "1", name: "Technology" },
    { id: "2", name: "Business" },
    { id: "3", name: "Entertainment" },
    { id: "4", name: "Education" },
    { id: "5", name: "Arts & Culture" }
  ];

  const organizers = [
    { id: "1", name: "Tech Events Co." },
    { id: "2", name: "Business Solutions Inc." },
    { id: "3", name: "Creative Productions" },
    { id: "4", name: "Education Partners" }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, eventImage: file }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast.success("Event created successfully!");
    navigate("/events");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/events" className="text-blue-600 hover:text-blue-800 text-sm">
              ← Back to Events
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
          <p className="text-gray-600 mt-1">Set up a new event in the system</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            <DashboardCard title="Basic Information">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Event Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter event name"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">
                    Event Description *
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe your event..."
                    rows={4}
                    required
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="eventTypeId">Event Type *</Label>
                    <Select value={formData.eventTypeId} onValueChange={(value) => handleInputChange("eventTypeId", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="eventCategoryId">Category *</Label>
                    <Select value={formData.eventCategoryId} onValueChange={(value) => handleInputChange("eventCategoryId", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="organizerId" className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Organizer *
                    </Label>
                    <Select value={formData.organizerId} onValueChange={(value) => handleInputChange("organizerId", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select organizer" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizers.map((organizer) => (
                          <SelectItem key={organizer.id} value={organizer.id}>
                            {organizer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="tags">
                    Tags (comma-separated)
                  </Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => handleInputChange("tags", e.target.value)}
                    placeholder="technology, conference, ai, innovation"
                    className="mt-1"
                  />
                </div>
              </div>
            </DashboardCard>

            <DashboardCard title="Date & Time">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="startDate" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Start Date *
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange("startDate", e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="endDate" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    End Date *
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange("endDate", e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="startTime" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Start Time *
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange("startTime", e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="endTime" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    End Time *
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleInputChange("endTime", e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
              </div>
            </DashboardCard>

            <DashboardCard title="Location & Capacity">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Event Location *
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="Convention Center, Downtown"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="maxGuests" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Maximum Attendees *
                  </Label>
                  <Input
                    id="maxGuests"
                    type="number"
                    value={formData.maxGuests}
                    onChange={(e) => handleInputChange("maxGuests", e.target.value)}
                    placeholder="500"
                    required
                    className="mt-1"
                  />
                </div>
              </div>
            </DashboardCard>

            <DashboardCard title="Registration Settings">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="registrationStartDate">Registration Start Date *</Label>
                  <Input
                    id="registrationStartDate"
                    type="date"
                    value={formData.registrationStartDate}
                    onChange={(e) => handleInputChange("registrationStartDate", e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="registrationEndDate">Registration End Date *</Label>
                  <Input
                    id="registrationEndDate"
                    type="date"
                    value={formData.registrationEndDate}
                    onChange={(e) => handleInputChange("registrationEndDate", e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="registrationFee">Registration Fee (Optional)</Label>
                  <Input
                    id="registrationFee"
                    type="number"
                    step="0.01"
                    value={formData.registrationFee}
                    onChange={(e) => handleInputChange("registrationFee", e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="NGN">NGN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DashboardCard>

            <DashboardCard title="Additional Information">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="requirements">
                    Requirements & Prerequisites
                  </Label>
                  <Textarea
                    id="requirements"
                    value={formData.requirements}
                    onChange={(e) => handleInputChange("requirements", e.target.value)}
                    placeholder="Any requirements or prerequisites for attendees..."
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="agenda">
                    Event Agenda
                  </Label>
                  <Textarea
                    id="agenda"
                    value={formData.agenda}
                    onChange={(e) => handleInputChange("agenda", e.target.value)}
                    placeholder="Detailed event schedule and agenda..."
                    rows={4}
                    className="mt-1"
                  />
                </div>
              </div>
            </DashboardCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <DashboardCard title="Event Image">
              <div className="text-center">
                <div className="mb-4">
                  {imagePreview ? (
                    <div className="relative mx-auto w-full h-48 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Event preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setFormData(prev => ({ ...prev, eventImage: null }));
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="mx-auto w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Event Image</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <input
                  type="file"
                  id="eventImage"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Label htmlFor="eventImage">
                  <Button type="button" variant="outline" asChild>
                    <span className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </span>
                  </Button>
                </Label>
                <p className="text-xs text-gray-500 mt-2">
                  PNG, JPG up to 5MB
                </p>
              </div>
            </DashboardCard>

            <DashboardCard title="Event Status">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </DashboardCard>

            <DashboardCard title="Quick Preview">
              <div className="text-center space-y-3">
                <div>
                  <div className="text-lg font-bold text-blue-600">New Event</div>
                  <div className="text-sm text-gray-600">Status</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">0</div>
                  <div className="text-sm text-gray-600">Registered</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-600">
                    {formData.maxGuests || "0"}
                  </div>
                  <div className="text-sm text-gray-600">Max Capacity</div>
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
            onClick={() => navigate("/events")}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={() => {
              setFormData(prev => ({ ...prev, status: "draft" }));
              handleSubmit(new Event("submit") as React.FormEvent<HTMLFormElement>);
            }}
          >
            <FileText className="w-4 h-4 mr-2" />
            Save as Draft
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
                Create Event
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
