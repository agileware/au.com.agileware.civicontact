import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Contact } from '../../models/contact';
import { Email } from '../../models/email';
import { Phone } from '../../models/phone';
import { Storage } from '@ionic/storage';
import { UtilsProvider } from '../utils/utils';
import { ContactPage } from '../../pages/contact/contact';
import { LocationTypesProvider } from '../location-types/location-types';
import { DatabaseProvider } from '../database/database';
import { Profilefielddata } from "../../models/profilefielddata";

@Injectable()
export class ContactsProvider {
  public contacts: Array<Contact>;
  public contactstoprocess: Array<Contact>;
  public directory: {};

  constructor(public http: HttpClient, public storage: Storage, public utilsProvider: UtilsProvider,
    public locationTypeProvider: LocationTypesProvider, public databaseProvider: DatabaseProvider) {
    this.contacts = new Array<Contact>();
    this.contactstoprocess = new Array<Contact>();
    this.directory = {};
  }

  openContactPage(contact, navCtrl) {
    navCtrl.push(ContactPage, {
      contact: contact,
    });
  }

  /**
   * Get the total number of contact in CiviContact groups
   * @param syncinfo object
   */
  getCount(syncinfo) {
    return new Promise(resolve => {
      let formData = new FormData();
      formData.append('key', syncinfo.sitekey);
      formData.append('api_key', syncinfo.apikey);
      formData.append('entity', 'CCAGroupContactsLog');
      formData.append('action', 'countcontact');
      formData.append('json', "1");
      let headers = new HttpHeaders();
      headers.append('content-type', 'multipart/form-data');

      this.http.post(syncinfo.restendpoint, formData, { headers: headers })
        .subscribe(data => {
          resolve(data);
        }, error => {
          console.log(JSON.stringify(error));
          resolve({ 'is_error': 1 });
        });
    });
  }

  fetch(syncinfo) {
    return new Promise(resolve => {

      let modifieddateparam = "";
      if (syncinfo.lastpulldatetime != "") {
        modifieddateparam = ',"createdat":{">=":"' + syncinfo.lastpulldatetime + '"}';
      }

      let postParams = {
        'key': syncinfo.sitekey,
        'api_key': syncinfo.apikey,
        'entity': 'CCAGroupContactsLog',
        'action': 'getmodifiedcontacts',
        'json': '{"sequential":1' + modifieddateparam + ',"options":{"sort":"id DESC"}}'
      };

      let resturl = this.utilsProvider.getRestUrl(syncinfo.restendpoint, postParams);
      console.log("Fetching contacts from -->");
      console.log(resturl);

      this.http.get(resturl)
        .subscribe(data => {
          if (data["is_error"] == 0) {
            this.contactstoprocess = [];
            // this.databaseProvider.resetAllContact();

            this.map(data["values"]);
            this.databaseProvider.saveContacts(this.contactstoprocess).then((data) => {
              console.log("Contacts saved...");
              resolve({
                "contacts": this.contacts,
                "status": true,
              });
            });
          } else {
            resolve({
              "contacts": [],
              "status": false,
              "message": data["error_message"] + " occured while fetching contacts."
            });
          }
        }, error => {
          console.log(JSON.stringify(error));
          resolve({
            "contacts": [],
            "status": false,
            "message": "Some error occured while fetching contacts."
          });
        });
    });
  }

  getDirectoryFromContacts(contacts) {

    let directory = {};
    for (let contact of contacts) {
      if (typeof contact !== "undefined" && contact != null) {
        let firstname = contact.firstname;
        let lastname = contact.lastname;

        let directorykey = "#";
        if (firstname != "") {
          directorykey = firstname.toUpperCase().charAt(0);
        }

        if ((firstname != "" || lastname != "") && !directory[directorykey]) {
          directory[directorykey] = new Array<Contact>();
        }

        if (firstname != "" || lastname != "") {
          directory[directorykey].push(contact);
        }
      }
    }

    return directory;
  }

  getDirectory(pagenumber, groupid = 0) {
    return new Promise(resolve => {
      console.log("Finding page " + pagenumber + " contacts...");
      this.databaseProvider.getAllContacts(pagenumber, groupid).then((storedcontacts) => {
        this.contacts = <[Contact]>storedcontacts;
        console.info('all contacts here -------------------------------------------',
          storedcontacts,
          this.contacts);
        this.directory = this.getDirectoryFromContacts(this.contacts);
        resolve({
          directory: this.directory
        });
      });
    });
  }

  map(values) {
    for (let value of values) {
      let contact = new Contact();

      contact.action = value["action"];
      contact.id = value["id"];
      contact.firstname = value["first_name"];
      contact.lastname = value["last_name"];
      contact.groups = value["groups"];

      if (contact.action != "delete") {
        contact.sortname = value["sort_name"];
        contact.createddate = value["created_date"];
        contact.imageurl = "";

        if (typeof value["image_URL"] !== "undefined" && value["image_URL"] != "") {
          contact.imageurl = this.utilsProvider.decodeHTML(value["image_URL"]);
          console.log(contact.imageurl);
        }
        contact.modifieddate = value["modified_date"];

        var emails = value["api.Email.get"]["values"];
        var phones = value["api.Phone.get"]["values"];
        var profilefieldsdata = value["profilefields"];

        if (typeof profilefieldsdata !== "undefined") {
          for (let profilefielddata of profilefieldsdata) {
            let profilekey = profilefielddata["key"];
            let profilevalue = profilefielddata["value"];
            let profilelabel = profilefielddata["label"];

            let profilefielddataobject = new Profilefielddata();
            profilefielddataobject.fieldname = profilekey;
            profilefielddataobject.value = profilevalue;
            profilefielddataobject.label = profilelabel;
            profilefielddataobject.contactid = value["id"];

            contact.profilefieldsdata.push(profilefielddataobject);
          }
        }

        for (let email of emails) {
          let locationtypeid = email["location_type_id"];
          let id = email["id"];
          let emailtext = email["email"];
          let emailobject = new Email(id, locationtypeid, emailtext);

          let locationtype = this.locationTypeProvider.getLocationType(locationtypeid);
          if (locationtype != null) {
            emailobject.type = locationtype;
            contact.emails.push(emailobject);
          }
        }

        for (let phone of phones) {
          let locationtypeid = phone["phone_type_id"];
          let phonetypeid = phone["location_type_id"];

          if (typeof locationtypeid === "undefined") {
            locationtypeid = phonetypeid;
          }

          if (typeof phonetypeid === "undefined") {
            phonetypeid = locationtypeid;
          }

          let id = phone["id"];
          let phonetxt = phone["phone"];
          let phoneobject = new Phone(id, locationtypeid, phonetxt);

          let locationtype = this.locationTypeProvider.getLocationType(locationtypeid);
          if (locationtype != null) {
            phoneobject.type = locationtype;
            contact.phones.push(phoneobject);
          }
        }


      }

      if (contact != null) {
        this.contactstoprocess[value["id"]] = contact;
      }
    }
  }

  addCallHistory(contactid: any) {
    return new Promise(resolve => {
      this.databaseProvider.findContact(contactid).then((foundcontact) => {
        resolve(foundcontact);
      });
    });
  }

  markContactAsFavourite(contactid: any) {
    return new Promise(resolve => {
      this.databaseProvider.findContact(contactid).then((foundcontact) => {
        if (foundcontact != null) {
          foundcontact["isfavourite"] = 1;
          this.databaseProvider.updateContact(foundcontact);
        }
        resolve(foundcontact);
      });
    });
  }

  removeContactFromFavourite(contactid: any) {
    if (typeof this.contacts[contactid] !== "undefined") {
      this.contacts[contactid].isfavourite = 0;
      this.databaseProvider.updateContact(this.contacts[contactid]);
    }
  }

  searchContacts(searchterm) {
    return new Promise(resolve => {
      searchterm = searchterm.toLowerCase().trim();
      this.databaseProvider.searchContacts(searchterm).then((contacts) => {
        let searchedContasts = contacts;
        resolve(this.getDirectoryFromContacts(searchedContasts));
      });
    });
  }

  getGroupContacts(groupid) {
    return new Promise((resolve) => {
      this.databaseProvider.getGroupContacts(groupid).then((contacts) => {
        resolve({
          'contacts': contacts
        });
      });
    });
  }
}
