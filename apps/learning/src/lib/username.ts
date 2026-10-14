// Username-based auth: accounts log in with a username + password
// (worker/api/auth.js). Email is optional contact info only.

/** Friendlier message for the one error users are likely to hit repeatedly. */
export function friendlyAuthError(message: string): string {
  if (message.includes("users_username_key")) return "That username is already taken.";
  return message;
}
