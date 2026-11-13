import { describe, expect, it } from "vitest";
import { TRANSLATIONS, formatNumber, translate } from "./i18n";

describe("i18n module", () => {
  it("has complete translation keys in English and Bengali", () => {
    const enKeys = Object.keys(TRANSLATIONS.en);
    const bnKeys = Object.keys(TRANSLATIONS.bn);

    expect(enKeys.length).toBeGreaterThan(50);
    // Every key in English should exist in Bengali
    enKeys.forEach((key) => {
      expect(TRANSLATIONS.bn[key], `Missing bn key: ${key}`).toBeDefined();
    });
  });

  it("converts western digits to Bengali numerals when locale is 'bn'", () => {
    expect(formatNumber(12345, "bn")).toBe("১২৩৪৫");
    expect(formatNumber("78.5%", "bn")).toBe("৭৮.৫%");
    expect(formatNumber(12345, "en")).toBe("12345");
  });

  it("translates strings with and without parameters", () => {
    expect(translate("appName", "en")).toBe("AstroGuard");
    expect(translate("appName", "bn")).toBe("অ্যাস্ট্রোগার্ড");

    expect(translate("noConsultMessages", "en")).toBe("No consultation messages logged yet with");
    expect(translate("noConsultMessages", "bn")).toBe("এর সাথে কোনো পরামর্শ বার্তা নেই");
  });
});
