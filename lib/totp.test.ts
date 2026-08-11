import { describe, it, expect } from "vitest";
import { generateTotpSecret, verifyTotp, generateRecoveryCodes, buildOtpAuthUrl } from "@/lib/totp";

describe("generateTotpSecret", () => {
  it("produces a base32 string with no padding", () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]+$/);
    expect(secret.length).toBeGreaterThan(0);
  });

  it("produces different secrets on each call", () => {
    expect(generateTotpSecret()).not.toBe(generateTotpSecret());
  });
});

describe("verifyTotp", () => {
  it("rejects a non-6-digit code immediately", () => {
    const secret = generateTotpSecret();
    expect(verifyTotp(secret, "123")).toBe(false);
    expect(verifyTotp(secret, "abcdef")).toBe(false);
    expect(verifyTotp(secret, "")).toBe(false);
  });

  it("rejects an arbitrary wrong code", () => {
    const secret = generateTotpSecret();
    // Astronomically unlikely to collide with the real code for "now".
    expect(verifyTotp(secret, "000000") && verifyTotp(secret, "111111")).toBeFalsy();
  });
});

describe("generateRecoveryCodes", () => {
  it("generates the requested number of unique codes in XXXX-XXXX form", () => {
    const codes = generateRecoveryCodes(8);
    expect(codes).toHaveLength(8);
    expect(new Set(codes).size).toBe(8);
    for (const code of codes) {
      expect(code).toMatch(/^\d{4}-\d{4}$/);
    }
  });
});

describe("buildOtpAuthUrl", () => {
  it("builds a valid otpauth:// URI containing the secret and issuer", () => {
    const url = buildOtpAuthUrl("JBSWY3DPEHPK3PXP", "coach@ucup2026.cg", "UCUP2026");
    expect(url.startsWith("otpauth://totp/")).toBe(true);
    expect(url).toContain("secret=JBSWY3DPEHPK3PXP");
    expect(url).toContain("issuer=UCUP2026");
  });
});
