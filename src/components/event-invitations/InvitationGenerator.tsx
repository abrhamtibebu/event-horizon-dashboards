import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Download, QrCode, RefreshCw, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { useGenerateInvitation } from '@/lib/api/invitations';
import { generateInvitationUrl, downloadQRCode } from '@/lib/invitationUtils';

interface InvitationGeneratorProps {
  eventId: number;
  eventUuid: string;
  eventName: string;
  isOrganizer: boolean;
}

export function InvitationGenerator({
  eventId,
  eventUuid,
  eventName,
  isOrganizer
}: InvitationGeneratorProps) {
  const [activeType, setActiveType] = useState<'generic' | 'personalized'>('personalized');
  const [currentInvitation, setCurrentInvitation] = useState<{
    code: string;
    url: string;
    qrUrl: string;
  } | null>(null);

  const generateMutation = useGenerateInvitation();

  const handleGenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync({
        eventId,
        type: activeType
      });

      const invitationUrl = generateInvitationUrl(
        window.location.origin,
        eventUuid,
        result.invitation_code
      );

      setCurrentInvitation({
        code: result.invitation_code,
        url: invitationUrl,
        qrUrl: result.qr_code_url || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(invitationUrl)}`
      });

      toast.success(`${activeType === 'generic' ? 'Generic' : 'Personalized'} invitation link generated!`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate invitation');
    }
  };

  const handleCopyLink = () => {
    if (currentInvitation) {
      navigator.clipboard.writeText(currentInvitation.url);
      toast.success('Invitation link copied to clipboard!');
    }
  };

  const handleCopyCode = () => {
    if (currentInvitation) {
      navigator.clipboard.writeText(currentInvitation.code);
      toast.success('Invitation code copied to clipboard!');
    }
  };

  const handleDownloadQR = () => {
    if (currentInvitation) {
      downloadQRCode(
        currentInvitation.qrUrl,
        `invitation-qr-${eventName.replace(/[^a-zA-Z0-9]/g, '-')}-${currentInvitation.code}.png`
      );
      toast.success('QR code downloaded!');
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Link2 className="w-5 h-5" />
        Generate Invitation Link
      </h3>

      <Tabs value={activeType} onValueChange={(value) => setActiveType(value as 'generic' | 'personalized')}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="personalized">Personalized Link</TabsTrigger>
          <TabsTrigger value="generic">Generic Link</TabsTrigger>
        </TabsList>

        <TabsContent value="personalized">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Generate a unique invitation link that tracks clicks and registrations attributed to you.
            </p>
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="w-full"
            >
              {generateMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 mr-2" />
                  Generate Personalized Link
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="generic">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Generate a general invitation link that can be shared with anyone. {isOrganizer ? 'Clicks and registrations will be tracked but not attributed to specific users.' : 'This link is the same for all users.'}
            </p>
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="w-full"
            >
              {generateMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 mr-2" />
                  Generate Generic Link
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {currentInvitation && (
        <div className="mt-6 space-y-4 pt-6 border-t">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Invitation Code
            </label>
            <div className="flex gap-2">
              <Input
                value={currentInvitation.code}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyCode}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Invitation Link
            </label>
            <div className="flex gap-2">
              <Input
                value={currentInvitation.url}
                readOnly
                className="text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyLink}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white p-2 rounded border">
                <img
                  src={currentInvitation.qrUrl}
                  alt="Invitation QR Code"
                  className="w-24 h-24"
                />
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">QR Code</h4>
                <p className="text-xs text-gray-600">
                  Scan to access the invitation
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadQR}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

