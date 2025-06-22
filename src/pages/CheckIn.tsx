import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck } from "lucide-react";

export default function CheckIn() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mx-auto bg-green-100 p-3 rounded-full">
            <UserCheck className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold">Attendee Check-in</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">This page is under construction.</p>
          <p className="mt-2 text-sm text-gray-500">
            Check-in functionality will be available here soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 