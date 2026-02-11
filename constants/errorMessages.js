const ERROR_MSG = Object.freeze({
  REQUIRED: "This field is required.",
  INVALID_EMAIL: "Please enter a valid email address.",
  PASSWORD_MIN: "Password must be at least 8 characters long.",
  PASSWORD_STRONG: "Password must include uppercase, lowercase, number, and special character.",
  PASSWORD_MATCH: "Passwords do not match.",

  STRING_MIN: (min) => `Must be at least ${min} characters.`,
  STRING_MAX: (max) => `Must be less than ${max} characters.`,

  NUMBER_INVALID: "Must be a valid phone number.",
  NUMBER_POSITIVE: "Value must be greater than 0.",

  FILE_TYPE: "Only JPG, PNG, or WEBP files are allowed.",
  FILE_SIZE: "File size must be less than 5MB.",
});

module.exports = ERROR_MSG;
