import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { FavouritesProvider } from '../../providers/favourites/favourites';
import { Events } from 'ionic-angular';
import { ContactsProvider } from '../../providers/contacts/contacts';
import { UtilsProvider } from '../../providers/utils/utils';
import { DatabaseProvider } from '../../providers/database/database';
import { LoadingProvider } from "../../providers/loading/loading";
import { Activity } from "../../models/activity";
import { EditHistoryPage } from "../edit-history/edit-history";

/**
 * Generated class for the FavouritesPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-favourites',
  templateUrl: 'favourites.html',
})
export class FavouritesPage {

  public favourites = [];
  public defaultfavourites = [];
  public isSearching: boolean = false;

  constructor(public navCtrl: NavController, public navParams: NavParams, public favouritesProvider: FavouritesProvider,
    public events: Events, public contactsprovider: ContactsProvider, public utilsProvider: UtilsProvider,
    public databaseProvider: DatabaseProvider, public loadingProvider: LoadingProvider) {
    this.favourites = [];
  }

  ionViewWillLeave() {
    if (this.isSearching) {
      this.events.publish("search:forcestop", {
        "from": "favourites"
      });
      this.isSearching = false;
      this.sortAndShowFavourites(this.defaultfavourites);
    }
  }

  ionViewDidLoad() {

    this.utilsProvider.trackPageOpen("Favourites");

    this.events.subscribe("search:started", (data) => {
      if (data["tabindex"] == 0) {
        let favourites = data["contacts"];
        this.isSearching = true;
        this.sortAndShowFavourites(favourites);
      }
    });

    this.events.subscribe("search:stopped", (data) => {
      if (data["tabindex"] == 0) {
        this.isSearching = false;
        this.sortAndShowFavourites(this.defaultfavourites);
      }
    });

    this.events.subscribe("contact:deleted", (data) => {
      this.removeContactFromFavourite(data);
    });

    this.events.subscribe("contact:unfavourited", (data) => {
      if (typeof data["isbycontactid"] !== "undefined" && data["isbycontactid"]) {
        this.removeContactFromFavourite(data);
      }
    });

    this.events.subscribe("contact:favourited", (data) => {
      console.log(JSON.stringify(data));
      if (typeof data["isfromdevice"] !== "undefined" && data["isfromdevice"]) {
        this.refreshData();
      }
    });

    this.events.subscribe("favourites:saved", (data) => {
      this.refreshData();
    });

    this.events.subscribe("contact:updated", (data) => {
      let contact = data["contact"];
      let totalfavourites = this.favourites.length;
      for (let i = 0; i < totalfavourites; i++) {
        if (this.favourites[i].contact.localid == contact.localid) {
          this.favourites[i].contact = contact;
        }
      }
    });
    this.refreshData();
  }

  removeContactFromFavourite(data) {
    let contactid = data["contactid"];
    let totalfavourites = this.favourites.length;
    let index = -1;
    for (let i = 0; i < totalfavourites; i++) {
      if (this.favourites[i].contact.localid == contactid) {
        index = i;
      }
    }
    if (index > -1) {
      this.favourites.splice(index, 1);
    }
  }

  refreshData() {
    this.favouritesProvider.reterive().then((data) => {
      let favourites = data["favourites"];
      if (favourites != null) {
        this.defaultfavourites = favourites;
        this.sortAndShowFavourites(favourites);
      }
    });
  }

  sortAndShowFavourites(favourites) {
    this.favourites = favourites.sort((object1, object2) => {
      if (object1.id < object2.id) {
        return 1;
      }
      return -1;
    });
  }

  callContactTileAction(favourite) {
    let tileAction = "";
    this.loadingProvider.showAlert("Please wait...");
    this.databaseProvider.getSyncInfo().then((data) => {
      let loggedInContactId = 0;
      if (data["status"]) {
        let syncinfo = data["info"];
        tileAction = syncinfo["ccacontacttileclickaction"];
        loggedInContactId = syncinfo["contactid"];
      }
      this.performTileAction(tileAction, favourite, loggedInContactId);
    });
  }

  performTileAction(action, favourite, loggedInContactId) {
    if (action != "") {
      action = action.split("__");

      let actionid = action[1];
      let actiontype = action[0];
      let actionlabel = action[2];

      let hasPhone = favourite.contact.phones.length > 0;
      let hasEmail = favourite.contact.emails.length > 0;

      if (actiontype.toLowerCase() == "activity") {

        if (this.isActivityOfCallType(action[2]) && hasPhone) {
          this.callContact(favourite);
          this.loadingProvider.dismissAlert();
        } else {

          let activity = new Activity();
          activity.activitydatetime = this.databaseProvider.getCurrentDateTime();
          activity.activitytypeid = actionid;
          activity.sourcecontactid = loggedInContactId;
          activity.assigneecontactids = loggedInContactId;
          activity.targetcontactids = favourite.contact.id;

          activity.sourcecontactidlocal = "" + UtilsProvider.LOGGEDIN_USERID_LOCALID;
          activity.assigneecontactidslocal = JSON.stringify([UtilsProvider.LOGGEDIN_USERID_LOCALID]);
          activity.targetcontactidslocal = JSON.stringify([favourite.contact.localid]);

          this.databaseProvider.insertActivity(activity, true).then((data) => {
            this.loadingProvider.dismissAlert();
            if (data["status"]) {
              this.performCallOrEmailActivity(action[2], favourite);
            }
          });
        }

      } else {
        this.performCallOrEmailActivity(action[2], favourite);
      }
    } else {
      this.callContact(favourite);
    }
  }

  isActivityOfCallType(activitytype) {
    return (activitytype.toLowerCase().indexOf("call") >= 0);
  }

  performCallOrEmailActivity(activitytype, favourite) {
    let hasPhone = favourite.contact.phones.length > 0;
    let hasEmail = favourite.contact.emails.length > 0;

    if (activitytype.toLowerCase().indexOf("call") >= 0) {
      //Contact has phone, but no email. Default action is email. Action for contact is call phone.
      if (hasPhone) {
        this.callContact(favourite);
      } else if (hasEmail) {
        this.emailContact(favourite);
      } else {
        //If contact has neither email or phone then the click action should open the contact.
        this.openContact(favourite);
      }

    } else if (activitytype.toLowerCase().indexOf("email") >= 0) {
      //Contact has email, but no phone. Default action is phone. Action for contact is call email.
      if (hasEmail) {
        this.emailContact(favourite);
      } else if (hasPhone) {
        this.callContact(favourite);
      } else {
        //If contact has neither email or phone then the click action should open the contact.
        this.openContact(favourite);
      }

    } else {
      this.utilsProvider.showToast(activitytype + " activity created.");
    }
  }

  callContact(favourite) {
    this.utilsProvider.call(favourite.contact).then((data) => {
      if (data["status"]) {
        this.databaseProvider.recordCallHistory(favourite.contact, '').then((data) => {
          this.navCtrl.push(EditHistoryPage, {
            'callhistory': data["history"],
          });
        });
      }
    });
  }

  emailContact(favourite) {
    let emails = favourite.contact["emails"];
    let totalemails = emails.length;
    let emailaddress = "";
    for (let i = 0; i < totalemails; i++) {
      // FIXME detect the main email for the contact
      emailaddress = emails[i]["email"];
      break;
    }

    if (emailaddress != "") {
      this.utilsProvider.email(favourite.contact, emailaddress);
    }
  }

  openContact(favourite) {
    this.contactsprovider.openContactPage(favourite.contact, this.navCtrl);
  }

}
