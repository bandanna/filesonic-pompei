import { Injectable } from '@angular/core';
import { ApolloClient, InMemoryCache, gql, NormalizedCacheObject, HttpLink, ApolloLink, concat } from '@apollo/client/core';

@Injectable({
  providedIn: 'root'
})

export class LensService {

  constructor() {
    const authMiddleware = new ApolloLink((operation, forward) => {
      const token = localStorage.getItem('token');
      operation.setContext({
        headers: {
          authorization: token ? `Bearer ${token}` : '',
        },
      });
      return forward(operation);
    });
    const API_URL = 'https://api-mumbai.lens.dev/';
    const API_LINK = new HttpLink({ uri: API_URL });
    this.client = new ApolloClient({
      link: concat(authMiddleware, API_LINK),
      cache: new InMemoryCache(),
    });
  }

  client: ApolloClient<NormalizedCacheObject>;

  // filter posts that have ipfs link
  postQuery = gql`fragment MetadataOutputFields on MetadataOutput {
    name
    description
    content
    media {
      original {
        ...MediaFields
      }
    }
  }
  
  fragment MediaFields on Media {
    url
    width
    height
  }
  
  fragment ProfileFields on Profile {
    id
    name
    bio
    picture {
      ... on NftImage {
        uri
      }
    }
  }
  
  fragment PostFields on Post {
    id
    profile {
      ...ProfileFields
    }
    metadata {
      ...MetadataOutputFields
    }
    appId
    hidden
    reaction(request: null)
    mirrors(by: null)
    hasCollectedByMe
  }
  
  query ExplorePublications($request: ExplorePublicationRequest!) {
    explorePublications(request: $request) {
      items {
        __typename 
        ... on Post {
          ...PostFields
        }
      }
      pageInfo {
        prev
        next
        totalCount
      }
    }
  }`

  //request: {
  //publicationId: "0x1d-0x01"

  collectPost = gql`mutation CreateCollectTypedData {
    createCollectTypedData(request: $request) {
      id
      expiresAt
      typedData {
        types {
          CollectWithSig {
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
          pubId
          data
        }
      }
    }
  }`
  

  createPost = gql`mutation CreatePostTypedData($options: TypedDataOptions, $request: CreatePublicPostRequest!) {
    createPostTypedData(options: $options, request: $request) {
      id
      expiresAt
      typedData {
        types {
          PostWithSig {
            name
            type
            typename
          }
          typename
        }
        domain {
          name
          chainId
          version
          verifyingContract
          typename
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
          typename
        }
        typename
      }
      typename
    }
  }`

  getPost = gql`
  query publications($request: PublicationsQueryRequest!) {
    publications(request: $request) {
      items {
        __typename
        ... on Post {
          ...PostFields
        }
      }
    }
  }
  fragment PostFields on Post {
    id
    metadata {
      ...MetadataOutputFields
    }
    createdAt
    appId
    hidden
    reaction(request: null)
    mirrors(by: null)
    hasCollectedByMe
  }
  fragment MetadataOutputFields on MetadataOutput {
    name
    description
    content
    attributes {
      displayType
      traitType
      value
    }
  }`
  // Query for all user profiles
  userProfiles = gql`fragment ProfileFields on Profile {
    id
  }
  
  query UserProfiles($ownedBy: [EthereumAddress!]) {
    profiles(request: {ownedBy: $ownedBy}) {
      items {
        ...ProfileFields
        interests
        isDefault
        dispatcher {
          address
          canUseRelay
          sponsor
          __typename
        }
        __typename
      }
      __typename
    }
    userSigNonces {
      lensHubOnChainSigNonce
      __typename
    }
  }
  `

  // Create the profile
  createProfile = gql`mutation createProfile($request: CreateProfileRequest!) {
    createProfile(request: $request) {
      ... on RelayerResult {
        txHash
      }
      ... on RelayError {
        reason
      }
      __typename
    }
  }`

  // Get all profiles
  exploreProfiles = gql`query ExploreProfiles {
    exploreProfiles(request: { sortCriteria: MOST_FOLLOWERS }) {
      items {
        id
        name
        bio
        isDefault
        attributes {
          displayType
          traitType
          key
          value
        }
        followNftAddress
        metadata
        handle
        picture {
          ... on NftImage {
            contractAddress
            tokenId
            uri
            chainId
            verified
          }
          ... on MediaSet {
            original {
              url
              mimeType
            }
          }
        }
        coverPicture {
          ... on NftImage {
            contractAddress
            tokenId
            uri
            chainId
            verified
          }
          ... on MediaSet {
            original {
              url
              mimeType
            }
          }
        }
        ownedBy
        dispatcher {
          address
          canUseRelay
        }
        stats {
          totalFollowers
          totalFollowing
          totalPosts
          totalComments
          totalMirrors
          totalPublications
          totalCollects
        }
        followModule {
          ... on FeeFollowModuleSettings {
            type
            contractAddress
            amount {
              asset {
                name
                symbol
                decimals
                address
              }
              value
            }
            recipient
          }
          ... on ProfileFollowModuleSettings {
          type
          }
          ... on RevertFollowModuleSettings {
          type
          }
        }
      }
      pageInfo {
        prev
        next
        totalCount
      }
    }
  }`

  challenge = gql`query Challenge($address: EthereumAddress!) {
    challenge(request: { address: $address }) {
      text
    }
  }`

  // authenticate
  authenticate = gql`mutation Authenticate(
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
  }`

  
  }
