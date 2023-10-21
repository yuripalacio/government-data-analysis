import { Entity } from '@/core/entities/entity'
import { z } from 'zod'

export const legislatorSchema = z.object({
  id: z.coerce.number(),
  name: z.string()
})

export type LegislatorProps = z.infer<typeof legislatorSchema>

export class Legislator<
  Props extends LegislatorProps,
> extends Entity<Props> {
  get id () {
    return this.props.id
  }

  get name () {
    return this.props.name
  }

  static create (props: LegislatorProps) {
    const legislator = new Legislator(props)

    return legislator
  }
}
