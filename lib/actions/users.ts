"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  isAdmin: z.coerce.boolean(),
});

export async function createUser(formData: FormData) {
  await requireAdmin();

  const parsed = userSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    isAdmin: formData.get("isAdmin") === "on",
  });

  const user = await prisma.user.create({
    data: {
      name: parsed.name,
      email: parsed.email,
      password: await hashPassword(parsed.password),
      isAdmin: parsed.isAdmin,
    },
  });

  await logAudit("user.create", "user", user.id, { email: parsed.email, isAdmin: parsed.isAdmin });
  revalidatePath("/admin/users");
}

export async function toggleUserAdmin(id: number, isAdmin: boolean) {
  await requireAdmin();
  await prisma.user.update({ where: { id }, data: { isAdmin } });
  await logAudit("user.role_change", "user", id, { isAdmin });
  revalidatePath("/admin/users");
}

export async function resetUserPassword(id: number, newPassword: string) {
  await requireAdmin();
  if (newPassword.length < 8) throw new Error("Le mot de passe doit faire au moins 8 caractères.");
  await prisma.user.update({ where: { id }, data: { password: await hashPassword(newPassword) } });
  await logAudit("user.password_reset", "user", id);
  revalidatePath("/admin/users");
}

export async function deleteUser(id: number) {
  const admin = await requireAdmin();
  if (admin.userId === id) throw new Error("Vous ne pouvez pas supprimer votre propre compte.");
  const target = await prisma.user.findUnique({ where: { id } });
  await prisma.user.delete({ where: { id } });
  await logAudit("user.delete", "user", id, { email: target?.email });
  revalidatePath("/admin/users");
}
