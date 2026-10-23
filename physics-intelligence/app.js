const DATA_URL = "assets/physics-intelligence-data.json";
const STORAGE_KEY = "al_performance_powerhouse_physics_intelligence_v1";

const state = {
  data: null,
  attempts: [],
  visibleFamilies: 24,
  shareMode: new URLSearchParams(location.search).get("share") === "1",
};

const el = (id) => document.getElementById(id);
const pct = (value, digits = 1) => `${(value * 100).toFixed(digits)}%`;
const escapeCsv = (value) => `"${String(value).replaceAll('"', '""')}"`;

function loadLocalState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    state.attempts = Array.isArray(parsed.attempts) ? parsed.attempts : [];
  } catch {
    state.attempts = [];
  }
}

function saveLocalState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, attempts: state.attempts }));
}

function setShareMode(enabled) {
  state.shareMode = enabled;
  document.body.classList.toggle("share-mode", enabled);
  el("shareBanner").hidden = !enabled;
  el("shareToggle").textContent = enabled ? "Exit share mode" : "Share mode";
  const url = new URL(location.href);
  if (enabled) url.searchParams.set("share", "1"); else url.searchParams.delete("share");
  history.replaceState(null, "", url);
}

function populateControls() {
  const years = state.data.byYear.map((row) => row.year);
  for (const id of ["yearFrom", "yearTo"]) {
    el(id).innerHTML = years.map((year) => `<option value="${year}">${year}</option>`).join("");
  }
  el("yearFrom").value = "2000";
  el("yearTo").value = "2025";
  const unitOptions = state.data.units.map((unit) => `<option value="${unit.name}">${unit.name}</option>`).join("");
  el("unitFilter").innerHTML = unitOptions;
  el("unitFilter").value = "Mechanics";
  el("familyUnit").insertAdjacentHTML("beforeend", unitOptions);
  el("attemptFamily").innerHTML = state.data.currentFamilies
    .map((family) => `<option value="${family.familyId}">${family.familyId} · ${family.name}</option>`)
    .join("");
}

function selectedYears() {
  let start = Number(el("yearFrom").value);
  let end = Number(el("yearTo").value);
  if (start > end) [start, end] = [end, start];
  const era = el("eraFilter").value;
  return state.data.byYear.filter((row) => row.year >= start && row.year <= end && (era === "all" || row.era === era));
}

function renderOverview() {
  const { overview, release } = state.data;
  el("metricQuestions").textContent = overview.questions.toLocaleString();
  el("metricYears").textContent = overview.examinationYears;
  el("metricCurrent").textContent = overview.currentEra.questions;
  el("metricFamilies").textContent = overview.currentEra.families;
  el("releaseHash").textContent = `Checkpoint ${release.checkpointZipSha256.slice(0, 12)}…`;
  for (const [id, values] of [["validatedList", state.data.scope.validated], ["provisionalList", state.data.scope.provisional], ["unavailableList", state.data.scope.unavailable]]) {
    el(id).innerHTML = values.map((value) => `<li>${value}</li>`).join("");
  }
  el("externalLink").href = state.data.externalComparison.url;
}

function aggregateUnits(rows) {
  const result = new Map(state.data.units.map((unit) => [unit.name, { count: 0, years: 0 }]));
  let totalQuestions = 0;
  for (const row of rows) {
    totalQuestions += row.questionCount;
    for (const unit of state.data.units) {
      const count = row.units[unit.name].count;
      result.get(unit.name).count += count;
      if (count > 0) result.get(unit.name).years += 1;
    }
  }
  return { result, totalQuestions };
}

function renderBarsAndTable(rows) {
  const { result, totalQuestions } = aggregateUnits(rows);
  const ordered = [...result.entries()].map(([unit, values]) => ({ unit, ...values, share: totalQuestions ? values.count / totalQuestions : 0 }))
    .sort((a, b) => b.share - a.share || a.unit.localeCompare(b.unit));
  const maxShare = Math.max(...ordered.map((row) => row.share), 0.01);
  el("unitBars").innerHTML = ordered.map((row) => `<div class="bar-row"><span>${row.unit}</span><div class="bar-track"><div class="bar-fill" style="width:${(row.share / maxShare) * 100}%"></div></div><span class="bar-value">${pct(row.share)}</span></div>`).join("");
  el("unitTable").innerHTML = ordered.map((row) => `<tr><td>${row.unit}</td><td>${row.count}</td><td>${pct(row.share, 2)}</td><td>${rows.length ? (row.count / rows.length).toFixed(2) : "—"}</td><td>${row.years}/${rows.length}</td></tr>`).join("");
}

function renderTrend(rows) {
  const unit = el("unitFilter").value;
  const svg = el("trendChart");
  const width = 720, height = 270, left = 42, right = 18, top = 18, bottom = 38;
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  el("trendTitle").textContent = `${unit} trend`;
  if (!rows.length) {
    svg.innerHTML = `<text x="20" y="50" class="axis-text">No years match this filter.</text>`;
    el("trendSummary").textContent = "No selected papers";
    return;
  }
  const values = rows.map((row) => ({ year: row.year, value: row.units[unit].percentage }));
  const maxValue = Math.max(...values.map((row) => row.value), 0.2);
  const yMax = Math.ceil(maxValue * 10) / 10;
  const x = (index) => left + (index / Math.max(values.length - 1, 1)) * (width - left - right);
  const y = (value) => top + (1 - value / yMax) * (height - top - bottom);
  let grid = "";
  for (let i = 0; i <= 4; i++) {
    const value = yMax * i / 4;
    const yPos = y(value);
    grid += `<line x1="${left}" x2="${width - right}" y1="${yPos}" y2="${yPos}" class="chart-gridline"/><text x="${left - 6}" y="${yPos + 4}" text-anchor="end" class="axis-text">${Math.round(value * 100)}%</text>`;
  }
  const points = values.map((row, index) => `${x(index)},${y(row.value)}`).join(" ");
  const area = `${left},${height - bottom} ${points} ${x(values.length - 1)},${height - bottom}`;
  const labels = values.map((row, index) => index % Math.ceil(values.length / 9) === 0 || index === values.length - 1 ? `<text x="${x(index)}" y="${height - 15}" text-anchor="middle" class="axis-text">${row.year}</text>` : "").join("");
  const dots = values.map((row, index) => `<circle cx="${x(index)}" cy="${y(row.value)}" r="4" class="chart-dot"><title>${row.year}: ${pct(row.value, 2)}</title></circle>`).join("");
  svg.innerHTML = `${grid}<polygon points="${area}" class="chart-area"/><polyline points="${points}" class="chart-line"/>${dots}${labels}`;
  const mean = values.reduce((sum, row) => sum + row.value, 0) / values.length;
  el("trendSummary").textContent = `${values.length} papers · mean ${pct(mean, 2)}`;
}

function heatColor(value, max) {
  const intensity = max ? value / max : 0;
  // Two contrast-safe bands (WCAG AA for the small cell text): dark cells carry light
  // text, light cells carry dark text, and the unreadable middle band is skipped.
  const light = intensity >= 0.5;
  const lightness = light ? 52 + (intensity - 0.5) * 2 * 20 : 12 + intensity * 2 * 18;
  return { background: `hsl(201 78% ${lightness.toFixed(1)}%)`, color: light ? "#07111f" : "#eef8ff" };
}

function renderHeatmap(rows) {
  const units = state.data.units.map((unit) => unit.name);
  const max = Math.max(...rows.flatMap((row) => units.map((unit) => row.units[unit].percentage)), 0.01);
  const abbreviations = {"Oscillations and Waves":"O&W","Gravitational Field":"Gravity","Electrostatic Field":"Electrostatic","Magnetic Field":"Magnetic","Current Electricity":"Current","Mechanical Properties of Matter":"MPM","Matter and Radiation":"M&R","Thermal Physics":"Thermal"};
  let html = `<div class="heatmap-grid" style="grid-template-columns:54px repeat(${units.length}, minmax(58px,1fr))"><span></span>${units.map((unit) => `<span class="heat-label">${abbreviations[unit] || unit}</span>`).join("")}`;
  for (const row of rows) {
    html += `<span class="heat-label heat-year">${row.year}</span>`;
    for (const unit of units) {
      const value = row.units[unit].percentage;
      html += `<span class="heat-cell" style="background:${heatColor(value, max).background};color:${heatColor(value, max).color}" title="${row.year} · ${unit}: ${row.units[unit].count}/${row.questionCount} (${pct(value, 2)})">${Math.round(value * 100)}</span>`;
    }
  }
  html += "</div>";
  el("heatmap").innerHTML = html;
}

function renderDistribution() {
  const rows = selectedYears();
  renderTrend(rows);
  renderBarsAndTable(rows);
  renderHeatmap(rows);
}

function filteredFamilies() {
  const query = el("familySearch").value.trim().toLowerCase();
  const unit = el("familyUnit").value;
  const minimum = Number(el("familyRecurrence").value);
  return state.data.currentFamilies.filter((family) => {
    const matchesQuery = !query || `${family.familyId} ${family.name} ${family.subtopic} ${family.questionReferences.join(" ")}`.toLowerCase().includes(query);
    return matchesQuery && (unit === "all" || family.unit === unit) && family.recurrenceCount >= minimum;
  });
}

function renderFamilies(reset = false) {
  if (reset) state.visibleFamilies = 24;
  const families = filteredFamilies();
  el("familyCount").textContent = `${families.length} families`;
  el("familyList").innerHTML = families.slice(0, state.visibleFamilies).map((family) => `<article class="family-card"><header><h3>${family.familyId} · ${family.name}</h3><span class="recurrence">${family.recurrenceCount} question${family.recurrenceCount === 1 ? "" : "s"}</span></header><p class="family-meta">${family.unit} · ${family.subtopic}</p><p class="family-refs"><strong>Years:</strong> ${family.years.join(", ")}<br><strong>References:</strong> ${family.questionReferences.join(" · ")}</p></article>`).join("");
  el("showMoreFamilies").hidden = state.visibleFamilies >= families.length;
}

function familyScores() {
  const maxFrequency = Math.max(...state.data.currentFamilies.map((family) => family.recurrenceCount), 1);
  return state.data.currentFamilies.map((family) => {
    const attempts = state.attempts.filter((attempt) => attempt.familyId === family.familyId);
    if (!attempts.length) return { family, attempts, score: null, parts: null };
    const weaknessMap = { correct: 0, wrong: 1, guessed: .75, slow: .55, unattempted: .45 };
    const frequency = family.recurrenceCount / maxFrequency;
    const weakness = attempts.reduce((sum, attempt) => sum + weaknessMap[attempt.outcome], 0) / attempts.length;
    const wrongLike = attempts.filter((attempt) => attempt.outcome === "wrong").length + attempts.filter((attempt) => attempt.outcome === "guessed").length * .5;
    const repeated = Math.min(1, wrongLike / 3);
    const averageTime = attempts.reduce((sum, attempt) => sum + attempt.timeSeconds, 0) / attempts.length;
    const timeLoss = Math.max(0, Math.min(1, (averageTime - 75) / 105));
    const mismatchValues = attempts.filter((attempt) => attempt.outcome === "wrong" || attempt.outcome === "guessed").map((attempt) => attempt.confidence / 5);
    const mismatch = mismatchValues.length ? mismatchValues.reduce((a, b) => a + b, 0) / mismatchValues.length : 0;
    const score = 100 * (.30 * frequency + .30 * weakness + .15 * repeated + .15 * timeLoss + .10 * mismatch);
    return { family, attempts, score, parts: { frequency, weakness, repeated, timeLoss, mismatch, averageTime } };
  }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}

function actionFor(item) {
  const latest = item.attempts.at(-1);
  if (!latest) return "Log a timed baseline";
  if (latest.outcome === "wrong" || latest.outcome === "guessed") return "Revise, then retest closed-book";
  if (latest.outcome === "slow" || item.parts.averageTime > 105) return "Practise under a 90-second cap";
  if (latest.outcome === "unattempted") return "Repair prerequisite, then attempt";
  return "Maintain with delayed retest";
}

function renderPerformance() {
  const scored = familyScores();
  const usable = scored.filter((item) => item.score !== null);
  if (!usable.length) {
    el("recommendations").innerHTML = `<article class="recommendation"><span>NEXT MOVE</span><strong>Log one honest timed Physics MCQ</strong><small>A recommendation requires your marked outcome, time and confidence.</small></article>`;
    el("opportunityTable").innerHTML = `<tr><td colspan="6">No private evidence yet. Frequency alone will not be disguised as a personal diagnosis.</td></tr>`;
    return;
  }
  const revise = usable.find((item) => ["wrong", "guessed", "unattempted"].includes(item.attempts.at(-1).outcome)) || usable[0];
  const practise = usable.find((item) => item.attempts.at(-1).outcome === "slow" || item.parts.averageTime > 105) || usable[0];
  const retest = usable.find((item) => ["wrong", "guessed"].includes(item.attempts.at(-1).outcome)) || usable[0];
  el("recommendations").innerHTML = [["REVISE", revise], ["PRACTISE", practise], ["RETEST", retest]].map(([label, item]) => `<article class="recommendation"><span>${label}</span><strong>${item.family.name}</strong><small>${item.family.unit} · score ${item.score.toFixed(1)}</small></article>`).join("");
  el("opportunityTable").innerHTML = usable.slice(0, 12).map((item, index) => {
    const outcomes = Object.entries(item.attempts.reduce((acc, attempt) => (acc[attempt.outcome] = (acc[attempt.outcome] || 0) + 1, acc), {})).map(([key, value]) => `${value} ${key}`).join(", ");
    return `<tr><td>${index + 1}</td><td>${item.family.name}</td><td>${item.family.unit}</td><td class="score">${item.score.toFixed(1)}</td><td>${outcomes}; avg ${Math.round(item.parts.averageTime)}s</td><td>${actionFor(item)}</td></tr>`;
  }).join("");
}

function downloadFilteredCsv() {
  const rows = selectedYears();
  const lines = [["exam_year", "era", "question_count", "unit", "count", "normalized_percentage"].map(escapeCsv).join(",")];
  for (const row of rows) for (const unit of state.data.units) lines.push([row.year, row.era, row.questionCount, unit.name, row.units[unit.name].count, row.units[unit.name].percentage].map(escapeCsv).join(","));
  const blob = new Blob([lines.join("\r\n") + "\r\n"], { type: "text/csv;charset=utf-8" });
  const link = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "physics-unit-distribution-filtered.csv" });
  link.click();
  URL.revokeObjectURL(link.href);
}

function bindEvents() {
  for (const id of ["yearFrom", "yearTo", "eraFilter", "unitFilter"]) el(id).addEventListener("change", renderDistribution);
  for (const id of ["familySearch", "familyUnit", "familyRecurrence"]) el(id).addEventListener(id === "familySearch" ? "input" : "change", () => renderFamilies(true));
  el("showMoreFamilies").addEventListener("click", () => { state.visibleFamilies += 24; renderFamilies(); });
  el("downloadCsv").addEventListener("click", downloadFilteredCsv);
  el("shareToggle").addEventListener("click", () => setShareMode(!state.shareMode));
  el("attemptForm").addEventListener("submit", (event) => {
    event.preventDefault();
    state.attempts.push({
      familyId: el("attemptFamily").value,
      outcome: el("attemptOutcome").value,
      timeSeconds: Number(el("attemptTime").value),
      confidence: Number(el("attemptConfidence").value),
      recordedAt: new Date().toISOString(),
    });
    saveLocalState();
    renderPerformance();
  });
  el("exportBackup").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify({ version: 1, storageKey: STORAGE_KEY, attempts: state.attempts }, null, 2)], { type: "application/json" });
    const link = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "physics-intelligence-private-backup.json" });
    link.click(); URL.revokeObjectURL(link.href);
  });
  el("importBackup").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const parsed = JSON.parse(await file.text());
    if (!Array.isArray(parsed.attempts)) throw new Error("Backup does not contain an attempts array.");
    state.attempts = parsed.attempts;
    saveLocalState(); renderPerformance();
  });
}

async function init() {
  const response = await fetch(DATA_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to load validated data (${response.status})`);
  state.data = await response.json();
  loadLocalState();
  populateControls();
  renderOverview();
  renderDistribution();
  renderFamilies();
  renderPerformance();
  bindEvents();
  setShareMode(state.shareMode);
}

init().catch((error) => {
  console.error(error);
  document.querySelector("main").innerHTML = `<section class="panel section-panel"><p class="eyebrow">DATA LOAD ERROR</p><h1>Physics Intelligence could not start.</h1><p>${error.message}</p></section>`;
});
