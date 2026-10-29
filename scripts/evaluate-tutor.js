import { readFile, writeFile } from "node:fs/promises";

const cases = JSON.parse(await readFile(new URL("../eval/cases.json", import.meta.url), "utf8"));
const results = [];

for (const item of cases) {
  const response = await fetch("http://127.0.0.1:8787/api/tutor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      answer: item.answer,
      decisionId: item.decisionId,
      level: "beginner",
    }),
  });
  const payload = await response.json();
  results.push({ ...item, httpStatus: response.status, tutorAnswer: payload.answer ?? payload.error ?? "Boş yanıt" });
  console.log(`${item.id}: ${response.status}`);
}

const output = new URL("../eval/results.json", import.meta.url);
await writeFile(output, `${JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)}\n`, "utf8");
console.log(`Kaydedildi: ${output.pathname}`);
