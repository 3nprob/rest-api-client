import {
  ClientOptions,
  IStoreService,
  PublicResults,
  MethodResults,
  ChannelProviderConfig,
  NodeResponses,
  PublicParams,
} from "@connext/types";

export interface InitClientManagerOptions {
  logger: any;
  mnemonic?: string;
  store: IStoreService;
}
export interface ConnectOptions extends ClientOptions {
  mnemonic: string;
  network?: string;
}

export interface PersistedData {
  mnemonic: string | undefined;
  subscriptions: EventSubscription[] | undefined;
  initOptions: Partial<ConnectOptions> | undefined;
}

export interface GenericErrorResponse {
  message: string;
}
export interface GenericSuccessResponse {
  success: true;
}

export interface GetBalanceRequestParams {
  assetId: string;
}
export interface GetBalanceResponse {
  freeBalanceOffChain: string;
  freeBalanceOnChain: string;
}

export interface GetVersionResponse {
  version: string;
}

export interface BatchSubscriptionResponse {
  subscriptions: EventSubscription[];
}
export interface SubscriptionResponse {
  id: string;
}

export type EventSubscription = { id: string; params: EventSubscriptionParams };
export type EventSubscriptionParams = { event: string; webhook: string };

export type GetAppInstanceDetailsParams = { appIdentityHash: string };
export type GetAppInstanceDetailsResponse = MethodResults.GetAppInstanceDetails;

export type GetConfigResponse = Partial<ChannelProviderConfig>;

export type GetHashLockStatusRequestParams = { lockHash: string; assetId: string };
export type GetHashLockStatusResponse = NodeResponses.GetHashLockTransfer & { paymentId: string };

export type GetLinkedStatusRequestParams = { paymentId: string };
export type GetLinkedStatusResponse = NodeResponses.GetLinkedTransfer;

export type GetTransferHistory = NodeResponses.GetTransferHistory;

export type PostDepositRequestParams = PublicParams.Deposit;

export type PostHashLockTransferRequestParams = PublicParams.HashLockTransfer;
export interface PostHashLockTransferResponse
  extends PublicResults.ConditionalTransfer,
    MethodResults.GetAppInstanceDetails {}

export type PostHashLockResolveRequestParams = PublicParams.ResolveHashLockTransfer;
export type PostHashLockResolveResponse = PublicResults.ResolveHashLockTransfer;

export type PostLinkedTransferRequestParams = PublicParams.LinkedTransfer;
export interface PostLinkedTransferResponse
  extends PublicResults.ConditionalTransfer,
    MethodResults.GetAppInstanceDetails {}

export type PostLinkedResolveRequestParams = PublicParams.ResolveLinkedTransfer;
export type PostLinkedResolveResponse = PublicResults.ResolveLinkedTransfer;

export type PostMnemonicRequestParams = { mnemonic: string };

export type PostTransactionRequestParams = { amount: string; assetId: string; recipient: string };
export interface PostTransactionResponse {
  txhash: string;
}

export type PostWithdrawRequestParams = PublicParams.Withdraw;
export type PostWithdrawResponse = { txhash: string };

export type PostSwapRequestParams = PublicParams.Swap;
export type PostSwapResponse = { fromAssetIdBalance: string; toAssetIdBalance: string };
