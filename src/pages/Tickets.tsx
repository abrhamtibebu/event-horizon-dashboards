import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket } from "lucide-react";

export default function Tickets() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mx-auto bg-blue-100 p-3 rounded-full">
            <Ticket className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold">My Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">This page is under construction.</p>
          <p className="mt-2 text-sm text-gray-500">
            Your tickets will be displayed here soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 