import { describe, it, expect } from "vitest";
import { GitAttributes, type FileEvaluation } from "../GitAttributes";

describe("GitAttributes", () => {
  it("should evaluate git's example correctly (https://www.git-scm.com/docs/gitattributes#_examples)", () => {
    const gitattributes = new GitAttributes(`

# Comment 1
ab*      merge=filfre
abc      -foo -bar
*.c      frotz

# Comment 2
abc     foo bar baz

a*       foo !bar -baz # Comment 3`);

    const expected: FileEvaluation = {
      attributes: {
        foo: true,
        bar: undefined,
        baz: false,
        merge: "filfre",
        frotz: undefined,
      },
      appliedRules: [
        {
          type: "rule",
          line: 4,
          column: 1,
          pattern: "ab*",
          attributes: [{ name: "merge", value: "filfre", line: 4, column: 10 }],
        },
        {
          type: "rule",
          line: 5,
          column: 1,
          pattern: "abc",
          attributes: [
            { name: "foo", value: false, line: 5, column: 10 },
            { name: "bar", value: false, line: 5, column: 15 },
          ],
        },
        {
          type: "rule",
          line: 9,
          column: 1,
          pattern: "abc",
          attributes: [
            { name: "foo", value: true, line: 9, column: 9 },
            { name: "bar", value: true, line: 9, column: 13 },
            { name: "baz", value: true, line: 9, column: 17 },
          ],
        },
        {
          type: "rule",
          line: 11,
          column: 1,
          pattern: "a*",
          attributes: [
            { name: "foo", value: true, line: 11, column: 10 },
            { name: "bar", value: undefined, line: 11, column: 14 },
            { name: "baz", value: false, line: 11, column: 19 },
          ],
        },
      ],
    };

    const actual = gitattributes.evaluate("abc");

    expect(actual).toEqual(expected);
  });
});
