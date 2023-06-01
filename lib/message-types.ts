export class MIMEVersion {}

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

export class PropSpec {
  constructor(public ptype: string, public property: string, public pvalue: string) {}
}

export class ResInfo {
  constructor(
    public method: string,
    public result: string,
    public reason: string | null,
    public prop: PropSpec[] | null
  ) {}
}

export type Result = "none" | ResInfo[];

export class AuthResPayload {
  constructor(public id: string, public results: Result) {}
}

export class ARCInfo {
  constructor(public instance: Number, public payload: AuthResPayload) {}
}
