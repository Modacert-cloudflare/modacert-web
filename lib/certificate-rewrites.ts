const certificateHost = [{ type: "host" as const, value: "certificate.modacert.com" }];
const uuidPattern = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}";

export function certificateRewrites() {
  return {
    beforeFiles: [
      { source: "/", destination: "/certificate", has: certificateHost },
      { source: `/:uuid(${uuidPattern})`, destination: "/certificate?uuid=:uuid", has: certificateHost },
    ],
    afterFiles: [],
    fallback: [],
  };
}
