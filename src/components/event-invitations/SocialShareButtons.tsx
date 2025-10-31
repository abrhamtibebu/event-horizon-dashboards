import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mail, MessageCircle, Send, Facebook, Twitter, Linkedin, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTrackShare } from '@/lib/api/invitations';
import { getSocialShareUrl, generateShareText } from '@/lib/invitationUtils';
import type { SocialPlatform } from '@/types/invitations';

interface SocialShareButtonsProps {
  invitationUrl: string;
  invitationCode: string;
  eventName: string;
  eventType: 'free' | 'ticketed';
}

export function SocialShareButtons({
  invitationUrl,
  invitationCode,
  eventName,
  eventType
}: SocialShareButtonsProps) {
  const trackShareMutation = useTrackShare();

  const shareText = generateShareText(eventName, eventType);

  const handleShare = async (platform: SocialPlatform) => {
    try {
      // Track the share
      await trackShareMutation.mutateAsync({
        invitationCode,
        platform
      });

      // Open share URL
      const shareUrl = getSocialShareUrl(platform, invitationUrl, shareText);
      window.open(shareUrl, '_blank', 'width=600,height=400');

      toast.success(`Shared via ${platform.charAt(0).toUpperCase() + platform.slice(1)}!`);
    } catch (error) {
      console.error('Share tracking failed:', error);
      // Still open share URL even if tracking fails
      const shareUrl = getSocialShareUrl(platform, invitationUrl, shareText);
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Share2 className="w-5 h-5" />
        Share Invitation
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Button
          variant="outline"
          onClick={() => handleShare('whatsapp')}
          className="flex items-center justify-center gap-2 h-auto py-3"
        >
          <MessageCircle className="w-5 h-5 text-green-600" />
          <span>WhatsApp</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => handleShare('telegram')}
          className="flex items-center justify-center gap-2 h-auto py-3"
        >
          <Send className="w-5 h-5 text-blue-500" />
          <span>Telegram</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => handleShare('facebook')}
          className="flex items-center justify-center gap-2 h-auto py-3"
        >
          <Facebook className="w-5 h-5 text-blue-700" />
          <span>Facebook</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => handleShare('twitter')}
          className="flex items-center justify-center gap-2 h-auto py-3"
        >
          <Twitter className="w-5 h-5 text-sky-500" />
          <span>Twitter/X</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => handleShare('linkedin')}
          className="flex items-center justify-center gap-2 h-auto py-3"
        >
          <Linkedin className="w-5 h-5 text-blue-600" />
          <span>LinkedIn</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => handleShare('email')}
          className="flex items-center justify-center gap-2 h-auto py-3"
        >
          <Mail className="w-5 h-5 text-gray-600" />
          <span>Email</span>
        </Button>
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          💡 <strong>Tip:</strong> Each share is tracked so you can see which platforms perform best!
        </p>
      </div>
    </Card>
  );
}

