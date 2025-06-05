// Variables de entorno para desarrollo local
export const env = {
  // Cloudflare
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID || "",
  CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN || "",

  // R2 Storage
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL || "",

  // Database
  DATABASE_URL: process.env.DATABASE_URL || "",

  // App
  NODE_ENV: process.env.NODE_ENV || "development",
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
}

// Validación de variables requeridas
export function validateEnv() {
  const required = ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN", "R2_PUBLIC_URL"]

  const missing = required.filter((key) => !env[key as keyof typeof env])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
  }
}
