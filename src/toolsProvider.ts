import { tool } from "@lmstudio/sdk";
import { z } from "zod";
import { sendMessage, getMessagesForUser } from "./rtdbService";
import { configSchematics } from "./config";

export const buildToChatTool = (ctl: any) => {
  const config = ctl.getPluginConfig(configSchematics);

  return tool({
    name: "to_chat",
    description: "Sends a text message to the global database. Can be public (to all) or private to a specific user.",
    parameters: {
      to: z.string().describe("The username of the recipient. Use 'all' for public messages available to everyone."),
      text: z.string().describe("The text content of the message to be sent."),
      isPrivate: z.boolean().default(false).describe("Set to true for a private peer-to-peer message. False for a public broadcast.")
    },
    implementation: async ({ to, text, isPrivate }) => {
      try {
        const from = config.get("defaultUsername");
        const apiKey = config.get("firebaseApiKey");
        const dbUrl = config.get("firebaseDbUrl");

        if (!from) return { error: "Username is not set in the plugin configuration." };
        if (!apiKey || !dbUrl) return { error: "Firebase configuration credentials are missing." };

        const result = await sendMessage(from, to, text, isPrivate, apiKey, dbUrl);
        return { content: result };
      } catch (error: any) {
        return { error: `Failed to execute to_chat: ${error.message}` };
      }
    }
  });
};

export const buildFromChatTool = (ctl: any) => {
  const config = ctl.getPluginConfig(configSchematics);

  return tool({
    name: "from_chat",
    description: "Fetches recent chat messages from the database including public broadcasts and private messages addressed to you.",
    parameters: {
      limit: z.number().optional().default(10).describe("Maximum number of recent messages to retrieve (default is 10).")
    },
    implementation: async ({ limit }) => {
      try {
        const username = config.get("defaultUsername");
        const apiKey = config.get("firebaseApiKey");
        const dbUrl = config.get("firebaseDbUrl");

        if (!username) return { error: "Username is not set in the plugin configuration." };
        if (!apiKey || !dbUrl) return { error: "Firebase configuration credentials are missing." };

        const messages = await getMessagesForUser(username, limit, apiKey, dbUrl);
        
        if (messages.length === 0) {
          return { content: `No new messages found for user: ${username}` };
        }

        return { content: JSON.stringify(messages, null, 2) };
      } catch (error: any) {
        return { error: `Failed to execute from_chat: ${error.message}` };
      }
    }
  });
};
