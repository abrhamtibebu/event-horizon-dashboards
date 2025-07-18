import React, { useState, useEffect } from "react";
import { getVendors, assignVendorsToEvents } from '@/lib/api';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function AssignVendor() {
  const [vendors, setVendors] = useState([]);
  const [selectedVendors, setSelectedVendors] = useState<number[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<number[]>([]);
  const [taskDescription, setTaskDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Static mock events for now
  const mockEvents = [
    { id: 1, name: "Annual Gala" },
    { id: 2, name: "Tech Expo" },
  ];

  useEffect(() => {
    setLoading(true);
    getVendors()
      .then(vs => {
        setVendors(vs);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load vendors');
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await assignVendorsToEvents(selectedVendors, selectedEvents, {
      description: taskDescription,
      deadline,
      deliverables,
    });
    setSubmitting(false);
    setSuccess(true);
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">Assign Vendor to Event</h1>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Loading vendors...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : vendors.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No vendors available.</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="block mb-1">Vendors</Label>
                <select
                  multiple
                  className="w-full border rounded p-2 bg-background"
                  value={selectedVendors.map(String)}
                  onChange={e =>
                    setSelectedVendors(
                      Array.from(e.target.selectedOptions, opt => Number(opt.value))
                    )
                  }
                >
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="block mb-1">Events</Label>
                <select
                  multiple
                  className="w-full border rounded p-2 bg-background"
                  value={selectedEvents.map(String)}
                  onChange={e =>
                    setSelectedEvents(
                      Array.from(e.target.selectedOptions, opt => Number(opt.value))
                    )
                  }
                >
                  {mockEvents.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="block mb-1">Task Description</Label>
                <Input
                  as="textarea"
                  value={taskDescription}
                  onChange={e => setTaskDescription(e.target.value)}
                  required
                  className="resize-none min-h-[80px]"
                />
              </div>
              <div>
                <Label className="block mb-1">Deadline</Label>
                <Input
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label className="block mb-1">Deliverables</Label>
                <Input
                  type="text"
                  value={deliverables}
                  onChange={e => setDeliverables(e.target.value)}
                  placeholder="e.g. Menu, AV setup, etc."
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? "Assigning..." : "Assign Vendor"}
              </Button>
              {success && <div className="text-green-600 mt-2 text-center">Assignment successful!</div>}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 