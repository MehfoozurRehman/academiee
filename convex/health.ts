import { query } from "./_generated/server";

export const status = query({
  args: {},
  async handler(ctx) {
    const users = await ctx.db.query("users").collect();
    const academies = await ctx.db.query("academies").collect();

    return {
      connected: true,
      userCount: users.length,
      academyCount: academies.length,
    };
  },
});
