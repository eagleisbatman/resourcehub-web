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
import { ProjectForm } from "@/components/projects/project-form";
import { StatusBadge } from "@/components/projects/status-badge";
import { ProjectResourcesCell } from "@/components/projects/project-resources-cell";
import { ProjectWithResources, Status, Flag } from "@/types";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithResources[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithResources | undefined>();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, statusesRes, flagsRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/config/statuses"),
        fetch("/api/config/flags"),
      ]);

      const projectsData = await projectsRes.json();
      const statusesData = await statusesRes.json();
      const flagsData = await flagsRes.json();

      if (projectsData.error) {
        console.error("Projects API error:", projectsData.error);
        alert(`Failed to load projects: ${projectsData.error.message}`);
      }

      console.log("Projects fetched:", projectsData.data?.length || 0);
      console.log("Statuses fetched:", statusesData.data?.length || 0);
      console.log("Flags fetched:", flagsData.data?.length || 0);

      setProjects(projectsData.data || []);
      setStatuses(statusesData.data || []);
      setFlags(flagsData.data || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      alert("Failed to load data. Please check the console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const response = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  const handleEdit = (project: ProjectWithResources) => {
    setEditingProject(project);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingProject(undefined);
    setFormOpen(true);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Project
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead>Resources</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No projects found
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.code}</TableCell>
                  <TableCell>{project.name}</TableCell>
                  <TableCell>
                    <StatusBadge status={project.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {project.flags.map((flag) => (
                        <span
                          key={flag.id}
                          className="rounded px-2 py-1 text-xs"
                          style={{
                            backgroundColor: `${flag.color}20`,
                            color: flag.color,
                          }}
                        >
                          {flag.name}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ProjectResourcesCell project={project} />
                  </TableCell>
                  <TableCell>
                    {project.totalPlannedHours > 0
                      ? `${project.totalPlannedHours}h`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(project)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(project.id)}
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

      <ProjectForm
        open={formOpen}
        onOpenChange={setFormOpen}
        project={editingProject}
        statuses={statuses}
        flags={flags}
        onSuccess={fetchData}
      />
    </div>
  );
}
