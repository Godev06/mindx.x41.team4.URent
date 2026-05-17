module.exports = {
  serve: (req, res, next) => next(),
  setup: () => (req, res, next) => res.json({ error: "Swagger UI is not available on Edge (Cloudflare). Please use the JSON specification at /api-docs.json" })
};
