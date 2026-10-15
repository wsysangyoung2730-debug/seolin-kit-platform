import { describe, expect, it } from "vitest";
import {
  decodeRoster,
  drawPeople,
  encodeRoster,
  makeTeams,
  parseRoster,
  readCount,
  remainingPeople,
  shuffled,
  type Participant,
} from "./teams";

function roster(count: number): Participant[] {
  return parseRoster(
    Array.from({ length: count }, (_, index) => `학생 ${index + 1}`).join("\n"),
  ).value!;
}

describe("classroom roster", () => {
  it("preserves repeated names as distinct participants and ignores blank lines", () => {
    const people = parseRoster(" 민수 \n\n지우\r\n민수 ").value!;
    expect(people.map((person) => person.label)).toEqual([
      "민수 · 1번",
      "지우",
      "민수 · 3번",
    ]);
    expect(new Set(people.map((person) => person.id)).size).toBe(3);
  });

  it("rejects excess people, long names and hidden control characters without truncation", () => {
    expect(parseRoster(" \n").error).toBeTruthy();
    expect(
      parseRoster(Array.from({ length: 101 }, () => "이름").join("\n")).error,
    ).toContain("101");
    expect(parseRoster("가".repeat(31)).error).toContain("30자");
    expect(parseRoster("민수\u202e").error).toBeTruthy();
    expect(parseRoster("이름").value).toHaveLength(1);
  });

  it("validates saved data and round-trips all participants", () => {
    expect(decodeRoster(encodeRoster("민수\n민수\n지우"))).toBe(
      "민수\n민수\n지우",
    );
    expect(decodeRoster(null)).toBe("");
    for (const invalid of [
      "broken",
      "null",
      '{"version":2,"names":["민수"]}',
      '{"version":1,"names":[3]}',
      '{"version":1,"names":["민수\\n지우"]}',
      '{"version":1,"names":[]}',
    ]) {
      expect(() => decodeRoster(invalid)).toThrow();
    }
  });

  it("requires whole counts in range and never silently clamps", () => {
    for (const invalid of ["", "0", "-1", "1.5", "1e1", "3명", "101"])
      expect(readCount(invalid, 1, 100).error).toBeTruthy();
    expect(readCount(" 3 ", 2, 4).value).toBe(3);
    expect(readCount("2", 2, 1).error).toBeTruthy();
  });
});

describe("balanced teams", () => {
  it("includes everyone exactly once and balances every allowed group size", () => {
    for (const size of [2, 3, 11, 37, 100]) {
      for (let count = 2; count <= Math.min(size, 20); count++) {
        const people = roster(size);
        const groups = makeTeams(people, count, () => 0.37);
        expect(groups).toHaveLength(count);
        expect(
          groups
            .flat()
            .map((person) => person.id)
            .sort(),
        ).toEqual(people.map((person) => person.id).sort());
        const lengths = groups.map((team) => team.length);
        expect(Math.max(...lengths) - Math.min(...lengths)).toBeLessThanOrEqual(
          1,
        );
      }
    }
  });

  it("rejects impossible team counts and leaves the source roster untouched", () => {
    const people = roster(5);
    const original = [...people];
    for (const count of [1, 6, 2.5])
      expect(() => makeTeams(people, count)).toThrow();
    makeTeams(people, 3, () => 0);
    expect(people).toEqual(original);
  });

  it("can produce every permutation of a three-person roster with equal branch counts", () => {
    const outcomes = new Set<string>();
    for (let first = 0; first < 3; first++) {
      for (let second = 0; second < 2; second++) {
        const values = [(first + 0.5) / 3, (second + 0.5) / 2];
        outcomes.add(shuffled(["a", "b", "c"], () => values.shift()!).join(""));
      }
    }
    expect(outcomes.size).toBe(6);
  });
});

describe("random draw", () => {
  it("draws without duplicates and exhausts the pool using all prior rounds", () => {
    const people = roster(5);
    const first = drawPeople(people, 2, [], true, () => 0).value!;
    const second = drawPeople(people, 3, [first], true, () => 0).value!;
    expect(
      new Set([...first.people, ...second.people].map((person) => person.id))
        .size,
    ).toBe(5);
    expect(remainingPeople(people, [first, second], true)).toEqual([]);
    expect(drawPeople(people, 1, [first, second], true).error).toContain(
      "모두",
    );
    expect(drawPeople(people, 4, [first], true).error).toContain("3명");
  });

  it("allows previous winners when requested while retaining unique people in one draw", () => {
    const people = roster(5);
    const first = drawPeople(people, 5, [], true, () => 0).value!;
    const second = drawPeople(people, 5, [first], false, () => 0).value!;
    expect(new Set(second.people.map((person) => person.id)).size).toBe(5);
    expect(remainingPeople(people, [first], false)).toHaveLength(5);
  });

  it("resets the pool with empty history and keeps same-name people separate", () => {
    const people = parseRoster("민수\n민수").value!;
    const first = drawPeople(people, 1, [], true, () => 0).value!;
    expect(remainingPeople(people, [first], true)).toHaveLength(1);
    expect(drawPeople(people, 2, [], true, () => 0).value!.people).toHaveLength(
      2,
    );
    expect(drawPeople(people, 0, [], false).error).toBeTruthy();
  });
});
