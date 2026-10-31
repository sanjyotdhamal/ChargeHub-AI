import { z } from "zod";

export const REGISTRATION_REGEX = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;
export const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;
export const MOTOR_REGEX = /^[A-Za-z0-9]{6,15}$/;
export const PHONE_REGEX = /^[6-9]\d{9}$/;

const currentYear = new Date().getFullYear();

export function normalizeRegistrationNumber(raw: string): string {
  return raw.replace(/[\s-]/g, "").toUpperCase();
}

export function formatRegistrationNumber(raw: string): string {
  if (!raw) return "";
  const clean = normalizeRegistrationNumber(raw);
  const match = clean.match(/^([A-Z]{2})([0-9]{1,2})([A-Z]{1,3})([0-9]{4})$/);
  if (!match) return clean;
  return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
}

export const CONNECTOR_TYPES = ["CCS2", "Type 2", "CHAdeMO"] as const;

export const VehicleInputSchema = z
  .object({
    brand: z.string().trim().min(1, "Brand is required").max(50, "Brand is too long"),
    model: z.string().trim().min(1, "Model is required").max(50, "Model is too long"),
    variant: z.string().trim().max(50, "Variant is too long").optional().default(""),
    year: z
      .number()
      .int("Year must be an integer")
      .min(2015, "Year must be 2015 or later")
      .max(currentYear + 1, `Year cannot exceed ${currentYear + 1}`),
    registrationNumber: z
      .string()
      .trim()
      .transform((val) => normalizeRegistrationNumber(val))
      .refine(
        (val) => REGISTRATION_REGEX.test(val),
        "Invalid Indian registration number (e.g. MH12AB1234)"
      ),
    vin: z
      .string()
      .trim()
      .toUpperCase()
      .refine(
        (val) => VIN_REGEX.test(val),
        "VIN must be 17 characters without I, O, or Q"
      ),
    motorNumber: z
      .string()
      .trim()
      .refine(
        (val) => MOTOR_REGEX.test(val),
        "Motor No. must be 6 to 15 alphanumeric characters"
      ),
    batteryCapacityKwh: z
      .number()
      .min(5, "Battery capacity must be at least 5 kWh")
      .max(150, "Battery capacity cannot exceed 150 kWh"),
    claimedRangeKm: z
      .number()
      .min(50, "Claimed range must be at least 50 km")
      .max(1000, "Claimed range cannot exceed 1000 km"),
    maxChargingPowerKw: z
      .number()
      .min(3, "Max charging power must be at least 3 kW")
      .max(350, "Max charging power cannot exceed 350 kW"),
    connectorType: z.enum(CONNECTOR_TYPES),
  })
  .strict();

export type VehicleInput = z.infer<typeof VehicleInputSchema>;

export const ProfileUpdateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(60, "Name cannot exceed 60 characters")
      .optional(),
    phone: z
      .string()
      .trim()
      .refine(
        (val) => val === "" || PHONE_REGEX.test(val),
        "Phone number must be a 10-digit Indian mobile number"
      )
      .optional(),
    city: z
      .string()
      .trim()
      .max(60, "City cannot exceed 60 characters")
      .optional(),
    chargingPreference: z
      .enum(["balanced", "fastest", "cheapest", "nearest"])
      .optional(),
    notifications: z
      .object({
        chargingComplete: z.boolean().optional(),
        lowBattery: z.boolean().optional(),
        priceDrop: z.boolean().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)/,
        "New password must contain at least one letter and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .strict()
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export const StationQuerySchema = z
  .object({
    network: z.string().optional(),
    connector: z.string().optional(),
    minPowerKw: z.coerce.number().min(0).optional(),
    availableOnly: z
      .enum(["true", "false"])
      .optional()
      .transform((val) => val === "true"),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    radiusKm: z.coerce.number().min(1).max(500).optional(),
    limit: z.coerce.number().min(1).max(500).default(200),
  })
  .refine(
    (data) => {
      const geoProps = [data.lat, data.lng, data.radiusKm];
      const count = geoProps.filter((v) => v !== undefined).length;
      return count === 0 || count === 3;
    },
    {
      message: "lat, lng, and radiusKm must all be provided together",
      path: ["radiusKm"],
    }
  );

export type StationQuery = z.infer<typeof StationQuerySchema>;

