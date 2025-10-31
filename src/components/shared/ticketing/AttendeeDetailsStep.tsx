import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, User, Mail, Phone, Building, Briefcase, Globe, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { attendeeDetailsSchema, AttendeeDetailsFormData } from '@/lib/validationSchemas';
import type { TicketSelection } from '@/types/publicTickets';

interface AttendeeDetailsStepProps {
  selections: TicketSelection[];
  onBack: () => void;
  onContinue: (data: AttendeeDetailsFormData) => void;
  initialData?: Partial<AttendeeDetailsFormData>;
}

const COUNTRIES = [
  'Ethiopia', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Sweden', 'Norway',
  'Kenya', 'South Africa', 'Nigeria', 'Egypt', 'Ghana', 'Tanzania',
  'India', 'China', 'Japan', 'South Korea', 'Singapore', 'UAE',
  // Add more countries as needed
];

export const AttendeeDetailsStep: React.FC<AttendeeDetailsStepProps> = ({
  selections,
  onBack,
  onContinue,
  initialData,
}) => {
  const totalTickets = selections.reduce((sum, s) => sum + s.quantity, 0);
  const [showGuestNames, setShowGuestNames] = useState(false);
  const [guestNameInputs, setGuestNameInputs] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AttendeeDetailsFormData>({
    resolver: zodResolver(attendeeDetailsSchema),
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      company: initialData?.company || '',
      job_title: initialData?.job_title || '',
      gender: initialData?.gender,
      country: initialData?.country || 'Ethiopia',
      dietary_requirements: initialData?.dietary_requirements || '',
      special_accommodations: initialData?.special_accommodations || '',
      guest_names: initialData?.guest_names || [],
      agreed_to_terms: initialData?.agreed_to_terms || false,
      subscribed_to_newsletter: initialData?.subscribed_to_newsletter || false,
    },
  });

  // Watch form values for auto-save
  const formValues = watch();

  // Auto-save to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('attendee_details_draft', JSON.stringify(formValues));
    }, 1000);

    return () => clearTimeout(timer);
  }, [formValues]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('attendee_details_draft');
    if (saved && !initialData) {
      try {
        const parsed = JSON.parse(saved);
        Object.keys(parsed).forEach((key) => {
          setValue(key as any, parsed[key]);
        });
      } catch (e) {
        // Ignore invalid JSON
      }
    }
  }, []);

  // Manage guest names
  const addGuestName = () => {
    setGuestNameInputs([...guestNameInputs, '']);
  };

  const removeGuestName = (index: number) => {
    const newGuestNames = guestNameInputs.filter((_, i) => i !== index);
    setGuestNameInputs(newGuestNames);
    setValue('guest_names', newGuestNames.filter((n) => n.trim() !== ''));
  };

  const updateGuestName = (index: number, value: string) => {
    const newGuestNames = [...guestNameInputs];
    newGuestNames[index] = value;
    setGuestNameInputs(newGuestNames);
    setValue('guest_names', newGuestNames.filter((n) => n.trim() !== ''));
  };

  const onSubmit = (data: AttendeeDetailsFormData) => {
    // Clear draft from localStorage
    localStorage.removeItem('attendee_details_draft');
    onContinue(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Attendee Information
        </h2>
        <p className="text-gray-600">
          Please provide your details to complete your registration
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Primary Attendee Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Primary Attendee Details
            </CardTitle>
            <CardDescription>
              This information will be used for the main ticket and event communications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="John Doe"
                  className="pl-10"
                />
              </div>
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="john@example.com"
                  className="pl-10"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  {...register('phone')}
                  placeholder="+251911234567 or 0911234567"
                  className="pl-10"
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Ethiopian phone number format
              </p>
            </div>

            {/* Company (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="company">Company / Organization</Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="company"
                  {...register('company')}
                  placeholder="Your company name"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Job Title (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="job_title"
                  {...register('job_title')}
                  placeholder="Your job title"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Gender (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                        <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Country (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guest Names (for multiple tickets) */}
        {totalTickets > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Guests</CardTitle>
              <CardDescription>
                You're purchasing {totalTickets} tickets. Optionally add names for other attendees.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showGuestNames ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowGuestNames(true)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Guest Names
                </Button>
              ) : (
                <div className="space-y-3">
                  {guestNameInputs.map((name, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Guest ${index + 1} name`}
                        value={name}
                        onChange={(e) => updateGuestName(index, e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeGuestName(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {guestNameInputs.length < totalTickets - 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addGuestName}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Another Guest
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Special Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Special Requirements</CardTitle>
            <CardDescription>Optional - Let us know if you have any special needs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dietary Requirements */}
            <div className="space-y-2">
              <Label htmlFor="dietary_requirements">Dietary Requirements</Label>
              <Textarea
                id="dietary_requirements"
                {...register('dietary_requirements')}
                placeholder="E.g., vegetarian, vegan, gluten-free, allergies..."
                rows={3}
              />
              {errors.dietary_requirements && (
                <p className="text-sm text-red-600">{errors.dietary_requirements.message}</p>
              )}
            </div>

            {/* Special Accommodations */}
            <div className="space-y-2">
              <Label htmlFor="special_accommodations">Special Accommodations</Label>
              <Textarea
                id="special_accommodations"
                {...register('special_accommodations')}
                placeholder="E.g., wheelchair access, sign language interpreter..."
                rows={3}
              />
              {errors.special_accommodations && (
                <p className="text-sm text-red-600">{errors.special_accommodations.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Terms and Conditions */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Terms Checkbox */}
            <div className="flex items-start gap-3">
              <Controller
                name="agreed_to_terms"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="agreed_to_terms"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <div className="space-y-1">
                <Label
                  htmlFor="agreed_to_terms"
                  className="text-sm font-normal cursor-pointer"
                >
                  I agree to the{' '}
                  <a href="#" className="text-blue-600 hover:underline">
                    Terms and Conditions
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </a>{' '}
                  <span className="text-red-500">*</span>
                </Label>
                {errors.agreed_to_terms && (
                  <p className="text-sm text-red-600">{errors.agreed_to_terms.message}</p>
                )}
              </div>
            </div>

            {/* Newsletter Checkbox */}
            <div className="flex items-start gap-3">
              <Controller
                name="subscribed_to_newsletter"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="subscribed_to_newsletter"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label
                htmlFor="subscribed_to_newsletter"
                className="text-sm font-normal cursor-pointer"
              >
                Send me updates about future events and special offers
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            size="lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tickets
          </Button>

          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? 'Processing...' : 'Continue to Payment'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </form>
  );
};

export default AttendeeDetailsStep;







