import { Entity } from '@/core/entities/entity'
import { z } from 'zod'

export const voteSchema = z.object({
  id: z.coerce.number(),
  bill_id: z.coerce.number()
})

export type VoteProps = z.infer<typeof voteSchema>

export class Vote<
  Props extends VoteProps,
> extends Entity<Props> {
  get id () {
    return this.props.id
  }

  get bill_id () {
    return this.props.bill_id
  }

  static create (props: VoteProps) {
    const vote = new Vote(props)

    return vote
  }
}
