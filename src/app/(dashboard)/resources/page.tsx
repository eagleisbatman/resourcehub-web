"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResourceForm } from "@/components/resources/resource-form";
import { ResourceStatusSummary } from "@/components/resources/resource-status-summary";
import { ResourceStatusBadge } from "@/components/resources/resource-status-badge";
import { LeaveDialog } from "@/components/resources/leave-dialog";
import { ResourceWithStatus, Role, ProjectWithRelations } from "@/types";
import { Plus, Pencil, Trash2, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ResourcesPage() {
  const [resources, setResources] = useState<ResourceWithStatus[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [projects, setProjects] = useState<ProjectWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceWithStatus | undefined>();
  const [selectedResourceId, setSelectedResourceId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resourcesRes, rolesRes, projectsRes] = await Promise.all([
        fetch("/api/resources"),
        fetch("/api/config/roles"),
        fetch("/api/projects?archived=false"),
      ]);

      const resourcesData = await resourcesRes.json();
      const rolesData = await rolesRes.json();
      const projectsData = await projectsRes.json();

      if (resourcesData.error) {
        console.error("Resources API error:", resourcesData.error);
        alert(`Failed to load resources: ${resourcesData.error.message}`);
      }
      if (projectsData.error) {
        console.error("Projects API error:", projectsData.error);
      }

      console.log("Resources fetched:", resourcesData.data?.length || 0);
      console.log("Roles fetched:", rolesData.data?.length || 0);
      console.log("Projects fetched:", projectsData.data?.length || 0);

      setResources(resourcesData.data || []);
      setRoles(rolesData.data || []);
      setProjects(projectsData.data || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      alert("Failed to load data. Please check the console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    try {
      const response = await fetch(`/api/resources/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to delete resource:", error);
    }
  };

  const handleEdit = (resource: ResourceWithStatus) => {
    setEditingResource(resource);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingResource(undefined);
    setFormOpen(true);
  };

  const handleAddLeave = (resourceId: string) => {
    setSelectedResourceId(resourceId);
    setLeaveDialogOpen(true);
  };

  const filteredResources = resources.filter((resource) => {
    if (statusFilter !== "all" && resource.status !== statusFilter) return false;
    if (roleFilter !== "all" && resource.roleId !== roleFilter) return false;
    return true;
  });

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Resources</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Resource
        </Button>
      </div>

      <ResourceStatusSummary resources={resources} />

      <div className="mb-4 flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="working">Working</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Workload</TableHead>
              <TableHead>Current Projects</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No resources found
                </TableCell>
              </TableRow>
            ) : (
              filteredResources.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell className="font-medium">{resource.code}</TableCell>
                  <TableCell>{resource.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{resource.role.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <ResourceStatusBadge status={resource.status} />
                  </TableCell>
                  <TableCell>
                    <span className={resource.workloadPercent > 100 ? "text-red-600 font-semibold" : ""}>
                      {resource.workloadPercent}%
                      {resource.workloadPercent > 100 && " ⚠️"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {resource.currentProjects.length > 0
                      ? resource.currentProjects.map((p) => p.code).join(", ")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(resource)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddLeave(resource.id)}
                        title="Add Leave"
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(resource.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ResourceForm
        open={formOpen}
        onOpenChange={setFormOpen}
        resource={editingResource}
        roles={roles}
        projects={projects}
        onSuccess={fetchData}
      />
      <LeaveDialog
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        resourceId={selectedResourceId}
        onSuccess={fetchData}
      />
    </div>
  );
}
