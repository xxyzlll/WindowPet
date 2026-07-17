use log::{error, info};
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Debug, Serialize, Deserialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct ChatCompletionRequest {
    model: String,
    messages: Vec<ChatMessage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    temperature: Option<f32>,
    stream: bool,
}

#[derive(Debug, Deserialize)]
struct ChatCompletionResponse {
    choices: Vec<Choice>,
}

#[derive(Debug, Deserialize)]
struct Choice {
    message: ChatMessage,
}

#[tauri::command]
pub async fn chat_with_ai(
    api_key: String,
    base_url: String,
    model: String,
    message: String,
    system_prompt: String,
    pet_name: String,
) -> Result<String, String> {
    info!("Chat with AI using model: {}, pet name: {}", model, pet_name);

    if api_key.is_empty() {
        return Err("API key is not configured. Please set it in settings.".to_string());
    }

    let client = reqwest::Client::new();
    let url = format!("{}/chat/completions", base_url.trim_end_matches('/'));

    let request_body = ChatCompletionRequest {
        model,
        messages: vec![
            ChatMessage {
                role: "system".to_string(),
                content: system_prompt,
            },
            ChatMessage {
                role: "user".to_string(),
                content: message,
            },
        ],
        temperature: Some(0.7),
        stream: false,
    };

    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| {
            error!("Failed to send request to AI API: {}", e);
            format!("Network error: {}", e)
        })?;

    if !response.status().is_success() {
        let status = response.status();
        let error_body = response.text().await.unwrap_or_default();
        error!("AI API error: {} - {}", status, error_body);
        return Err(format!("API error ({}): {}", status, error_body));
    }

    let result: ChatCompletionResponse = response.json().await.map_err(|e| {
        error!("Failed to parse AI response: {}", e);
        format!("Failed to parse response: {}", e)
    })?;

    let reply = result
        .choices
        .first()
        .map(|c| c.message.content.clone())
        .unwrap_or_else(|| "No response from AI.".to_string());

    info!("AI chat completed successfully");
    Ok(reply)
}
