import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { allDamageTypes } from "../../weapon";
import type { ARDetail } from "../../calculateAR";
import { testSword } from "../../testFixtures";
import SpellPanel from "./SpellPanel";

describe("main card spell scaling", () => {
  it("retains every element and icon even when their percentages are identical", () => {
    const spell: ARDetail["spell"] = Object.fromEntries(allDamageTypes.map((type) => [type, { scaling: 126.4, penalized: false }]));
    const html = renderToStaticMarkup(<SpellPanel weapon={{ ...testSword, incantationTool: true }} spell={spell} />);
    expect(html.match(/126%/g)).toHaveLength(5);
    for (const label of ["Physical", "Magic", "Fire", "Lightning", "Holy"]) expect(html).toContain(label);
    expect(html).not.toContain("All elements");
  });
});
