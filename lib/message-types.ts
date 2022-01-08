export type Parameter = Record<string, string>;

export class ContentType {
  // prettier-ignore
  constructor(public type: string,
              public subtype: string,
              public parameters: Parameter[]
             ) {}
}

export type Encoding = "7bit" | "8bit" | "binary" | "quoted-printable" | "base64";

export class ContentTransferEncoding {
  constructor(public mechanism: Encoding) {}
}
