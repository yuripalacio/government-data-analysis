import { Entity } from '@/core/entities/entity'

export interface LegislatorProps {
  id: number
  name: string
}

export abstract class Legislators<
  Props extends LegislatorProps,
> extends Entity<Props> {
  get id () {
    return this.props.id
  }

  get name () {
    return this.props.name
  }
}
