import { Injectable } from '@angular/core';
import { ethers } from 'ethers';
import { BehaviorSubject } from 'rxjs';

const url = 'https://api-mumbai.lens.dev';

const signed: Map<string, string> = new Map();
const challenges: Map<string, string> = new Map();

async function postData(query: any, variables: any): Promise<object | null> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        variables: variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error('Error posting data:', error);
  }

  return null;
}

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
    console.log({ log: window.ethereum });
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

    console.log('Signed message:', signedMessage);
    return signedMessage;
  } catch (error) {
    console.error('Error signing message:', error);
    throw error;
  }
}
