import { pgTable, text, serial, integer, decimal, timestamp } from 'drizzle-orm/pg-core'

export const holdings = pgTable('holdings', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  broker: text('broker').notNull(),
  
  symbol: text('symbol').notNull(),
  companyName: text('company_name'),
  isin: text('isin'),
  
  quantity: integer('quantity').notNull(),
  avgPrice: decimal('avg_price', { precision: 10, scale: 2 }).notNull(),
  currentPrice: decimal('current_price', { precision: 10, scale: 2 }),
  
  sector: text('sector'),
  lastUpdated: timestamp('last_updated').defaultNow(),
})
