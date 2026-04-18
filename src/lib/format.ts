type AddressParts = {
  address?: string | null;
  address2?: string | null;
  city?: string | null;
  stateProvince?: string | null;
  postalCode?: string | null;
};

export function formatAddress(parts: AddressParts): string {
  const cityLine = [parts.city, parts.stateProvince, parts.postalCode]
    .filter(Boolean)
    .join(", ");
  return [parts.address, parts.address2, cityLine]
    .filter(Boolean)
    .join(", ");
}
