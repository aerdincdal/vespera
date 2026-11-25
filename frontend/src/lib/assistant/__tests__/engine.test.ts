/**
 * Runs with `npm run test:assistant` (node --test via tsx).
 * Exercises the Turkish NL → analysis engine over the bundled HR dataset and a synthetic CSV.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { answer, interpret, schemaFor } from "../engine";
import { parseCsv } from "../csv";
import type { Row } from "../types";

const here = dirname(fileURLToPath(import.meta.url));
const rows: Row[] = JSON.parse(readFileSync(resolve(here, "../../../../public/data/hr_personel_tr.json"), "utf8"));
const schema = schemaFor(rows);

const TURKISH_MARKERS = /[çğıöşüÇĞİÖŞÜ]|\b(ve|ile|için|var|en|göre|bazında|oranı|ortalama|sayısı|dağılım|veri)\b/;
const ENGLISH_LEAK = /\b(Sales|Research|Human Resources|Male|Female|Yes|average|count|rate)\b/;

function assertTurkish(reply: string) {
  assert.ok(TURKISH_MARKERS.test(reply), `Yanıt Türkçe görünmüyor: ${reply}`);
  assert.ok(!ENGLISH_LEAK.test(reply), `Yanıtta İngilizce sızıntısı var: ${reply}`);
}

interface Case {
  q: string;
  intent: string;
  table?: boolean;
  chart?: "bar" | "line" | "pie" | false;
  contains?: RegExp[];
  columns?: string[];
}

const CASES: Case[] = [
  {
    q: "Departmanlara göre ortalama maaşları göster",
    intent: "groupby", table: true, chart: "bar",
    contains: [/Departman bazında ortalama Aylık Gelir/, /Satış/, /₺/],
    columns: ["Departman", "Ortalama Aylık Gelir", "Kişi Sayısı"],
  },
  { q: "Yaş dağılımı histogramını çiz", intent: "distribution", table: true, chart: "bar", contains: [/Yaş 18 ile 60 arasında/, /En yoğun aralık/] },
  {
    q: "En yüksek maaşı alan 5 kişiyi listele",
    intent: "top", table: true, chart: "bar",
    contains: [/en yüksek 5 kişi/, /19\.999 ₺/, /Personel No 259/],
  },
  {
    q: "Departmanlara göre ayrılma oranı nedir?",
    intent: "rate", table: true, chart: "bar",
    contains: [/Ayrılma oranı en yüksek Satış \(%20,6\)/, /genel oran %16,1/],
    columns: ["Departman", "Ayrılma Oranı (%)", "Evet Sayısı", "Kişi Sayısı"],
  },
  {
    q: "Fazla mesai yapanların ortalama iş memnuniyeti",
    intent: "aggregate", table: true, chart: "bar",
    contains: [/Fazla Mesai = Evet/, /416 kişi/, /ortalama İş Memnuniyeti 2,77/],
  },
  {
    q: "Yaşı 40'tan büyük kadın çalışanların ortalama geliri",
    intent: "aggregate", table: true, chart: "bar",
    contains: [/Cinsiyet = Kadın/, /Yaş > 40/, /193 kişi/, /₺/],
  },
  {
    q: "Aylık gelir ile toplam deneyim arasındaki ilişki",
    intent: "correlation", table: true, chart: "line",
    contains: [/güçlü pozitif ilişki/, /r = 0,77/],
  },
  {
    q: "Pozisyonlara göre çalışan sayısı",
    intent: "groupby", table: true, chart: "bar",
    contains: [/Pozisyon bazında en kalabalık grup Satış Uzmanı \(326 kişi/, /9 grup/],
    columns: ["Pozisyon", "Kişi Sayısı", "Pay"],
  },
  {
    q: "Medeni duruma göre ayrılma yüzdesi",
    intent: "rate", table: true, chart: "bar",
    contains: [/Bekar \(%25,5\)/, /Boşanmış \(%10,1\)/],
  },
  { q: "Verideki sütunlar neler?", intent: "columns", table: true, chart: false, contains: [/32 sütun/, /23 sayısal/, /8 kategorik/] },
  { q: "kaç çalışan var", intent: "count", chart: false, contains: [/1\.470 çalışan kaydı/] },
  { q: "merhaba", intent: "greeting", chart: false, contains: [/^Merhaba!/, /1\.470 kayıt/, /Örneğin/] },
  { q: "asdfgh", intent: "fallback", chart: false, contains: [/eşleştiremedim/, /• Departman bazında ortalama Aylık Gelir/, /• Yaş dağılımı/] },
];

for (const c of CASES) {
  test(c.q, () => {
    const a = interpret(c.q, schema);
    assert.equal(a.intent, c.intent, `intent ${a.intent} ≠ ${c.intent}`);
    const r = answer(rows, c.q);
    assertTurkish(r.reply);
    assert.ok(r.reply.length > 20);
    if (c.table) {
      assert.ok(r.table, "tablo bekleniyordu");
      assert.ok(r.table.rows.length > 0 && r.table.rows.length <= 50, "tablo 1–50 satır olmalı");
      if (c.columns) assert.deepEqual(r.table.columns, c.columns);
    }
    if (c.chart) {
      assert.ok(r.chart, "grafik bekleniyordu");
      assert.equal(r.chart.type, c.chart);
      assert.ok(r.chart.data.length > 0);
      assert.ok(r.chart.yKeys.every((k) => typeof r.chart!.data[0][k] === "number"), "grafik y değerleri sayı olmalı");
    } else if (c.chart === false) {
      assert.equal(r.chart, undefined, "grafik beklenmiyordu");
    }
    for (const re of c.contains ?? []) assert.match(r.reply, re);
    // headline ≤ 2 sentences for analytical answers
    if (!["greeting", "help", "fallback", "columns"].includes(c.intent)) {
      const sentences = r.reply.split(/(?<=[.!?])\s+(?=[A-ZÇĞİÖŞÜ0-9"])/).length;
      assert.ok(sentences <= 2, `yanıt 2 cümleyi aşıyor (${sentences}): ${r.reply}`);
    }
  });
}

test("filters: value + comparator + participle combine", () => {
  const a = interpret("Satış departmanında fazla mesai yapan ve yaşı 30 ile 40 arasında olan kaç çalışan var", schema);
  assert.equal(a.intent, "count");
  const ops = a.filters.map((f) => `${f.column.name}:${f.op}`).sort();
  assert.deepEqual(ops, ["Departman:eq", "Fazla Mesai:eq", "Yaş:between"]);
  const r = answer(rows, "Satış departmanında fazla mesai yapan ve yaşı 30 ile 40 arasında olan kaç çalışan var");
  assert.match(r.reply, /ölçütüne uyan \d+ kişi var/);
});

test("crosstab: two categoricals → stacked bar", () => {
  const r = answer(rows, "Departmanlara göre cinsiyet dağılımı");
  assert.equal(interpret("Departmanlara göre cinsiyet dağılımı", schema).intent, "crosstab");
  assert.ok(r.chart && r.chart.type === "bar" && r.chart.yKeys.length === 2);
  assert.deepEqual(r.table?.columns, ["Departman", "Erkek", "Kadın", "Kişi Sayısı"]);
});

test("ordinal / temporal groupings → line chart, ascending order", () => {
  const r = answer(rows, "Şirkette yıla göre ortalama gelir");
  assert.equal(r.chart?.type, "line");
  const xs = r.table!.rows.map((row) => Number(row[0]));
  assert.deepEqual(xs, [...xs].sort((a, b) => a - b));
});

test("share question with ≤6 categories → pie", () => {
  const r = answer(rows, "cinsiyet dağılımı yüzdesi");
  assert.equal(r.chart?.type, "pie");
  assert.match(r.reply, /Erkek/);
});

test("overall rate without grouping", () => {
  const r = answer(rows, "ayrılma oranı");
  assert.match(r.reply, /Ayrılma oranı %16,1/);
  assert.equal(r.chart?.type, "pie");
});

test("bottom-N", () => {
  const r = answer(rows, "En düşük maaşlı 3 çalışan kim?");
  assert.match(r.reply, /en düşük 3 kişi/);
  assert.equal(r.table?.rows.length, 3);
});

test("parseCsv: ; delimiter, Turkish decimals, quoted fields", () => {
  const csv = "﻿Ürün;Bölge;Satış Tutarı;Adet\n\"Vida, M8\";Marmara;1.250,50;10\nSomun;Ege;980,00;7\nCıvata;Marmara;2.100,25;12\n";
  const parsed = parseCsv(csv);
  assert.equal(parsed.delimiter, ";");
  assert.deepEqual(parsed.columns, ["Ürün", "Bölge", "Satış Tutarı", "Adet"]);
  assert.equal(parsed.rows.length, 3);
  assert.equal(parsed.rows[0]["Satış Tutarı"], 1250.5);
  assert.equal(parsed.rows[0]["Ürün"], "Vida, M8");
  const r = answer(parsed.rows, "Bölgeye göre toplam satış tutarı");
  assert.match(r.reply, /Bölge bazında toplam Satış Tutarı en yüksek Marmara \(3\.350,75 ₺\)/);
  assert.equal(r.table?.columns[1], "Toplam Satış Tutarı");
});

test("parseCsv: , delimiter with plain numbers", () => {
  const parsed = parseCsv("name,score\nA,1.5\nB,2\nC,3.25\n");
  assert.equal(parsed.delimiter, ",");
  assert.equal(parsed.rows[2].score, 3.25);
});
