import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import axios from 'axios';

export default function UsherJobDetails() {
  const { eventId } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    axios.get(`/api/usher/events`).then(res => {
      const found = res.data.find((e: any) => String(e.id) === String(eventId));
      setEvent(found);
      setLoading(false);
    }).catch(() => {
      setError('Failed to load job details.');
      setLoading(false);
    });
  }, [eventId]);

  const handleAcceptJob = async () => {
    setActionLoading(true);
    try {
      await axios.post(`/api/events/${eventId}/usher/accept`);
      window.location.reload();
    } catch {
      alert('Failed to accept job.');
    } finally {
      setActionLoading(false);
    }
  };
  const handleRejectJob = async () => {
    setActionLoading(true);
    try {
      await axios.post(`/api/events/${eventId}/usher/reject`, { reason: rejectReason });
      setRejectDialogOpen(false);
      setRejectReason('');
      window.location.reload();
    } catch {
      alert('Failed to reject job.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading job details...</div>;
  if (error || !event) return <div className="p-8 text-center text-red-500">{error || 'Job not found.'}</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-2">Job Details for {event.name}</h1>
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <span className="block text-sm font-medium text-gray-700">Assigned Tasks:</span>
          <span className="block text-gray-800">{Array.isArray(event.tasks) ? event.tasks.join(', ') : ''}</span>
        </div>
        <div>
          <span className="block text-sm font-medium text-gray-700">Daily Rate:</span>
          <span className="block text-gray-800">{event.daily_rate ? `${event.daily_rate} ETB` : '-'}</span>
        </div>
        <div>
          <span className="block text-sm font-medium text-gray-700">Ushering Days:</span>
          <span className="block text-gray-800">{event.from_date} to {event.to_date}</span>
        </div>
        <div>
          <span className="block text-sm font-medium text-gray-700">Status:</span>
          <span className="block text-gray-800 capitalize">{event.accepted}</span>
        </div>
        {event.accepted === 'pending' && (
          <div className="flex gap-2 mt-2">
            <Button className="bg-green-600 text-white" disabled={actionLoading} onClick={handleAcceptJob}>Accept</Button>
            <Button className="bg-red-600 text-white" disabled={actionLoading} onClick={() => setRejectDialogOpen(true)}>Reject</Button>
          </div>
        )}
        {event.accepted === 'accepted' && (
          <div className="text-green-700 font-semibold mt-2">
            Expected Earnings: {event.daily_rate && event.from_date && event.to_date ? `${calculateEarnings(event.daily_rate, event.from_date, event.to_date)} ETB` : '-'}
          </div>
        )}
        {event.accepted === 'rejected' && (
          <div className="text-red-700 font-semibold mt-2">
            Rejected: {event.rejected_reason || 'No reason provided'}
          </div>
        )}
      </div>
      {/* Reject Reason Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Job</DialogTitle>
            <div className="text-sm text-gray-500">Provide a reason for rejecting this job assignment.</div>
          </DialogHeader>
          <textarea
            className="w-full border rounded px-2 py-1 mt-2"
            rows={3}
            placeholder="Reason for rejection"
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={actionLoading}>Cancel</Button>
            <Button onClick={handleRejectJob} disabled={actionLoading || !rejectReason.trim()} className="bg-red-600 text-white">
              {actionLoading ? 'Rejecting...' : 'Reject Job'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function calculateEarnings(dailyRate: number|string, fromDate: string, toDate: string) {
  if (!dailyRate || !fromDate || !toDate) return 0;
  const start = new Date(fromDate);
  const end = new Date(toDate);
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  return Number(dailyRate) * days;
} 