import fastify, { RequestGenericInterface } from "fastify";
import Helmet from "fastify-helmet";
// import Swagger from "fastify-swagger";

import pkg from "../package.json";

import defaultConfig from "./config";
import Client from "./client";
import {
  requireParam,
  isNotIncluded,
  getRandomMnemonic,
  AppConfig,
  BatchSubscriptionResponse,
  EventSubscriptionParams,
  GenericErrorResponse,
  GenericSuccessResponse,
  GetAppInstanceDetailsParams,
  GetAppInstanceDetailsResponse,
  GetBalanceRequestParams,
  GetBalanceResponse,
  GetConfigResponse,
  GetHashLockStatusRequestParams,
  GetHashLockStatusResponse,
  GetLinkedStatusRequestParams,
  GetLinkedStatusResponse,
  GetTransferHistory,
  GetVersionResponse,
  InitOptions,
  PostDepositRequestParams,
  PostHashLockResolveRequestParams,
  PostHashLockResolveResponse,
  PostHashLockTransferRequestParams,
  PostHashLockTransferResponse,
  PostLinkedResolveRequestParams,
  PostLinkedResolveResponse,
  PostLinkedTransferRequestParams,
  PostLinkedTransferResponse,
  PostMnemonicRequestParams,
  PostSwapRequestParams,
  PostSwapResponse,
  PostTransactionRequestParams,
  PostTransactionResponse,
  PostWithdrawRequestParams,
  PostWithdrawResponse,
  SubscriptionResponse,
} from "./helpers";

export async function initApp(_config?: Partial<AppConfig>) {
  const config = { ...defaultConfig, ..._config };
  const app = fastify({
    logger: { prettyPrint: config.debug } as any,
    disableRequestLogging: true,
  });

  const client = await Client.init(app.log, config);
  app.register(Helmet);

  // app.register(Swagger);

  const loggingBlacklist = ["/balance"];

  app.addHook("onRequest", (req, reply, done) => {
    if (config.debug && req.url) {
      if (isNotIncluded(req.url, loggingBlacklist)) {
        req.log.info({ url: req.url, id: req.id }, "received request");
      }
    }
    done();
  });

  app.addHook("onResponse", (req, reply, done) => {
    if (config.debug && req.url) {
      if (isNotIncluded(req.url, loggingBlacklist)) {
        req.log.info({ url: req.url, statusCode: reply.statusCode }, "request completed");
      }
    }
    done();
  });

  // -- GET ---------------------------------------------------------------- //

  app.get("/health", (req, res) => {
    res.status(204).send<void>();
  });

  app.get("/hello", (req, res) => {
    res.status(200).send<string>(`Hello World, this is Connext client`);
  });

  app.get("/version", (req, res) => {
    try {
      res.status(200).send<GetVersionResponse>({ version: pkg.version });
    } catch (error) {
      app.log.error(error);
      res.status(500).send<GenericErrorResponse>({ message: error.message });
    }
  });

  interface GetBalanceRequest extends RequestGenericInterface {
    Params: GetBalanceRequestParams;
  }

  app.get<GetBalanceRequest>("/balance/:assetId", async (req, res) => {
    try {
      await requireParam(req.params, "assetId");
      res.status(200).send<GetBalanceResponse>(await client.balance(req.params.assetId));
    } catch (error) {
      app.log.error(error);
      res.status(500).send<GenericErrorResponse>({ message: error.message });
    }
  });

  app.get("/config", async (req, res) => {
    try {
      res.status(200).send<GetConfigResponse>(await client.getConfig());
    } catch (error) {
      app.log.error(error);
      res.status(500).send<GenericErrorResponse>({ message: error.message });
    }
  });

  interface GetHashLockStatusRequest extends RequestGenericInterface {
    Params: GetHashLockStatusRequestParams;
  }

  app.get<GetHashLockStatusRequest>("/hashlock-status/:lockHash/:assetId", async (req, res) => {
    try {
      await requireParam(req.params, "lockHash");
      await requireParam(req.params, "assetId");
      const { lockHash, assetId } = req.params;
      res
        .status(200)
        .send<GetHashLockStatusResponse>(await client.hashLockStatus(lockHash, assetId));
    } catch (error) {
      app.log.error(error);
      res.status(500).send<GenericErrorResponse>({ message: error.message });
    }
  });

  interface GetLinkedStatusRequest extends RequestGenericInterface {
    Params: GetLinkedStatusRequestParams;
  }

  app.get<GetLinkedStatusRequest>("/linked-status/:paymentId", async (req, res) => {
    try {
      await requireParam(req.params, "paymentId");
      const { paymentId } = req.params;
      res.status(200).send<GetLinkedStatusResponse>(await client.linkedStatus(paymentId));
    } catch (error) {
      app.log.error(error);
      res.status(500).send<GenericErrorResponse>({ message: error.message });
    }
  });

  interface GetAppInstanceDetailsRequest extends RequestGenericInterface {
    Params: GetAppInstanceDetailsParams;
  }

  app.get<GetAppInstanceDetailsRequest>(
    "/appinstance-details/:appIdentityHash",
    async (req, res) => {
      try {
        await requireParam(req.params, "appIdentityHash");
        res
          .status(200)
          .send<GetAppInstanceDetailsResponse>(
            await client.getAppInstanceDetails(req.params.appIdentityHash),
          );
      } catch (error) {
        app.log.error(error);
        res.status(500).send<GenericErrorResponse>({ message: error.message });
      }
    },
  );

  app.get("/transfer-history", async (req, res) => {
    try {
      res.status(200).send<GetTransferHistory>(await client.getTransferHistory());
    } catch (error) {
      app.log.error(error);
      res.status(500).send<GenericErrorResponse>({ message: error.message });
    }
  });

  // -- POST ---------------------------------------------------------------- //

  interface PostCreateRequest extends RequestGenericInterface {
    Body: Partial<InitOptions>;
  }

  app.post<PostCreateRequest>("/create", async (req, res) => {
    try {
      const opts = { ...req.body };
      if (!client.mnemonic || !opts.mnemonic) {
        opts.mnemonic = getRandomMnemonic();
      }
      await client.initClient(opts);
      res.status(200).send<GetConfigResponse>(await client.getConfig());
    } catch (error) {
      app.log.error(error);
      res.status(500).send<GenericErrorResponse>({ message: error.message });
    }
  });

  interface PostConnectRequest extends RequestGenericInterface {
    Body: Partial<InitOptions>;
  }

  app.post<PostConnectRequest>("/connect", async (req, res) => {
    try {
      if (!client.mnemonic) {
        await requireParam(req.body, "mnemonic");
      }
      await client.initClient(req.body);
      const config = await client.getConfig();
      res.status(200).send<GetConfigResponse>(config);
    } catch (error) {
      app.log.error(error);
      res.status(500).send<GenericErrorResponse>({ message: error.message });
    }
  });

  interface PostMnemonicRequest extends RequestGenericInterface {
    Body: PostMnemonicRequestParams;
  }

  app.post<PostMnemonicRequest>("/mnemonic", async (req, res) => {
    try {
      await requireParam(req.body, "mnemonic");
      await client.setMnemonic(req.body.mnemonic);
      res.status(200).send<GenericSuccessResponse>({ success: true });
    } catch (error) {
      app.log.error(error);
      res.status(500).send<GenericErrorResponse>({ message: error.message });
    }
  });

  interface PostTransactionRequest extends RequestGenericInterface {
    Body: PostTransactionRequestParams;
  }

  app.post<PostTransactionRequest>("/onchain-transfer", async (req, res) => {
    try {
      await requireParam(req.body, "amount");
      await requireParam(req.body, "assetId");
      await requireParam(req.body, "recipient");
      res.status(200).send<PostTransactionResponse>(await client.transferOnChain(req.body));
    } catch (error) {
      app.log.error(error);
      res.status(500).send<GenericErrorResponse>({ message: error.message });
    }
  });

  interface PostHashLockTransferRequest extends RequestGenericInterface {
    Body: PostHashLockTransferRequestParams;
  }

  app.post<PostHashLockTransferRequest>("/hashlock-transfer", async (req, res) => {
    try {
      await requireParam(req.body, "amount");
      await requireParam(req.body, "assetId");
      await requireParam(req.body, "lockHash");
      await requireParam(req.body, "timelock");
      await requireParam(req.body, "recipient");
      res.status(200).send<PostHashLockTransferResponse>(await client.hashLockTransfer(req.body));
    } catch (error) {
      app.log.error(error);
      res.status(500).send<GenericErrorResponse>({ message: error.message });
    }
  });

  interface PostHashLockResolveRequest extends RequestGenericInterface {
    Body: PostHashLockResolveRequestParams;
  }

  app.post<PostHashLockResolveRequest>("/hashlock-resolve", async (req, res) => {
    try {
      await requireParam(req.body, "preImage");
      await requireParam(req.body, "assetId");
      res.status(200).send<PostHashLockResolveResponse>(await client.hashLockResolve(req.body));
    } catch (error) {
      app.log.error(error);
      res.status(500).send<GenericErrorResponse>({ message: error.message });
    }
  });

  interface PostLinkedTransferRequest extends RequestGenericInterface {
    Body: PostLinkedTransferRequestParams;
  }

  app.post<PostLinkedTransferRequest>("/linked-transfer", async (req, res) => {
    try {
      await requireParam(req.body, "amount");
      await requireParam(req.body, "assetId");
      await requireParam(req.body, "preImage");
      res.status(200).send<PostLinkedTransferResponse>(await client.linkedTransfer(req.body));
    } catch (error) {
      app.log.error(error);
      res.status(500).send<GenericErrorResponse>({ message: error.message });
    }
  });

  interface PostLinkedResolveRequest extends RequestGenericInterface {
    Body: PostLinkedResolveRequestParams;
  }

  app.post<PostLinkedResolveRequest>("/linked-resolve", async (req, res) => {
    try {
      await requireParam(req.body, "preImage");
      await requireParam(req.body, "paymentId");
      res.status(200).send<PostLinkedResolveResponse>(await client.linkedResolve(req.body));
    } catch (error) {
      app.log.error(error);
      res.status(500).send<GenericErrorResponse>({ message: error.message });
    }
  });

  interface PostDepositRequest extends RequestGenericInterface {
    Body: PostDepositRequestParams;
  }

  app.post<PostDepositRequest>("/deposit", async (req, res) => {
    try {
      await requireParam(req.body, "amount");
      await requireParam(req.body, "assetId");
      res.status(200).send<GetBalanceResponse>(await client.deposit(req.body));
    } catch (error) {
      app.log.error(error);
      res.status(500).send<GenericErrorResponse>({ message: error.message });
    }
  });

  interface PostSwapRequest extends RequestGenericInterface {
    Body: PostSwapRequestParams;
  }

  app.post<PostSwapRequest>("/swap", async (req, res) => {
    try {
      await requireParam(req.body, "amount");
      await requireParam(req.body, "fromAssetId");
      await requireParam(req.body, "swapRate");
      await requireParam(req.body, "toAssetId");
      res.status(200).send<PostSwapResponse>(await client.swap(req.body));
    } catch (error) {
      app.log.error(error);
      res.status(500).send<GenericErrorResponse>({ message: error.message });
    }
  });

  interface PostWithdrawRequest extends RequestGenericInterface {
    Body: PostWithdrawRequestParams;
  }

  app.post<PostWithdrawRequest>("/withdraw", async (req, res) => {
    try {
      await requireParam(req.body, "amount");
      res.status(200).send<PostWithdrawResponse>(await client.withdraw(req.body));
    } catch (error) {
      app.log.error(error);
      res.status(500).send<GenericErrorResponse>({ message: error.message });
    }
  });

  interface PostSubscribeRequest extends RequestGenericInterface {
    Body: EventSubscriptionParams;
  }

  app.post<PostSubscribeRequest>("/subscribe", async (req, res) => {
    try {
      await requireParam(req.body, "event");
      await requireParam(req.body, "webhook");
      res.status(200).send<SubscriptionResponse>(await client.subscribe(req.body));
    } catch (error) {
      app.log.error(error);
      res.status(500).send<GenericErrorResponse>({ message: error.message });
    }
  });

  interface PostBatchSubscribeRequest extends RequestGenericInterface {
    Body: {
      params: EventSubscriptionParams[];
    };
  }

  app.post<PostBatchSubscribeRequest>("/subscribe/batch", async (req, res) => {
    try {
      await requireParam(req.body, "params", "array");
      res.status(200).send<BatchSubscriptionResponse>(await client.subscribeBatch(req.body.params));
    } catch (error) {
      app.log.error(error);
      res.status(500).send<GenericErrorResponse>({ message: error.message });
    }
  });

  // -- DELETE ---------------------------------------------------------------- //

  interface DeleteSubscribeRequest extends RequestGenericInterface {
    Body: {
      id: string;
    };
  }

  app.delete<DeleteSubscribeRequest>("/subscribe", async (req, res) => {
    try {
      await requireParam(req.body, "id");
      res.status(200).send<GenericSuccessResponse>(await client.unsubscribe(req.body.id));
    } catch (error) {
      app.log.error(error);
      res.status(500).send<GenericErrorResponse>({ message: error.message });
    }
  });

  interface DeleteBatchSubscribeRequest extends RequestGenericInterface {
    Body: {
      ids: string[];
    };
  }

  app.delete<DeleteBatchSubscribeRequest>("/subscribe/batch", async (req, res) => {
    try {
      await requireParam(req.body, "ids", "array");
      res.status(200).send<GenericSuccessResponse>(await client.unsubscribeBatch(req.body.ids));
    } catch (error) {
      app.log.error(error);
      res.status(500).send<GenericErrorResponse>({ message: error.message });
    }
  });

  app.delete("/subscribe/all", async (req, res) => {
    try {
      res.status(200).send<GenericSuccessResponse>(await client.unsubscribeAll());
    } catch (error) {
      app.log.error(error);
      res.status(500).send<GenericErrorResponse>({ message: error.message });
    }
  });

  return { app, config };
}