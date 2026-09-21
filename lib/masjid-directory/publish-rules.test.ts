import { describe, it, expect } from "vitest";
import {
  canShowVerifiedLabel,
  isPubliclyVisible,
  showClaimListingButton,
  getTimesSource,
  getDataSourceLabel,
} from "./publish-rules";

describe("canShowVerifiedLabel", () => {
  it("is false for an unverified masjid", () => {
    expect(canShowVerifiedLabel({ verification_status: "unverified" })).toBe(false);
  });

  it("is false for a masjid with computed (AlAdhan) times", () => {
    expect(canShowVerifiedLabel({ verification_status: "computed" })).toBe(false);
  });

  it("is true only once the masjid has confirmed its times", () => {
    expect(canShowVerifiedLabel({ verification_status: "masjid_confirmed" })).toBe(true);
  });
});

describe("isPubliclyVisible", () => {
  it("is true when not opted out", () => {
    expect(isPubliclyVisible({ opted_out: false })).toBe(true);
  });

  it("is false once opted_out is set", () => {
    expect(isPubliclyVisible({ opted_out: true })).toBe(false);
  });
});

describe("showClaimListingButton", () => {
  it("shows the claim button for a non-customer masjid", () => {
    expect(showClaimListingButton({ is_sahla_customer: false })).toBe(true);
  });

  it("hides the claim button once the masjid is a Sahla customer", () => {
    expect(showClaimListingButton({ is_sahla_customer: true })).toBe(false);
  });
});

describe("getTimesSource", () => {
  it("uses AlAdhan for a non-customer masjid", () => {
    expect(getTimesSource({ is_sahla_customer: false, mosque_id: null }, undefined)).toBe("aladhan");
  });

  it("uses AlAdhan for a customer that hasn't opted into the directory", () => {
    expect(getTimesSource({ is_sahla_customer: true, mosque_id: "mosque_1" }, false)).toBe("aladhan");
  });

  it("uses AlAdhan for a customer row missing its mosque_id link", () => {
    expect(getTimesSource({ is_sahla_customer: true, mosque_id: null }, true)).toBe("aladhan");
  });

  it("uses iqamah_config only when customer + linked + opted in", () => {
    expect(getTimesSource({ is_sahla_customer: true, mosque_id: "mosque_1" }, true)).toBe(
      "iqamah_config"
    );
  });
});

describe("getDataSourceLabel", () => {
  it("labels iqamah_config as masjid-entered", () => {
    expect(getDataSourceLabel("iqamah_config")).toMatch(/masjid/i);
  });

  it("labels aladhan as unconfirmed", () => {
    expect(getDataSourceLabel("aladhan")).toMatch(/not confirmed/i);
  });
});
