import { Component, OnInit } from '@angular/core';
import { LensService } from '../services/lens.service';
import { MetamaskService } from '../services/metamask.service';


import { ethers, utils } from "ethers";   // use ethers when deploying to test or main nets
const contract_address = "0x30C1e76b7D01789488a3c5bec9304345c39a84C4"

declare global {
  interface Window {
    ethereum: any;
  }
}

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.css']
})

export class IndexComponent {
  lensId = '';
  title = 'filesonic';
  currentChainId$ = this.metamaskService.currentChainId$;
  currentAccount$ = this.metamaskService.currentAccount$;
  balance$ = this.metamaskService.balance$;
  hasMetamask;
  posts: any[] = [];
  contract: ethers.Contract | undefined;
  abi = [{"inputs":[{"internalType":"uint256","name":"updateInterval","type":"uint256"},{"internalType":"uint256","name":"_pubId","type":"uint256"},{"internalType":"uint256","name":"_initPrice","type":"uint256"},{"internalType":"uint256","name":"_increment","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"buyData","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"bytes","name":"","type":"bytes"}],"name":"checkUpkeep","outputs":[{"internalType":"bool","name":"upkeepNeeded","type":"bool"},{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"increment","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"interval","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"lastTimeStamp","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes","name":"","type":"bytes"}],"name":"performUpkeep","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"price","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pubId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]

  constructor(private metamaskService: MetamaskService, private lensService: LensService) {
    this.hasMetamask = metamaskService.checkMetamaskAvailability();
    if (this.hasMetamask) {
      metamaskService.retrieveConnection();
    }
  }

  ngOnInit(): void {
    this.lensPosts()
    console.log(this.metamaskService.signer);
    this.contract = new ethers.Contract(contract_address, this.abi, this.metamaskService.signer);
  }

  // query the posts
  async lensPosts() {
    const postQuery = await this.lensService.client.query(
      {query: this.lensService.postQuery,
      variables: {request: {
        sortCriteria: "TOP_COMMENTED",
        publicationTypes: ["POST"],
        limit: 50}
      }
    }
  )
    
      // filter posts with url
      const postsWithUrl = postQuery.data.explorePublications.items.filter((item: any) => {
        return item.metadata?.media[0]?.original?.url?.includes('http');
      });

      this.posts = postsWithUrl
      console.log(postsWithUrl)
      
  }

  async collect() {
    const signer = this.metamaskService.provider?.getSigner(); 
    console.log(signer);
    if (!signer) return
    const price = await this.contract?.connect(signer)["price"]();
    console.log(ethers.utils.formatUnits(price));
     await this.contract?.connect(signer)["buyData"]({value: price});
  }

  donate() {
  }

  connectWallet() {
    this.metamaskService.connectWallet();
  }
}
