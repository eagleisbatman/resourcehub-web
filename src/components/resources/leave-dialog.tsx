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
import { Textarea } from "@/components/ui/textarea";
import type { ResourceLeave } from "@/types";

interface LeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceId: string;
  leaveId?: string;
  onSuccess: () => void;
}

export function LeaveDialog({
  open,
  onOpenChange,
  resourceId,
  leaveId,
  onSuccess,
}: LeaveDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: "leave" as "leave" | "sick" | "vacation" | "unavailable",
    startDate: "",
    endDate: "",
    notes: "",
  });

  useEffect(() => {
    if (leaveId && open) {
      fetch(`/api/leaves/${leaveId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            const leave = data.data;
            setFormData({
              leaveType: leave.leaveType,
              startDate: leave.startDate ? new Date(leave.startDate).toISOString().split("T")[0] : "",
              endDate: leave.endDate ? new Date(leave.endDate).toISOString().split("T")[0] : "",
              notes: leave.notes || "",
            });
          }
        })
        .catch(console.error);
    } else if (open) {
      setFormData({
        leaveType: "leave",
        startDate: "",
        endDate: "",
        notes: "",
      });
    }
  }, [leaveId, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = leaveId ? `/api/leaves/${leaveId}` : "/api/leaves";
      const method = leaveId ? "PATCH" : "POST";

      const payload = {
        resourceId,
        leaveType: formData.leaveType,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        notes: formData.notes || null,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to save leave");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      alert(err.message || "Failed to save leave");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!leaveId || !confirm("Are you sure you want to delete this leave record?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/leaves/${leaveId}`, { method: "DELETE" });
      if (response.ok) {
        onSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to delete leave:", error);
      alert("Failed to delete leave");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{leaveId ? "Edit Leave" : "Add Leave"}</DialogTitle>
          <DialogDescription>Enter leave details below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="leaveType">Leave Type *</Label>
              <Select
                value={formData.leaveType}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, leaveType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leave">Leave</SelectItem>
                  <SelectItem value="sick">Sick</SelectItem>
                  <SelectItem value="vacation">Vacation</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            {leaveId && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : leaveId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
