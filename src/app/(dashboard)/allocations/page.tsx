"use client";

import { useState, useEffect } from "react";
import { MonthSelector } from "@/components/allocations/month-selector";
import { AllocationsGrid } from "@/components/allocations/allocations-grid";
import { AllocationWithRelations, ProjectWithRelations, Role } from "@/types";

export default function AllocationsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [allocations, setAllocations] = useState<AllocationWithRelations[]>([]);
  const [projects, setProjects] = useState<ProjectWithRelations[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [year, month]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allocationsRes, projectsRes, rolesRes] = await Promise.all([
        fetch(`/api/allocations?year=${year}&month=${month}`),
        fetch("/api/projects?archived=false"),
        fetch("/api/config/roles"),
      ]);

      const allocationsData = await allocationsRes.json();
      const projectsData = await projectsRes.json();
      const rolesData = await rolesRes.json();

      setAllocations(allocationsData.data || []);
      setProjects(projectsData.data || []);
      setRoles(rolesData.data || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (
    updates: Array<{ id: string; plannedHours: number; actualHours: number }>
  ) => {
    try {
      const bulkUpdates = updates.map((update) => {
        const allocation = allocations.find((a) => a.id === update.id);
        if (!allocation) return null;

        return {
          projectId: allocation.projectId,
          roleId: allocation.roleId,
          resourceIds: allocation.resourceIds,
          year: allocation.year,
          month: allocation.month,
          week: allocation.week,
          plannedHours: update.plannedHours,
          actualHours: update.actualHours,
          notes: allocation.notes,
        };
      }).filter(Boolean);

      const response = await fetch("/api/allocations/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocations: bulkUpdates }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to save allocations:", error);
      throw error;
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Allocations</h1>
        <MonthSelector year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />
      </div>

      <AllocationsGrid
        allocations={allocations}
        projects={projects}
        roles={roles}
        year={year}
        month={month}
        onSave={handleSave}
      />
    </div>
  );
}
