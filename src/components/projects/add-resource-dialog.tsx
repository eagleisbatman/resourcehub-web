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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { Resource, Role } from "@/types";

interface AddResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  roleId: string;
  resources: Resource[];
  onSuccess: () => void;
}

export function AddResourceDialog({
  open,
  onOpenChange,
  projectId,
  roleId,
  resources,
  onSuccess,
}: AddResourceDialogProps) {
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const filteredResources = resources.filter((r) => r.roleId === roleId && r.isActive);

  useEffect(() => {
    if (!open) {
      setSelectedResourceIds([]);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedResourceIds.length === 0) return;

    setLoading(true);
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const week = Math.ceil(today.getDate() / 7);

      // Create allocations for each selected resource
      const promises = selectedResourceIds.map((resourceId) =>
        fetch("/api/allocations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            roleId,
            resourceIds: [resourceId],
            year,
            month,
            week,
            plannedHours: "0",
            actualHours: "0",
          }),
        })
      );

      await Promise.all(promises);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add resources:", error);
      alert("Failed to add resources to project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Resources to Project</DialogTitle>
          <DialogDescription>Select resources to assign to this project.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {filteredResources.length === 0 ? (
              <p className="text-sm text-muted-foreground">No resources available for this role.</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {filteredResources.map((resource) => (
                  <div key={resource.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={resource.id}
                      checked={selectedResourceIds.includes(resource.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedResourceIds([...selectedResourceIds, resource.id]);
                        } else {
                          setSelectedResourceIds(selectedResourceIds.filter((id) => id !== resource.id));
                        }
                      }}
                    />
                    <Label
                      htmlFor={resource.id}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {resource.code} - {resource.name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || selectedResourceIds.length === 0}>
              {loading ? "Adding..." : "Add Resources"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
