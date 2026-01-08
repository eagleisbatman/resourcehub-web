import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResourceWithStatus } from "@/types";

interface ResourceStatusSummaryProps {
  resources: ResourceWithStatus[];
}

export function ResourceStatusSummary({ resources }: ResourceStatusSummaryProps) {
  const available = resources.filter((r) => r.status === "available").length;
  const working = resources.filter((r) => r.status === "working").length;
  const onLeave = resources.filter((r) => r.status === "on_leave").length;
  const upcomingLeave = resources.filter((r) => r.upcomingLeaves.length > 0).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Available</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{available}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Working</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{working}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">On Leave</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{onLeave}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Leave</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{upcomingLeave}</div>
        </CardContent>
      </Card>
    </div>
  );
}
