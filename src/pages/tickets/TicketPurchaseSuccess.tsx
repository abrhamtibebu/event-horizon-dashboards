import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Mail, Download, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TicketPurchaseSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-success/10 via-background to-muted/50 p-4 md:p-8 flex flex-col items-center justify-center">
      <motion.div
        className="max-w-2xl w-full"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-8 shadow-2xl">
          <CardContent className="text-center space-y-6">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex justify-center"
            >
              <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-16 h-16 text-success" />
              </div>
            </motion.div>

            {/* Success Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold text-card-foreground mb-3">
                🎉 Purchase Successful!
              </h1>
              <p className="text-lg text-muted-foreground">
                Your ticket purchase has been completed successfully.
              </p>
            </motion.div>

            {/* Information Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-info/10 to-primary/10 dark:from-info/20 dark:to-primary/20 rounded-lg p-6 space-y-4"
            >
              <div className="flex items-start gap-3">
                <Mail className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div className="text-left">
                  <h3 className="font-semibold text-card-foreground mb-1">
                    Check Your Email
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your tickets have been sent to your email address. Please check your inbox (and spam folder) for your ticket confirmation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Download className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div className="text-left">
                  <h3 className="font-semibold text-card-foreground mb-1">
                    Download Your Tickets
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    You can download your tickets from the email or save them to your mobile wallet for easy access at the event.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Important Notes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-warning/10 dark:bg-warning/20 border border-warning/30 dark:border-warning/40 rounded-lg p-4 text-left"
            >
              <h4 className="font-semibold text-card-foreground mb-2 flex items-center gap-2">
                <span className="text-xl">📌</span>
                Important Information
              </h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Please bring your ticket (digital or printed) to the event</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Your ticket contains a unique QR code for entry</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Arrive early to avoid queues at the entrance</span>
                </li>
              </ul>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="flex flex-col sm:flex-row gap-3 pt-4"
            >
              <Button
                onClick={() => navigate('/')}
                className="flex-1 bg-brand-gradient"
                size="lg"
              >
                <Home className="w-5 h-5 mr-2" />
                Return to Home
              </Button>
            </motion.div>

            {/* Contact Support */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-sm text-muted-foreground pt-4"
            >
              Have questions? Contact event support if you need assistance.
            </motion.p>
          </CardContent>
        </Card>

        {/* Confetti Animation (Optional) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 2, times: [0, 0.2, 0.8, 1] }}
          className="text-6xl text-center mt-4"
        >
          🎊 🎉 🎊
        </motion.div>
      </motion.div>
    </div>
  );
}




