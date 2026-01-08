"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AllocationWithRelations, ProjectWithRelations, Role } from "@/types";
import { Save } from "lucide-react";

interface AllocationsGridProps {
  allocations: AllocationWithRelations[];
  projects: ProjectWithRelations[];
  roles: Role[];
  year: number;
  month: number;
  onSave: (updates: Array<{ id: string; plannedHours: number; actualHours: number }>) => void;
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
  year,
  month,
  onSave,
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
      allocations: Record<number, AllocationWithRelations>;
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
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-border">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border p-2 text-left font-semibold text-foreground">Project</th>
              <th className="border border-border p-2 text-left font-semibold text-foreground">Role</th>
              {weeks.map((week) => (
                <th key={week} className="border border-border p-2 text-center font-semibold text-foreground">
                  Week {week}
                </th>
              ))}
            </tr>
            <tr className="bg-muted">
              <th colSpan={2} className="border border-border p-2"></th>
              {weeks.map((week) => (
                <th key={week} className="border border-border p-1 text-xs text-foreground">
                  <div>Planned</div>
                  <div>Actual</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gridData.map((row) => (
              <tr key={`${row.projectId}-${row.roleId}`} className="bg-card">
                <td className="border border-border p-2 font-medium text-foreground">{row.projectName}</td>
                <td className="border border-border p-2 text-foreground">{row.roleName}</td>
                {weeks.map((week) => {
                  const allocation = row.allocations[week];
                  const key = allocation ? allocation.id : `${row.projectId}-${row.roleId}-${week}`;
                  const edit = edits[key];
                  const plannedHours = edit?.plannedHours ?? (allocation ? Number(allocation.plannedHours) : 0);
                  const actualHours = edit?.actualHours ?? (allocation ? Number(allocation.actualHours) : 0);

                  return (
                    <td key={week} className="border border-border p-1 bg-card">
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          step="0.1"
                          className="h-8 w-20 text-xs"
                          value={plannedHours}
                          onChange={(e) =>
                            handleChange(row.projectId, row.roleId, week, "plannedHours", parseFloat(e.target.value) || 0)
                          }
                        />
                        <Input
                          type="number"
                          step="0.1"
                          className="h-8 w-20 text-xs"
                          value={actualHours}
                          onChange={(e) =>
                            handleChange(row.projectId, row.roleId, week, "actualHours", parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

