import crypto from "crypto";
import { protectedProcedure, router } from "../_core/trpc";

const CPX_APP_ID = process.env.CPX_APP_ID ?? "33680";
const CPX_APP_SECURE_HASH = process.env.CPX_APP_SECURE_HASH ?? "";

export const surveyRouter = router({
  // Returns the CPX iframe URL with secure hash for the current user
  iframeUrl: protectedProcedure.query(({ ctx }) => {
    const extUserId = String(ctx.user.id);
    const secureHash = crypto
      .createHash("md5")
      .update(`${extUserId}-${CPX_APP_SECURE_HASH}`)
      .digest("hex");

    const params = new URLSearchParams({
      app_id: CPX_APP_ID,
      ext_user_id: extUserId,
      secure_hash: secureHash,
      username: ctx.user.name ?? "",
      email: ctx.user.email ?? "",
      subid_1: "",
      subid_2: "",
    });

    return {
      url: `https://offers.cpx-research.com/index.php?${params.toString()}`,
      appId: CPX_APP_ID,
      extUserId,
    };
  }),
});
