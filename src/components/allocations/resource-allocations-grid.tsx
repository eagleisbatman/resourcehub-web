"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AllocationWithResources, ProjectWithRelations, Resource } from "@/types";
import { Save, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ResourceAllocationsGridProps {
  allocations: AllocationWithResources[];
  projects: ProjectWithRelations[];
  resources: Resource[];
  year: number;
  month: number;
  onSave: (updates: Array<{ id: string; plannedHours: number; actualHours: number }>) => void;
  onAssignResource?: (projectId: string, resourceId: string) => void;
}

function getWeeksInMonth(year: number, month: number): number[] {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  return [1, 2, 3, 4, 5].filter((w) => w <= Math.ceil(lastDay.getDate() / 7) + 1);
}

export function ResourceAllocationsGrid({
  allocations,
  projects,
  resources,
  year,
  month,
  onSave,
  onAssignResource,
}: ResourceAllocationsGridProps) {
  const weeks = getWeeksInMonth(year, month);
  const [edits, setEdits] = useState<Record<string, { plannedHours: number; actualHours: number }>>(
    {}
  );
  const [saving, setSaving] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Group allocations by project and resource
  const gridData = useMemo(() => {
    const rows: Array<{
      projectId: string;
      projectName: string;
      resourceId: string;
      resourceName: string;
      resourceCode: string;
      allocations: Record<number, AllocationWithResources>;
    }> = [];

    // Get all unique project-resource combinations from allocations
    const projectResourceMap = new Map<string, Set<string>>();
    
    allocations.forEach((alloc) => {
      if (!projectResourceMap.has(alloc.projectId)) {
        projectResourceMap.set(alloc.projectId, new Set());
      }
      alloc.resourceIds.forEach((resourceId) => {
        projectResourceMap.get(alloc.projectId)!.add(resourceId);
      });
    });

    // Create rows for each project-resource combination
    projectResourceMap.forEach((resourceIds, projectId) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      resourceIds.forEach((resourceId) => {
        const resource = resources.find((r) => r.id === resourceId);
        if (!resource) return;

        const resourceAllocations = allocations.filter(
          (a) => a.projectId === projectId && a.resourceIds.includes(resourceId)
        );

        const allocationMap: Record<number, AllocationWithResources> = {};
        resourceAllocations.forEach((alloc) => {
          allocationMap[alloc.week] = alloc;
        });

        rows.push({
          projectId,
          projectName: project.name,
          resourceId,
          resourceName: resource.name,
          resourceCode: resource.code,
          allocations: allocationMap,
        });
      });
    });

    // Filter by selected project if any
    if (selectedProjectId) {
      return rows.filter((r) => r.projectId === selectedProjectId);
    }

    return rows;
  }, [allocations, projects, resources, selectedProjectId]);

  const handleChange = (
    projectId: string,
    resourceId: string,
    week: number,
    field: "plannedHours" | "actualHours",
    value: number
  ) => {
    const allocation = gridData
      .find((r) => r.projectId === projectId && r.resourceId === resourceId)
      ?.allocations[week];

    const key = allocation ? allocation.id : `${projectId}-${resourceId}-${week}`;
    setEdits((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        plannedHours: allocation?.plannedHours ? Number(allocation.plannedHours) : 0,
        actualHours: allocation?.actualHours ? Number(allocation.actualHours) : 0,
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(edits).map(([key, values]) => {
        const parts = key.includes("-") ? key.split("-") : [null, null, null];
        const allocation = allocations.find((a) => a.id === key);

        return {
          id: allocation?.id || key,
          plannedHours: values.plannedHours,
          actualHours: values.actualHours,
        };
      });

      await onSave(updates);
      setEdits({});
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Failed to save allocations");
    } finally {
      setSaving(false);
    }
  };

  const handleAddResource = (projectId: string) => {
    if (onAssignResource) {
      // Find available resources for this project
      const allocatedResourceIds = new Set(
        gridData.filter((r) => r.projectId === projectId).map((r) => r.resourceId)
      );
      const availableResources = resources.filter(
        (r) => !allocatedResourceIds.has(r.id) && r.isActive
      );

      if (availableResources.length === 0) {
        alert("No available resources to assign to this project.");
        return;
      }

      // Show a simple prompt to select resource
      const resourceOptions = availableResources
        .map((r, idx) => `${idx + 1}. ${r.code} - ${r.name}`)
        .join("\n");
      const selection = prompt(
        `Select a resource to assign:\n\n${resourceOptions}\n\nEnter number (1-${availableResources.length}):`
      );

      const selectedIndex = parseInt(selection || "0") - 1;
      if (selectedIndex >= 0 && selectedIndex < availableResources.length) {
        onAssignResource(projectId, availableResources[selectedIndex].id);
      }
    }
  };

  const hasEdits = Object.keys(edits).length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filter by project (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasEdits && (
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Project</TableHead>
              <TableHead className="w-[200px]">Resource</TableHead>
              {weeks.map((week) => (
                <TableHead key={week} className="text-center min-w-[200px]">
                  <div className="font-semibold">Week {week}</div>
                  <div className="text-xs font-normal text-muted-foreground mt-1 flex gap-4 justify-center">
                    <span>Planned</span>
                    <span>Actual</span>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {gridData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2 + weeks.length} className="text-center text-muted-foreground py-8">
                  {selectedProjectId
                    ? "No resources allocated to this project yet. Click 'Add Resource' below to assign resources."
                    : "No allocations found. Assign resources to projects to see them here."}
                </TableCell>
              </TableRow>
            ) : (
              gridData.map((row) => (
                <TableRow key={`${row.projectId}-${row.resourceId}`}>
                  <TableCell className="font-medium">{row.projectName}</TableCell>
                  <TableCell>
                    <div className="font-medium">{row.resourceCode}</div>
                    <div className="text-xs text-muted-foreground">{row.resourceName}</div>
                  </TableCell>
                  {weeks.map((week) => {
                    const allocation = row.allocations[week];
                    const key = allocation
                      ? allocation.id
                      : `${row.projectId}-${row.resourceId}-${week}`;
                    const edit = edits[key];
                    const plannedHours =
                      edit?.plannedHours ?? (allocation ? Number(allocation.plannedHours) : 0);
                    const actualHours =
                      edit?.actualHours ?? (allocation ? Number(allocation.actualHours) : 0);

                    return (
                      <TableCell key={week}>
                        <div className="flex gap-2 justify-center">
                          <Input
                            type="number"
                            step="0.1"
                            className="h-8 w-20 text-xs"
                            placeholder="0"
                            value={plannedHours || ""}
                            onChange={(e) =>
                              handleChange(
                                row.projectId,
                                row.resourceId,
                                week,
                                "plannedHours",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                          <Input
                            type="number"
                            step="0.1"
                            className="h-8 w-20 text-xs"
                            placeholder="0"
                            value={actualHours || ""}
                            onChange={(e) =>
                              handleChange(
                                row.projectId,
                                row.resourceId,
                                week,
                                "actualHours",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {projects.length > 0 && (
        <div className="flex justify-end gap-2">
          {selectedProjectId ? (
            <Button
              variant="outline"
              onClick={() => handleAddResource(selectedProjectId)}
              disabled={!onAssignResource}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Resource to {projects.find((p) => p.id === selectedProjectId)?.name}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground self-center">
              Select a project above to add resources
            </p>
          )}
        </div>
      )}
    </div>
  );
}
