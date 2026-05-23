import { describe, it, expect } from "vitest";
import { buildCsv, csvField } from "@/lib/exports/csv";
import { EXPORTERS, emisExporter, runExport } from "@/lib/exports";

describe("CSV builder", () => {
  it("quotes fields containing commas, quotes, or newlines", () => {
    expect(csvField("plain")).toBe("plain");
    expect(csvField("a,b")).toBe('"a,b"');
    expect(csvField('he said "hi"')).toBe('"he said ""hi"""');
    expect(csvField("line1\nline2")).toBe('"line1\nline2"');
    expect(csvField(null)).toBe("");
  });

  it("builds header + rows", () => {
    const csv = buildCsv(
      ["a", "b"],
      [
        [1, 2],
        ["x", "y,z"],
      ],
    );
    expect(csv).toBe('a,b\r\n1,2\r\nx,"y,z"');
  });
});

describe("export scaffolds", () => {
  it("are all marked scaffold (NOT submission-ready) until formats confirmed", () => {
    for (const e of EXPORTERS) expect(e.status).toBe("scaffold");
  });

  it("EMIS exporter emits a header row and one row per student", () => {
    const csv = runExport(emisExporter, [
      {
        admission_no: "THS2028-0001",
        full_name: "Ama Mensah",
        date_of_birth: "2012-05-01",
        sex: "female",
        year_group: "shs1",
        stream: "science",
      },
    ]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toContain("admission_no");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("THS2028-0001");
  });
});
