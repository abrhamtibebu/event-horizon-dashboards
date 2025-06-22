
import { useState } from "react";
import { 
  Upload, 
  Download, 
  Search, 
  MapPin, 
  Filter,
  FileText,
  CheckCircle,
  AlertCircle,
  Users
} from "lucide-react";
import { DashboardCard } from "@/components/DashboardCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const sampleBadgeData = [
  {
    id: 1,
    name: "John Smith",
    company: "Tech Corp",
    email: "john.smith@techcorp.com",
    guestType: "VIP",
    zone: "A",
    section: "A1",
    table: "12",
    seat: "3",
    status: "located",
    checkIn: "09:15 AM"
  },
  {
    id: 2,
    name: "Sarah Johnson",
    company: "Marketing Plus",
    email: "sarah.johnson@marketingplus.com",
    guestType: "Speaker",
    zone: "B",
    section: "B2",
    table: "8",
    seat: "1",
    status: "located",
    checkIn: "08:45 AM"
  },
  {
    id: 3,
    name: "Mike Davis",
    company: "Innovation Ltd",
    email: "mike.davis@innovation.com",
    guestType: "Visitor",
    zone: "C",
    section: "C3",
    table: "25",
    seat: "7",
    status: "pending",
    checkIn: "-"
  },
  {
    id: 4,
    name: "Lisa Wilson",
    company: "Business Solutions",
    email: "lisa.wilson@bizsolut.com",
    guestType: "Staff",
    zone: "A",
    section: "A2",
    table: "5",
    seat: "2",
    status: "located",
    checkIn: "09:30 AM"
  }
];

export default function LocateBadges() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedZone, setSelectedZone] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "located": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "missing": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getGuestTypeColor = (type: string) => {
    switch (type) {
      case "VIP": return "bg-purple-100 text-purple-800";
      case "Speaker": return "bg-blue-100 text-blue-800";
      case "Staff": return "bg-green-100 text-green-800";
      case "Visitor": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = `Name,Company,Email,Guest Type,Zone,Section,Table,Seat
John Smith,Tech Corp,john.smith@techcorp.com,VIP,A,A1,12,3
Sarah Johnson,Marketing Plus,sarah.johnson@marketingplus.com,Speaker,B,B2,8,1
Mike Davis,Innovation Ltd,mike.davis@innovation.com,Visitor,C,C3,25,7
Lisa Wilson,Business Solutions,lisa.wilson@bizsolut.com,Staff,A,A2,5,2`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'badge_location_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredData = sampleBadgeData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZone = selectedZone === "all" || item.zone === selectedZone;
    const matchesStatus = selectedStatus === "all" || item.status === selectedStatus;
    
    return matchesSearch && matchesZone && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Locate Badges</h1>
          <p className="text-gray-600 mt-1">Manage badge locations and seating arrangements</p>
        </div>
        <Button 
          onClick={downloadSampleCSV}
          variant="outline"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Sample CSV
        </Button>
      </div>

      {/* Upload Section */}
      <DashboardCard title="Upload Badge Location Data">
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">Upload CSV File</p>
              <p className="text-gray-600">
                Upload a CSV file with guest information and badge location details
              </p>
              <div className="flex items-center justify-center gap-4 mt-4">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
                >
                  Choose File
                </label>
                {uploadedFile && (
                  <span className="text-sm text-gray-600">
                    Selected: {uploadedFile.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">CSV Format Requirements</h4>
                <p className="text-blue-700 text-sm mt-1">
                  Your CSV file should include the following columns: Name, Company, Email, Guest Type, Zone, Section, Table, Seat
                </p>
                <ul className="text-blue-700 text-sm mt-2 list-disc list-inside">
                  <li>Guest Type: VIP, Speaker, Staff, or Visitor</li>
                  <li>Zone: Alphabetic zones (A, B, C, etc.)</li>
                  <li>Section: Zone + number (A1, B2, C3, etc.)</li>
                  <li>Table: Numeric table number</li>
                  <li>Seat: Numeric seat number</li>
                </ul>
              </div>
            </div>
          </div>

          {uploadedFile && (
            <div className="flex gap-3">
              <Button className="bg-gradient-to-r from-green-600 to-blue-600">
                <CheckCircle className="w-4 h-4 mr-2" />
                Process Upload
              </Button>
              <Button variant="outline" onClick={() => setUploadedFile(null)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </DashboardCard>

      {/* Search and Filter Section */}
      <DashboardCard title="Badge Location Management">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedZone} onValueChange={setSelectedZone}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select Zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                <SelectItem value="A">Zone A</SelectItem>
                <SelectItem value="B">Zone B</SelectItem>
                <SelectItem value="C">Zone C</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="located">Located</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="missing">Missing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Badges</p>
                  <p className="text-2xl font-bold text-blue-900">{sampleBadgeData.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Located</p>
                  <p className="text-2xl font-bold text-green-900">
                    {sampleBadgeData.filter(item => item.status === 'located').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium">Pending</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {sampleBadgeData.filter(item => item.status === 'pending').length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">VIP Guests</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {sampleBadgeData.filter(item => item.guestType === 'VIP').length}
                  </p>
                </div>
                <MapPin className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Guest Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.company}</TableCell>
                    <TableCell>
                      <Badge className={getGuestTypeColor(item.guestType)}>
                        {item.guestType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Zone {item.zone} - {item.section}</div>
                        <div className="text-gray-600">Table {item.table}, Seat {item.seat}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.checkIn}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <MapPin className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
}
