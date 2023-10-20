import { Entity } from '@/core/entities/entity'

export interface BillProps {
  id: number
  title: string
  sponsor_id: number
}

export abstract class Bill<
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
}
