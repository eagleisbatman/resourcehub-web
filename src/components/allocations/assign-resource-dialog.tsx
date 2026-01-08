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
import type { Resource } from "@/types";

interface AssignResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allocationId: string;
  currentResourceIds: string[];
  resources: Resource[];
  roleId: string;
  onSuccess: () => void;
}

export function AssignResourceDialog({
  open,
  onOpenChange,
  allocationId,
  currentResourceIds,
  resources,
  roleId,
  onSuccess,
}: AssignResourceDialogProps) {
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const filteredResources = resources.filter(
    (r) => r.roleId === roleId && r.isActive
  );

  useEffect(() => {
    if (open) {
      setSelectedResourceIds(currentResourceIds);
    }
  }, [open, currentResourceIds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`/api/allocations/${allocationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceIds: selectedResourceIds,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to assign resources");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to assign resources:", error);
      alert("Failed to assign resources");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Resources</DialogTitle>
          <DialogDescription>
            Select resources to assign to this allocation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {filteredResources.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No resources available for this role.
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {filteredResources.map((resource) => (
                  <div key={resource.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={resource.id}
                      checked={selectedResourceIds.includes(resource.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedResourceIds([
                            ...selectedResourceIds,
                            resource.id,
                          ]);
                        } else {
                          setSelectedResourceIds(
                            selectedResourceIds.filter((id) => id !== resource.id)
                          );
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
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
