"use client";

import { useState, useEffect, useCallback } from "react";
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

  const fetchData = useCallback(async () => {
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
  }, [year, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (
    updates: Array<{ id: string; plannedHours: number; actualHours: number }>
  ) => {
    try {
      const bulkUpdates = updates.map((update) => {
        const allocation = allocations.find((a) => a.id === update.id);
        
        // If allocation exists, update it
        if (allocation) {
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
        }
        
        // If allocation doesn't exist, parse the key to extract projectId, roleId, and week
        // Format: `${projectId}-${roleId}-${week}`
        const parts = update.id.split("-");
        if (parts.length >= 3) {
          const projectId = parts[0];
          const roleId = parts[1];
          const week = parseInt(parts[2]);
          
          // Only create if hours are greater than 0
          if (update.plannedHours > 0 || update.actualHours > 0) {
            return {
              projectId,
              roleId,
              resourceIds: [],
              year,
              month,
              week,
              plannedHours: update.plannedHours,
              actualHours: update.actualHours,
              notes: null,
            };
          }
        }
        
        return null;
      }).filter(Boolean);

      if (bulkUpdates.length === 0) {
        return;
      }

      const response = await fetch("/api/allocations/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocations: bulkUpdates }),
      });

      if (response.ok) {
        fetchData();
      } else {
        const errorData = await response.json();
        console.error("Failed to save allocations:", errorData);
        throw new Error(errorData.error?.message || "Failed to save allocations");
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
        <div>
          <h1 className="text-2xl font-bold">Allocations</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Assign resources to projects by entering hours for each project/role combination. 
            Each row represents a project and role pair - enter planned and actual hours for each week.
          </p>
        </div>
        <MonthSelector year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />
      </div>

      {projects.length === 0 && (
        <div className="mb-4 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            <strong>No projects found.</strong> Create projects first before allocating resources.
          </p>
        </div>
      )}

      {roles.length === 0 && (
        <div className="mb-4 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            <strong>No roles found.</strong> Create roles in Settings before allocating resources.
          </p>
        </div>
      )}

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
