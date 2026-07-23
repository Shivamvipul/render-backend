// Multipart/form-data (used for file uploads) can only send plain strings as field values.
// The frontend JSON.stringifies complex fields like ticketTiers/tags before appending them to
// FormData, so we need to parse them back into real arrays/objects here — before validation
// and before they're saved to Mongoose, which expects real arrays for these schema paths.
const JSON_FIELDS = ['ticketTiers', 'tags', 'gallery', 'mapLocation'];

const parseJsonFields = (req, res, next) => {
  JSON_FIELDS.forEach((field) => {
    if (typeof req.body[field] === 'string') {
      try {
        req.body[field] = JSON.parse(req.body[field]);
      } catch {
        // Leave as-is; downstream validation will report a clear error for a malformed field.
      }
    }
  });
  next();
};

module.exports = parseJsonFields;
