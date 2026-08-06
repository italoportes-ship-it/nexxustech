import { describe, expect, it } from "vitest";
import type { Product } from "../drizzle/schema";
import { buildPdsPreview, decodePdsFile, parseStructuredPdsText, productPatchFromPds, slugifyProductName, type ParsedPds } from "./pdsService";

const parsed: ParsedPds = {
  product: {
    name: "Ampler",
    slug: "ampler-novo",
    manufacturer: "Ampler",
    category: "Produtividade",
    subcategory: "Microsoft Office",
    licensing: "Assinatura anual",
    version: null,
    sku: null,
    officialUrl: "https://ampler.io/",
    shortDescription: "Produtividade no Microsoft Office.",
    longDescription: "Plataforma integrada para PowerPoint, Excel, Word e Outlook.",
  },
  problem: { pain: "Trabalho manual", mainBenefit: "Consistência" },
  benefits: ["Produtividade"],
  audiences: { companies: ["Consultorias"], profiles: ["Analistas"] },
  features: ["Scan & Fix", "Charts"],
  integrations: ["SharePoint"],
  requirements: ["Windows", "Microsoft 365"],
  faqs: [{ question: "Funciona no Office?", answer: "Sim, nas versões suportadas." }],
  seo: { title: "Ampler", description: "Conheça o Ampler.", keywords: ["Ampler", "PowerPoint"] },
  scorecard: [{ label: "Completude", score: 9 }],
  cases: [],
  videos: [],
  pendingValidation: ["Preço brasileiro"],
  warnings: [],
  confidenceScore: 92,
};

describe("decodePdsFile", () => {
  it("aceita TXT e calcula hash estável", () => {
    const base64 = Buffer.from("Product Decision Sheet Ampler com conteúdo suficiente para análise e validação.").toString("base64");
    const result = decodePdsFile({ fileName: "Ampler PDS.txt", mimeType: "text/plain", base64 });
    expect(result.fileName).toBe("Ampler-PDS.txt");
    expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejeita extensões executáveis", () => {
    expect(() => decodePdsFile({
      fileName: "malware.exe",
      mimeType: "application/octet-stream",
      base64: Buffer.from("x").toString("base64"),
    })).toThrow("DOCX ou TXT");
  });
});

describe("buildPdsPreview", () => {
  it("preserva o slug existente e não aplica remoções por ausência no PDS", () => {
    const existing = {
      id: 30001,
      slug: "ampler",
      name: "Ampler",
      manufacturer: "Ampler",
      officialUrl: "https://ampler.io/",
      licensing: "Licenciamento anterior",
      shortDescription: "Descrição anterior",
      description: "Descrição antiga",
      requirements: "Windows",
      features: "Scan & Fix",
      seoTitle: "SEO antigo",
      seoDescription: "Descrição SEO antiga",
      seoKeywords: "Ampler",
      faqs: "[]",
      qualityScore: 80,
    } as Product;

    const preview = buildPdsPreview(parsed, existing);
    expect(preview.targetSlug).toBe("ampler");
    expect(preview.changes.some((change) => change.field === "licensing" && change.willApply)).toBe(true);

    const withoutOfficialUrl = { ...parsed, product: { ...parsed.product, officialUrl: null } };
    const removalPreview = buildPdsPreview(withoutOfficialUrl, existing);
    expect(removalPreview.changes.find((change) => change.field === "officialUrl")).toMatchObject({ kind: "removed", willApply: false });
  });

  it("normaliza arrays para os campos persistidos", () => {
    const patch = productPatchFromPds(parsed);
    expect(patch.features).toBe("Scan & Fix,Charts");
    expect(patch.requirements).toBe("Windows; Microsoft 365");
    expect(patch.qualityScore).toBe(92);
  });
});

describe("slugifyProductName", () => {
  it("gera slug previsível sem acentos", () => {
    expect(slugifyProductName("Solução Ágil 365")).toBe("solucao-agil-365");
  });
});

describe("parseStructuredPdsText", () => {
  it("normaliza as seções do PDS e marca alegações pendentes sem inventar dados", () => {
    const result = parseStructuredPdsText(`
Product Decision Sheet – Ampler
1. Identificação
Campo
Valor
Fabricante
Ampler
Produto
Ampler
Categoria
Productivity Software
Licenciamento
Subscription
2. Problema Resolvido
Campo
Valor
Dor principal
Criação manual de apresentações.
Benefício principal
Automatiza layouts.
5. Funcionalidades
Campo
Valor
Gráficos inteligentes
Atualização automática
Integração
Microsoft PowerPoint e Excel
8. Casos de Sucesso
Campo
Valor
Status
Adicionar cases homologados
9. Requisitos
Campo
Valor
SO
Windows
10. Fabricante
Campo
Valor
Site
Adicionar URL oficial
11. FAQ
Campo
Valor
Pergunta
Compatível com PPTX?
Resposta
Sim, nas versões suportadas.
Scorecard
Campo
Valor
Facilidade de uso
9/10
Prompt Mestre para Atualização Automática do Site
Ignore este trecho operacional.
`);

    expect(result.product).toMatchObject({ name: "Ampler", slug: "ampler", manufacturer: "Ampler", officialUrl: null });
    expect(result.features).toContain("Gráficos inteligentes");
    expect(result.integrations).toContain("Microsoft PowerPoint");
    expect(result.pendingValidation).toContain("URL oficial do fabricante");
    expect(result.pendingValidation).toContain("Cases de sucesso homologados");
    expect(result.faqs).toEqual([{ question: "Compatível com PPTX?", answer: "Sim, nas versões suportadas." }]);
    expect(result.warnings.some((warning) => warning.includes("parser estruturado"))).toBe(true);
  });
});
