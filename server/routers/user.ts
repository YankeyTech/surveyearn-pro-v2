import { eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { hashPassword, verifyPassword } from "../_core/password";

export const userRouter = router({
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(users)
        .set({ name: input.name, ...(input.email ? { email: input.email } : {}) })
        .where(eq(users.id, ctx.user.id));

      return { success: true };
    }),

  uploadProfilePicture: protectedProcedure
    .input(z.object({ file: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Store as base64 data URL (no external storage needed)
      const url = `data:image/jpeg;base64,${input.file}`;
      await db.update(users)
        .set({ profilePictureUrl: url })
        .where(eq(users.id, ctx.user.id));

      return { url };
    }),

  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(6),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const rows = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (!rows.length) throw new TRPCError({ code: "NOT_FOUND" });

      const user = rows[0];
      if (!user.passwordHash) throw new TRPCError({ code: "BAD_REQUEST", message: "No password set for this account" });

      const valid = verifyPassword(input.currentPassword, user.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect" });

      const newHash = hashPassword(input.newPassword);
      await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, ctx.user.id));

      return { success: true };
    }),
});