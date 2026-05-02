import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Copy, 
  Download, 
  RefreshCw, 
  Link2, 
  Mail, 
  UserPlus, 
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useGenerateInvitation, useBulkGenerateInvitations } from '@/lib/api/invitations';
import { generateInvitationUrl, downloadQRCode } from '@/lib/invitationUtils';

interface InvitationGeneratorProps {
  eventId: number;
  eventUuid: string;
  eventName: string;
  isOrganizer: boolean;
  defaultType?: 'generic' | 'personalized' | 'exhibitor' | 'speaker' | 'vip' | 'media';
  onGenerated?: (invitation: { code: string; url: string }) => void;
}

type InvitationType = 'generic' | 'personalized' | 'exhibitor' | 'speaker' | 'vip' | 'media';

export function InvitationGenerator({
  eventId,
  eventUuid,
  eventName,
  defaultType,
  onGenerated
}: InvitationGeneratorProps) {
  const [invitationType, setInvitationType] = useState<InvitationType>(defaultType || 'personalized');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isBulk, setIsBulk] = useState(false);
  const [csvData, setCsvData] = useState<Array<{ name: string; email: string; type: string }> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentInvitation, setCurrentInvitation] = useState<{
    code: string;
    url: string;
    qrUrl: string;
  } | null>(null);

  const generateMutation = useGenerateInvitation();
  const bulkMutation = useBulkGenerateInvitations();

  const handleGenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync({
        eventId,
        type: invitationType,
        recipientName: recipientName || undefined,
        recipientEmail: recipientEmail || undefined,
        expiresAt: expiresAt || undefined,
      });

      const publicUrl = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
      const invitationUrl = generateInvitationUrl(
        publicUrl,
        eventUuid,
        result.invitation_code
      );

      const invitationData = {
        code: result.invitation_code,
        url: invitationUrl,
        qrUrl: result.qr_code_url || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(invitationUrl)}`,
      };

      setCurrentInvitation(invitationData);
      
      if (onGenerated) {
        onGenerated({ code: invitationData.code, url: invitationData.url });
      }

      toast.success(recipientName ? 'Personalized invitation created!' : 'Generic registration link created!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate link');
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').filter(row => row.trim());
      // Skip header if it exists (check for "name" or "email")
      const startIndex = rows[0].toLowerCase().includes('name') ? 1 : 0;
      
      const parsed = rows.slice(startIndex).map(row => {
        const columns = row.split(',').map(col => col.trim());
        return {
          name: columns[0] || '',
          email: columns[1] || '',
          type: columns[2] || invitationType
        };
      }).filter(item => item.name && item.email);

      setCsvData(parsed);
      toast.success(`Parsed ${parsed.length} recipients`);
    };
    reader.readAsText(file);
  };

  const handleBulkGenerate = async () => {
    if (!csvData) return;
    try {
      await bulkMutation.mutateAsync({
        eventId,
        invitations: csvData
      });
      toast.success(`Successfully sent ${csvData.length} invitations!`);
      setCsvData(null);
      setIsBulk(false);
    } catch (error: any) {
      toast.error('Bulk generation failed');
    }
  };

  const isRoleBased = ['exhibitor', 'speaker', 'vip', 'media'].includes(invitationType);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Generator</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs h-7 gap-2"
          onClick={() => {
            setIsBulk(!isBulk);
            setCsvData(null);
            setCurrentInvitation(null);
          }}
        >
          {isBulk ? <UserPlus className="w-3 h-3" /> : <Upload className="w-3 h-3" />}
          {isBulk ? 'Single Invitation' : 'Bulk CSV Upload'}
        </Button>
      </div>

      <div className="space-y-4 bg-card border border-border p-5 rounded-xl shadow-sm">
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase">Target Type</Label>
          <Select value={invitationType} onValueChange={(v: any) => setInvitationType(v)}>
            <SelectTrigger className="h-10 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personalized">Standard Visitor</SelectItem>
              <SelectItem value="exhibitor">Exhibitor</SelectItem>
              <SelectItem value="media">Press / Media</SelectItem>
              <SelectItem value="speaker">Speaker</SelectItem>
              <SelectItem value="vip">VIP Guest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isBulk ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <div 
              className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleCsvUpload} 
                accept=".csv" 
                className="hidden" 
              />
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium">Click to upload CSV</p>
              <p className="text-[10px] text-muted-foreground mt-1">Format: Name, Email, Type (optional)</p>
            </div>

            {csvData && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-medium">{csvData.length} recipients ready</span>
                </div>
                <Button 
                  size="sm" 
                  className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleBulkGenerate}
                  disabled={bulkMutation.isPending}
                >
                  {bulkMutation.isPending ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Process Bulk'}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Recipient Name (Optional)</Label>
                <Input 
                  placeholder="Leave empty for public link" 
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="h-10 rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Email (Sends Invitation)</Label>
                <Input 
                  placeholder="email@example.com" 
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="h-10 rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Expiry (Optional)</Label>
              <Input 
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="h-10 rounded-lg"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="w-full bg-primary text-primary-foreground h-10 rounded-lg font-semibold shadow-sm"
            >
              {generateMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                recipientName ? 'Create Personalized Link' : `Create Public ${invitationType.charAt(0).toUpperCase() + invitationType.slice(1)} Link`
              )}
            </Button>
          </div>
        )}
      </div>

      {currentInvitation && (
        <div className="p-4 bg-muted/20 border border-border rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2 border-dashed">
          <div className="flex gap-2">
            <Input
              value={currentInvitation.url}
              readOnly
              className="bg-background border-border text-[10px] h-9 font-mono"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(currentInvitation.url);
                toast.success('Copied!');
              }}
              className="h-9 px-3 shrink-0"
            >
              <Copy className="w-3.5 h-3.5 mr-2" />
              Copy
            </Button>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <div className="flex items-center gap-3">
              <div className="bg-white p-1 rounded border border-border shadow-sm">
                <img src={currentInvitation.qrUrl} className="w-12 h-12" alt="QR" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Invitation Code</p>
                <p className="text-xs font-mono font-bold text-primary">{currentInvitation.code}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                downloadQRCode(currentInvitation!.qrUrl, `qr-${currentInvitation!.code}.png`);
              }}
              className="text-xs h-8"
            >
              <Download className="w-3.5 h-3.5 mr-2" />
              QR
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}



