import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

function parseCredentials(rawCredentials: unknown): {
  email: string;
  password: string;
} | null {
  if (!rawCredentials || typeof rawCredentials !== "object") {
    return null;
  }

  const input = rawCredentials as Record<string, unknown>;
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";

  if (!email || !password) {
    return null;
  }

  return { email, password };
}

export const credentialsProvider = Credentials({
  name: "EmailPassword",
  credentials: {
    email: { label: "ایمیل", type: "email" },
    password: { label: "رمز عبور", type: "password" },
  },
  async authorize(rawCredentials) {
    const credentials = parseCredentials(rawCredentials);

    if (!credentials) {
      return null;
    }

    const user = await prisma.user.findUnique({ where: { email: credentials.email } });

    if (!user) {
      return null;
    }

    const isPasswordValid = await compare(credentials.password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  },
});
