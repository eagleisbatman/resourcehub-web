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
import { Checkbox } from "@/components/ui/checkbox";
import { ProjectWithRelations, Status, Flag } from "@/types";

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: ProjectWithRelations;
  statuses: Status[];
  flags: Flag[];
  onSuccess: () => void;
}

export function ProjectForm({
  open,
  onOpenChange,
  project,
  statuses,
  flags,
  onSuccess,
}: ProjectFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    isOngoing: false,
    statusId: "",
    flagIds: [] as string[],
  });

  useEffect(() => {
    if (project) {
      setFormData({
        code: project.code,
        name: project.name,
        description: project.description || "",
        startDate: project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "",
        endDate: project.endDate ? new Date(project.endDate).toISOString().split("T")[0] : "",
        isOngoing: project.isOngoing,
        statusId: project.statusId,
        flagIds: project.flags.map((f) => f.id),
      });
    } else {
      setFormData({
        code: "",
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        isOngoing: false,
        statusId: statuses[0]?.id || "",
        flagIds: [],
      });
    }
  }, [project, statuses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = project ? `/api/projects/${project.id}` : "/api/projects";
      const method = project ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to save project");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      alert(error.message || "Failed to save project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "Create Project"}</DialogTitle>
          <DialogDescription>Enter project details below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="statusId">Status *</Label>
              <Select value={formData.statusId} onValueChange={(value) => setFormData({ ...formData, statusId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Flags</Label>
              <div className="flex flex-wrap gap-4">
                {flags.map((flag) => (
                  <div key={flag.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`flag-${flag.id}`}
                      checked={formData.flagIds.includes(flag.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({ ...formData, flagIds: [...formData.flagIds, flag.id] });
                        } else {
                          setFormData({
                            ...formData,
                            flagIds: formData.flagIds.filter((id) => id !== flag.id),
                          });
                        }
                      }}
                    />
                    <Label htmlFor={`flag-${flag.id}`} className="cursor-pointer">
                      {flag.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isOngoing"
                checked={formData.isOngoing}
                onCheckedChange={(checked) => setFormData({ ...formData, isOngoing: !!checked })}
              />
              <Label htmlFor="isOngoing" className="cursor-pointer">
                Ongoing Project
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : project ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

