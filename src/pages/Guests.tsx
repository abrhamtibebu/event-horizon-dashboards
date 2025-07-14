import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { DashboardCard } from '@/components/DashboardCard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Users as UsersIcon, Mail, MessageSquare } from 'lucide-react';
import { getAllGuests } from '@/lib/api';

interface Guest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  jobtitle?: string;
  gender?: string;
  country?: string;
  guestType?: { name: string };
  guest_type?: string;
  [key: string]: any;
}

export default function Guests() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    getAllGuests()
      .then(res => {
        setGuests(res.data);
        setError(null);
      })
      .catch(() => setError('Failed to fetch guests.'))
      .finally(() => setLoading(false));
  }, []);

  const filteredGuests = guests.filter(g => {
    const search = filter.toLowerCase();
    return (
      g.name?.toLowerCase().includes(search) ||
      g.email?.toLowerCase().includes(search) ||
      g.phone?.toLowerCase().includes(search) ||
      g.company?.toLowerCase().includes(search) ||
      g.jobtitle?.toLowerCase().includes(search) ||
      g.gender?.toLowerCase().includes(search) ||
      g.country?.toLowerCase().includes(search)
    );
  });

  const allSelected =
    filteredGuests.length > 0 &&
    filteredGuests.every((g) => selected.includes(g.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(selected.filter((id) => !filteredGuests.some((g) => g.id === id)));
    } else {
      setSelected([
        ...selected,
        ...filteredGuests.filter((g) => !selected.includes(g.id)).map((g) => g.id),
      ]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  // Placeholder handlers for actions
  const handleSendEmail = (ids: string[]) => {
    alert(`Send email to: ${ids.join(', ')}`);
  };
  const handleSendSMS = (ids: string[]) => {
    alert(`Send SMS to: ${ids.join(', ')}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Guest Management</h1>
          <p className="text-gray-600 mt-1">View and manage all guests across events</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            disabled={selected.length === 0}
            onClick={() => handleSendEmail(selected)}
          >
            <Mail className="w-4 h-4" /> Send Email
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            disabled={selected.length === 0}
            onClick={() => handleSendSMS(selected)}
          >
            <MessageSquare className="w-4 h-4" /> Send SMS
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search guests..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loading/Error States */}
      {loading && <div className="text-center py-12">Loading guests...</div>}
      {error && <div className="text-center py-12 text-red-500">{error}</div>}

      {/* Guests Table */}
      {!loading && !error && filteredGuests.length > 0 && (
        <DashboardCard title="Guests" className="shadow-lg rounded-xl border-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all guests"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Guest Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGuests.map(guest => (
                  <TableRow
                    key={guest.id}
                    className="hover:bg-blue-50 transition-colors group"
                  >
                    <TableCell>
                      <Checkbox
                        checked={selected.includes(guest.id)}
                        onCheckedChange={() => toggleSelect(guest.id)}
                        aria-label={`Select guest ${guest.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-8 h-8 flex items-center justify-center font-bold text-white shadow">
                          {guest.name
                            ?.split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold group-hover:text-blue-700 transition-colors">{guest.name}</div>
                          <div className="text-xs text-gray-500">{guest.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{guest.email}</TableCell>
                    <TableCell>{guest.phone || '-'}</TableCell>
                    <TableCell>{guest.company || '-'}</TableCell>
                    <TableCell>{guest.jobtitle || '-'}</TableCell>
                    <TableCell>{guest.gender || '-'}</TableCell>
                    <TableCell>{guest.country || '-'}</TableCell>
                    <TableCell>{guest.guestType?.name || guest.guest_type || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                          onClick={() => handleSendEmail([guest.id])}
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                          onClick={() => handleSendSMS([guest.id])}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DashboardCard>
      )}

      {/* Empty State */}
      {!loading && !error && filteredGuests.length === 0 && (
        <div className="text-center py-12">
          <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No guests found</h3>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
} 