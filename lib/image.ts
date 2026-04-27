/**
 * Returns the image URL or null if empty/undefined.
 * Next.js Image component accepts null but not empty string.
 */
export function imageOrNull(url: string | null | undefined): string | null {
  return url && url.trim() !== "" ? url : null;
}

/**
 * Default placeholder image for products with no image.
 */
export const DEFAULT_PRODUCT_IMAGE = "/products/placeholder.png";
