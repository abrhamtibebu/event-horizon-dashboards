import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Mail, Download, Home, ArrowRight, ShieldCheck, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TicketPurchaseSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <motion.div
        className="max-w-xl w-full relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Card className="border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] dark:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="h-2 w-full bg-brand-gradient" />
          <CardContent className="p-8 md:p-12 text-center space-y-8">
            {/* Header */}
            <div className="space-y-4">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                className="mx-auto w-20 h-20 bg-green-500/10 dark:bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mb-6"
              >
                <CheckCircle2 className="w-10 h-10" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-2">Purchase Confirmed!</h1>
                <p className="text-muted-foreground font-medium">Your tickets have been secured and issued.</p>
              </motion.div>
            </div>

            {/* Ticket Info Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-muted/30 border border-border rounded-2xl p-6 text-left space-y-6"
            >
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Check your inbox</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We've sent your digital tickets and receipt to your email. Don't forget to check your spam folder just in case!
                  </p>
                </div>
              </div>

              <div className="h-px bg-border w-full" />

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                  <Ticket className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Entry instructions</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Present the QR code in your email at the event entrance. You can print it or show it directly from your phone.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Security Notice */}
            <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
              <ShieldCheck className="w-4 h-4" /> Secure Blockchain-backed Ticketing
            </div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col gap-3"
            >
              <Button
                onClick={() => navigate('/')}
                className="h-14 w-full text-lg font-bold shadow-xl shadow-primary/20 group"
              >
                Back to Explorer <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="ghost" className="h-12 w-full font-bold text-muted-foreground hover:text-foreground">
                Download PDF Receipt
              </Button>
            </motion.div>
          </CardContent>
        </Card>

        {/* Support Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-8 text-sm text-muted-foreground"
        >
          Need help? <span className="text-primary font-bold cursor-pointer hover:underline">Contact Support</span>
        </motion.p>
      </motion.div>
    </div>
  );
}
