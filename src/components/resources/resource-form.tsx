"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResourceWithRole, Role, ProjectWithRelations } from "@/types";

interface ResourceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource?: ResourceWithRole;
  roles: Role[];
  projects?: ProjectWithRelations[];
  onSuccess: () => void;
}

export function ResourceForm({
  open,
  onOpenChange,
  resource,
  roles,
  projects = [],
  onSuccess,
}: ResourceFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    email: "",
    roleId: "",
    specialization: "",
    availability: 100,
    projectId: "",
  });

  useEffect(() => {
    if (resource) {
      setFormData({
        code: resource.code,
        name: resource.name,
        email: resource.email || "",
        roleId: resource.roleId,
        specialization: resource.specialization || "",
        availability: resource.availability,
        projectId: "", // Resources are linked via allocations, not directly
      });
    } else {
      setFormData({
        code: "",
        name: "",
        email: "",
        roleId: roles[0]?.id || "",
        specialization: "",
        availability: 100,
        projectId: "",
      });
    }
  }, [resource, roles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = resource ? `/api/resources/${resource.id}` : "/api/resources";
      const method = resource ? "PATCH" : "POST";

      // Remove projectId from payload as resources are linked via allocations
      const payload = {
        code: formData.code,
        name: formData.name,
        email: formData.email,
        roleId: formData.roleId,
        specialization: formData.specialization,
        availability: formData.availability,
      };
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to save resource");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      alert(err.message || "Failed to save resource");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{resource ? "Edit Resource" : "Create Resource"}</DialogTitle>
          <DialogDescription>Enter resource details below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                  {!resource && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (!formData.name) return;
                        try {
                          const response = await fetch("/api/resources/generate-code", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ 
                              name: formData.name,
                              specialization: formData.specialization 
                            }),
                          });
                          if (response.ok) {
                            const data = await response.json();
                            setFormData({ ...formData, code: data.data.code });
                          }
                        } catch (error) {
                          console.error("Failed to generate code:", error);
                        }
                      }}
                      disabled={!formData.name}
                    >
                      Auto
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                  }}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleId">Role *</Label>
              <Select
                value={formData.roleId}
                onValueChange={(value) => setFormData({ ...formData, roleId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                value={formData.specialization}
                onChange={(e) => {
                  setFormData({ ...formData, specialization: e.target.value });
                }}
              />
            </div>
            {projects.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="projectId">Primary Project (Optional)</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project (for reference)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.code} - {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Note: Resources are linked to projects through allocations. This is for reference only.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="availability">Availability (%)</Label>
              <Input
                id="availability"
                type="number"
                min="0"
                max="100"
                value={formData.availability}
                onChange={(e) =>
                  setFormData({ ...formData, availability: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : resource ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

