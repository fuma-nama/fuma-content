export function isActive(pathname: string, templatePathname: string, nested = false): boolean {
  if (pathname === templatePathname) return true;
  if (nested && pathname.startsWith(templatePathname + "/")) return true;

  return false;
}
