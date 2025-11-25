import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck } from "lucide-react";
import Breadcrumbs from '@/components/Breadcrumbs';

export default function CheckIn() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      {/* Breadcrumbs */}
      <div className="w-full max-w-lg mb-6">
        <Breadcrumbs 
          items={[
            { label: 'Attendee Check-in', href: '/dashboard/check-in' }
          ]}
        />
      </div>
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mx-auto bg-success/10 p-3 rounded-full">
            <UserCheck className="h-8 w-8 text-success" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold">Attendee Check-in</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This page is under construction.</p>
          <p className="mt-2 text-sm text-muted-foreground/70">
            Check-in functionality will be available here soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 