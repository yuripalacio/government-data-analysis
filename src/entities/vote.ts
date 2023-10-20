import { Entity } from '@/core/entities/entity'

export interface VoteProps {
  id: number
  bill_id: number
}

export abstract class Vote<
  Props extends VoteProps,
> extends Entity<Props> {
  get id () {
    return this.props.id
  }

  get bill_id () {
    return this.props.bill_id
  }
}
