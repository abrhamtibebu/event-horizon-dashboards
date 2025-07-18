import React, { useState, useEffect } from "react";
import { getVendorTasks, updateVendorTaskStatus, uploadVendorFile } from '@/lib/api';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function VendorTaskTracker() {
  const [tasks, setTasks] = useState([]);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [fileInputs, setFileInputs] = useState<{ [key: number]: File | null }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getVendorTasks()
      .then(ts => {
        setTasks(ts);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load tasks');
        setLoading(false);
      });
  }, []);

  const handleStatusChange = async (id: number, status: string) => {
    await updateVendorTaskStatus(id, status);
    getVendorTasks().then(setTasks);
  };

  const handleFileChange = (id: number, file: File | null) => {
    setFileInputs(inputs => ({ ...inputs, [id]: file }));
  };

  const handleFileUpload = async (id: number) => {
    setUploadingId(id);
    const file = fileInputs[id];
    if (file) {
      await uploadVendorFile(id, file);
      setFileInputs(inputs => ({ ...inputs, [id]: null }));
      getVendorTasks().then(setTasks);
    }
    setUploadingId(null);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">Vendor Task Tracker</h1>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Loading tasks...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : tasks.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No tasks available.</div>
          ) : (
            <div className="space-y-6">
              {tasks.map(task => (
                <Card key={task.id} className="bg-card">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="font-semibold">Vendor:</span> {task.vendor}
                        <span className="ml-4 font-semibold">Event:</span> {task.event}
                      </div>
                      <div>
                        <Label className="mr-2">Status</Label>
                        <select
                          className="border rounded p-1 bg-background"
                          value={task.status}
                          onChange={e => handleStatusChange(task.id, e.target.value)}
                        >
                          <option>Pending</option>
                          <option>In Progress</option>
                          <option>Completed</option>
                          <option>Delayed</option>
                        </select>
                      </div>
                    </div>
                    <div className="mb-1">
                      <span className="font-semibold">Task:</span> {task.description}
                    </div>
                    <div className="mb-1">
                      <span className="font-semibold">Deadline:</span> {task.deadline}
                    </div>
                    <div className="mb-1">
                      <span className="font-semibold">Deliverables:</span> {task.deliverables}
                    </div>
                    <div className="mb-1">
                      <span className="font-semibold">Files:</span> {task.files.length ? task.files.join(", ") : "None"}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type="file"
                        onChange={e =>
                          handleFileChange(task.id, e.target.files ? e.target.files[0] : null)
                        }
                        disabled={uploadingId === task.id}
                        className="w-auto"
                      />
                      <Button
                        className=""
                        onClick={() => handleFileUpload(task.id)}
                        disabled={!fileInputs[task.id] || uploadingId === task.id}
                      >
                        {uploadingId === task.id ? "Uploading..." : "Upload File"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 