var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-qBXU3U/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// src/lib/response.ts
var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-request-id",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};
function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "content-type": "application/json", ...extra }
  });
}
__name(json, "json");
function errorJson(message, status, request_id) {
  return json({ error: message, request_id }, status, { "x-request-id": request_id });
}
__name(errorJson, "errorJson");
function newRequestId() {
  return crypto.randomUUID();
}
__name(newRequestId, "newRequestId");

// src/lib/ratelimit.ts
async function sha256Hex(input) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256Hex, "sha256Hex");
async function checkRateLimit(env, bearer) {
  if (!bearer)
    return { allowed: true, retryAfter: 0 };
  const limit = Number(env.RATE_LIMIT_PER_10S || "60");
  const now = Date.now();
  const window = 1e4;
  const id = (await sha256Hex(bearer)).slice(0, 24);
  const key = `rl:${id}`;
  const raw = await env.RL.get(key);
  let hits = raw ? JSON.parse(raw) : [];
  hits = hits.filter((t) => now - t < window);
  if (hits.length >= limit) {
    const retryAfter = Math.ceil((window - (now - hits[0])) / 1e3);
    return { allowed: false, retryAfter: Math.max(retryAfter, 1) };
  }
  hits.push(now);
  await env.RL.put(key, JSON.stringify(hits), { expirationTtl: 60 });
  return { allowed: true, retryAfter: 0 };
}
__name(checkRateLimit, "checkRateLimit");

// src/lib/proxy.ts
async function forward(env, fnName, req, init = {}, requestId) {
  const method = init.method || req.method;
  const search = init.search ?? new URL(req.url).search;
  const url = `${env.SUPABASE_FUNCTIONS_URL}/${fnName}${search}`;
  const headers = new Headers();
  const auth = req.headers.get("authorization");
  if (auth)
    headers.set("authorization", auth);
  headers.set("apikey", env.SUPABASE_ANON_KEY);
  headers.set("x-request-id", requestId);
  const ct = req.headers.get("content-type");
  if (ct)
    headers.set("content-type", ct);
  const body = init.body !== void 0 ? init.body : method === "GET" || method === "HEAD" ? null : await req.arrayBuffer();
  const upstream = await fetch(url, { method, headers, body });
  const respHeaders = new Headers(CORS);
  respHeaders.set("x-request-id", requestId);
  const upCt = upstream.headers.get("content-type");
  if (upCt)
    respHeaders.set("content-type", upCt);
  return new Response(upstream.body, { status: upstream.status, headers: respHeaders });
}
__name(forward, "forward");

// src/index.ts
var src_default = {
  async fetch(req, env) {
    const requestId = req.headers.get("x-request-id") || newRequestId();
    if (req.method === "OPTIONS")
      return new Response("ok", { headers: CORS });
    const url = new URL(req.url);
    const path = url.pathname;
    if (path === "/v1/health") {
      return json({ ok: true, service: "webrabbit-api", request_id: requestId }, 200, { "x-request-id": requestId });
    }
    const authHeader = req.headers.get("authorization");
    const bearer = authHeader?.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : null;
    const rl = await checkRateLimit(env, bearer);
    if (!rl.allowed) {
      return errorJson("Rate limit exceeded", 429, requestId);
    }
    try {
      if (req.method === "POST" && path === "/v1/collect/momo") {
        return await forward(env, "collect-momo", req, {}, requestId);
      }
      if (req.method === "POST" && path === "/v1/collect/card") {
        return await forward(env, "collect-card", req, {}, requestId);
      }
      if (req.method === "POST" && path === "/v1/payout/momo") {
        return await forward(env, "payout-momo", req, {}, requestId);
      }
      const txnMatch = path.match(/^\/v1\/transactions\/([^/]+)$/);
      if (req.method === "GET" && txnMatch) {
        const id = txnMatch[1];
        return await forward(env, "transaction-status", req, { search: `?transaction_id=${encodeURIComponent(id)}` }, requestId);
      }
      if (req.method === "GET" && path === "/v1/transactions") {
        return await forward(env, "list-transactions", req, {}, requestId);
      }
      return errorJson("not_found", 404, requestId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "internal_error";
      return errorJson(msg, 500, requestId);
    }
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-qBXU3U/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-qBXU3U/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
