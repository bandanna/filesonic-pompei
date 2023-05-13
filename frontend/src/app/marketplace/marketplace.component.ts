import { Component, ElementRef, ViewChild } from '@angular/core';
import { create } from 'ipfs-http-client';
import { environment } from '../../environments/environment';
import { postData, profiles } from '../utils';

@Component({
  selector: 'app-marketplace',
  templateUrl: './marketplace.component.html',
  styleUrls: ['./marketplace.component.css'],
})
export class MarketplaceComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('progressBar') progressBar!: ElementRef<HTMLProgressElement>;
  ipfs;

  ngAfterViewInit() {
    this.fileInput.nativeElement.addEventListener(
      'change',
      this.onFileInputChange
    );
  }

  onFileInputChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (!(input.files && input.files.length > 0)) {
      return;
    }

    const file = input.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onloadend = async () => {
      const content = new Uint8Array(reader.result as ArrayBuffer);

      const updateProgress = (progress: number) => {
        this.progressBar.nativeElement.value = Math.floor(
          (progress * 100) / content.length
        );
      };

      const options = {
        wrapWithDirectory: true,
        progress: updateProgress,
      };

      let cid: null | string = null;

      try {
        const result = await this.ipfs.add(content, options);
        cid = result.cid.toString();
      } catch (error) {
        console.error('Error uploading file:', error);
      }

      if (!cid) {
        return;
      }

      const publication = await createPublication(cid);
      if (!publication) {
        return;
      }
    };

    reader.readAsArrayBuffer(file);
  };

  constructor() {
    this.ipfs = create({
      host: 'ipfs.infura.io',
      port: 5001,
      protocol: 'https',
      headers: {
        Authorization: `Basic ${btoa(
          `${environment.ipfsApiKey}:${environment.ipfsApiSecret}`
        )}`,
      },
    });
  }
}

async function createPublication(cid: string): Promise<object | null> {
  let token: string | null = null;

  const obj: any = localStorage.getItem(window.ethereum.selectedAddress);
  if (obj) {
    token = JSON.parse(obj)['accessToken'];
  }

  const profile = profiles.get(
    window.ethereum.selectedAddress.toString().toLowerCase()
  );

  return postData(
    `
mutation CreatePostTypedData {
  createPostTypedData(request: {
    profileId: "${profile}",
    contentURI: "ipfs://${cid}",
    collectModule: {
      revertCollectModule: true
    },
    referenceModule: {
      followerOnlyReferenceModule: false
    }
  }) {
    id
    expiresAt
    typedData {
      types {
        PostWithSig {
          name
          type
        }
      }
      domain {
        name
        chainId
        version
        verifyingContract
      }
      value {
        nonce
        deadline
        profileId
        contentURI
        collectModule
        collectModuleInitData
        referenceModule
        referenceModuleInitData
      }
    }
  }
}`,
    {},
    token
  );
}
