import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const CACHE_TTL = {
  DASHBOARD: 300,
  ANALYTICS: 600,
  AI_INSIGHTS: 3600,
}
