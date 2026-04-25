// Offline-first sync engine — Phase 15.x build target.
//
// `push_changes` ships local pending writes (inbox captures, node
// edits) up to the SvelteKit /api/desktop/sync endpoint.
// `pull_changes` pulls deltas since `last_pulled_at`.
//
// For v1.1.0 we ship the IPC surface and stub the bodies; the
// concrete sync algorithm + conflict resolution lands in 1.1.x once
// the local SQLite schema is shipped.

use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct PushInput {
    pub session_token: String,
    pub since: Option<u64>,
}

#[derive(Debug, Serialize)]
pub struct PushResult {
    pub pushed: u32,
    pub failed: u32,
}

#[derive(Debug, Serialize)]
pub struct PullResult {
    pub pulled: u32,
    pub conflicts: Vec<String>,
    pub last_pulled_at: u64,
}

#[tauri::command]
pub async fn push_changes(_input: PushInput) -> Result<PushResult, String> {
    // TODO(phase-15.x): walk local pending tables and POST to
    // /api/desktop/sync with idempotency keys.
    Ok(PushResult { pushed: 0, failed: 0 })
}

#[tauri::command]
pub async fn pull_changes(_input: PushInput) -> Result<PullResult, String> {
    Ok(PullResult {
        pulled: 0,
        conflicts: Vec::new(),
        last_pulled_at: 0,
    })
}
