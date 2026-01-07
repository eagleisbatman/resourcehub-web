import { Badge } from "@/components/ui/badge";
import { Status } from "@prisma/client";

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge
      style={{
        backgroundColor: `${status.color}20`,
        color: status.color,
        borderColor: status.color,
      }}
      variant="outline"
    >
      {status.name}
    </Badge>
  );
}

