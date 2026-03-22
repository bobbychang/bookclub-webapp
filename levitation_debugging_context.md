# Levitation Client Debugging Context

This file contains the debugging history and attempted fixes for the `levitation-client` (v0.3.6) running on Windows. The goal is to provide context for a new agent taking over this specific issue so we can resume work on the main Next.js webapp.

## Primary Issue: The Connect/Disconnect Loop
The user successfully starts a remote session from their mobile browser (connecting to the Windows `levitation-client` daemon). However, **when the user sends a query**, the mobile UI enters an infinite loop of connecting and disconnecting.

## Previous Blockers & Applied Fixes

### 1. Windows `lsof` Crash (Resolved)
**Problem:** The `levitation-client` relies on the Unix `lsof` command in `getLanguageServerProcesses()` (inside `node_modules/levitation-client/dist/commands.js`) to enumerate active workspaces. On Windows, this threw an exception and crashed the client.
**Fix Applied:** We patched `commands.js` to use `netstat -ano | findstr LISTEN` and `wmic process get commandline` for `win32` platforms to identify `language_server` processes and extract their `--csrf_token`.
**Current Status:** Workspace enumeration works correctly. The client no longer crashes on startup.

### 2. Event Loop Blocking (Attempted Fix)
**Hypothesis:** We noticed a flood of `EnumerateWorkspacesRequest` logs. We suspected the synchronous `execSync('wmic ...')` call was blocking the Node event loop, causing WebSocket ping/pong timeouts and triggering the reconnect loop.
**Fix Applied:** Added a 30-second global caching layer (`global._levitationCachedProcesses`) to the Windows fetcher so that rapid consecutive calls return immediately without shelling out.
**Current Status:** The client restarts successfully, but the infinite connect/disconnect loop still occurs on the mobile browser upon sending a query.

### 3. Massive Trajectory JSON Formats (Attempted Fix)
**Hypothesis:** When the user sends a query, the Levitation UI requests `GetCascadeTrajectory`. For our large conversational agent, this JSON payload was over 8MB (containing massive system prompts, tool call histories, and conversation logs). This oversized frame might be crashing the mobile browser's WebSocket proxy or hitting a frame size limit, causing an automatic socket drop and UI reload.
**Fix Applied:** We patched `GetCascadeTrajectoryData` (in `commands.js`) to strip out `step.plannerResponse.promptSections`, `conversationHistory`, and `ephemeralMessage` before returning the array to the client.
**Current Status:** Despite significantly reducing the payload size, the user reported the connect/disconnect loop is still happening as of the latest test.

## Next Steps for the New Agent
1. **Analyze Phone/Browser Logs:** Determine if the mobile browser console shows specific WebSocket closure codes (e.g., 1006, 1009 Frame Too Large) or internal Levitation React exceptions.
2. **Review `commands.js` Error Handling:** Ensure our custom `wmic` and truncation hacks aren't silently throwing a TypeError that causes `GetCascadeTrajectoryData` or `HandleCascadeUserInteractionData` to return an invalid format.
3. **Verify Port Mappings:** The `netstat` script currently returns *all* ports bound by the `language_server` PID on `127.0.0.1` (including gRPC and debug ports). `GetWorkspaceInfosData` blindly POSTs to all of them, which might cause hang-ups or fatal socket errors. The Linux `lsof` implementation does the same, but Windows behavior might differ.
