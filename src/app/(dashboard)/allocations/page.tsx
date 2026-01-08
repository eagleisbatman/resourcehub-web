"use client";

import { useState, useEffect, useCallback } from "react";
import { MonthSelector } from "@/components/allocations/month-selector";
import { ResourceAllocationsGrid } from "@/components/allocations/resource-allocations-grid";
import { LeaveWarningBanner } from "@/components/allocations/leave-warning-banner";
import { AssignResourceDialog } from "@/components/allocations/assign-resource-dialog";
import { AllocationWithResources, ProjectWithRelations, Role, Resource } from "@/types";

export default function AllocationsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [allocations, setAllocations] = useState<AllocationWithResources[]>([]);
  const [projects, setProjects] = useState<ProjectWithRelations[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedAllocationId, setSelectedAllocationId] = useState<string>("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [allocationsRes, projectsRes, rolesRes, resourcesRes] = await Promise.all([
        fetch(`/api/allocations?year=${year}&month=${month}`),
        fetch("/api/projects?archived=false"),
        fetch("/api/config/roles"),
        fetch("/api/resources"),
      ]);

      const allocationsData = await allocationsRes.json();
      const projectsData = await projectsRes.json();
      const rolesData = await rolesRes.json();
      const resourcesData = await resourcesRes.json();

      setAllocations(allocationsData.data || []);
      setProjects(projectsData.data || []);
      setRoles(rolesData.data || []);
      setResources(resourcesData.data || []);
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
            View and manage resource allocations to projects. Each row shows a resource allocated to a project, 
            with planned and actual hours for each week of the month.
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

      {resources.length === 0 && (
        <div className="mb-4 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            <strong>No resources found.</strong> Create resources first before allocating them to projects.
          </p>
        </div>
      )}

      <LeaveWarningBanner year={year} month={month} />

      <ResourceAllocationsGrid
        allocations={allocations}
        projects={projects}
        resources={resources}
        year={year}
        month={month}
        onSave={handleSave}
        onAssignResource={async (projectId, resourceId) => {
          try {
            const response = await fetch("/api/allocations/assign-resource", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                projectId,
                resourceId,
                year,
                month,
              }),
            });

            if (response.ok) {
              fetchData();
            } else {
              const error = await response.json();
              alert(error.error?.message || "Failed to assign resource");
            }
          } catch (error) {
            console.error("Failed to assign resource:", error);
            alert("Failed to assign resource");
          }
        }}
      />
    </div>
  );
}
