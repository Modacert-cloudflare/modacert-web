type ProxyContext = {
  params: Promise<{ path: string[] }>;
};

const hopByHopHeaders = new Set([
  "connection",
  "content-length",
  "expect",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

function normalizeOrigin(origin: string) {
  return origin.replace(/\/+$/, "");
}

function getOrigin(path: string[]) {
  if (path[0] === "payments") {
    return normalizeOrigin(
      process.env.PAYMENT_SERVICE_ORIGIN ||
        process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL ||
        "http://localhost:3002",
    );
  }

  return normalizeOrigin(
    process.env.USER_SERVICE_ORIGIN ||
      process.env.NEXT_PUBLIC_USER_SERVICE_URL ||
      "http://localhost:3005",
  );
}

function getProxyHeaders(request: Request) {
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!hopByHopHeaders.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  headers.set("accept-encoding", "identity");
  return headers;
}

function getResponseHeaders(response: Response) {
  const headers = new Headers();
  response.headers.forEach((value, key) => {
    if (!hopByHopHeaders.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  return headers;
}

async function getBody(request: Request) {
  if (request.method === "GET" || request.method === "HEAD") return undefined;
  const body = await request.arrayBuffer();
  return body.byteLength > 0 ? body : undefined;
}

async function proxy(request: Request, context: ProxyContext) {
  const { path } = await context.params;
  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(
    `/api/v1/${path.join("/")}${incomingUrl.search}`,
    getOrigin(path),
  );

  try {
    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers: getProxyHeaders(request),
      body: await getBody(request),
      redirect: "manual",
      cache: "no-store",
    });

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: getResponseHeaders(upstream),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to reach API service";

    return Response.json(
      {
        success: false,
        error: { message: "API proxy failed", detail: message },
      },
      { status: 502 },
    );
  }
}

export {
  proxy as DELETE,
  proxy as GET,
  proxy as HEAD,
  proxy as OPTIONS,
  proxy as PATCH,
  proxy as POST,
  proxy as PUT,
};
