export class Activity {
  id: number = 0;
  activitytypeid: string = "";
  subject: string = "";
  activitydatetime: string;
  sourcecontactid: string;
  targetcontactids: string;
  assigneecontactids: string;

  sourcecontactidlocal: string = "";
  targetcontactidslocal: string = "";
  assigneecontactidslocal: string = "";

  details: string = "";

  createddate: string;
  modifieddate: string;
  localid: number = 0;
}