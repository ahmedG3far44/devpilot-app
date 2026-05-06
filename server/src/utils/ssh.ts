import { Client } from "ssh2";

import env from "./env";


const host = env.EC2_HOST;
const username = env.EC2_USER;
const password = env.EC2_SSH_PASSWORD;
const port = parseInt(env.EC2_SSH_PORT) || 22;


export const streamRemoteCommand = (
  command: string,
  onData: (chunk: string) => void,
  onClose: (closeMessage:string) => void,
  onError?: (err: Error) => void
) => {
  const conn = new Client();

  conn
    .on("ready", () => {
        onData("Connecting Server is ready....")
      conn.exec(command, (err, stream) => {
        if (err) {
          onError?.(err);
          conn.end();
          return;
        }

        stream
          .on("data", (chunk: Buffer) => onData(chunk.toString()))
          .stderr.on("data", (chunk: Buffer) => onData(`[stderr] ${chunk.toString()}`));

        stream.on("close", () => {
          onClose("Connection clonse");
          conn.end();
        });
      });
    })
    .on("error", (err) => {
      onError?.(err);
    })
    .connect({
      host,
      username,
      password,
      port,
    });
};
