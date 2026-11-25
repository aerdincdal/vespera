#!/usr/bin/env node
/**
 * docs/hr_attrition.csv (IBM HR Attrition, UTF-8 BOM) → public/data/hr_personel_tr.json
 * Columns and categorical values are translated to Turkish so the in-browser
 * "Veri Analizi Asistanı" can answer in Turkish without a backend.
 * Usage: `npm run build:hrdata`
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(here, "../../docs/hr_attrition.csv");
const OUT = resolve(here, "../public/data/hr_personel_tr.json");

const COLUMNS = {
  Age: "Yaş",
  Attrition: "Ayrılma",
  BusinessTravel: "İş Seyahati",
  DailyRate: "Günlük Ücret",
  Department: "Departman",
  DistanceFromHome: "Eve Uzaklık (km)",
  Education: "Eğitim Seviyesi",
  EducationField: "Eğitim Alanı",
  EnvironmentSatisfaction: "Ortam Memnuniyeti",
  Gender: "Cinsiyet",
  HourlyRate: "Saatlik Ücret",
  JobInvolvement: "İşe Bağlılık",
  JobLevel: "Kademe",
  JobRole: "Pozisyon",
  JobSatisfaction: "İş Memnuniyeti",
  MaritalStatus: "Medeni Durum",
  MonthlyIncome: "Aylık Gelir",
  MonthlyRate: "Aylık Ücret",
  NumCompaniesWorked: "Çalışılan Şirket Sayısı",
  OverTime: "Fazla Mesai",
  PercentSalaryHike: "Zam Oranı (%)",
  PerformanceRating: "Performans Puanı",
  RelationshipSatisfaction: "İlişki Memnuniyeti",
  StockOptionLevel: "Hisse Opsiyonu",
  TotalWorkingYears: "Toplam Deneyim (yıl)",
  TrainingTimesLastYear: "Geçen Yıl Eğitim Sayısı",
  WorkLifeBalance: "İş-Yaşam Dengesi",
  YearsAtCompany: "Şirkette Yıl",
  YearsInCurrentRole: "Pozisyonda Yıl",
  YearsSinceLastPromotion: "Son Terfiden Bu Yana (yıl)",
  YearsWithCurrManager: "Mevcut Yöneticiyle Yıl",
  EmployeeNumber: "Personel No",
};
const DROP = new Set(["EmployeeCount", "Over18", "StandardHours"]);

const VALUES = {
  Department: { Sales: "Satış", "Research & Development": "Ar-Ge", "Human Resources": "İnsan Kaynakları" },
  Gender: { Male: "Erkek", Female: "Kadın" },
  Attrition: { Yes: "Evet", No: "Hayır" },
  OverTime: { Yes: "Evet", No: "Hayır" },
  MaritalStatus: { Single: "Bekar", Married: "Evli", Divorced: "Boşanmış" },
  BusinessTravel: { Travel_Rarely: "Nadiren", Travel_Frequently: "Sık Sık", "Non-Travel": "Yok" },
  JobRole: {
    "Sales Executive": "Satış Uzmanı",
    "Research Scientist": "Araştırma Bilimcisi",
    "Laboratory Technician": "Laboratuvar Teknisyeni",
    "Manufacturing Director": "Üretim Direktörü",
    "Healthcare Representative": "Sağlık Temsilcisi",
    Manager: "Yönetici",
    "Sales Representative": "Satış Temsilcisi",
    "Research Director": "Araştırma Direktörü",
    "Human Resources": "İK Uzmanı",
  },
  EducationField: {
    "Life Sciences": "Yaşam Bilimleri",
    Medical: "Tıp",
    Marketing: "Pazarlama",
    "Technical Degree": "Teknik",
    "Human Resources": "İnsan Kaynakları",
    Other: "Diğer",
  },
};

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else q = false;
      } else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

const raw = (await readFile(SRC, "utf8")).replace(/^﻿/, "");
const lines = raw.split(/\r?\n/).filter((l) => l.trim().length);
const header = splitCsvLine(lines[0]).map((h) => h.trim());

const unknownCols = header.filter((h) => !COLUMNS[h] && !DROP.has(h));
if (unknownCols.length) throw new Error(`Çeviri tablosunda olmayan sütunlar: ${unknownCols.join(", ")}`);

const rows = [];
for (const line of lines.slice(1)) {
  const cells = splitCsvLine(line);
  const row = {};
  header.forEach((h, i) => {
    if (DROP.has(h)) return;
    const rawVal = (cells[i] ?? "").trim();
    const map = VALUES[h];
    if (map) {
      if (!(rawVal in map)) throw new Error(`${h} için çevirisi olmayan değer: "${rawVal}"`);
      row[COLUMNS[h]] = map[rawVal];
      return;
    }
    const n = Number(rawVal);
    row[COLUMNS[h]] = rawVal !== "" && Number.isFinite(n) ? n : rawVal;
  });
  rows.push(row);
}

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(rows), "utf8");
console.log(`✓ ${rows.length} satır, ${Object.keys(rows[0]).length} sütun → ${OUT}`);
