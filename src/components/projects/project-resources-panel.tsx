"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResourceStatusBadge } from "@/components/resources/resource-status-badge";
import type { ProjectWithResources } from "@/types";
import { Plus } from "lucide-react";

interface ProjectResourcesPanelProps {
  project: ProjectWithResources;
  onAddResource?: () => void;
}

export function ProjectResourcesPanel({
  project,
  onAddResource,
}: ProjectResourcesPanelProps) {
  const resources = project.allocatedResources || [];

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Allocated Resources</h3>
        {onAddResource && (
          <Button size="sm" onClick={onAddResource}>
            <Plus className="mr-2 h-4 w-4" />
            Add Resource
          </Button>
        )}
      </div>
      {resources.length === 0 ? (
        <p className="text-sm text-muted-foreground">No resources allocated to this project.</p>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resource</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Hours (This Month)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell className="font-medium">
                    {resource.code} - {resource.name}
                  </TableCell>
                  <TableCell>{resource.role}</TableCell>
                  <TableCell>
                    <ResourceStatusBadge status={resource.status} />
                  </TableCell>
                  <TableCell className="text-right">{resource.plannedHours}h</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
