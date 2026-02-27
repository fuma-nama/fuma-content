import { cursorDataSchema, type CursorData } from ".";

// TODO: auth system
export function generateUser(): CursorData {
  let cached = sessionStorage.getItem("cursor-data");
  if (cached) {
    try {
      cached = JSON.parse(cached);
    } catch {
      cached = null;
    }
    const result = cursorDataSchema.safeParse(cached);
    if (result.success) return result.data;
  }

  const data: CursorData = {
    color: generateRandomHsl(),
    name: `Session ${Math.round(Math.random() * 9999)
      .toString()
      .padStart(4, "0")}`,
  };
  sessionStorage.setItem("cursor-data", JSON.stringify(data));
  return data;
}

function generateRandomHsl() {
  const hue = Math.floor(Math.random() * 361);
  return `hsl(${hue}, 80%, 40%)`;
}
