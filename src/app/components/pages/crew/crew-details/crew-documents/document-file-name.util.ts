export function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex <= 0 || lastDotIndex === fileName.length - 1) {
    return '';
  }

  return fileName.slice(lastDotIndex);
}

export function stripFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex <= 0) {
    return fileName;
  }

  return fileName.slice(0, lastDotIndex);
}

export function buildSimpleFileName(name: string, sourceFileName: string): string {
  const extension = getFileExtension(sourceFileName);
  const baseName = stripFileExtension(name.trim());
  return `${baseName}${extension}`;
}

export function buildFullFileNamePreview(
  name: string,
  documentType: string | null | undefined,
  expireDate: string | null | undefined,
  sourceFileName: string,
  crewId: number | null
): string {
  const extension = getFileExtension(sourceFileName);
  const baseName = stripFileExtension(name.trim());
  const crewIdPart = crewId != null ? String(crewId) : '';
  const typePart = documentType?.trim() || '';
  const datePart = expireDate ? expireDate.replace(/-/g, '') : '';

  return `${crewIdPart}_${typePart}_${datePart}_${baseName}${extension}`;
}

export function toIsoExpireDate(expireDate: string): string {
  return new Date(`${expireDate}T00:00:00.000Z`).toISOString();
}
