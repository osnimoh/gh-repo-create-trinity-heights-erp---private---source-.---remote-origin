import { describe, it, expect } from "vitest";
import { wassceGrade } from "@/lib/academics/grading";

describe("WASSCE grading", () => {
  it("maps band boundaries to the right grade", () => {
    expect(wassceGrade(100).grade).toBe("A1");
    expect(wassceGrade(75).grade).toBe("A1");
    expect(wassceGrade(74.99).grade).toBe("B2");
    expect(wassceGrade(70).grade).toBe("B2");
    expect(wassceGrade(69).grade).toBe("B3");
    expect(wassceGrade(65).grade).toBe("B3");
    expect(wassceGrade(64).grade).toBe("C4");
    expect(wassceGrade(60).grade).toBe("C4");
    expect(wassceGrade(55).grade).toBe("C5");
    expect(wassceGrade(50).grade).toBe("C6");
    expect(wassceGrade(45).grade).toBe("D7");
    expect(wassceGrade(40).grade).toBe("E8");
    expect(wassceGrade(39.99).grade).toBe("F9");
    expect(wassceGrade(0).grade).toBe("F9");
  });

  it("marks F9 as the only failing grade", () => {
    expect(wassceGrade(39).pass).toBe(false);
    expect(wassceGrade(40).pass).toBe(true);
    expect(wassceGrade(50).pass).toBe(true);
  });

  it("clamps out-of-range percentages", () => {
    expect(wassceGrade(120).grade).toBe("A1");
    expect(wassceGrade(-5).grade).toBe("F9");
  });
});
