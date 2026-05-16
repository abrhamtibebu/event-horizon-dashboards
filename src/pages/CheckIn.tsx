import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck } from "lucide-react";
import Breadcrumbs from '@/components/Breadcrumbs';
import { UsherMobileLayout } from '@/components/UsherMobileLayout';

export default function CheckIn() {
  return (
    <UsherMobileLayout title="Attendee Check-in">
      <div className="flex flex-col items-center justify-center p-6 text-center space-y-6">
        {/* Breadcrumbs */}
        <div className="w-full max-w-lg hidden md:block">
          <Breadcrumbs 
            items={[
              { label: 'Attendee Check-in', href: '/dashboard/check-in' }
            ]}
          />
        </div>
        <Card className="w-full max-w-lg bg-white/5 border-white/10 rounded-[2rem]">
          <CardHeader>
            <div className="mx-auto bg-primary/10 p-4 rounded-full">
              <UserCheck className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="mt-4 text-2xl font-black text-white uppercase tracking-tight">Attendee Check-in</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 font-medium">This module is being optimized for mobile.</p>
            <p className="mt-2 text-sm text-gray-500">
              High-speed scanning and registration tools will be available here soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </UsherMobileLayout>
  );
}