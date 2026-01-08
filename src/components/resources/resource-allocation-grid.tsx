"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AllocationWithResources } from "@/types";

interface ResourceAllocationGridProps {
  resourceId: string;
  year: number;
  month: number;
}

function getWeeksInMonth(year: number, month: number): number[] {
  return [1, 2, 3, 4, 5].filter((w) => {
    const date = new Date(year, month - 1, w * 7);
    return date.getMonth() === month - 1;
  });
}

export function ResourceAllocationGrid({
  resourceId,
  year,
  month,
}: ResourceAllocationGridProps) {
  const [allocations, setAllocations] = useState<AllocationWithResources[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/allocations?year=${year}&month=${month}`)
      .then((res) => res.json())
      .then((data) => {
        const resourceAllocations = (data.data || []).filter((alloc: AllocationWithResources) =>
          alloc.resourceIds.includes(resourceId)
        );
        setAllocations(resourceAllocations);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [resourceId, year, month]);

  const weeks = getWeeksInMonth(year, month);

  const projectMap = new Map<
    string,
    {
      project: AllocationWithResources["project"];
      weeks: Record<number, { planned: number; actual: number }>;
    }
  >();

  allocations.forEach((alloc) => {
    if (!projectMap.has(alloc.projectId)) {
      projectMap.set(alloc.projectId, {
        project: alloc.project,
        weeks: {},
      });
    }
    const projectData = projectMap.get(alloc.projectId)!;
    projectData.weeks[alloc.week] = {
      planned: Number(alloc.plannedHours),
      actual: Number(alloc.actualHours),
    };
  });

  const projects = Array.from(projectMap.values());

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (projects.length === 0) {
    return <div className="p-4 text-muted-foreground">No allocations found for this resource.</div>;
  }

  const totalPlanned = projects.reduce(
    (sum, p) =>
      sum +
      Object.values(p.weeks).reduce((weekSum, week) => weekSum + week.planned, 0),
    0
  );
  const totalActual = projects.reduce(
    (sum, p) =>
      sum +
      Object.values(p.weeks).reduce((weekSum, week) => weekSum + week.actual, 0),
    0
  );

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            {weeks.map((week) => (
              <TableHead key={week} className="text-center">
                Week {week}
              </TableHead>
            ))}
            <TableHead className="text-center">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((projectData) => {
            const projectTotalPlanned = Object.values(projectData.weeks).reduce(
              (sum, week) => sum + week.planned,
              0
            );
            const projectTotalActual = Object.values(projectData.weeks).reduce(
              (sum, week) => sum + week.actual,
              0
            );

            return (
              <TableRow key={projectData.project.id}>
                <TableCell className="font-medium">
                  {projectData.project.code} - {projectData.project.name}
                </TableCell>
                {weeks.map((week) => {
                  const weekData = projectData.weeks[week] || { planned: 0, actual: 0 };
                  return (
                    <TableCell key={week} className="text-center">
                      <div className="text-sm">
                        <div>P: {weekData.planned}h</div>
                        <div className="text-muted-foreground">A: {weekData.actual}h</div>
                      </div>
                    </TableCell>
                  );
                })}
                <TableCell className="text-center">
                  <div className="text-sm">
                    <div>{projectTotalPlanned}h</div>
                    <div className="text-muted-foreground">{projectTotalActual}h</div>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          <TableRow className="font-semibold">
            <TableCell>Total</TableCell>
            {weeks.map((week) => {
              const weekTotalPlanned = projects.reduce(
                (sum, p) => sum + (p.weeks[week]?.planned || 0),
                0
              );
              const weekTotalActual = projects.reduce(
                (sum, p) => sum + (p.weeks[week]?.actual || 0),
                0
              );
              return (
                <TableCell key={week} className="text-center">
                  <div className="text-sm">
                    <div>{weekTotalPlanned}h</div>
                    <div className="text-muted-foreground">{weekTotalActual}h</div>
                  </div>
                </TableCell>
              );
            })}
            <TableCell className="text-center">
              <div className="text-sm">
                <div>{totalPlanned}h</div>
                <div className="text-muted-foreground">{totalActual}h</div>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
