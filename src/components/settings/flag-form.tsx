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
import { Flag } from "@/types";
import { SketchPicker } from "react-color";

interface FlagFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flag?: Flag;
  onSuccess: () => void;
}

export function FlagForm({ open, onOpenChange, flag, onSuccess }: FlagFormProps) {
  const [loading, setLoading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    color: "#6B7280",
    order: 0,
  });

  useEffect(() => {
    if (flag) {
      setFormData({
        name: flag.name,
        color: flag.color,
        order: flag.order,
      });
    } else {
      setFormData({
        name: "",
        color: "#6B7280",
        order: 0,
      });
    }
  }, [flag]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = flag ? `/api/config/flags/${flag.id}` : "/api/config/flags";
      const method = flag ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to save flag");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      alert(error.message || "Failed to save flag");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{flag ? "Edit Flag" : "Create Flag"}</DialogTitle>
          <DialogDescription>Enter flag details below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center gap-2">
                <div
                  className="h-10 w-20 rounded border cursor-pointer"
                  style={{ backgroundColor: formData.color }}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                />
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1"
                />
              </div>
              {showColorPicker && (
                <div className="absolute z-50">
                  <div
                    className="fixed inset-0"
                    onClick={() => setShowColorPicker(false)}
                  />
                  <SketchPicker
                    color={formData.color}
                    onChange={(color) => setFormData({ ...formData, color: color.hex })}
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="order">Order</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : flag ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

