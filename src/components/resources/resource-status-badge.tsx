import { Badge } from "@/components/ui/badge";
import type { ResourceStatus } from "@/lib/resource-utils";

interface ResourceStatusBadgeProps {
  status: ResourceStatus;
}

export function ResourceStatusBadge({ status }: ResourceStatusBadgeProps) {
  const variants: Record<ResourceStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    available: { variant: "default", label: "Available" },
    working: { variant: "secondary", label: "Working" },
    on_leave: { variant: "outline", label: "On Leave" },
  };

  const config = variants[status];

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}
