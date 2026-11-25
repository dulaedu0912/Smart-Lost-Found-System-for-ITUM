import { calculateMatchScore } from "./matching.js";

const templates = [
  ["Scientific calculator", "Black Casio calculator", "Division of IT"],
  ["Water bottle", "Blue metal bottle", "Canteen"],
  ["USB drive", "Small silver USB drive", "Main Library"],
  ["Umbrella", "Navy folding umbrella", "Sports Complex"],
];

function makePair(template, matching, variation) {
  const [category, title, zone] = template;
  const offset = matching ? variation : variation + 30;
  return {
    left: {
      kind: "LOST",
      category,
      zone,
      date: "2026-11-01",
      colour: title.split(" ")[0],
      title,
      description: matching ? `${title} with a small identifying mark` : "Different item",
    },
    right: {
      kind: "FOUND",
      category,
      zone: matching ? zone : "Lecture Hall Complex",
      date: `2026-11-${String(1 + offset).padStart(2, "0")}`,
      colour: matching ? title.split(" ")[0] : "Red",
      title: matching ? `${title} found` : `Different ${category}`,
      description: matching ? `${title} with an identifying mark` : "Different model and identifying marks",
    },
    label: matching,
  };
}

export function buildSyntheticDataset() {
  return templates.flatMap((template) => [
    makePair(template, true, 0),
    makePair(template, true, 3),
    makePair(template, true, 10),
    makePair(template, false, 0),
  ]);
}

export function evaluateThreshold(dataset, threshold) {
  let truePositive = 0;
  let falsePositive = 0;
  let falseNegative = 0;

  for (const pair of dataset) {
    const predicted = calculateMatchScore(pair.left, pair.right) >= threshold;
    if (predicted && pair.label) truePositive += 1;
    if (predicted && !pair.label) falsePositive += 1;
    if (!predicted && pair.label) falseNegative += 1;
  }

  const precision = truePositive / Math.max(truePositive + falsePositive, 1);
  const recall = truePositive / Math.max(truePositive + falseNegative, 1);
  const f1 = (2 * precision * recall) / Math.max(precision + recall, 1);
  return { threshold, precision, recall, f1, truePositive, falsePositive, falseNegative };
}

if (process.argv[1]?.endsWith("evaluation.js")) {
  const dataset = buildSyntheticDataset();
  const results = Array.from({ length: 26 }, (_, index) =>
    evaluateThreshold(dataset, 0.6 + index * 0.01),
  );
  const best = results.reduce((current, result) => (result.f1 > current.f1 ? result : current));
  console.log(JSON.stringify({ datasetSize: dataset.length, best, results }, null, 2));
}
