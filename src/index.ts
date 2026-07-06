import { type PluginContext } from "@lmstudio/sdk";
import { configSchematics } from "./config";
import { buildToChatTool, buildFromChatTool } from "./toolsProvider";

export function main(context: PluginContext) {
  context.withConfigSchematics(configSchematics);

  // Регистрируем инструменты через ctl
  context.withToolsProvider(async (ctl: any) => {
    const toChatTool = buildToChatTool(ctl);
    const fromChatTool = buildFromChatTool(ctl);
    
    return [toChatTool, fromChatTool].filter(Boolean);
  });
}

// 2. double as default экспорт на случай, если другие части SDK ищут его
export default main;
