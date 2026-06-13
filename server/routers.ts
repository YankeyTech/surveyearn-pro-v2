import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { walletRouter } from "./routers/wallet";
import { surveyRouter } from "./routers/survey";
import { withdrawalRouter } from "./routers/withdrawal";
import { adminRouter } from "./routers/admin";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  wallet: walletRouter,
  survey: surveyRouter,
  withdrawal: withdrawalRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
