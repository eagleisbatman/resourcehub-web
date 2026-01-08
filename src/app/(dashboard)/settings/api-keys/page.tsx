"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ApiKeyForm } from "@/components/settings/api-key-form";
import { ApiKeyList } from "@/components/settings/api-key-list";
import { Plus } from "lucide-react";
import { useSession } from "next-auth/react";

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

export default function ApiKeysPage() {
  const { data: session } = useSession();
  const [myKeys, setMyKeys] = useState<ApiKey[]>([]);
  const [allKeys, setAllKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/auth/api-keys");
      const data = await response.json();
      const keys = data.data || [];
      
      // Separate own keys from all keys (for Super Admins)
      if (isSuperAdmin && session?.user?.id) {
        // Super Admins see all keys, but we'll separate them in the UI
        setAllKeys(keys);
        // Filter to show own keys separately
        const ownKeys = keys.filter((k: ApiKey) => k.userId === session.user.id);
        setMyKeys(ownKeys);
      } else {
        setMyKeys(keys);
        setAllKeys([]);
      }
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this API key? It will no longer work.")) {
      return;
    }

    try {
      const response = await fetch(`/api/auth/api-keys/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error?.message || "Failed to revoke API key");
      }
    } catch (error) {
      console.error("Failed to revoke API key:", error);
      alert("Failed to revoke API key");
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage API keys for MCP server access
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create API Key
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">My API Keys</h2>
          <ApiKeyList
            keys={myKeys}
            onRevoke={handleRevoke}
            canRevokeAll={false}
          />
        </div>

        {isSuperAdmin && allKeys.length > myKeys.length && (
          <div>
            <h2 className="text-lg font-semibold mb-4">All API Keys</h2>
            <ApiKeyList
              keys={allKeys.filter((k) => !myKeys.find((mk) => mk.id === k.id))}
              onRevoke={handleRevoke}
              canRevokeAll={true}
            />
          </div>
        )}
      </div>

      <ApiKeyForm
        open={formOpen}
        onOpenChange={setFormOpen}
        userRole={(session?.user?.role as "SUPER_ADMIN" | "ADMIN") || "ADMIN"}
        onSuccess={fetchData}
      />
    </div>
  );
}
