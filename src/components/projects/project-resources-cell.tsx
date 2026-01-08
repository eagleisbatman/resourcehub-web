import { Badge } from "@/components/ui/badge";
import type { ProjectWithResources } from "@/types";

interface ProjectResourcesCellProps {
  project: ProjectWithResources;
  maxDisplay?: number;
}

export function ProjectResourcesCell({
  project,
  maxDisplay = 3,
}: ProjectResourcesCellProps) {
  const resources = project.allocatedResources || [];
  const displayResources = resources.slice(0, maxDisplay);
  const remainingCount = resources.length - maxDisplay;

  if (resources.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {displayResources.map((resource) => (
        <Badge key={resource.id} variant="outline" className="text-xs">
          {resource.name}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="secondary" className="text-xs">
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
}
