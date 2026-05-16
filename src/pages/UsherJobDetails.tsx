import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import axios from 'axios';
import { UsherMobileLayout } from '@/components/UsherMobileLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

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
    <UsherMobileLayout title="Job Details">
      <div className="max-w-2xl mx-auto p-4 space-y-6 pb-20">
        <div className="hidden md:block">
          <Breadcrumbs 
            items={[
              { label: 'Usher Jobs', href: '/dashboard/usher-jobs' },
              { label: event?.name || 'Job Details' }
            ]}
            className="mb-4"
          />
        </div>
        
        <div className="space-y-1 pt-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Assignment Details</h2>
          <h1 className="text-3xl font-black text-white leading-tight">{event.name}</h1>
        </div>

        <Card className="border-white/10 bg-white/5 rounded-[2rem] overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-gray-500">Job Specification</CardTitle>
              <Badge 
                variant="outline" 
                className={cn(
                  "rounded-full px-3 py-1 text-[10px] font-black uppercase border-none",
                  event.accepted === 'accepted' ? "bg-green-500/10 text-green-400" : 
                  event.accepted === 'pending' ? "bg-yellow-500/10 text-yellow-400" : "bg-red-500/10 text-red-400"
                )}
              >
                {event.accepted}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <span className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Assigned Tasks</span>
                  <span className="text-white font-bold">{Array.isArray(event.tasks) ? event.tasks.join(', ') : 'General Assistance'}</span>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <span className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Daily Rate</span>
                  <span className="text-white font-bold">{event.daily_rate ? `${event.daily_rate} ETB` : 'Not specified'}</span>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <span className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Duration</span>
                  <span className="text-white font-bold">{event.from_date} <span className="text-gray-500 font-medium mx-1">to</span> {event.to_date}</span>
                </div>
              </div>
            </div>

            {event.accepted === 'pending' && (
              <div className="flex gap-3 pt-6">
                <Button 
                  className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-lg shadow-primary/20" 
                  disabled={actionLoading} 
                  onClick={handleAcceptJob}
                >
                  {actionLoading ? 'Processing...' : 'Accept Job'}
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1 h-14 rounded-2xl border-white/10 bg-white/5 text-white font-black uppercase tracking-widest hover:bg-white/10" 
                  disabled={actionLoading} 
                  onClick={() => setRejectDialogOpen(true)}
                >
                  Reject
                </Button>
              </div>
            )}

            {event.accepted === 'accepted' && (
              <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 mt-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <div>
                    <span className="block text-[10px] font-black uppercase text-green-400 tracking-widest">Expected Earnings</span>
                    <span className="text-xl font-black text-white">
                      {event.daily_rate && event.from_date && event.to_date ? `${calculateEarnings(event.daily_rate, event.from_date, event.to_date)} ETB` : '-'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {event.accepted === 'rejected' && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mt-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <div>
                    <span className="block text-[10px] font-black uppercase text-red-400 tracking-widest">Rejection Reason</span>
                    <span className="text-white font-bold">{event.rejected_reason || 'No reason provided'}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reject Reason Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent className="w-[95vw] max-w-md bg-[#0b1630] border-white/10 rounded-[2.5rem] p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black text-white uppercase tracking-tight">Reject Assignment</DialogTitle>
              <div className="text-gray-500 font-medium">Please provide a reason for declining this job.</div>
            </DialogHeader>
            <textarea
              className="w-full bg-white/5 border-white/10 rounded-2xl p-4 text-white placeholder:text-gray-500 focus:border-primary transition-all mb-6"
              rows={4}
              placeholder="E.g. Schedule conflict, distance, etc."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <DialogFooter className="gap-3">
              <Button variant="outline" className="h-14 rounded-2xl border-white/10 text-white flex-1" onClick={() => setRejectDialogOpen(false)} disabled={actionLoading}>Cancel</Button>
              <Button onClick={handleRejectJob} disabled={actionLoading || !rejectReason.trim()} className="h-14 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest flex-1">
                {actionLoading ? 'Rejecting...' : 'Reject Job'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </UsherMobileLayout>
  );
}

function calculateEarnings(dailyRate: number|string, fromDate: string, toDate: string) {
  if (!dailyRate || !fromDate || !toDate) return 0;
  const start = new Date(fromDate);
  const end = new Date(toDate);
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  return Number(dailyRate) * days;
} 