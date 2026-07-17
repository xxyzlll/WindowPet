import { Select, TextInput, PasswordInput, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { handleSettingChange } from "../../utils/handleSettingChange";
import { useSettingStore } from "../../hooks/useSettingStore";
import { memo } from "react";
import { IconRobot, IconKey, IconLink, IconBrain } from "@tabler/icons-react";
import { DispatchType } from "../../types/IEvents";

function AISettings() {
    const { t } = useTranslation();
    const { aiProvider, deepseekApiKey, deepseekBaseUrl, deepseekModel } = useSettingStore();

    return (
        <Stack>
            <Select
                leftSection={<IconRobot size="1rem" />}
                allowDeselect={false}
                checkIconPosition={"right"}
                my={"sm"}
                label={t("AI Provider")}
                description={t("Choose the AI service provider")}
                placeholder="Pick one"
                data={[
                    { value: "deepseek", label: "DeepSeek" },
                ]}
                value={aiProvider}
                onChange={(value) => handleSettingChange(DispatchType.ChangeAiProvider, value as string)}
            />

            {aiProvider === "deepseek" && (
                <>
                    <PasswordInput
                        leftSection={<IconKey size="1rem" />}
                        my={"sm"}
                        label={t("DeepSeek API Key")}
                        description={t("Your DeepSeek API key for AI chat functionality")}
                        placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                        value={deepseekApiKey}
                        onChange={(e) => handleSettingChange(DispatchType.ChangeDeepseekApiKey, e.currentTarget.value)}
                    />

                    <TextInput
                        leftSection={<IconLink size="1rem" />}
                        my={"sm"}
                        label={t("API Base URL")}
                        description={t("The base URL for the DeepSeek API")}
                        placeholder="https://api.deepseek.com"
                        value={deepseekBaseUrl}
                        onChange={(e) => handleSettingChange(DispatchType.ChangeDeepseekBaseUrl, e.currentTarget.value)}
                    />

                    <Select
                        leftSection={<IconBrain size="1rem" />}
                        allowDeselect={false}
                        checkIconPosition={"right"}
                        my={"sm"}
                        label={t("Model")}
                        description={t("Choose the AI model to use for chat")}
                        placeholder="Pick one"
                        data={[
                            { value: "deepseek-chat", label: "deepseek-chat" },
                            { value: "deepseek-reasoner", label: "deepseek-reasoner" },
                        ]}
                        value={deepseekModel}
                        onChange={(value) => handleSettingChange(DispatchType.ChangeDeepseekModel, value as string)}
                    />
                </>
            )}

            <Text size="xs" c="dimmed" mt="md">
                {t("Tip: Triple-click on any pet to open the chat input and start a conversation with AI.")}
            </Text>
        </Stack>
    )
}

export default memo(AISettings);
