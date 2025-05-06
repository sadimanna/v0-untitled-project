/**
 * Parses a file size string with units (KB, MB, GB) into bytes
 * @param sizeStr String like "10MB" or "5GB"
 * @returns Size in bytes
 */
export function parseFileSize(sizeStr: string): number {
  // If it's just a number, return it as is (assuming bytes)
  if (!isNaN(Number(sizeStr))) {
    return Number(sizeStr)
  }

  // Parse string with units
  const regex = /^(\d+(?:\.\d+)?)\s*(KB|MB|GB|K|M|G|B)?$/i
  const matches = sizeStr.match(regex)

  if (!matches) {
    console.warn(`Invalid file size format: ${sizeStr}, defaulting to 10MB`)
    return 10 * 1024 * 1024 // Default to 10MB
  }

  const size = Number.parseFloat(matches[1])
  const unit = (matches[2] || "B").toUpperCase()

  switch (unit) {
    case "KB":
    case "K":
      return size * 1024
    case "MB":
    case "M":
      return size * 1024 * 1024
    case "GB":
    case "G":
      return size * 1024 * 1024 * 1024
    case "B":
    default:
      return size
  }
}
