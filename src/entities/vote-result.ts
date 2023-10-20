import { Entity } from '@/core/entities/entity'

export interface VoteResultProps {
  id: number
  legislator_id: number
  vote_id: number
  vote_type: number
}

export abstract class VoteResult<
  Props extends VoteResultProps,
> extends Entity<Props> {
  get id () {
    return this.props.id
  }

  get legislator_id () {
    return this.props.legislator_id
  }

  get vote_id () {
    return this.props.vote_id
  }

  get vote_type () {
    return this.props.vote_type
  }
}
