const prisma = require("./prisma");

const TRASH_RETENTION_DAYS = 30;
const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Permanently delete notes that have been in the trash for more than TRASH_RETENTION_DAYS.
 * Returns the count of purged notes.
 */
const purgeExpiredNotes = async () => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - TRASH_RETENTION_DAYS);

  const { count } = await prisma.note.deleteMany({
    where: {
      isDeleted: true,
      deletedAt: { lte: cutoff },
    },
  });

  if (count > 0) {
    console.log(`🗑️  Purged ${count} note(s) deleted more than ${TRASH_RETENTION_DAYS} days ago`);
  }

  return count;
};

/**
 * Start the recurring cleanup job.
 * Runs once immediately on startup, then every 24 hours.
 */
const startCleanupJob = () => {
  purgeExpiredNotes().catch((err) =>
    console.error("Cleanup job error (startup):", err.message)
  );

  setInterval(() => {
    purgeExpiredNotes().catch((err) =>
      console.error("Cleanup job error (interval):", err.message)
    );
  }, INTERVAL_MS);

  console.log(`🧹 Trash cleanup job started — notes purged after ${TRASH_RETENTION_DAYS} days`);
};

module.exports = { startCleanupJob, purgeExpiredNotes, TRASH_RETENTION_DAYS };
