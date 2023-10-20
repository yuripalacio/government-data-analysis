import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  LEGISLATORS_REPORT_NAME: z.string().default('legislators-support-oppose-count'),
  BILLS_REPORT_NAME: z.string().default('bills'),
  CSV_SEPARATOR: z.string().default(','),
  YEA_VOTE: z.coerce.number().default(1),
  NAY_VOTE: z.coerce.number().default(2)
})

const _env = envSchema.safeParse(process.env)

if (!_env.success) {
  console.error('Invalid environment variables', _env.error.format())

  throw new Error('Invalid environment variables.')
}

export const env = _env.data
