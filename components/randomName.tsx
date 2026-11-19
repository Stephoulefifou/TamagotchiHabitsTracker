// RANDOM NAME
// Asks the Random User API for a random first name (used when the egg hatches).
// No key needed. If it fails (no internet...), we use a backup name instead.

const URL = "https://randomuser.me/api/?inc=name&noinfo?nat=fi";

export async function getRandomName(): Promise<string> {
  try {
    const response = await fetch(URL);            // 1. send the request
    if (!response.ok) throw new Error("Bad answer"); // 2. the server said no
    const data = await response.json();            // 3. turn the answer into an object
    return data.results[0].name.first;             // 4. keep only the first name
  } catch {
    return "Slimy"; // backup name, so the egg can always hatch
  }
}