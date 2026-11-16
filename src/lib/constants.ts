// Satser og regler. Oppdateres årlig når grunnbeløpet (G) reguleres 1. mai.
// Alle beregninger er forenklede anslag og erstatter ikke NAVs eller leverandørenes beregninger.

/** Grunnbeløpet i folketrygden. Oppdater ved årlig regulering (1. mai). */
export const G = 130_160;

/** Opptjening i folketrygden (ny modell, født 1963 eller senere) */
export const FOLKETRYGD_ACCRUAL_RATE = 0.181;
export const FOLKETRYGD_INCOME_CAP_G = 7.1;

/** Garantipensjon – omtrentlig sats for enslig, i G */
export const GARANTIPENSJON_SATS_G = 1.75;
export const GARANTIPENSJON_AVKORTING = 0.8;

/** Innskuddspensjon (OTP) */
export const OTP_MIN_RATE = 2;
export const OTP_MAX_RATE = 7;
export const OTP_MAX_EXTRA_RATE = 18.1;
export const OTP_SALARY_CAP_G = 12;

export const TAX_RATE_ORDINARY_INCOME = 0.22;

/** IPS: maks årlig innskudd med fradrag */
export const IPS_MAX_YEARLY = 15_000;

/** AFP – livsvarig, opptjening i prosent av inntekt opp til 7,1G fra 13 til 61 år */
export const AFP_PRIVAT_RATE = 0.00314;
export const AFP_OFFENTLIG_RATE = 0.00421;
export const AFP_LAST_ACCRUAL_AGE = 61;

/** Offentlig tjenestepensjon (påslagsmodell, født 1963 eller senere) */
export const OFFENTLIG_TP_RATE = 0.057;
export const OFFENTLIG_TP_EXTRA_RATE = 0.181;

/** Uttak */
export const MIN_WITHDRAWAL_AGE = 62;
export const MAX_WITHDRAWAL_AGE = 75;
/** Innskuddspensjon og IPS utbetales minst i 10 år og minst til fylte 80 år */
export const MIN_PAYOUT_YEARS = 10;
export const MIN_PAYOUT_END_AGE = 80;

/** Forventet reell avkastning (etter inflasjon, før kostnader) */
export const REAL_RETURN_STOCKS = 0.04;
export const REAL_RETURN_BONDS = 0.005;

/** Livsfaseprofil: full aksjeandel til 50 år, trappes lineært ned til 20 % ved 75 år */
export const LIFECYCLE_START_AGE = 50;
export const LIFECYCLE_END_AGE = 75;
export const LIFECYCLE_START_SHARE = 100;
export const LIFECYCLE_END_SHARE = 20;
