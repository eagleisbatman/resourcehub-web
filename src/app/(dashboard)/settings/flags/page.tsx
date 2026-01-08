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
import { FlagForm } from "@/components/settings/flag-form";
import { Flag } from "@/types";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function FlagsPage() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState<Flag | undefined>();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/config/flags");
      const data = await response.json();
      setFlags(data.data || []);
    } catch (error) {
      console.error("Failed to fetch flags:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this flag?")) return;

    try {
      const response = await fetch(`/api/config/flags/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to delete flag:", error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Flags</h1>
        <Button onClick={() => {
          setEditingFlag(undefined);
          setFormOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Create Flag
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-500">
                  No flags found
                </TableCell>
              </TableRow>
            ) : (
              flags.map((flag) => (
                <TableRow key={flag.id}>
                  <TableCell className="font-medium">{flag.name}</TableCell>
                  <TableCell>
                    <div
                      className="h-6 w-20 rounded border"
                      style={{ backgroundColor: flag.color }}
                    />
                  </TableCell>
                  <TableCell>{flag.order}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingFlag(flag);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(flag.id)}
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

      <FlagForm
        open={formOpen}
        onOpenChange={setFormOpen}
        flag={editingFlag}
        onSuccess={fetchData}
      />
    </div>
  );
}

