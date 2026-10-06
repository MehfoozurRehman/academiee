import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import {
  convexAuth,
  createAccount,
  retrieveAccount,
  type GenericActionCtxWithAuthConfig,
} from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { DataModel, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

type Ctx = GenericActionCtxWithAuthConfig<DataModel>;

// Finds the user behind an account, creating the account (and user) on first
// sign-in. No secrets are stored on the account: the one-time code has already
// been checked by the time this runs.
async function signInAccount(
  ctx: Ctx,
  provider: string,
  id: string,
  profile: { email?: string; name?: string }
): Promise<Id<"users">> {
  try {
    const { user } = await retrieveAccount(ctx, { provider, account: { id } });
    return user._id;
  } catch {
    const { user } = await createAccount(ctx, {
      provider,
      account: { id },
      profile,
      shouldLinkViaEmail: false,
    });
    return user._id;
  }
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    // Academy owners (and super admins): email + 6-digit code.
    ConvexCredentials({
      id: "email-code",
      authorize: async (credentials, ctx) => {
        const email = String(credentials.email ?? "").trim().toLowerCase();
        const code = String(credentials.code ?? "").trim();
        if (!email || !/^\d{6}$/.test(code)) return null;

        const ok: boolean = await ctx.runMutation(internal.authCodes.consumeEmailCode, {
          email,
          code,
        });
        if (!ok) throw new ConvexError({ code: "INVALID_CODE", message: "That code is wrong or has expired." });

        const userId = await signInAccount(ctx, "email-code", email, { email });
        await ctx.runMutation(internal.authCodes.afterOwnerSignIn, { userId, email });
        return { userId };
      },
    }),

    // Students: academy code + student ID + one-time code from the owner.
    ConvexCredentials({
      id: "student-code",
      authorize: async (credentials, ctx) => {
        const academyCode = String(credentials.academyCode ?? "").trim().toUpperCase();
        const studentCode = String(credentials.studentCode ?? "").trim().toUpperCase();
        const code = String(credentials.code ?? "").trim();
        if (!academyCode || !studentCode || !/^\d{6}$/.test(code)) return null;

        const student: { studentId: Id<"students">; name: string } | null =
          await ctx.runMutation(internal.authCodes.consumeStudentCode, {
            academyCode,
            studentCode,
            code,
          });
        if (!student) {
          throw new ConvexError({ code: "INVALID_STUDENT", message: "Those details don't match. Check them with your academy." });
        }

        const userId = await signInAccount(ctx, "student-code", student.studentId, {
          name: student.name,
        });
        await ctx.runMutation(internal.authCodes.afterStudentSignIn, {
          userId,
          studentId: student.studentId,
        });
        return { userId };
      },
    }),
  ],
});
