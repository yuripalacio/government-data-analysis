export abstract class Entity<Props> {
  private readonly _id: number
  protected props: Props

  get id () {
    return this._id
  }

  protected constructor (props: Props, id: number) {
    this.props = props
    this._id = id
  }
}
