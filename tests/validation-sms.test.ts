import { describe, expect, it } from "vitest";
import { normalizePhone, formatPhone } from "@/lib/phone";
import { chooseRoleSchema, smsSettingsSchema } from "@/lib/validation/account";

describe("normalizePhone", () => {
  it("accepts US numbers in common formats", () => {
    expect(normalizePhone("(555) 123-4567")).toBe("+15551234567");
    expect(normalizePhone("555.123.4567")).toBe("+15551234567");
    expect(normalizePhone("1 555 123 4567")).toBe("+15551234567");
    expect(normalizePhone("+44 20 7946 0958")).toBe("+442079460958");
  });

  it("rejects things that are not phone numbers", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("12345")).toBeNull();
    expect(normalizePhone("555-CALL-NOW")).toBeNull();
    expect(normalizePhone("+0123456789")).toBeNull();
  });

  it("formats US numbers for display", () => {
    expect(formatPhone("+15551234567")).toBe("(555) 123-4567");
    expect(formatPhone("+442079460958")).toBe("+442079460958");
  });
});

describe("smsSettingsSchema", () => {
  it("clears the phone when texts are off", () => {
    const r = smsSettingsSchema.safeParse({ smsOptIn: false, phone: "5551234567" });
    expect(r.success && r.data).toEqual({ smsOptIn: false, phone: null });
  });

  it("needs a phone when texts are on", () => {
    const r = smsSettingsSchema.safeParse({ smsOptIn: true, phone: "" });
    expect(r.success).toBe(false);
  });

  it("rejects a bad phone when texts are on", () => {
    const r = smsSettingsSchema.safeParse({ smsOptIn: true, phone: "123" });
    expect(r.success).toBe(false);
  });

  it("stores E.164 when texts are on", () => {
    const r = smsSettingsSchema.safeParse({ smsOptIn: true, phone: "(555) 123-4567" });
    expect(r.success && r.data).toEqual({ smsOptIn: true, phone: "+15551234567" });
  });
});

describe("chooseRoleSchema", () => {
  it("still works without text settings", () => {
    const r = chooseRoleSchema.safeParse({ role: "builder" });
    expect(r.success && r.data).toEqual({ role: "builder" });
  });
});
