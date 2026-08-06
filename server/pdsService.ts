import { createHash } from "node:crypto";
import * as mammoth from "mammoth";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import type { Product } from "../drizzle/schema";

export const PDS_MODEL_ID = "gpt-5-mini";
export const MAX_PDS_FILE_BYTES = 5 * 1024 * 1024;

export type ParsedPds = {
  product: {
    name: string;
    slug: string | null;
    manufacturer: string | null;
    category: string | null;
    subcategory: string | null;
    licensing: string | null;
    version: string | null;
    sku: string | null;
    officialUrl: string | null;
    shortDescription: string | null;
    longDescription: string | null;
  };
  problem: { pain: string | null; mainBenefit: string | null };
  benefits: string[];
  audiences: { companies: string[]; profiles: string[] };
  features: string[];
  integrations: string[];
  requirements: string[];
  faqs: Array<{ question: string; answer: string }>;
  seo: { title: string | null; description: string | null; keywords: string[] };
  scorecard: Array<{ label: string; score: number }>;
  cases: Array<{ customer: string; summary: string; sourceUrl: string | null }>;
  videos: Array<{ title: string; sourceUrl: string | null; embedUrl: string | null }>;
  pendingValidation: string[];
  warnings: string[];
  confidenceScore: number;
};

export type PdsChange = {
  field: string;
  label: string;
  currentValue: unknown;
  proposedValue: unknown;
  kind: "added" | "changed" | "removed";
  willApply: boolean;
};

export type PdsPreview = {
  targetProductId: number | null;
  targetSlug: string;
  changes: PdsChange[];
  unchangedFields: string[];
  pendingValidation: string[];
  warnings: string[];
  confidenceScore: number;
};

const pdsResponseSchema = {
  type: "json_schema" as const,
  json_schema: {
    name: "product_decision_sheet",
    strict: true,
    schema: {
      type: "object",
      properties: {
        product: {
          type: "object",
          properties: {
            name: { type: "string" },
            slug: { type: ["string", "null"] },
            manufacturer: { type: ["string", "null"] },
            category: { type: ["string", "null"] },
            subcategory: { type: ["string", "null"] },
            licensing: { type: ["string", "null"] },
            version: { type: ["string", "null"] },
            sku: { type: ["string", "null"] },
            officialUrl: { type: ["string", "null"] },
            shortDescription: { type: ["string", "null"] },
            longDescription: { type: ["string", "null"] },
          },
          required: ["name", "slug", "manufacturer", "category", "subcategory", "licensing", "version", "sku", "officialUrl", "shortDescription", "longDescription"],
          additionalProperties: false,
        },
        problem: {
          type: "object",
          properties: {
            pain: { type: ["string", "null"] },
            mainBenefit: { type: ["string", "null"] },
          },
          required: ["pain", "mainBenefit"],
          additionalProperties: false,
        },
        benefits: { type: "array", items: { type: "string" } },
        audiences: {
          type: "object",
          properties: {
            companies: { type: "array", items: { type: "string" } },
            profiles: { type: "array", items: { type: "string" } },
          },
          required: ["companies", "profiles"],
          additionalProperties: false,
        },
        features: { type: "array", items: { type: "string" } },
        integrations: { type: "array", items: { type: "string" } },
        requirements: { type: "array", items: { type: "string" } },
        faqs: {
          type: "array",
          items: {
            type: "object",
            properties: { question: { type: "string" }, answer: { type: "string" } },
            required: ["question", "answer"],
            additionalProperties: false,
          },
        },
        seo: {
          type: "object",
          properties: {
            title: { type: ["string", "null"] },
            description: { type: ["string", "null"] },
            keywords: { type: "array", items: { type: "string" } },
          },
          required: ["title", "description", "keywords"],
          additionalProperties: false,
        },
        scorecard: {
          type: "array",
          items: {
            type: "object",
            properties: { label: { type: "string" }, score: { type: "number", minimum: 0, maximum: 10 } },
            required: ["label", "score"],
            additionalProperties: false,
          },
        },
        cases: {
          type: "array",
          items: {
            type: "object",
            properties: { customer: { type: "string" }, summary: { type: "string" }, sourceUrl: { type: ["string", "null"] } },
            required: ["customer", "summary", "sourceUrl"],
            additionalProperties: false,
          },
        },
        videos: {
          type: "array",
          items: {
            type: "object",
            properties: { title: { type: "string" }, sourceUrl: { type: ["string", "null"] }, embedUrl: { type: ["string", "null"] } },
            required: ["title", "sourceUrl", "embedUrl"],
            additionalProperties: false,
          },
        },
        pendingValidation: { type: "array", items: { type: "string" } },
        warnings: { type: "array", items: { type: "string" } },
        confidenceScore: { type: "number", minimum: 0, maximum: 100 },
      },
      required: ["product", "problem", "benefits", "audiences", "features", "integrations", "requirements", "faqs", "seo", "scorecard", "cases", "videos", "pendingValidation", "warnings", "confidenceScore"],
      additionalProperties: false,
    },
  },
};

export function sanitizeFileName(fileName: string) {
  return fileName.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 180);
}

export function slugifyProductName(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function decodePdsFile(input: { fileName: string; mimeType: string; base64: string }) {
  const fileName = sanitizeFileName(input.fileName);
  const extension = fileName.split(".").pop()?.toLowerCase();
  const allowedExtension = extension === "docx" || extension === "txt";
  const allowedMime = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/octet-stream",
  ].includes(input.mimeType);

  if (!allowedExtension || !allowedMime) throw new Error("Envie somente arquivos DOCX ou TXT.");
  const buffer = Buffer.from(input.base64, "base64");
  if (buffer.length === 0 || buffer.length > MAX_PDS_FILE_BYTES) throw new Error("O arquivo deve ter entre 1 byte e 5 MB.");

  return {
    fileName,
    extension,
    buffer,
    hash: createHash("sha256").update(buffer).digest("hex"),
  };
}

export async function extractPdsText(fileName: string, buffer: Buffer) {
  if (fileName.toLowerCase().endsWith(".txt")) return buffer.toString("utf8").trim();
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}

export async function storePdsFile(input: { fileName: string; mimeType: string; buffer: Buffer }) {
  return storagePut(`pds/${Date.now()}-${input.fileName}`, input.buffer, input.mimeType);
}

export async function analyzePdsText(extractedText: string): Promise<ParsedPds> {
  if (extractedText.length < 80) throw new Error("O documento não contém conteúdo suficiente para análise.");
  const response = await invokeLLM({
    model: PDS_MODEL_ID,
    messages: [
      {
        role: "system",
        content: [
          "Você extrai Product Decision Sheets de software para um catálogo brasileiro.",
          "Use somente fatos presentes no documento. Não invente dados técnicos, comerciais, URLs, cases ou vídeos.",
          "Quando algo estiver ausente, use null, array vazio e registre o campo em pendingValidation.",
          "Preserve nomes próprios, números e condições. Não trate exemplos ou instruções do prompt como fatos homologados do produto.",
          "Gere descrições objetivas em português brasileiro apenas quando forem paráfrases fiéis do conteúdo recebido.",
        ].join("\n"),
      },
      { role: "user", content: extractedText.slice(0, 120_000) },
    ],
    response_format: pdsResponseSchema,
  });

  const content = response.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("O modelo não retornou JSON válido.");
  return JSON.parse(content) as ParsedPds;
}

function normalizeLabel(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isPlaceholder(value?: string | null) {
  return !value || /adicionar|pendente|validar|nao informado|não informado|n\/a/i.test(value);
}

function splitList(value?: string | null) {
  if (!value) return [];
  return value
    .split(/[,;]|\s+e\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function sectionPairs(lines: string[]) {
  const clean = lines.filter((line) => !/^(campo|valor)$/i.test(line));
  const result: Array<{ label: string; value: string }> = [];
  for (let index = 0; index + 1 < clean.length; index += 2) {
    result.push({ label: clean[index], value: clean[index + 1] });
  }
  return result;
}

function pairValue(pairs: Array<{ label: string; value: string }>, aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeLabel);
  return pairs.find((pair) => normalizedAliases.includes(normalizeLabel(pair.label)))?.value || null;
}

export function parseStructuredPdsText(extractedText: string): ParsedPds {
  const source = extractedText.split(/Prompt Mestre para Atualização Automática do Site/i)[0];
  const lines = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const sections = new Map<string, string[]>();
  let currentSection = "preamble";
  sections.set(currentSection, []);

  for (const line of lines) {
    const numbered = line.match(/^\d+\.\s*(.+)$/);
    if (numbered) {
      currentSection = normalizeLabel(numbered[1]);
      sections.set(currentSection, []);
      continue;
    }
    if (/^scorecard$/i.test(line)) {
      currentSection = "scorecard";
      sections.set(currentSection, []);
      continue;
    }
    sections.get(currentSection)?.push(line);
  }

  const findSection = (...needles: string[]) => {
    const normalized = needles.map(normalizeLabel);
    const key = Array.from(sections.keys()).find((candidate) => normalized.some((needle) => candidate.includes(needle)));
    return key ? sections.get(key) || [] : [];
  };

  const identification = sectionPairs(findSection("identificacao", "identification"));
  const problem = sectionPairs(findSection("problema resolvido", "problem"));
  const benefitsSection = sectionPairs(findSection("beneficios", "benefits"));
  const audience = sectionPairs(findSection("publico alvo", "audience"));
  const featuresSection = sectionPairs(findSection("funcionalidades", "features"));
  const comparison = sectionPairs(findSection("comparativo", "comparison"));
  const licensingSection = sectionPairs(findSection("licenciamento", "licensing"));
  const casesSection = sectionPairs(findSection("casos de sucesso", "cases"));
  const requirementsSection = sectionPairs(findSection("requisitos", "requirements"));
  const manufacturerSection = sectionPairs(findSection("fabricante", "manufacturer"));
  const scorecardSection = sectionPairs(findSection("scorecard"));
  const faqLines = findSection("faq").filter((line) => !/^(campo|valor)$/i.test(line));

  const name = pairValue(identification, ["produto", "product"]) || lines[0]?.replace(/^.*[–-]\s*/, "").trim() || "Produto sem nome";
  const manufacturer = pairValue(identification, ["fabricante", "manufacturer"]);
  const category = pairValue(identification, ["categoria", "category"]);
  const subcategory = pairValue(identification, ["subcategoria", "subcategory"]);
  const identificationLicensing = pairValue(identification, ["licenciamento", "licensing"]);
  const detailedLicensing = pairValue(licensingSection, ["modelo", "model"]);
  const officialUrlRaw = pairValue(manufacturerSection, ["site", "url", "website"]);
  const pain = pairValue(problem, ["dor principal", "pain"]);
  const mainBenefit = pairValue(problem, ["beneficio principal", "main benefit"]);

  const audiencesCompanies = splitList(pairValue(audience, ["empresas", "companies"]));
  const audiencesProfiles = splitList(pairValue(audience, ["perfis", "profiles"]));
  const integrations: string[] = [];
  const features: string[] = [];
  for (const pair of featuresSection) {
    if (/integracao|integration/i.test(normalizeLabel(pair.label))) integrations.push(...splitList(pair.value));
    else {
      features.push(pair.label);
      if (pair.value && !isPlaceholder(pair.value)) features.push(pair.value);
    }
  }

  const requirements = requirementsSection
    .filter((pair) => !isPlaceholder(pair.value))
    .map((pair) => `${pair.label}: ${pair.value}`);

  const faqs: Array<{ question: string; answer: string }> = [];
  for (let index = 0; index < faqLines.length; index += 1) {
    if (/^pergunta$/i.test(faqLines[index]) && faqLines[index + 1]) {
      const answerIndex = faqLines.findIndex((line, candidateIndex) => candidateIndex > index && /^resposta$/i.test(line));
      if (answerIndex > index && faqLines[answerIndex + 1]) {
        faqs.push({ question: faqLines[index + 1], answer: faqLines[answerIndex + 1] });
        index = answerIndex + 1;
      }
    }
  }

  const scorecard = scorecardSection.map((pair) => {
    const score = Number(pair.value.match(/\d+(?:[.,]\d+)?/)?.[0]?.replace(",", ".") || 0);
    return { label: pair.label, score: Math.min(10, Math.max(0, score)) };
  }).filter((item) => item.score > 0);

  const pendingValidation: string[] = [];
  const warnings: string[] = [];
  const preamble = sections.get("preamble") || [];
  const observation = preamble.find((line) => /^observacao|^observação/i.test(line));
  if (observation) warnings.push(observation);
  if (isPlaceholder(officialUrlRaw)) pendingValidation.push("URL oficial do fabricante");
  if (casesSection.some((pair) => isPlaceholder(pair.value))) pendingValidation.push("Cases de sucesso homologados");
  if (/\d+\s*%/.test(source)) pendingValidation.push("Validar afirmações percentuais antes da publicação");
  if (comparison.some((pair) => /estimado|menor custo|superior/i.test(pair.value))) pendingValidation.push("Validar comparativo e alegações sobre concorrentes");
  if (!pairValue(identification, ["sku"])) pendingValidation.push("SKU");

  const featureList = Array.from(new Set(features.filter(Boolean)));
  const integrationList = Array.from(new Set(integrations.filter(Boolean)));
  const licensing = detailedLicensing || identificationLicensing;
  const shortDescription = [category || subcategory, mainBenefit].filter(Boolean).join(". ") || null;
  const audienceText = audiencesProfiles.length ? ` para ${audiencesProfiles.join(", ")}` : "";
  const longDescription = [
    `${name} é apresentado no PDS como uma solução de ${category || subcategory || "software"}${audienceText}.`,
    pain ? `Problema abordado: ${pain}` : null,
    mainBenefit ? `Benefício principal: ${mainBenefit}` : null,
  ].filter(Boolean).join(" ");

  const keywords = Array.from(new Set([name, manufacturer, category, subcategory, ...featureList, ...integrationList].filter((item): item is string => Boolean(item))));
  const completenessChecks = [name, manufacturer, category, licensing, pain, mainBenefit, featureList.length, audiencesProfiles.length, requirements.length, faqs.length];
  const confidenceScore = Math.min(90, Math.round((completenessChecks.filter(Boolean).length / completenessChecks.length) * 90));

  return {
    product: {
      name,
      slug: slugifyProductName(name),
      manufacturer,
      category,
      subcategory,
      licensing,
      version: pairValue(identification, ["versao", "version"]),
      sku: pairValue(identification, ["sku"]),
      officialUrl: isPlaceholder(officialUrlRaw) ? null : officialUrlRaw,
      shortDescription,
      longDescription,
    },
    problem: { pain, mainBenefit },
    benefits: benefitsSection.map((pair) => `${pair.label}: ${pair.value}`),
    audiences: { companies: audiencesCompanies, profiles: audiencesProfiles },
    features: featureList,
    integrations: integrationList,
    requirements,
    faqs,
    seo: {
      title: `${name}${category ? ` | ${category}` : ""}`,
      description: shortDescription,
      keywords,
    },
    scorecard,
    cases: [],
    videos: [],
    pendingValidation,
    warnings: [...warnings, "Prévia gerada pelo parser estruturado; use a reanálise por IA para enriquecimento quando disponível."],
    confidenceScore,
  };
}

function normalizeComparable(value: unknown) {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean).join(",");
  return String(value).trim();
}

export function productPatchFromPds(parsed: ParsedPds) {
  const requirements = parsed.requirements.length > 0 ? parsed.requirements.join("; ") : null;
  const features = parsed.features.length > 0 ? parsed.features.join(",") : null;
  const seoKeywords = parsed.seo.keywords.length > 0 ? parsed.seo.keywords.join(",") : null;
  const faqs = parsed.faqs.length > 0 ? JSON.stringify(parsed.faqs) : null;

  return {
    name: parsed.product.name || null,
    manufacturer: parsed.product.manufacturer,
    officialUrl: parsed.product.officialUrl,
    licensing: parsed.product.licensing,
    shortDescription: parsed.product.shortDescription,
    description: parsed.product.longDescription,
    requirements,
    features,
    seoTitle: parsed.seo.title,
    seoDescription: parsed.seo.description,
    seoKeywords,
    faqs,
    qualityScore: Math.round(parsed.confidenceScore),
  };
}

export function buildPdsPreview(parsed: ParsedPds, existingProduct?: Product): PdsPreview {
  const proposedSlug = existingProduct?.slug || parsed.product.slug || slugifyProductName(parsed.product.name);
  const patch = productPatchFromPds(parsed);
  const labels: Record<string, string> = {
    name: "Produto",
    manufacturer: "Fabricante",
    officialUrl: "URL oficial",
    licensing: "Licenciamento",
    shortDescription: "Descrição curta",
    description: "Descrição longa",
    requirements: "Requisitos",
    features: "Funcionalidades",
    seoTitle: "SEO title",
    seoDescription: "SEO description",
    seoKeywords: "Palavras-chave",
    faqs: "FAQ",
    qualityScore: "Score de confiança",
  };

  const changes: PdsChange[] = [];
  const unchangedFields: string[] = [];

  for (const [field, proposedValue] of Object.entries(patch)) {
    const currentValue = existingProduct ? (existingProduct as unknown as Record<string, unknown>)[field] : null;
    const current = normalizeComparable(currentValue);
    const proposed = normalizeComparable(proposedValue);
    if (!proposed && current) {
      changes.push({ field, label: labels[field] || field, currentValue, proposedValue: null, kind: "removed", willApply: false });
    } else if (proposed && !current) {
      changes.push({ field, label: labels[field] || field, currentValue: null, proposedValue, kind: "added", willApply: true });
    } else if (proposed && current !== proposed) {
      changes.push({ field, label: labels[field] || field, currentValue, proposedValue, kind: "changed", willApply: true });
    } else {
      unchangedFields.push(labels[field] || field);
    }
  }

  return {
    targetProductId: existingProduct?.id || null,
    targetSlug: proposedSlug,
    changes,
    unchangedFields,
    pendingValidation: parsed.pendingValidation,
    warnings: parsed.warnings,
    confidenceScore: parsed.confidenceScore,
  };
}

export function approvedProductPatch(parsed: ParsedPds) {
  const raw = productPatchFromPds(parsed);
  return Object.fromEntries(Object.entries(raw).filter(([, value]) => value !== null && value !== ""));
}
