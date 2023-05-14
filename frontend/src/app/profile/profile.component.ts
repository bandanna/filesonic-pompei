import { Component } from '@angular/core';
import { LensService } from '../services/lens.service';
import { IpfsService } from '../services/ipfs.service';
import { v4 as uuidv4 } from 'uuid';
import { ethers, utils } from 'ethers';
import LENS_HUB_ABI from '../../assets/abis/lens-hub-contract-abi.json';
import { environment } from 'src/environments/environments';
// @ts-ignore
import omitDeep from 'omit-deep';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})


// this.lensService.client.mutate({
//  mutation: ,
//  variables: {},
// });  ---> SAME AS POST

export class ProfileComponent {

  address = "";
  lensId = "";
  posts: any[] = []


  constructor(private lensService: LensService, private ipfsService: IpfsService) {}

  // query the users
  async ngOnInit() {
    const account = await window.ethereum.send('eth_requestAccounts');
    
    if (account.result.length) {
      this.address = account.result[0];
      const result = await this.lensService.client.query({
        query: this.lensService.userProfiles,
        variables: { ownedBy: this.address }});

      this.lensId = result.data.profiles.items[0].id
      this.lensPosts()
    }
  }

  // query the posts
  async lensPosts() {
    console.log(this.lensId)
    const postQuery = await this.lensService.client.query(
      {query: this.lensService.getPost,
        variables: {request: {
          publicationTypes: ['POST'],
          metadata: { mainContentFocus: ['TEXT_ONLY'] },
          profileId: this.lensId,
          }
        }
      })
    
      // filter posts with url
      const postsWithUrl = postQuery.data.explorePublications.items.filter((item: any) => {
        return item.__typename === 'Post' && item.metadata?.media[0]?.original?.url?.includes('http');
      });

      this.posts = postsWithUrl

  }


  // Upload to IPFS (name, descrição, content, AppId)
  async uploadIpfs(name: any, desc: string, content: string) {

    const ipfsResult = await this.ipfsService.uploadIpfs({
      version: '2.0.0',
      mainContentFocus: 'TEXT_ONLY',
      description: desc,
      metadata_id: uuidv4(),
      locale: 'en-US',
      content: content,
      external_url: null,
      image: null,
      imageMimeType: null,
      name: name,
      attributes: [],
      tags: [],
      appId: "FILESONIC_POMPEI"
    });

    return ipfsResult.path
  }

  // FAZER LENS
  async createPost(name: any, desc: string, content: string) {
    const path = await this.uploadIpfs(name, desc, content)
    const post = await this.lensService.client.mutate({
      mutation: this.lensService.createPost,
      variables: {
        request: {
          profileId: this.lensId,
          contentURI: `ipfs://${path}`,
          collectModule: {
            revertCollectModule: true,
          },
          referenceModule: {
            followerOnlyReferenceModule: false,
          },
        },
      },
    });

    const { domain, types, value } = post.data!.createPostTypedData.typedData;
    const signer = new ethers.providers.Web3Provider(
      window.ethereum
    ).getSigner();
    const signedResult = await signer._signTypedData(
      omitDeep(domain, '__typename' as any),
      omitDeep(types, '__typename' as any) as any,
      omitDeep(value, '__typename' as any)
    );
    const { v, r, s } = utils.splitSignature(signedResult);
    const lensHub = new ethers.Contract(
      environment.LENS_HUB_CONTRACT,
      LENS_HUB_ABI,
      signer
    );
    const tx = await lensHub['postWithSig']({
      profileId: value.profileId,
      contentURI: value.contentURI,
      collectModule: value.collectModule,
      collectModuleInitData: value.collectModuleInitData,
      referenceModule: value.referenceModule,
      referenceModuleInitData: value.referenceModuleInitData,
      sig: {
        v,
        r,
        s,
        deadline: value.deadline,
      },
    });
  }


}
