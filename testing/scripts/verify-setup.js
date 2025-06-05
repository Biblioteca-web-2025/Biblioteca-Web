// Script para verificar que la configuración de Cloudflare esté correcta

async function verifyCloudflareSetup() {
  console.log("🔍 Verificando configuración de Cloudflare...\n")

  // Verificar variables de entorno
  const requiredEnvVars = ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN", "R2_PUBLIC_URL"]

  console.log("📋 Verificando variables de entorno:")
  requiredEnvVars.forEach((envVar) => {
    const value = process.env[envVar]
    console.log(`  ${envVar}: ${value ? "✅ Configurada" : "❌ Faltante"}`)
  })

  // Verificar que wrangler esté instalado
  try {
    const { execSync } = require("child_process")
    const wranglerVersion = execSync("wrangler --version", { encoding: "utf8" })
    console.log(`\n🛠️ Wrangler: ✅ Instalado (${wranglerVersion.trim()})`)
  } catch (error) {
    console.log("\n🛠️ Wrangler: ❌ No instalado")
    console.log("   Instala con: npm install -g wrangler")
  }

  // Verificar archivos de configuración
  const fs = require("fs")
  const configFiles = ["wrangler.toml", "scripts/create-database.sql", ".env.local"]

  console.log("\n📁 Verificando archivos de configuración:")
  configFiles.forEach((file) => {
    const exists = fs.existsSync(file)
    console.log(`  ${file}: ${exists ? "✅ Existe" : "❌ Faltante"}`)
  })

  console.log("\n📖 Próximos pasos:")
  console.log("1. Ejecuta: chmod +x scripts/setup-cloudflare.sh")
  console.log("2. Ejecuta: ./scripts/setup-cloudflare.sh")
  console.log("3. Copia .env.example a .env.local y configura las variables")
  console.log("4. Ejecuta: npm run dev")
}

verifyCloudflareSetup()
