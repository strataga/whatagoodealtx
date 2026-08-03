#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { parseCatalogCsv, validateItemId } from './catalog-core.mjs'
import {
  atomicWriteJson,
  defaultExternalPaths,
  fetchAccessToken,
  fetchLiveMedia,
  loadDatabaseFallbacks,
  readEnvFile,
  redactError,
  resolveCategoryName,
} from './sync-support.mjs'

function parseArgs(argv) {
  const defaults = defaultExternalPaths(process.env.HOME || '')
  const args = {
    databasePath: defaults.databasePath,
    envPath: defaults.envPath,
    csvPath: path.resolve('data/ebay-listings.csv'),
    outputPath: path.resolve('data/catalog-media.json'),
  }
  for (let index = 2; index < argv.length; index += 1) {
    const flag = argv[index]
    const value = argv[index + 1]
    if (flag === '--database' && value) args.databasePath = path.resolve(value)
    else if (flag === '--env-file' && value) args.envPath = path.resolve(value)
    else if (flag === '--csv' && value) args.csvPath = path.resolve(value)
    else if (flag === '--output' && value) args.outputPath = path.resolve(value)
    else if (flag === '--help' || flag === '-h') {
      console.log('Usage: pnpm catalog:sync [--database <path>] [--env-file <path>] [--csv <path>] [--output <path>]')
      process.exit(0)
    } else throw new Error(`Unknown or incomplete argument: ${flag}`)
    index += 1
  }
  return args
}

async function main() {
  const args = parseArgs(process.argv)
  const csvRows = parseCatalogCsv(await readFile(args.csvPath))
  const activeIds = new Set(csvRows.map((row) => validateItemId(row['Item number'])))
  const env = await readEnvFile(args.envPath)
  const secrets = [env.EBAY_CLIENT_ID, env.EBAY_CLIENT_SECRET, env.EBAY_REFRESH_TOKEN]
  try {
    const { accessToken, environment } = await fetchAccessToken(env)
    secrets.push(accessToken)
    const live = await fetchLiveMedia(environment, accessToken)
    const liveById = new Map(live.items.map((item) => [item.itemId, item]))
    const fallbacks = loadDatabaseFallbacks(args.databasePath)
    const items = [...activeIds].sort().map((itemId) => {
      const current = liveById.get(itemId)
      const fallback = fallbacks.get(itemId)
      const thumbnailUrl = current?.thumbnailUrl || fallback?.thumbnailUrl
      if (!thumbnailUrl) throw new Error(`Active CSV listing ${itemId} has no valid current thumbnail.`)
      const storeCategoryId = current?.storeCategoryId || fallback?.storeCategoryId || '1'
      return {
        itemId,
        thumbnailUrl,
        storeCategoryId,
        categoryName: resolveCategoryName(storeCategoryId, live.categories),
      }
    })
    const snapshot = {
      version: 1,
      generatedAt: new Date().toISOString(),
      departments: live.categories
        .filter((category) => !category.parentCategoryId)
        .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)),
      items,
    }
    await atomicWriteJson(args.outputPath, snapshot)
    console.log(`Catalog media snapshot updated: ${items.length} active listings, ${snapshot.departments.length} departments.`)
  } catch (error) {
    throw new Error(redactError(error, secrets))
  }
}

main().catch((error) => {
  console.error(`Catalog sync failed: ${error.message}`)
  process.exitCode = 1
})
