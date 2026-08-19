import { MODULE_ID, SETTINGS } from "./constants";

type SettingKey = (typeof SETTINGS)[keyof typeof SETTINGS]["key"];
type SettingChangeHandlers = Partial<Record<SettingKey, (value: unknown) => void>>;

export function registerModuleSettings(onChangeHandlers: SettingChangeHandlers = {}): void {
    for (const { key, ...options } of Object.values(SETTINGS)) {
        game.settings.register(MODULE_ID, key, {
            ...options,
            onChange: onChangeHandlers[key]
        });
    }
}
