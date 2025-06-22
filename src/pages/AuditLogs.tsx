
import { useState } from "react";
import { Shield, Search, Filter, Calendar, User, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DashboardCard } from "@/components/DashboardCard";
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

const auditLogs = [
  {
    id: 1,
    timestamp: "2024-12-22 14:30:25",
    userId: "admin@vems.com",
    action: "CREATE_ORGANIZER",
    resource: "Elite Events Co.",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    severity: "info",
    details: "Created new organizer account"
  },
  {
    id: 2,
    timestamp: "2024-12-22 13:15:12",
    userId: "sarah@eliteevents.com",
    action: "UPDATE_EVENT",
    resource: "Tech Conference 2024",
    ipAddress: "203.0.113.45",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    severity: "info",
    details: "Updated event details and schedule"
  },
  {
    id: 3,
    timestamp: "2024-12-22 12:45:33",
    userId: "admin@vems.com",
    action: "SUSPEND_ORGANIZER",
    resource: "Creative Gatherings",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    severity: "warning",
    details: "Suspended organizer due to policy violations"
  },
  {
    id: 4,
    timestamp: "2024-12-22 11:20:18",
    userId: "mike@premierprods.com",
    action: "DELETE_EVENT",
    resource: "Product Launch Event",
    ipAddress: "198.51.100.78",
    userAgent: "Mozilla/5.0 (X11; Linux x86_64)",
    severity: "high",
    details: "Permanently deleted cancelled event"
  },
  {
    id: 5,
    timestamp: "2024-12-22 10:05:44",
    userId: "lisa@creativegatherings.com",
    action: "LOGIN_FAILED",
    resource: "Authentication System",
    ipAddress: "203.0.113.89",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
    severity: "error",
    details: "Multiple failed login attempts detected"
  }
];

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "info": return "bg-blue-100 text-blue-800 border-blue-200";
      case "warning": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "error": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes("CREATE") || action.includes("ADD")) return <User className="w-4 h-4" />;
    if (action.includes("UPDATE") || action.includes("EDIT")) return <Activity className="w-4 h-4" />;
    if (action.includes("DELETE") || action.includes("SUSPEND")) return <Shield className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.resource.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === "all" || log.action.toLowerCase().includes(actionFilter.toLowerCase());
    const matchesSeverity = severityFilter === "all" || log.severity === severityFilter;
    return matchesSearch && matchesAction && matchesSeverity;
  });

  const logStats = {
    total: auditLogs.length,
    info: auditLogs.filter(l => l.severity === "info").length,
    warning: auditLogs.filter(l => l.severity === "warning").length,
    error: auditLogs.filter(l => l.severity === "error").length,
    high: auditLogs.filter(l => l.severity === "high").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">Monitor system activities and security events</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Calendar className="w-4 h-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <DashboardCard title="Total Logs" className="text-center">
          <div className="text-2xl font-bold text-blue-600">{logStats.total}</div>
        </DashboardCard>
        <DashboardCard title="Info" className="text-center">
          <div className="text-2xl font-bold text-blue-600">{logStats.info}</div>
        </DashboardCard>
        <DashboardCard title="Warnings" className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{logStats.warning}</div>
        </DashboardCard>
        <DashboardCard title="Errors" className="text-center">
          <div className="text-2xl font-bold text-red-600">{logStats.error}</div>
        </DashboardCard>
        <DashboardCard title="High Priority" className="text-center">
          <div className="text-2xl font-bold text-purple-600">{logStats.high}</div>
        </DashboardCard>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
            <SelectItem value="login">Login</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="high">High Priority</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Audit Logs Table */}
      <DashboardCard title="System Activity Log">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-sm text-gray-600">
                  {log.timestamp}
                </TableCell>
                <TableCell>
                  <div className="font-medium text-gray-900">{log.userId}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getActionIcon(log.action)}
                    <span className="font-medium">{log.action}</span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-600">{log.resource}</TableCell>
                <TableCell>
                  <Badge className={getSeverityColor(log.severity)}>
                    {log.severity}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm text-gray-600">
                  {log.ipAddress}
                </TableCell>
                <TableCell className="text-gray-600 max-w-xs truncate">
                  {log.details}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DashboardCard>

      {filteredLogs.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No audit logs found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}
