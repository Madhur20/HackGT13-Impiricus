import { describe, expect, it } from "vitest";
import type { PrescribingStat } from "@relay/domain";
import { computeCohortComparison } from "./index";

const subject: PrescribingStat = {
  hcpId: "subject",
  classId: "sglt2",
  classLabel: "SGLT2 inhibitors",
  year: 2024,
  classShare: 0.18,
  totalClaims: 200,
  suppressed: false,
  specialty: "Endocrinology",
  state: "GA",
};

describe("computeCohortComparison", () => {
  it("uses a qualifying state cohort and excludes other medication classes", () => {
    const records: PrescribingStat[] = [
      subject,
      ...Array.from({ length: 11 }, (_, index) => ({
        ...subject,
        hcpId: `peer-${index}`,
        classShare: (index + 10) / 100,
      })),
      { ...subject, hcpId: "other-class", classId: "glp1", classShare: 0.99 },
    ];

    const result = computeCohortComparison({ subject, records });

    expect(result?.cohortSize).toBe(11);
    expect(result?.geography).toBe("GA");
    expect(result?.usedFallback).toBe(false);
    expect(result?.cohortMedian).toBeCloseTo(0.15);
  });

  it("returns null when the fallback cohort is below the privacy threshold", () => {
    const records = Array.from({ length: 10 }, (_, index) => ({
      ...subject,
      hcpId: `peer-${index}`,
      state: "NC",
    }));

    expect(computeCohortComparison({ subject, records })).toBeNull();
  });
});
