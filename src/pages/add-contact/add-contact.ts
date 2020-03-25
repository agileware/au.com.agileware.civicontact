import { Component } from '@angular/core';
import { Events, NavController, NavParams } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, FormArray } from '@angular/forms';
import { Contact } from '../../models/contact';
import { LocationTypesProvider } from '../../providers/location-types/location-types'
import { Phone } from '../../models/phone';
import { Email } from '../../models/email';
import { LocationType } from '../../models/locationtype';
import { DatabaseProvider } from '../../providers/database/database';
import { UtilsProvider } from '../../providers/utils/utils';
import { LoadingProvider } from '../../providers/loading/loading';
import { Country } from "../../models/country";
import { State } from "../../models/state";
import { County } from "../../models/county";
import { AddContactPofileAutoCompleteFieldsService } from "../../services/AddContactPofileAutoCompleteFieldsService";
import { Profilefielddata } from "../../models/profilefielddata";

/**
 * Generated class for the AddContactPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-add-contact',
  templateUrl: 'add-contact.html',
})
export class AddContactPage {

  public addContactFormGroup: FormGroup;

  public firstname: AbstractControl;
  public lastname: AbstractControl;
  public phones: FormArray;
  public emails: FormArray;

  public contact = null;
  public pagetitle: string = "Add new contact";
  public isediting = false;

  public locationtypes;
  public defaultlocationtypeid = 0;

  public syncinfo;

  public profilefields;

  public countries;
  public allstates;
  public allcounties;

  public countriesobject;
  public allstatesobject;
  public allcountiesobject;

  public hasCountry: boolean = false;
  public hasCustomCountry: boolean = false;
  public hasState: boolean = false;
  public hasCustomState: boolean = false;

  public countrySelected: boolean = false;
  public stateSelected: boolean = false;

  public customCountrySelected: boolean = false;
  public customStateSelected: boolean = false;

  public statestodisplay = [];
  public countiestodisplay = [];
  public customstatestodisplay = [];

  public hasProfileFields: boolean = false;

  public profilefieldvalues;

  constructor(public navCtrl: NavController, public navParams: NavParams, public formBuilder: FormBuilder,
    public locationTypesProvider: LocationTypesProvider, public databaseProvider: DatabaseProvider,
    public utilsProvider: UtilsProvider, public loadingProvider: LoadingProvider,
    public addContactProfileAutoCompleteFieldsService: AddContactPofileAutoCompleteFieldsService,
    public events: Events) {

    this.profilefields = [];
    this.profilefieldvalues = {};

    this.countriesobject = {};
    this.allstatesobject = {};
    this.allcountiesobject = {};

    this.countries = new Array<Country>();
    this.allstates = new Array<State>();
    this.allcounties = new Array<County>();
    this.statestodisplay = new Array<State>();
    this.countiestodisplay = new Array<County>();

    this.addContactFormGroup = formBuilder.group({
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      phones: this.formBuilder.array([]),
      emails: this.formBuilder.array([]),
    });

    this.firstname = this.addContactFormGroup.controls['firstname'];
    this.lastname = this.addContactFormGroup.controls['lastname'];
    this.emails = <FormArray>this.addContactFormGroup.controls['emails'];
    this.phones = <FormArray>this.addContactFormGroup.controls['phones'];

    locationTypesProvider.retrive().then((locationtypes) => {
      this.locationtypes = locationtypes;
      for (let locationtype of this.locationtypes) {
        if (locationtype.isdefault == 1) {
          this.defaultlocationtypeid = locationtype.id;
          if (!this.isediting) {
            this.addBlankPhoneAndEmail();
          } else {
            for (let phone of this.contact.phones) {
              this.phones.push(this.createPhone(phone));
            }
            for (let email of this.contact.emails) {
              this.emails.push(this.createEmail(email));
            }
            this.addBlankPhoneAndEmail();
          }
        }
      }
    });

    this.contact = this.navParams.get("contact");
    if (this.contact != null) {
      this.pagetitle = "Edit contact";
      this.isediting = true;
    } else {
      this.contact = new Contact();
    }
  }

  addBlankPhoneAndEmail() {
    this.phones.push(this.createPhone());
    this.emails.push(this.createEmail());
  }

  createPhone(phone = null): AbstractControl {
    let typeid = this.defaultlocationtypeid;
    if (phone == null) {
      phone = new Phone(0, null, "");
    } else {
      typeid = phone.type.id;
    }

    return this.formBuilder.group({
      number: [phone.phone, Validators.pattern('^[- ()0-9]*$')],
      type: typeid,
      liveid: [phone.id],
    });
  }

  createEmail(email = null): AbstractControl {
    let typeid = this.defaultlocationtypeid;
    if (email == null) {
      email = new Email(0, null, "");
    } else {
      typeid = email.type.id;
    }

    return this.formBuilder.group({
      emailid: [email.email, this.emailValidator],
      type: typeid,
      liveid: [email.id],
    });
  }

  getPhoneProperty(i, property): string {
    return this.phones.controls[i].get(property).value;
  }

  getEmailProperty(i, property): string {
    return this.emails.controls[i].get(property).value;
  }

  private emailValidator(control: AbstractControl): ValidationErrors {
    if (!control.value) {
      return null;
    }

    return Validators.email(control);
  }

  ionViewDidLoad() {
    let trackLabel = "Add Contact";
    if (this.isediting) {
      trackLabel = "Edit Contact";
    }
    this.utilsProvider.trackPageOpen(trackLabel);
    this.getSyncInfo();
  }

  private getSyncInfo() {
    this.loadingProvider.showAlert("Setting up profile fields, Please wait...");
    this.databaseProvider.getSyncInfo().then((data) => {
      this.syncinfo = data["info"];
      this.setProfileFields();
    });
  }

  private setProfileFields() {
    if (this.syncinfo["ccaprofilefields"] != '') {
      let profilefields = JSON.parse(this.syncinfo["ccaprofilefields"]);
      profilefields = this.removeReadOnlyFields(profilefields);
      if (profilefields.length > 0) {
        this.formatCountriesObject(this.syncinfo["ccacountries"]);
        this.setProfileFieldValues(profilefields).then((data) => {
          this.profilefields = profilefields;
          this.setCountryVariables();
          this.hasProfileFields = true;
          this.loadingProvider.dismissAlert();
        });
      }
    } else {
      this.hasProfileFields = false;
      this.loadingProvider.dismissAlert();
    }
  }

  private removeReadOnlyFields(profilefields) {
    let profilefieldstoreturn = [];
    for (let profilefield of profilefields) {
      if (profilefield["is_view"] != 1) {
        profilefieldstoreturn.push(profilefield);
      }
    }
    return profilefieldstoreturn;
  }

  private setProfileFieldValues(profilefields) {
    return new Promise((resolve) => {
      if (this.isediting) {

        let findbylocal = (this.contact.id) ? false : true;
        let contactid = (this.contact.id) ? this.contact.id : this.contact.localid;

        this.databaseProvider.findProfileFieldsDataByContact(contactid, findbylocal, true).then((data) => {
          this.setProfileFieldValuesWithData(profilefields, data);
          resolve(true);
        });
      } else {
        this.setProfileFieldValuesWithData(profilefields);
        resolve(true);
      }
    });
  }

  private setProfileFieldValuesWithData(profilefields, data = null) {
    this.profilefieldvalues = {};

    for (let profilefield of profilefields) {
      let fieldvalue: any = "";
      let setfieldvalue = true;

      if (data != null && typeof data[profilefield["name"]] !== "undefined") {
        fieldvalue = data[profilefield["name"]]["value"];
      }

      // For Selection form elements. Gender, Prefix, Suffix & Custom Select elements.
      if (fieldvalue != '' && (profilefield.html_type == 'Select')) {
        let selectionvalues = profilefield.selectionvalues;
        for (let selectionvalue of selectionvalues) {
          if (selectionvalue['key'] == fieldvalue) {
            fieldvalue = selectionvalue;
            break;
          }
        }
      }

      // For Custom Date elements.
      if (fieldvalue != '' && (profilefield.html_type == 'Select Date')) {
        fieldvalue = fieldvalue.replace(" ", "T");
      }

      // For Country Selection.
      if (fieldvalue != '' && (profilefield.bao == 'CRM_Core_BAO_Country')) {
        if (typeof this.countriesobject[fieldvalue] !== "undefined") {
          this.statestodisplay = this.countriesobject[fieldvalue]['states'];
          this.hasCountry = true;
          fieldvalue = this.countriesobject[fieldvalue];
        }
      }

      // For State/Province Selection.
      if (fieldvalue != '' && (profilefield.bao == 'CRM_Core_DAO_StateProvince')) {
        if (typeof this.allstatesobject[fieldvalue] !== "undefined") {
          this.countiestodisplay = this.allstatesobject[fieldvalue]['counties'];
          this.hasState = true;
          fieldvalue = this.allstatesobject[fieldvalue];
        }
      }

      // For County Selection.
      if (fieldvalue != '' && (profilefield.bao == 'CRM_Core_DAO_County')) {
        if (typeof this.allcountiesobject[fieldvalue] !== "undefined") {
          fieldvalue = this.allcountiesobject[fieldvalue];
        }
      }

      // For Custom Country Selection.
      if (fieldvalue != '' && (profilefield.html_type == 'Select Country')) {
        if (typeof this.countriesobject[fieldvalue] !== "undefined") {
          this.hasCustomCountry = true;
          this.customstatestodisplay = this.countriesobject[fieldvalue]['states'];
          fieldvalue = this.countriesobject[fieldvalue];
        }
      }

      // For Custom State/Province Selection.
      if (fieldvalue != '' && (profilefield.html_type == 'Select State/Province')) {
        if (typeof this.allstatesobject[fieldvalue] !== "undefined") {
          this.hasCustomState = true;
          fieldvalue = this.allstatesobject[fieldvalue];
        }
      }

      // For Multi Custom State/Province Selection.
      if (fieldvalue != '' && (profilefield.html_type == 'Multi-Select State/Province')) {
        let fieldvaluearray = fieldvalue.split(",");
        fieldvalue = [];
        for (let fieldvalueitem of fieldvaluearray) {
          if (typeof this.allstatesobject[fieldvalueitem] !== "undefined") {
            fieldvalue.push(this.allstatesobject[fieldvalueitem]);
          }
        }
      }

      // For Multi Custom Country Selection.
      if (fieldvalue != '' && (profilefield.html_type == 'Multi-Select Country')) {
        let fieldvaluearray = fieldvalue.split(",");
        fieldvalue = [];
        for (let fieldvalueitem of fieldvaluearray) {
          if (typeof this.countriesobject[fieldvalueitem] !== "undefined") {
            fieldvalue.push(this.countriesobject[fieldvalueitem]);
          }
        }
      }

      // For Multi-Selection form elements.
      if (fieldvalue != '' && profilefield.html_type == 'Multi-Select') {
        let fieldvaluearray = fieldvalue.split(",");
        fieldvalue = [];
        let selectionvalues = profilefield.selectionvalues;

        for (let selectionvalue of selectionvalues) {
          if (fieldvaluearray.indexOf(selectionvalue['key'] + '') >= 0) {
            fieldvalue.push(selectionvalue);
          }
        }
      }

      // For Checkbox form elements.
      if (profilefield.html_type == 'CheckBox') {
        let selectionvalues = profilefield.selectionvalues;
        setfieldvalue = false;
        this.profilefieldvalues[profilefield["name"]] = {};
        let fieldvaluearray = fieldvalue.split(",");

        for (let selectionvalue of selectionvalues) {
          let hasSelectedThisOption = false;
          if (fieldvaluearray.indexOf(selectionvalue['key'] + '') >= 0) {
            hasSelectedThisOption = true;
          }
          this.profilefieldvalues[profilefield["name"]][selectionvalue['key']] = hasSelectedThisOption;
        }
      }

      if (setfieldvalue) {
        this.profilefieldvalues[profilefield["name"]] = fieldvalue;
      }
    }
  }

  private setCountryVariables() {
    for (let profilefield of this.profilefields) {
      if (profilefield["bao"] == "CRM_Core_BAO_Country") {
        this.hasCountry = true;
      }

      if (profilefield["bao"] == "CRM_Core_DAO_StateProvince") {
        this.hasState = true;
      }

      if (profilefield["html_type"] == "Select State/Province") {
        this.hasCustomState = true;
      }

      if (profilefield["html_type"] == "Select Country") {
        this.hasCustomCountry = true;
      }
    }

    if (this.hasState && !this.hasCountry) {
      this.statestodisplay = this.allstates;
    }

    if (this.hasCustomState && !this.hasCustomCountry) {
      this.customstatestodisplay = this.allstates;
    }

    if (!this.hasState) {
      this.countiestodisplay = this.allcounties;
    }
  }

  private setStateSelected(event) {
    let stateid = event.value.id;
    this.stateSelected = true;
    this.countiestodisplay = new Array<County>();

    for (let state of this.statestodisplay) {
      if (state.id == stateid) {
        this.countiestodisplay = state.counties;
        break;
      }
    }
  }

  private setCustomCountrySelected(event) {
    let countryid = event.value.id;
    this.customCountrySelected = true;

    this.customstatestodisplay = new Array<State>();

    for (let country of this.countries) {
      if (country.id == countryid) {
        this.customstatestodisplay = country.states;
        break;
      }
    }
  }

  private setCountrySelected(event) {
    let countryid = event.value.id;
    this.countrySelected = true;

    this.statestodisplay = new Array<State>();

    for (let country of this.countries) {
      if (country.id == countryid) {
        this.statestodisplay = country.states;
        break;
      }
    }
  }

  private updateCurrentFocusedAutoCompleteItems(selectionvalues) {
    this.addContactProfileAutoCompleteFieldsService.setAutoCompleteExternalItems(selectionvalues);
  }

  private formatCountriesObject(countries) {
    countries = JSON.parse(countries);
    for (let countryid in countries) {
      let country = new Country();
      country.id = countries[countryid].id;
      country.isoCode = countries[countryid].iso_code;
      country.name = countries[countryid].name;
      let states = countries[countryid]["api.StateProvince.get"]["values"];
      for (let stateid in states) {
        let state = new State();
        state.id = states[stateid].id;
        state.name = states[stateid].name;

        let counties = states[stateid]["counties"];
        for (let countyid in counties) {
          let county = new County();
          county.name = counties[countyid];
          county.id = parseInt(countyid);
          state.counties.push(county)
          this.allcounties.push(county);
          this.allcountiesobject[county.id] = county;
        }
        country.states.push(state);
        this.allstates.push(state);
        this.allstatesobject[state.id] = state;
      }

      this.countries.push(country);
      this.countriesobject[country.id] = country;
    }
  }

  private getLocationTypeFromId(typeid) {
    for (let locationtype of this.locationtypes) {
      if (locationtype.id == typeid) {
        return locationtype;
      }
    }
    return null;
  }

  uploadImage() {
    // TODO
  }

  submitAddContactForm() {

    let profileFieldErrors = [];
    let updatedprofilefieldvalues = new Array<Profilefielddata>();

    for (let profilefield of this.profilefields) {
      let profilefieldvalue = this.profilefieldvalues[profilefield.name];
      let profilefieldlabel = this.profilefieldvalues[profilefield.name];

      if (profilefieldvalue == '' && profilefield.is_required) {
        profileFieldErrors.push(profilefield.title + ' is a required field.');
      }

      if (profilefieldvalue != '' && (profilefield.html_type == 'Select')) {
        profilefieldlabel = profilefieldvalue.val;
        profilefieldvalue = profilefieldvalue.key;
      }

      if (profilefieldvalue != '' && (profilefield.html_type == 'Select State/Province' || profilefield.bao == 'CRM_Core_BAO_Country' || profilefield.bao == 'CRM_Core_DAO_StateProvince' || profilefield.bao == 'CRM_Core_DAO_County' || profilefield.html_type == 'Select Country')) {
        profilefieldlabel = profilefieldvalue.name;
        profilefieldvalue = profilefieldvalue.id;
      }

      if (profilefieldvalue != '' && (profilefield.html_type == 'Multi-Select Country' || profilefield.html_type == 'Multi-Select State/Province')) {
        let finalfieldvalue = [];
        let finalfieldlabels = [];
        for (let singlevalue of profilefieldvalue) {
          finalfieldvalue.push(singlevalue.id);
          finalfieldlabels.push(singlevalue.name);
        }
        profilefieldvalue = finalfieldvalue.join(',');
        profilefieldlabel = finalfieldlabels.join(', ');
      }

      if (profilefieldvalue != '' && profilefield.html_type == 'Multi-Select') {
        let finalfieldvalue = [];
        let finalfieldlabels = [];

        for (let singlevalue of profilefieldvalue) {
          finalfieldvalue.push(singlevalue.key);
          finalfieldlabels.push(singlevalue.val);
        }
        profilefieldvalue = finalfieldvalue.join(',');
        profilefieldlabel = finalfieldlabels.join(', ');
      }

      if (profilefield.html_type == 'CheckBox') {
        let selectionvalues = profilefield.selectionvalues;
        let finalfieldvalue = [];
        let finalfieldlabels = [];
        for (let selectionvalue of selectionvalues) {
          if (profilefieldvalue[selectionvalue['key'] + '']) {
            finalfieldvalue.push(selectionvalue['key']);
            finalfieldlabels.push(selectionvalue['val']);
          }
        }
        profilefieldvalue = finalfieldvalue.join(',');
        profilefieldlabel = finalfieldlabels.join(', ');
      }

      if (profilefield.html_type == 'Radio') {
        let selectionvalues = profilefield.selectionvalues;
        for (let selectionvalue of selectionvalues) {
          if (profilefieldvalue == selectionvalue['key']) {
            profilefieldlabel = selectionvalue['val'];
          }
        }
      }

      if (profilefield.html_type == 'Select Date' && profilefieldvalue != '') {
        profilefieldlabel = UtilsProvider.dateFromISOToReadable(profilefieldvalue);
      }

      if (profilefield.data_type == "Int" && profilefieldvalue != '' && isNaN(profilefieldvalue)) {
        profileFieldErrors.push(profilefield.title + ' should be a valid integer.');
      }

      if ((profilefield.data_type == "Link" || profilefield.bao == 'CRM_Core_BAO_Website') && profilefieldvalue != '' && !UtilsProvider.isValidURL(profilefieldvalue)) {
        profileFieldErrors.push(profilefield.title + ' should be valid URL.');
      }

      let profilefielddataobject = new Profilefielddata();
      profilefielddataobject.contactid = this.contact.id;
      profilefielddataobject.contactidlocal = this.contact.localid;
      profilefielddataobject.value = profilefieldvalue;
      profilefielddataobject.label = profilefieldlabel;
      profilefielddataobject.fieldname = profilefield.name;

      updatedprofilefieldvalues.push(profilefielddataobject);
    }

    this.contact.profilefieldsdata = updatedprofilefieldvalues;
    if (profileFieldErrors.length > 0) {
      this.utilsProvider.showAlert((this.isediting) ? 'Edit Contact' : 'Add Contact', profileFieldErrors.join('<br><br>'));
      return;
    }

    let currentdatetime = this.getDateString();
    this.contact.firstname = this.firstname.value;
    this.contact.lastname = this.lastname.value;
    this.contact.modifieddate = currentdatetime;

    if (!this.isediting) {
      this.contact.createddate = currentdatetime;
      this.contact.isfavourite = 0;
      this.contact.id = 0;
      this.contact.imageurl = "";
      this.contact.groups = this.syncinfo["defaultgroupid"];
    }

    this.contact.phones = [];
    this.contact.emails = [];

    for (let phone of this.phones.value) {
      if (phone.number.trim() != "") {
        this.contact.phones.push(new Phone(phone.liveid, <LocationType>this.getLocationTypeFromId(phone.type), phone.number));
      }
    }

    for (let email of this.emails.value) {
      if (email.emailid.trim() != "") {
        this.contact.emails.push(new Email(email.liveid, <LocationType>this.getLocationTypeFromId(email.type), email.emailid));
      }
    }

    this.loadingProvider.showAlert("Saving contact, Please wait...");

    if (this.contact.localid != 0) {
      this.databaseProvider.updateContact(this.contact, true).then((data) => {
        if (data["status"]) {
          this.databaseProvider.saveProfileFieldsData(this.contact).then((data) => {
            this.events.publish("contact:updated:withprofilefields", {
              "contact": this.contact,
              "fromdevice": true,
            });

            this.utilsProvider.trackEvent("Contact", "Updated", "Updated contact information.", this.contact.id, true);
            this.closeAddPage("Contact has been updated successfully.");
          });
        }
      });
    } else {
      this.databaseProvider.insertContact(this.contact, true).then((data) => {
        if (data["status"]) {
          this.contact = data["contact"];
          this.resetProfileFieldsData();

          this.databaseProvider.saveProfileFieldsData(this.contact).then((data) => {
            this.events.publish("contact:inserted:withprofilefields", {
              "contact": this.contact,
              "fromdevice": true,
            });

            this.utilsProvider.trackEvent("Contact", "Added", "Added new contact.", this.contact.localid, true);
            this.closeAddPage("New contact has been added successfully.");
          });
        }
      });
    }
  }

  resetProfileFieldsData() {
    let updatedprofilefieldvalues = this.contact.profilefieldsdata;
    this.contact.profilefieldsdata = new Array<Profilefielddata>();
    for (let updatedprofilefieldvalue of updatedprofilefieldvalues) {
      updatedprofilefieldvalue.contactid = this.contact.id;
      updatedprofilefieldvalue.contactidlocal = this.contact.localid;
      this.contact.profilefieldsdata.push(updatedprofilefieldvalue);
    }
  }

  closeAddPage(message: string) {
    this.loadingProvider.dismissAlert();
    this.utilsProvider.showToast(message);
    this.navCtrl.pop();
  }

  private getDateString() {
    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
    let datestring = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
    return datestring;
  }

}