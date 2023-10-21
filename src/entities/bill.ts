import { Entity } from '@/core/entities/entity'
import { z } from 'zod'

export const billSchema = z.object({
  id: z.coerce.number(),
  title: z.string(),
  sponsor_id: z.coerce.number()
})

export type BillProps = z.infer<typeof billSchema>

export class Bill<
  Props extends BillProps,
> extends Entity<Props> {
  get id () {
    return this.props.id
  }

  get title () {
    return this.props.title
  }

  get sponsor_id () {
    return this.props.sponsor_id
  }

  static create (props: BillProps) {
    const bill = new Bill(props)

    return bill
  }
}
