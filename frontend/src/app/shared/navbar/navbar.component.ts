import { ethers } from 'ethers';
import { AsyncPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MetamaskService } from '../../services/metamask.service';
import { LensService } from '../../services/lens.service';


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

  address = '';
  title = 'filesonic';
  currentChainId$ = this.metamaskService.currentChainId$;
  currentAccount$ = this.metamaskService.currentAccount$;
  balance$ = this.metamaskService.balance$;
  /// round
  hasMetamask;

  constructor(private metamaskService: MetamaskService, private lensService: LensService) {
    this.hasMetamask = metamaskService.checkMetamaskAvailability();
    if (this.hasMetamask) {
      metamaskService.retrieveConnection();
    }
  }

  connectWallet() {
    this.metamaskService.connectWallet();
  }

  // query the users
  async ngOnInit() {
    const profileQuery = await this.lensService.client.query(
      {query: this.lensService.exploreProfiles}
      )
    //console.log(profileQuery)
  }

  // authenticate
  async login() {
    const account = await window.ethereum.send('eth_requestAccounts');

    if (account.result.length) {
      this.address = account.result[0];

      const challengeInfo = await this.lensService.client.query({
        query: this.lensService.challenge,
        variables: { address: this.address },
      });

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(
        challengeInfo.data.challenge.text
      );

      const authData = await this.lensService.client.mutate({
        mutation: this.lensService.authenticate,
        variables: {
          address: this.address,
          signature,
        },
      });

      const {
        data: {
          authenticate: { accessToken },
        },
      } = authData;

      localStorage.setItem('token', accessToken);

      const profile = await this.lensService.client.query({
        query: this.lensService.userProfiles,
        variables: { ownedBy: this.address },
      });


      const {
        data: {
          profiles: { items },
        },
      } = profile;
      //console.log(items)
      if (!items.length) {
        const response = await this.createProfileLens()
      //console.log(response)
      //console.log(items)
      }
    }
  }

  async createProfileLens () {
    const result = await this.lensService.client.mutate({
      mutation: this.lensService.createProfile,
      variables: {
        request: {
          handle: "3TOnKQKQ4V",
          profilePictureUri: null,
          followNFTURI: null,
          followModule: null,
        },
      },
    });

    return result
  }

  // Verify if user is logged in LENS
  async isLogged() {

    const profile = await this.lensService.client.query({
      query: this.lensService.userProfiles,
      variables: { ownedBy: this.address },
    });

    const {
      data: {
        profiles: { items },
      },
    } = profile;

    //console.log(items.length)
    return items.length;
  }

}
