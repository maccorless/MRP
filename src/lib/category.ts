/** Parse the category chip selection ("press" | "photo" | "both") into boolean flags. */
export function parseCategoryFlags(category: string | null): {
  categoryPress: boolean;
  categoryPhoto: boolean;
} {
  if (category === "press") return { categoryPress: true, categoryPhoto: false };
  if (category === "photo") return { categoryPress: false, categoryPhoto: true };
  if (category === "both") return { categoryPress: true, categoryPhoto: true };
  return { categoryPress: false, categoryPhoto: false };
}

/** Render boolean flags back to a display string. */
export function categoryDisplayLabel(press: boolean, photo: boolean): string {
  if (press && photo) return "Press + Photo";
  if (press) return "Press";
  if (photo) return "Photo";
  return "—";
}
