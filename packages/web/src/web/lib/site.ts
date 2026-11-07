/** Only public hosting configuration; never put credentials here. */
export const isPublicPages = import.meta.env.MODE === "pages";
export const apiOrigin = isPublicPages
  ? "https://osobnyak-nebylitsy.onrender.com"
  : window.location.origin;
export const adminUrl = isPublicPages ? `${apiOrigin}/admin` : "/admin";
export const publicAsset = (name: string) => `${import.meta.env.BASE_URL}${name.replace(/^\/+/, "")}`;