import { isNotNull, sql } from "drizzle-orm";
import { db } from "../src/db";
import { enrRequests, auditLog } from "../src/db/schema";

async function main() {
  const before = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(enrRequests)
    .where(isNotNull(enrRequests.submittedAt));

  console.log(`Submitted ENR rows before: ${before[0].count}`);

  await db.update(enrRequests).set({ submittedAt: null }).where(isNotNull(enrRequests.submittedAt));

  const audit = await db
    .delete(auditLog)
    .where(sql`${auditLog.action} = 'enr_submitted'`)
    .returning({ id: auditLog.id });

  console.log(`Reverted ENR rows to draft. Deleted ${audit.length} enr_submitted audit entries.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
