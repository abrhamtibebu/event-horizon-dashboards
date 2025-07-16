import { PartyPopper, Mail } from 'lucide-react';

export default function Messages() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="animate-bounce mb-4">
        <PartyPopper className="w-20 h-20 text-purple-500 drop-shadow-lg" />
      </div>
      <h1 className="text-4xl font-extrabold text-gradient bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
        Messages Coming Soon!
      </h1>
      <p className="text-lg text-gray-600 mb-6">
        We're working on something awesome for your event communications.<br />
        Stay tuned for a fun and powerful messaging experience!
      </p>
      <div className="flex flex-col items-center gap-2">
        <Mail className="w-10 h-10 text-blue-400 animate-pulse" />
        <span className="text-sm text-gray-400">Check back soon for updates 🚀</span>
      </div>
    </div>
  );
}
