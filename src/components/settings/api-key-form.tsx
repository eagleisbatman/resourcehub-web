"use client";

import { useState } from "react";
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
import { Copy, Check } from "lucide-react";

interface ApiKeyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: "SUPER_ADMIN" | "ADMIN";
  onSuccess: () => void;
}

interface CreatedApiKey {
  id: string;
  name: string;
  key: string;
  keyPrefix: string;
  role: string;
  expiresAt: string | null;
  createdAt: string;
}

export function ApiKeyForm({ open, onOpenChange, userRole, onSuccess }: ApiKeyFormProps) {
  const [loading, setLoading] = useState(false);
  const [createdKey, setCreatedKey] = useState<CreatedApiKey | null>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    expiresAt: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCreatedKey(null);

    try {
      const response = await fetch("/api/auth/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          expiresAt: formData.expiresAt || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to create API key");
      }

      const result = await response.json();
      setCreatedKey(result.data);
      onSuccess();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create API key";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (createdKey?.key) {
      await navigator.clipboard.writeText(createdKey.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setCreatedKey(null);
    setFormData({ name: "", expiresAt: "" });
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {createdKey ? (
          <>
            <DialogHeader>
              <DialogTitle>API Key Created</DialogTitle>
              <DialogDescription>
                Copy your API key now. You won't be able to see it again.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={createdKey.key}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={createdKey.name} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={createdKey.role} readOnly />
              </div>
              {createdKey.expiresAt && (
                <div className="space-y-2">
                  <Label>Expires At</Label>
                  <Input
                    value={new Date(createdKey.expiresAt).toLocaleString()}
                    readOnly
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Create a new API key for MCP server access. The key will have {userRole} permissions.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Cursor MCP - Development"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  />
                </div>
                <div className="rounded-md bg-muted p-3 text-sm">
                  <p className="font-medium mb-1">Role: {userRole}</p>
                  <p className="text-muted-foreground">
                    This API key will have the same permissions as your account.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create API Key"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
