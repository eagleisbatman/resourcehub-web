import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import type { Resource } from "@/types";

interface AllocationResourcesCellProps {
  resourceIds: string[];
  resources: Resource[];
  onAdd: () => void;
}

export function AllocationResourcesCell({
  resourceIds,
  resources,
  onAdd,
}: AllocationResourcesCellProps) {
  const allocatedResources = resources.filter((r) => resourceIds.includes(r.id));

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {allocatedResources.map((resource) => (
        <Badge key={resource.id} variant="outline" className="text-xs">
          {resource.name}
        </Badge>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs"
        onClick={onAdd}
      >
        <Plus className="h-3 w-3 mr-1" />
        Add
      </Button>
    </div>
  );
}
