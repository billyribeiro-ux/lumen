use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

#[derive(Debug, Deserialize)]
pub struct QuickCaptureInput {
    pub body: String,
    pub source_url: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct QuickCaptureResult {
    pub queued: bool,
    pub capture_token: String,
}

/// Receive a quick-capture from the renderer (the small ⌥Space window),
/// stash it locally for the sync engine, and return an idempotency token.
///
/// The web layer's /api/inbox endpoint uses the same `capture_token`
/// when the sync engine ships the row to Neon — preventing dupes from
/// retries.
#[tauri::command]
pub async fn submit_capture(
    app: AppHandle,
    input: QuickCaptureInput,
) -> Result<QuickCaptureResult, String> {
    let token = format!(
        "desktop-{}-{}",
        chrono_timestamp(),
        rand_token(8),
    );

    // TODO(phase-15.x): persist into the local SQLite store under
    // `inbox_pending(capture_token, body, source_url, created_at)` and
    // wake the sync engine via a tokio channel.

    // For now, emit so the renderer can optimistically display.
    let _ = app.emit(
        "lumen:capture-queued",
        serde_json::json!({
            "captureToken": token,
            "body": input.body,
            "sourceUrl": input.source_url,
        }),
    );

    Ok(QuickCaptureResult {
        queued: true,
        capture_token: token,
    })
}

fn chrono_timestamp() -> u64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn rand_token(len: usize) -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let seed = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.subsec_nanos())
        .unwrap_or(0);
    let mut state = seed as u64;
    let chars: &[u8] = b"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let mut out = String::with_capacity(len);
    for _ in 0..len {
        state = state.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
        out.push(chars[(state >> 33) as usize % chars.len()] as char);
    }
    out
}
