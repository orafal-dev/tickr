import { Suspense } from "react";

import { AcceptInvitationView } from "@/app/accept-invitation/accept-invitation-view";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

const AcceptInvitationFallback = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invitation</CardTitle>
        <CardDescription>Loading…</CardDescription>
      </CardHeader>
    </Card>
  );
};

export default function AcceptInvitationPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Suspense fallback={<AcceptInvitationFallback />}>
          <AcceptInvitationView />
        </Suspense>
      </div>
    </div>
  );
}
