import { Entity } from '@/core/entities/entity'
import { z } from 'zod'

export const voteResultSchema = z.object({
  id: z.coerce.number(),
  legislator_id: z.coerce.number(),
  vote_id: z.coerce.number(),
  vote_type: z.coerce.number()
})

export type VoteResultProps = z.infer<typeof voteResultSchema>

export class VoteResult<
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

  static create (props: VoteResultProps) {
    const voteResult = new VoteResult(props)

    return voteResult
  }
}
