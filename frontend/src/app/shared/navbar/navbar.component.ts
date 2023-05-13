import { Component, Input } from '@angular/core';
import { MetamaskService } from '../../services/metamask.service';
import { AsyncPipe } from '@angular/common';


declare global {
  interface Window {
    ethereum: any;
  }
}

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  providers: [AsyncPipe]
})

export class NavBarComponent {

  title = 'filesonic';
  currentChainId$ = this.metamaskService.currentChainId$;
  currentAccount$ = this.metamaskService.currentAccount$;
  balance$ = this.metamaskService.balance$;
  hasMetamask;

  constructor(private metamaskService: MetamaskService) {
    this.hasMetamask = metamaskService.checkMetamaskAvailability();
    if (this.hasMetamask) {
      metamaskService.retrieveConnection();
    }
  }

  connectWallet() {
    this.metamaskService.connectWallet();
  }
}
