import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getVendors, deleteVendor, getVendorAverageRating } from '@/lib/api';

// Placeholder vendor data type
interface Vendor {
  id: number;
  name: string;
  company: string;
  category: string;
  status: 'active' | 'inactive';
  rating: number;
  assignedEvents: string[];
}

const categories = ['All', 'Catering', 'AV', 'Florist'];
const statuses = ['all', 'active', 'inactive'];

export default function VendorDashboard() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('all');
  const [avgRatings, setAvgRatings] = useState<{ [vendorId: number]: number | null }>({});

  useEffect(() => {
    getVendors().then(vs => {
      setVendors(vs);
      vs.forEach(v => {
        getVendorAverageRating(v.id).then(avg => {
          setAvgRatings(r => ({ ...r, [v.id]: avg }));
        });
      });
    });
  }, []);

  const filtered = vendors.filter(v =>
    (category === 'All' || v.category === category) &&
    (status === 'all' || v.status === status) &&
    (v.name.toLowerCase().includes(search.toLowerCase()) || v.company.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Vendors</h1>
        <div className="flex gap-2">
          <Link to="/dashboard/vendors/add">
            <Button variant="default">Add Vendor</Button>
          </Link>
          <Link to="/dashboard/vendors/assign">
            <Button variant="outline">Assign Vendor</Button>
          </Link>
          <Link to="/dashboard/vendors/tasks">
            <Button variant="outline">Task Tracker</Button>
          </Link>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 mb-4">
        <Input placeholder="Search by name or company" value={search} onChange={e => setSearch(e.target.value)} className="w-64" />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {statuses.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-x-auto bg-card rounded shadow border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned Events</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No vendors found.</TableCell></TableRow>
            ) : filtered.map(vendor => (
              <TableRow key={vendor.id}>
                <TableCell>
                  <Link to={`/dashboard/vendors/profile/${vendor.id}`} className="text-blue-600 hover:underline">
                    {vendor.name}
                  </Link>
                </TableCell>
                <TableCell>{vendor.company}</TableCell>
                <TableCell>{vendor.category}</TableCell>
                <TableCell>
                  <span className={vendor.status === 'active' ? 'text-green-600' : 'text-gray-400'}>{vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}</span>
                </TableCell>
                <TableCell>{vendor.assignedEvents.join(', ') || <span className="text-muted-foreground">None</span>}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={i < Math.round(avgRatings[vendor.id] ?? vendor.rating) ? 'text-yellow-400' : 'text-gray-300'} size={16} />
                    ))}
                    <span className="ml-1 text-xs text-muted-foreground">({(avgRatings[vendor.id] ?? vendor.rating)?.toFixed(1)})</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/dashboard/vendors/edit/${vendor.id}`}>Edit</Link>
                  </Button>
                  <Button size="sm" variant="destructive" className="ml-2" onClick={async () => {
                    if (window.confirm('Delete this vendor?')) {
                      await deleteVendor(vendor.id);
                      getVendors().then(setVendors);
                    }
                  }}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 