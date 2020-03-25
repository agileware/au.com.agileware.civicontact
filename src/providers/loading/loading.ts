import { Injectable } from '@angular/core';
import { LoadingController } from 'ionic-angular';

/*
  Generated class for the LoadingProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class LoadingProvider {

  public loader = null;

  constructor(public loading: LoadingController) {

  }

  showAlert(content: string, options: any = {}) {
    options.content = content;
    this.loader = this.loading.create(options);
    this.loader.present().then(() => {

    });
  }

  dismissAlert() {
    if (this.loader != null) {
      this.loader.dismiss();
      this.loader = null;
    }
  }

}
