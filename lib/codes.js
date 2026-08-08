/** Small helpers for generating human-readable codes and passwords */

export function randomDigits(n = 4) {
  return Math.floor(Math.random() * Math.pow(10, n)).toString().padStart(n, '0');
}

export function generateClientCode() {
  return `CL-${1000 + Math.floor(Math.random() * 9000)}`;
}

export function generateVendorCode() {
  return `VN-${100 + Math.floor(Math.random() * 900)}`;
}

export function generateProjectCode() {
  return `PRJ-${2000 + Math.floor(Math.random() * 8000)}`;
}

export function generateTempPassword() {
  const words = ['coral', 'amber', 'quartz', 'ivory', 'sable', 'lumen', 'ember', 'onyx'];
  const word = words[Math.floor(Math.random() * words.length)];
  return `${word}${randomDigits(3)}`;
}
