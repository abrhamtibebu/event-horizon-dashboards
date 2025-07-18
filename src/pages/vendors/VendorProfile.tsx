import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getVendorById, getVendorDocuments, getVendorReviews, addVendorReview, getVendorAverageRating } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, FileText, ArrowLeft } from 'lucide-react';

export default function VendorProfile() {
  const { vendorId } = useParams();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [documents, setDocuments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 0, review: '', reviewer: '', event: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    setLoading(true);
    getVendorById(vendorId)
      .then(v => {
        setVendor(v);
        setLoading(false);
        if (v) {
          getVendorDocuments(vendorId).then(setDocuments);
          getVendorReviews(vendorId).then(setReviews);
          getVendorAverageRating(vendorId).then(setAvgRating);
        }
      })
      .catch(() => {
        setError('Vendor not found');
        setLoading(false);
      });
  }, [vendorId]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    await addVendorReview(vendorId, {
      ...reviewForm,
      date: new Date().toISOString().slice(0, 10),
    });
    setReviewForm({ rating: 0, review: '', reviewer: '', event: '' });
    getVendorReviews(vendorId).then(setReviews);
    getVendorAverageRating(vendorId).then(setAvgRating);
    setSubmittingReview(false);
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error || !vendor) return <div className="p-6 text-red-500">{error || 'Vendor not found'}</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" className="mb-2" onClick={() => window.history.back()}><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-4">
            <span>{vendor.name}</span>
            <span className="text-sm text-muted-foreground">({vendor.category})</span>
            <span className={vendor.status === 'active' ? 'text-green-600 text-xs ml-2' : 'text-gray-400 text-xs ml-2'}>
              {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
            </span>
            <span className="flex items-center ml-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={i < Math.round(avgRating || vendor.rating) ? 'text-yellow-400' : 'text-gray-300'} size={16} />
              ))}
              <span className="ml-1 text-xs text-muted-foreground">({(avgRating || vendor.rating)?.toFixed(1)})</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="font-semibold mb-1">Contact Info</div>
              <div className="text-sm">Email: <span className="text-muted-foreground">{vendor.email}</span></div>
              <div className="text-sm">Phone: <span className="text-muted-foreground">{vendor.phone}</span></div>
              <div className="text-sm">Company: <span className="text-muted-foreground">{vendor.company}</span></div>
            </div>
            <div>
              <div className="font-semibold mb-1">Services Offered</div>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                {vendor.services.map(s => <li key={s}>{s}</li>)}
              </ul>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="font-semibold mb-1">Legal Documents</div>
              <ul className="space-y-1">
                {documents.map(doc => (
                  <li key={doc.name} className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <a href={doc.url} className="underline text-primary" target="_blank" rel="noopener noreferrer">{doc.name}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-1">Contracts</div>
              <ul className="space-y-1">
                {vendor.contracts.map(doc => (
                  <li key={doc.name} className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <a href={doc.url} className="underline text-primary" target="_blank" rel="noopener noreferrer">{doc.name}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div>
            <div className="font-semibold mb-1">Assigned Events & Ratings</div>
            <ul className="space-y-1 text-sm">
              {vendor.assignedEvents.map(ev => (
                <li key={ev.name} className="flex items-center gap-2">
                  <span>{ev.name} ({ev.date})</span>
                  <span className="flex items-center ml-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={i < ev.rating ? 'text-yellow-400' : 'text-gray-300'} size={14} />
                    ))}
                    <span className="ml-1 text-xs text-muted-foreground">({ev.rating})</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-1">Notes</div>
            <div className="text-sm text-muted-foreground whitespace-pre-line">{vendor.notes}</div>
          </div>
          <div>
            <div className="font-semibold mb-1">Ratings & Reviews</div>
            <div className="mb-2">
              <form onSubmit={handleReviewSubmit} className="flex flex-col gap-2 md:flex-row md:items-end md:gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Your Name</label>
                  <input type="text" className="border rounded p-1 w-40" value={reviewForm.reviewer} onChange={e => setReviewForm(f => ({ ...f, reviewer: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Event</label>
                  <input type="text" className="border rounded p-1 w-40" value={reviewForm.event} onChange={e => setReviewForm(f => ({ ...f, event: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Rating</label>
                  <select className="border rounded p-1 w-24" value={reviewForm.rating} onChange={e => setReviewForm(f => ({ ...f, rating: Number(e.target.value) }))} required>
                    <option value={0}>Select</option>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Review</label>
                  <input type="text" className="border rounded p-1 w-full" value={reviewForm.review} onChange={e => setReviewForm(f => ({ ...f, review: e.target.value }))} required />
                </div>
                <Button type="submit" disabled={submittingReview || !reviewForm.rating || !reviewForm.reviewer || !reviewForm.event || !reviewForm.review}>{submittingReview ? 'Submitting...' : 'Submit'}</Button>
              </form>
            </div>
            <ul className="space-y-2">
              {reviews.length === 0 && <li className="text-muted-foreground text-sm">No reviews yet.</li>}
              {reviews.map((r, i) => (
                <li key={i} className="border rounded p-2 bg-muted">
                  <div className="flex items-center gap-2 mb-1">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className={j < r.rating ? 'text-yellow-400' : 'text-gray-300'} size={14} />
                    ))}
                    <span className="ml-2 font-medium">{r.reviewer}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{r.event} • {r.date}</span>
                  </div>
                  <div className="text-sm">{r.review}</div>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 