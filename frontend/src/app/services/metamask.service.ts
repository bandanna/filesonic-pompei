import { Injectable } from '@angular/core';
import { ethers } from 'ethers';
import { BehaviorSubject } from 'rxjs';
import { postData } from '../utils';

const signed: Map<string, string> = new Map();
const challenges: Map<string, string> = new Map();

@Injectable({
  providedIn: 'root',
})
export class MetamaskService {
  currentChainId$: BehaviorSubject<string> = new BehaviorSubject<string>('');
  currentAccount$: BehaviorSubject<string> = new BehaviorSubject<string>('');
  balance$: BehaviorSubject<string> = new BehaviorSubject<string>('');
  provider: ethers.providers.Web3Provider | undefined;
  signer: ethers.Signer | undefined;
  done: boolean = false;

  checkMetamaskAvailability() {
    try {
      return !!window.ethereum;
    } catch (err) {
      return false;
    }
  }

  connectWallet() {
    window.ethereum
      .request({
        method: 'eth_requestAccounts',
      })
      .then(() => {
        this.handleAccountsChanged();
        this.handleChainChanged();
        this.getBalance();
      });
  }

  async retrieveConnection() {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts.length) {
      this.handleAccountsChanged();
      this.handleChainChanged();
      this.getBalance();
    }
  }

  handleChainChanged(): void {
    this.currentChainId$.next(window.ethereum.chainId);
    window.ethereum.on('chainChanged', () => {
      window.location.reload();
    });
  }

  async handleAccountsChanged() {
    this.currentAccount$.next(window.ethereum.selectedAddress);

    this.provider = this.getProvider();
    this.signer = this.provider.getSigner();
    window.ethereum.on('accountsChanged', () => {
      window.location.reload();
    });

    if (window.localStorage.getItem(window.ethereum.selectedAddress)) {
      return;
    }

    if (challenges.has(window.ethereum.selectedAddress)) {
      return;
    }

    const challenge = await this.getChallenge(window.ethereum.selectedAddress);
    if (!challenge) {
      return;
    }

    interface Response {
      data: {
        challenge: {
          text: string;
        };
      };
    }

    const text = (challenge as Response)['data']['challenge']['text'];
    if (signed.has(text)) {
      return;
    }

    challenges.set(window.ethereum.selectedAddress, text);

    const signature = await signMessageWithMetaMask(
      text,
      window.ethereum.selectedAddress
    );

    signed.set(text, signature);

    const token = await this.getToken(
      window.ethereum.selectedAddress,
      signature
    );

    if (!token) {
      return;
    }

    interface TokenResponse {
      data: {
        authenticate: {
          accessToken: string;
          refreshToken: string;
        };
      };
    }

    const parsedToken = token as TokenResponse;

    window.localStorage.setItem(
      window.ethereum.selectedAddress,
      JSON.stringify(parsedToken['data']['authenticate'])
    );
  }

  async getBalance() {
    if (!this.provider) throw new Error('Provider not configured!');
    const balance = await this.provider.getBalance(this.currentAccount$.value);
    this.balance$.next(ethers.utils.formatEther(balance));
  }

  getProvider() {
    return new ethers.providers.Web3Provider(window.ethereum);
  }

  async getChallenge(address: string): Promise<object | null> {
    return postData(
      `
  query Challenge($address: EthereumAddress!) {
    challenge(request: { address: $address }) {
      text
    }
  }
`,
      { address: address }
    );
  }

  async getToken(address: string, signature: string): Promise<object | null> {
    return postData(
      `
   mutation Authenticate(
    $address: EthereumAddress!
    $signature: Signature!
  ) {
    authenticate(request: {
      address: $address,
      signature: $signature
    }) {
      accessToken
      refreshToken
    }
  }
`,
      { address: address, signature: signature }
    );
  }
}

async function signMessageWithMetaMask(
  message: string,
  account: string
): Promise<string> {
  try {
    const provider = (window as any).ethereum;

    if (!provider) {
      throw new Error('MetaMask is not installed');
    }

    const signedMessage = await provider.request({
      method: 'personal_sign',
      params: [
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message)),
        account,
      ],
    });

    return signedMessage;
  } catch (error) {
    console.error('Error signing message:', error);
    throw error;
  }
}
