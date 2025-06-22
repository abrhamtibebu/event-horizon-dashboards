import { useState } from "react";
import { Users, Search, Filter, Plus, Mail, Phone, Edit, Trash2, UserCheck, UserX, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DashboardCard } from "@/components/DashboardCard";
import { Link } from "react-router-dom";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const organizers = [
  {
    id: 1,
    name: "Elite Events Co.",
    contactPerson: "Sarah Thompson",
    email: "sarah@eliteevents.com",
    phone: "+1 (555) 123-4567",
    status: "active",
    eventsManaged: 15,
    primaryContact: "Sarah Thompson",
    assignedContacts: 3,
    joinDate: "2024-01-15",
    lastActivity: "2 hours ago"
  },
  {
    id: 2,
    name: "Premier Productions",
    contactPerson: "Michael Davis",
    email: "m.davis@premierprods.com",
    phone: "+1 (555) 234-5678",
    status: "active",
    eventsManaged: 8,
    primaryContact: "Michael Davis",
    assignedContacts: 2,
    joinDate: "2024-02-20",
    lastActivity: "1 day ago"
  },
  {
    id: 3,
    name: "Creative Gatherings",
    contactPerson: "Lisa Wilson",
    email: "lisa@creativegatherings.com",
    phone: "+1 (555) 345-6789",
    status: "suspended",
    eventsManaged: 12,
    primaryContact: "Lisa Wilson",
    assignedContacts: 4,
    joinDate: "2024-03-10",
    lastActivity: "1 week ago"
  },
  {
    id: 4,
    name: "Urban Events LLC",
    contactPerson: "James Rodriguez",
    email: "james@urbanevents.com",
    phone: "+1 (555) 456-7890",
    status: "inactive",
    eventsManaged: 5,
    primaryContact: "James Rodriguez",
    assignedContacts: 1,
    joinDate: "2024-04-05",
    lastActivity: "2 weeks ago"
  }
];

export default function Organizers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 border-green-200";
      case "inactive": return "bg-gray-100 text-gray-800 border-gray-200";
      case "suspended": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredOrganizers = organizers.filter(organizer => {
    const matchesSearch = organizer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         organizer.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         organizer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || organizer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const organizerStats = {
    total: organizers.length,
    active: organizers.filter(o => o.status === "active").length,
    inactive: organizers.filter(o => o.status === "inactive").length,
    suspended: organizers.filter(o => o.status === "suspended").length,
    totalEvents: organizers.reduce((sum, o) => sum + o.eventsManaged, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizer Management</h1>
          <p className="text-gray-600 mt-1">Manage event organizers, contacts, and permissions</p>
        </div>
        <Link to="/organizers/add">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Organizer
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <DashboardCard title="Total Organizers" className="text-center">
          <div className="text-2xl font-bold text-blue-600">{organizerStats.total}</div>
        </DashboardCard>
        <DashboardCard title="Active" className="text-center">
          <div className="text-2xl font-bold text-green-600">{organizerStats.active}</div>
        </DashboardCard>
        <DashboardCard title="Inactive" className="text-center">
          <div className="text-2xl font-bold text-gray-600">{organizerStats.inactive}</div>
        </DashboardCard>
        <DashboardCard title="Suspended" className="text-center">
          <div className="text-2xl font-bold text-red-600">{organizerStats.suspended}</div>
        </DashboardCard>
        <DashboardCard title="Total Events" className="text-center">
          <div className="text-2xl font-bold text-purple-600">{organizerStats.totalEvents}</div>
        </DashboardCard>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search organizers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Organizers Table */}
      <DashboardCard title="Organizers">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Primary Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Events Managed</TableHead>
              <TableHead>Assigned Contacts</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrganizers.map((organizer) => (
              <TableRow key={organizer.id}>
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900">{organizer.name}</div>
                    <div className="text-sm text-gray-500">Joined {organizer.joinDate}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900">{organizer.contactPerson}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      {organizer.email}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      {organizer.phone}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(organizer.status)}>
                    {organizer.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-600">{organizer.eventsManaged}</TableCell>
                <TableCell className="text-gray-600">{organizer.assignedContacts}</TableCell>
                <TableCell className="text-gray-600">{organizer.lastActivity}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <UserCheck className="w-4 h-4" />
                    </Button>
                    {organizer.status === "active" ? (
                      <Button variant="outline" size="sm">
                        <UserX className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm">
                        <Power className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DashboardCard>

      {filteredOrganizers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No organizers found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}
