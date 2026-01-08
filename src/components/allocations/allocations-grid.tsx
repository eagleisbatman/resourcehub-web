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
import { AllocationWithResources, ProjectWithRelations, Role, Resource } from "@/types";
import { AllocationResourcesCell } from "@/components/allocations/allocation-resources-cell";
import { Save } from "lucide-react";

interface AllocationsGridProps {
  allocations: AllocationWithResources[];
  projects: ProjectWithRelations[];
  roles: Role[];
  resources: Resource[];
  year: number;
  month: number;
  onSave: (updates: Array<{ id: string; plannedHours: number; actualHours: number }>) => void;
  onAssignResource?: (allocationId: string, roleId: string) => void;
}

function getWeeksInMonth(year: number, month: number): number[] {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const weeks: number[] = [];
  const currentDate = new Date(firstDay);

  while (currentDate <= lastDay) {
    const weekNumber = Math.ceil((currentDate.getDate() + firstDay.getDay()) / 7);
    if (!weeks.includes(weekNumber)) {
      weeks.push(weekNumber);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return [1, 2, 3, 4, 5].filter((w) => w <= Math.ceil(lastDay.getDate() / 7) + 1);
}

export function AllocationsGrid({
  allocations,
  projects,
  roles,
  resources,
  year,
  month,
  onSave,
  onAssignResource,
}: AllocationsGridProps) {
  const weeks = getWeeksInMonth(year, month);
  const [edits, setEdits] = useState<Record<string, { plannedHours: number; actualHours: number }>>(
    {}
  );
  const [saving, setSaving] = useState(false);

  const gridData = useMemo(() => {
    const rows: Array<{
      projectId: string;
      projectName: string;
      roleId: string;
      roleName: string;
      allocations: Record<number, AllocationWithResources>;
    }> = [];

    projects.forEach((project) => {
      roles.forEach((role) => {
        const projectAllocations = allocations.filter(
          (a) => a.projectId === project.id && a.roleId === role.id
        );

        const allocationMap: Record<number, AllocationWithRelations> = {};
        projectAllocations.forEach((alloc) => {
          allocationMap[alloc.week] = alloc;
        });

        rows.push({
          projectId: project.id,
          projectName: project.name,
          roleId: role.id,
          roleName: role.name,
          allocations: allocationMap,
        });
      });
    });

    return rows;
  }, [allocations, projects, roles]);

  const handleChange = (
    projectId: string,
    roleId: string,
    week: number,
    field: "plannedHours" | "actualHours",
    value: number
  ) => {
    const allocation = gridData
      .find((r) => r.projectId === projectId && r.roleId === roleId)
      ?.allocations[week];

    const key = allocation ? allocation.id : `${projectId}-${roleId}-${week}`;
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
        const [projectId, roleId, weekStr] = key.includes("-") ? key.split("-") : [null, null, null];
        const allocation = allocations.find(
          (a) =>
            a.id === key ||
            (projectId &&
              roleId &&
              a.projectId === projectId &&
              a.roleId === roleId &&
              a.week === parseInt(weekStr || "0"))
        );

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
    } finally {
      setSaving(false);
    }
  };

  const hasEdits = Object.keys(edits).length > 0;

  return (
    <div className="space-y-4">
      {hasEdits && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Project</TableHead>
              <TableHead className="w-[150px]">Role</TableHead>
              <TableHead className="w-[200px]">Resources</TableHead>
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
                <TableCell colSpan={3 + weeks.length} className="text-center text-muted-foreground py-8">
                  No projects or roles found. Create projects and roles first, then enter hours in the cells to create allocations.
                </TableCell>
              </TableRow>
            ) : (
              gridData.map((row) => {
                const firstAllocation = Object.values(row.allocations)[0];
                return (
                  <TableRow key={`${row.projectId}-${row.roleId}`}>
                    <TableCell className="font-medium">{row.projectName}</TableCell>
                    <TableCell>{row.roleName}</TableCell>
                    <TableCell>
                      {firstAllocation ? (
                        <AllocationResourcesCell
                          resourceIds={firstAllocation.resourceIds}
                          resources={resources}
                          onAdd={() => onAssignResource?.(firstAllocation.id, row.roleId)}
                        />
                      ) : (
                        <AllocationResourcesCell
                          resourceIds={[]}
                          resources={resources}
                          onAdd={() => {}}
                        />
                      )}
                    </TableCell>
                    {weeks.map((week) => {
                    const allocation = row.allocations[week];
                    const key = allocation ? allocation.id : `${row.projectId}-${row.roleId}-${week}`;
                    const edit = edits[key];
                    const plannedHours = edit?.plannedHours ?? (allocation ? Number(allocation.plannedHours) : 0);
                    const actualHours = edit?.actualHours ?? (allocation ? Number(allocation.actualHours) : 0);

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
                              handleChange(row.projectId, row.roleId, week, "plannedHours", parseFloat(e.target.value) || 0)
                            }
                          />
                          <Input
                            type="number"
                            step="0.1"
                            className="h-8 w-20 text-xs"
                            placeholder="0"
                            value={actualHours || ""}
                            onChange={(e) =>
                              handleChange(row.projectId, row.roleId, week, "actualHours", parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                      </TableCell>
                    );
                  })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

