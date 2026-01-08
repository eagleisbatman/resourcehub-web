"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  role: "SUPER_ADMIN" | "ADMIN";
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  userId?: string;
  userEmail?: string;
}

interface ApiKeyListProps {
  keys: ApiKey[];
  onRevoke: (id: string) => void;
  canRevokeAll?: boolean;
}

export function ApiKeyList({ keys, onRevoke, canRevokeAll = false }: ApiKeyListProps) {
  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString();
  };

  if (keys.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-gray-500">
        No API keys found
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            {canRevokeAll && <TableHead>User</TableHead>}
            <TableHead>Name</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Used</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keys.map((key) => (
            <TableRow key={key.id}>
              {canRevokeAll && (
                <TableCell className="text-sm text-muted-foreground">
                  {key.userEmail || "N/A"}
                </TableCell>
              )}
              <TableCell className="font-medium">{key.name}</TableCell>
              <TableCell className="font-mono text-sm">
                rh_live_sk_{key.keyPrefix}...
              </TableCell>
              <TableCell>
                <Badge variant={key.role === "SUPER_ADMIN" ? "default" : "secondary"}>
                  {key.role}
                </Badge>
              </TableCell>
              <TableCell>
                {isExpired(key.expiresAt) ? (
                  <Badge variant="destructive">Expired</Badge>
                ) : key.isActive ? (
                  <Badge variant="default">Active</Badge>
                ) : (
                  <Badge variant="secondary">Revoked</Badge>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(key.lastUsedAt)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {key.expiresAt ? formatDate(key.expiresAt) : "Never"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(key.createdAt)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRevoke(key.id)}
                  disabled={!key.isActive}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
