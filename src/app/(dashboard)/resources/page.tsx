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
import { ResourceWithRole, Role, ProjectWithRelations } from "@/types";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ResourcesPage() {
  const [resources, setResources] = useState<ResourceWithRole[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [projects, setProjects] = useState<ProjectWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceWithRole | undefined>();

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

      setResources(resourcesData.data || []);
      setRoles(rolesData.data || []);
      setProjects(projectsData.data || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
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

  const handleEdit = (resource: ResourceWithRole) => {
    setEditingResource(resource);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingResource(undefined);
    setFormOpen(true);
  };

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

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Specialization</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500">
                  No resources found
                </TableCell>
              </TableRow>
            ) : (
              resources.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell className="font-medium">{resource.code}</TableCell>
                  <TableCell>{resource.name}</TableCell>
                  <TableCell>{resource.email || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{resource.role.name}</Badge>
                  </TableCell>
                  <TableCell>{resource.specialization || "-"}</TableCell>
                  <TableCell>{resource.availability}%</TableCell>
                  <TableCell>
                    <Badge variant={resource.isActive ? "default" : "secondary"}>
                      {resource.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(resource)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(resource.id)}
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
    </div>
  );
}
