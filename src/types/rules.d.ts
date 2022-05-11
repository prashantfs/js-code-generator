export interface linkDetails {
  link_id: number;
  page_link: string;
}

export interface RuleInterface {
  code: string;
  type: string;
  typeCode: number;
  message: string;
  context: string;
  selector: string;
  runner: string;
  runnerExtras: any;
  elemID: string;
  severity: string;
  job_id: string;
  linkDetails: linkDetails;
  category: string;
  conformance_level: string;
  editedContext: string;
  action: string;
}
