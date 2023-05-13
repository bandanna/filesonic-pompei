import { Component, ElementRef, ViewChild } from '@angular/core';
import { create } from 'ipfs-http-client';
import { environment } from '../../environments/environment';

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

      try {
        const result = await this.ipfs.add(content, options);
        console.log(`IPFS CID: ${result.cid.toString()}`);
      } catch (error) {
        console.error('Error uploading file:', error);
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
