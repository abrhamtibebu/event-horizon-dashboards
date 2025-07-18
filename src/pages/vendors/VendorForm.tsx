import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Upload } from 'lucide-react';
import { createVendor, getVendorById, updateVendor, uploadVendorFile, getVendorDocuments } from '@/lib/api';

const categories = ['Catering', 'AV', 'Florist', 'Security', 'Logistics'];

export default function VendorForm() {
  const { vendorId } = useParams();
  const isEdit = !!vendorId;
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    category: '',
    notes: '',
    files: [] as File[],
  });
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [fileDragActive, setFileDragActive] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    if (isEdit) {
      setFetching(true);
      getVendorById(vendorId).then(v => {
        if (v) setForm(f => ({ ...f, ...v }));
        getVendorDocuments(vendorId).then(setDocuments);
        setFetching(false);
      });
    }
  }, [isEdit, vendorId]);

  const validate = () => {
    const errs: any = {};
    if (!form.name) errs.name = 'Name is required';
    if (!form.company) errs.company = 'Company is required';
    if (!form.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) errs.email = 'Valid email required';
    if (!form.phone) errs.phone = 'Phone is required';
    if (!form.category) errs.category = 'Category is required';
    return errs;
  };

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    if (form.files.length + arr.length > 5) {
      setErrors((e: any) => ({ ...e, files: 'Max 5 files allowed' }));
      return;
    }
    setForm(f => ({ ...f, files: [...f.files, ...arr] }));
    setErrors((e: any) => ({ ...e, files: undefined }));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setFileDragActive(false);
    handleFileChange(e.dataTransfer.files);
  };

  const handleRemoveFile = (idx: number) => {
    setForm(f => ({ ...f, files: f.files.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      let vendor;
      if (isEdit) {
        vendor = await updateVendor(vendorId, form);
      } else {
        vendor = await createVendor(form);
      }
      // Upload files
      for (const file of form.files) {
        await uploadVendorFile(vendor.id, file);
      }
      setLoading(false);
      alert(isEdit ? 'Vendor updated successfully!' : 'Vendor created successfully!');
      window.history.back();
    } catch (err) {
      setLoading(false);
      setErrors((e: any) => ({ ...e, submit: isEdit ? 'Failed to update vendor' : 'Failed to create vendor' }));
    }
  };

  if (fetching) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{isEdit ? 'Edit Vendor' : 'Add Vendor'}</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            {errors.name && <div className="text-xs text-red-500 mt-1">{errors.name}</div>}
          </div>
          <div>
            <Label htmlFor="company">Company</Label>
            <Input id="company" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            {errors.company && <div className="text-xs text-red-500 mt-1">{errors.company}</div>}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            {errors.email && <div className="text-xs text-red-500 mt-1">{errors.email}</div>}
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            {errors.phone && <div className="text-xs text-red-500 mt-1">{errors.phone}</div>}
          </div>
          <div>
            <Label htmlFor="category">Service Category</Label>
            <Select value={form.category} onValueChange={val => setForm(f => ({ ...f, category: val }))}>
              <SelectTrigger id="category"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.category && <div className="text-xs text-red-500 mt-1">{errors.category}</div>}
          </div>
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
        </div>
        <div>
          <Label>Documents (max 5 files)</Label>
          <div
            className={`border-2 border-dashed rounded p-4 flex flex-col items-center gap-2 ${fileDragActive ? 'border-blue-500 bg-blue-50' : 'border-border'}`}
            onDragOver={e => { e.preventDefault(); setFileDragActive(true); }}
            onDragLeave={e => { e.preventDefault(); setFileDragActive(false); }}
            onDrop={handleDrop}
          >
            <Upload className="w-6 h-6 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">Drag & drop files here or</span>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              id="file-upload"
              onChange={e => handleFileChange(e.target.files)}
              disabled={form.files.length >= 5}
            />
            <label htmlFor="file-upload" className="text-primary underline cursor-pointer">Browse files</label>
            {errors.files && <div className="text-xs text-red-500 mt-1">{errors.files}</div>}
            <div className="flex flex-col gap-1 mt-2 w-full">
              {form.files.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm bg-muted rounded px-2 py-1">
                  <span className="truncate flex-1">{file.name}</span>
                  <Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveFile(idx)}><X className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
            {isEdit && documents.length > 0 && (
              <div className="w-full mt-4">
                <div className="font-semibold mb-1">Uploaded Documents</div>
                <ul className="space-y-1">
                  {documents.map(doc => (
                    <li key={doc.name} className="flex items-center gap-2">
                      <Upload className="w-4 h-4 text-muted-foreground" />
                      <span>{doc.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Vendor'}</Button>
        </div>
      </form>
    </div>
  );
} 