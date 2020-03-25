import { Injectable } from '@angular/core';
import { AlertController } from 'ionic-angular';
import { ToastController } from 'ionic-angular';
import { GoogleAnalytics } from '@ionic-native/google-analytics';

/*
  Generated class for the UtilsProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class UtilsProvider {

  private cordovaNotAvailableMessage = "Cordova is not available, Run the application in device/simulator.";
  private static LATEST_EXTENSION_VERSION = 8;
  private static EXTENSION_WARNING_SHOWN_ON: Date = null;
  public static LOGGEDIN_USERID_LOCALID = -1;

  constructor(public alertController: AlertController, public toastController: ToastController, public googleAnalytics: GoogleAnalytics) {

  }

  showWarningIfUsingOldExtension(currentextensionversion) {
    if (currentextensionversion < UtilsProvider.LATEST_EXTENSION_VERSION) {
      let today = new Date();
      today.setHours(0, 0, 0);
      if (UtilsProvider.EXTENSION_WARNING_SHOWN_ON == null || UtilsProvider.EXTENSION_WARNING_SHOWN_ON < today) {
        UtilsProvider.EXTENSION_WARNING_SHOWN_ON = today;
        this.showAlert("Update Extension", "The CiviCRM extension installed in CiviCRM is out of date and should be updated. Contact your CiviCRM administrator. Not all features may function correctly");
      }
    }
  }

  static isValidURL(str) {
    var regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
    if (!regex.test(str)) {
      return false;
    } else {
      return true;
    }
  }

  static dateFromISOToReadable(datestring) {
    datestring = datestring.split("-");
    return datestring[2].substring(0, 2) + "/" + datestring[1] + "/" + datestring[0];
  }

  decodeHTML(html) {
    let txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }

  modifyKeysAndValues(contactid, directorykeys, directoryvalues) {
    for (let key of directorykeys) {
      let foundIndex = false;
      let index = -1;
      let totalcontacts = directoryvalues[key].length;

      for (let i = 0; i < totalcontacts; i++) {
        let contact = directoryvalues[key][i];
        if (contact.localid == contactid) {
          foundIndex = true;
          index = i;
          break;
        }
      }

      if (foundIndex) {
        directoryvalues[key].splice(index, 1);
        if (directoryvalues[key].length == 0) {

          let valueindex = directoryvalues.indexOf(key);
          let keyindex = directorykeys.indexOf(key);

          if (valueindex > -1) {
            directoryvalues.splice(valueindex, 1);
          }

          if (keyindex > -1) {
            directorykeys.splice(keyindex, 1);
          }
        }
        break;
      }
    }
  }

  trackPageOpen(page: string) {
    this.googleAnalytics.trackView(page, "", true).then((data) => {
      console.log("--- Tracking new page open ---");
      console.log(data);
    });
  }

  trackEvent(category: string, action: string, label: string, value: number, newSession: boolean) {
    this.googleAnalytics.trackEvent(category, action, label, value, newSession).then((data) => {
      console.log("--- Logging new event ---");
      console.log(data);
    });
  }

  getRestUrl(endpoint, params, forPostParams = false) {
    if (endpoint.indexOf('?') !== -1) {
      return endpoint + '&' + this.getQueryString(params, true);
    }
    return endpoint + this.getQueryString(params, forPostParams);
  }

  getQueryString(params, forPostParams = false) {
    let querystring = "?";
    if (forPostParams) {
      querystring = "";
    }
    let keys = Object.keys(params);
    let totalkeys = keys.length;
    for (let i = 0; i < totalkeys; i++) {
      querystring += keys[i] + "=" + params[keys[i]];
      if ((totalkeys - 1) != i) {
        querystring += "&";
      }
    }
    return querystring;
  }

  showToast(message: string) {
    let toast = this.toastController.create({
      message: message,
      duration: 3000,
      position: 'bottom'
    });

    toast.onDidDismiss(() => {

    });

    toast.present();
  }

  showAlert(title: string, message: string, okhandler: any = null) {
    let alert = this.alertController.create({
      title: title,
      message: message,
      buttons: [
        {
          text: 'Ok',
          role: 'cancel',
          handler: okhandler
        }
      ]
    });
    alert.present();
  }

  showCatchError(errorfor, errorcode) {
    if (errorcode == "cordova_not_available") {
      this.showAlert(errorfor, this.getCordovaNotAvailableMessage());
    }
  }

  getCordovaNotAvailableMessage() {
    return this.cordovaNotAvailableMessage;
  }

  email(contact, emailaddress, bccemail = null) {
    this.trackEvent("Contact", "Email", "Email to contact.", 1, true);
    let href = 'mailto:' + emailaddress;
    // Email to activity
    if (bccemail != null) {
      href += '?bcc=' + bccemail["username"] + "@" + bccemail["domain"];
    }
    window.location.href = href;
  }

  call(contact, phonenumber = "") {
    this.trackEvent("Contact", "Call", "Call to contact.", 1, true);
    return new Promise((resolve) => {
      if (contact.phones.length > 0 || phonenumber != "") {

        if (phonenumber == "") {
          phonenumber = contact.phones[0].phone;
        }
        window.location.href = 'tel:' + phonenumber;
        resolve({
          "status": true,
        });
      } else {
        this.showAlert("Call Contact", "Phone numbers not found for this contact.");
        resolve({
          "status": false,
        });
      }
    });
  }

  text(contact, phonenumber) {
    this.trackEvent("Contact", "SMS", "SMS to contact.", 1, true);
    window.location.href = 'sms:' + phonenumber;
  }
}
