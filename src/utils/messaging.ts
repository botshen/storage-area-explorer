import { defineExtensionMessaging } from "@webext-core/messaging";

interface ProtocolMap {
  sendToDevPanel: (data: any) => void;
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<ProtocolMap>();
