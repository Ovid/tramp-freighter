// BASE_URL, not '/', because VITE_BASE_PATH sub-path deploys serve public/
// under a prefix.
export function getPortraitUrl(category, key) {
  return `${import.meta.env.BASE_URL}portraits/${category}/${key}.webp`;
}
