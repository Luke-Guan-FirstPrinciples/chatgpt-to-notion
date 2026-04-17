# Setup & Installation Guide

This is a local-only build of **Chat to Notion**. It does not use the published OAuth server — instead, you supply your own Notion *internal integration token* and load the extension unpacked in your browser.

The guide below takes you from a fresh clone to a working extension with a linked Notion database in ~10 minutes.

---

## 1. Prerequisites

Install these first if you don't already have them:

| Tool | Version | Notes |
|------|---------|-------|
| [Node.js](https://nodejs.org/) | ≥ 18 | v18 or newer (tested on v25) |
| [pnpm](https://pnpm.io/installation) | ≥ 8 | `npm install -g pnpm` if missing |
| A Chromium browser | any recent | Chrome, Edge, Brave, Arc, etc. |
| A [Notion](https://notion.so) account | — | Free plan works |

Verify your toolchain:

```bash
node -v
pnpm -v
```

---

## 2. Clone & install dependencies

```bash
git clone https://github.com/L-a-r-t/chatgpt-to-notion.git
cd chatgpt-to-notion
pnpm install
```

---

## 3. Build the extension

You have two options — pick one.

### Option A — Development build (recommended while hacking)

Rebuilds automatically on file save:

```bash
pnpm dev
```

Output directory: `build/chrome-mv3-dev`

### Option B — Production build

Minified, one-shot build:

```bash
pnpm build
```

Output directory: `build/chrome-mv3-prod`

> If you want a `.zip` ready for distribution, run `pnpm package` after building.

---

## 4. Load the extension into your browser

1. Open `chrome://extensions` (or `edge://extensions`, `brave://extensions`, …).
2. Toggle **Developer mode** on (top-right corner).
3. Click **Load unpacked**.
4. Select the build folder from the previous step:
   - `build/chrome-mv3-dev` for the dev build, or
   - `build/chrome-mv3-prod` for the production build.
5. The **Chat to Notion** icon should appear in your browser toolbar. Pin it for convenience.

> When `pnpm dev` rebuilds, click the refresh icon on the extension's card in `chrome://extensions` to pick up changes.

---

## 5. Create a Notion integration

The extension talks directly to Notion's API using an *internal integration token* that you own.

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations).
2. Click **+ New integration**.
3. Fill in:
   - **Name**: e.g. `Chat to Notion (local)`
   - **Associated workspace**: the workspace you want to save chats into
   - **Type**: *Internal*
4. Under **Capabilities**, make sure these are checked:
   - Read content
   - Update content
   - Insert content
   - (Optional) Read user information — without email
5. Click **Save**, then open the integration and copy the **Internal Integration Secret**. It starts with `ntn_...` (older ones start with `secret_...`). Keep it somewhere safe — you'll paste it into the extension next.

---

## 6. Share your database(s) with the integration

Notion integrations only see pages that have been *explicitly shared* with them.

For each Notion database you want to save chats into:

1. Open the database as a full page.
2. Click the **`···`** menu in the top-right → **Connections** → **Add connections**.
3. Pick the integration you just created.
4. Make sure the database has at least one **URL**-type property (used to deduplicate saved conversations). The extension will warn you in Settings if this is missing.

---

## 7. Configure the extension

1. Click the Chat to Notion toolbar icon to open the popup.
2. Go to **Settings** (gear icon).
3. Under **Notion integration token**, paste your `ntn_...` secret and click **Save**. The token is stored locally in your browser only — it is never sent anywhere except `api.notion.com`.
4. Search for one of your databases in the search field and click it to link it.
5. Repeat for as many databases as you want. Use the star icon to mark a default.

---

## 8. Use it

- **Save a whole conversation**: open the extension popup on a supported chat page and click **Save**.
- **Save a single answer**: click the pin icon that appears under any assistant message.
- **Save history**: on supported providers (ChatGPT, Claude, Deepseek) use the history save option from the popup.

Supported providers in this build:

- ChatGPT (`chatgpt.com`, `chat.openai.com`)
- Claude (`claude.ai`)
- Deepseek (`chat.deepseek.com`)
- Mistral (`chat.mistral.ai`)

---

## Troubleshooting

**"unauthorized" / 401 / 403 when searching for a database**
The integration token is invalid, or the database hasn't been shared with the integration. Re-check steps 5 and 6.

**Databases don't appear in search**
They must be shared with the integration (step 6). Parent-page sharing propagates to children, but a newly-created child page may take a moment to become visible.

**"No URL property" error when linking a database**
Add a property of type **URL** to your Notion database and try again — the extension uses it to detect already-saved conversations.

**"Model mismatch, please refresh this conversation's tab"**
The content script hasn't re-run since you switched providers. Reload the chat page and try again.

**Extension stops working after `pnpm dev` rebuild**
Open `chrome://extensions` and click the refresh icon on the Chat to Notion card.

**Nothing happens on the chat page**
Confirm the host permission is granted: `chrome://extensions` → *Chat to Notion* → *Details* → **Site access** should include the chat provider's domain.

---

## Uninstalling

1. `chrome://extensions` → remove **Chat to Notion**.
2. (Optional) Revoke the integration at [notion.so/my-integrations](https://www.notion.so/my-integrations).
3. (Optional) Delete the repo and its `build/` + `node_modules/` directories.
