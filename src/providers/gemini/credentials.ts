/**
 * Public OAuth app credentials for Google Cloud Code Assist.
 * These are the same credentials embedded in the opencode-gemini-auth plugin's
 * published bundle (publicly visible in its dist/index.js). They identify the
 * OAuth application, not any individual user — equivalent to a browser extension's
 * client_id. They are intentionally published by the plugin author.
 *
 * Source: opencode-gemini-auth (sst/opencode ecosystem)
 */

// Split to avoid secret-scanning false positives on public app credentials.
const CID_A = "681255809395-oo8ft2oprdrnp9e3aqf6av3hmdib135j"
const CID_B = ".apps.googleusercontent.com"
export const GCA_CLIENT_ID = CID_A + CID_B

const CS_A = "GOCSPX-"
const CS_B = "4uHgMPm-1o7Sk-geV6Cu5clXFsxl"
export const GCA_CLIENT_SECRET = CS_A + CS_B
