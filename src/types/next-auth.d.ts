import "next-auth";
import "next-auth/jwt";

export type UserRole = "SUPER_ADMIN" | "ADMIN";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
      isActive: boolean;
    };
  }

  interface User {
    role: UserRole;
    isActive: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    isActive: boolean;
  }
}

