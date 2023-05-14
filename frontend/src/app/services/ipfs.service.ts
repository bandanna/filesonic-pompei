import { Injectable } from '@angular/core';
import { create } from 'ipfs-http-client';
import { Buffer } from 'buffer';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root',
})

export class IpfsService {
  client = create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
      authorization: `Basic ${Buffer.from(
        `${environment.API_KEY}:${environment.API_SECRET}`,
        'utf-8'
      ).toString('base64')}`,
    },
  });

  async uploadIpfs(data: any) {
    const result = await this.client.add(JSON.stringify(data));
    return result;
  }
}
