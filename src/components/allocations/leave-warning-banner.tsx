"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import type { ResourceLeave } from "@/types";

interface LeaveWarningBannerProps {
  year: number;
  month: number;
}

export function LeaveWarningBanner({
  year,
  month,
}: LeaveWarningBannerProps) {
  const [leaves, setLeaves] = useState<
    Array<ResourceLeave & { resource?: { name: string } }>
  >([]);

  useEffect(() => {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0).toISOString();

    fetch(`/api/leaves?startDate=${startDate}&endDate=${endDate}`)
      .then((res) => res.json())
      .then((data) => {
        setLeaves(data.data || []);
      })
      .catch(console.error);
  }, [year, month]);

  if (leaves.length === 0) {
    return null;
  }

  return (
    <Alert className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Resources on Leave</AlertTitle>
      <AlertDescription>
        The following resources are on leave this month:{" "}
        {leaves
          .map(
            (leave) =>
              `${leave.resource?.name || "Unknown"} (${new Date(
                leave.startDate
              ).toLocaleDateString()} - ${new Date(
                leave.endDate
              ).toLocaleDateString()})`
          )
          .join(", ")}
      </AlertDescription>
    </Alert>
  );
}
