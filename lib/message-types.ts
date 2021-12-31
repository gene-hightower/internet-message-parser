export type Parameter = Record<string, string>;

export class ContentType {

  constructor(
    public type: string,
    public subtype: string,
    public parameters: Parameter[] | null
  ) {}

}
