/**
 * GET /about
 * Returns info about the author and implemented features
 */
const getAbout = (req, res) => {
  return res.status(200).json({
    name: process.env.AUTHOR_NAME || "Your Name",
    email: process.env.AUTHOR_EMAIL || "your@email.com",
    "my features": {
      "Note Tags": "Users can attach multiple tags to notes and filter notes by tag. Chosen to improve note organization — a core UX need in any notes app.",
      "Note Pinning": "Users can pin important notes so they always appear at the top of the list. Chosen because it's a high-value, low-effort feature that mirrors real apps like Google Keep.",
      "Soft Delete & Trash": "Deleted notes go to a trash bin and can be restored. Chosen to prevent accidental data loss — a critical safety feature.",
      "Pagination": "GET /notes supports page and limit query params. Chosen to keep the API performant as note count grows.",
      "Full-text Search": "GET /search?q=keyword searches across note titles and content. Chosen because search is the primary way users retrieve information in a notes app.",
    },
  });
};

module.exports = { getAbout };
