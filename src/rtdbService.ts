//src/rtdbService.ts
import * as fs from 'fs';
import * as path from 'path';

interface ChatMessage {
  from: string;
  to: string;
  text: string;
  isPrivate: boolean;
  ts: number;       // Unix timestamp
  dateTime: string; // date-time string for LLM (not Unix timestamp number)
  uid: string;
}

interface StoredSession {
  localId: string;
  refreshToken: string;
}

const SESSION_FILE = path.join(__dirname, '..', 'firebase_session.json');

async function getStableAuthToken(apiKey: string): Promise<{ idToken: string; localId: string }> {
  if (fs.existsSync(SESSION_FILE)) {
    try {
      const sessionData = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8')) as StoredSession;
      const refreshUrl = `https://securetoken.googleapis.com/v1/token?key=${apiKey}`;
      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: sessionData.refreshToken
        })
      });

      if (response.ok) {
        const data = await response.json() as any;
        return {
          idToken: data.id_token,
          localId: data.user_id
        };
      }
    } catch (e) {
      // Fallback to generating a new session if file is corrupted
    }
  }

  const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
  const response = await fetch(signUpUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnSecureToken: true })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Authentication failed: ${response.status}`);
  }

  const data = await response.json() as any;
  const newSession: StoredSession = {
    localId: data.localId,
    refreshToken: data.refreshToken
  };
  fs.writeFileSync(SESSION_FILE, JSON.stringify(newSession, null, 2), 'utf8');

  return {
    idToken: data.idToken,
    localId: data.localId
  };
}

async function registerUsernameIfAvailable(username: string, uid: string, idToken: string, dbUrl: string): Promise<boolean> {
  const cleanDbUrl = dbUrl.endsWith('/') ? dbUrl.slice(0, -1) : dbUrl;
  const checkUrl = `${cleanDbUrl}/usernames/${username}.json?auth=${idToken}`;
  
  const checkResponse = await fetch(checkUrl);
  const existingUid = await checkResponse.json();

  if (!existingUid || existingUid === uid) {
    await fetch(checkUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(uid)
    });
    return true;
  }
  return false;
}

export async function sendMessage(fromConfig: string, to: string, text: string, isPrivate: boolean, apiKey: string, dbUrl: string): Promise<string> {
  const finalUsername = fromConfig ? fromConfig.trim().toLowerCase() : "";
  const finalTo = to ? to.trim().toLowerCase() : "all";
  
  if (!finalUsername) {
    throw new Error("Username cannot be empty. Please set a unique username in settings.");
  }

  const usernameRegex = /^[a-z0-9_-]{3,20}$/;
  if (!usernameRegex.test(finalUsername)) {
    throw new Error("Invalid username format. Only a-z, 0-9, - and _ are allowed (3-20 chars).");
  }

  if (finalTo !== "all" && !usernameRegex.test(finalTo)) {
    throw new Error("Invalid recipient username format.");
  }

  const { idToken, localId } = await getStableAuthToken(apiKey);

  const isRegistered = await registerUsernameIfAvailable(finalUsername, localId, idToken, dbUrl);
  if (!isRegistered) {
    throw new Error(`The username "${finalUsername}" is already taken by another person.`);
  }

  const now = Date.now();
  const messageData: ChatMessage = {
    from: finalUsername,
    to: isPrivate ? finalTo : 'all',
    text,
    isPrivate,
    ts: now,
    dateTime: new Date(now).toISOString().replace('T', ' ').substring(0, 19),
    uid: localId
  };

  const cleanDbUrl = dbUrl.endsWith('/') ? dbUrl.slice(0, -1) : dbUrl;
  const url = `${cleanDbUrl}/lm-chat.json?auth=${idToken}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messageData)
  });

  if (!response.ok) {
    throw new Error("Database write rejected. Security rules verification failed.");
  }

  return `Success: Message from ${finalUsername} securely stored.`;
}

export async function getMessagesForUser(configUsername: string, limit: number, apiKey: string, dbUrl: string): Promise<ChatMessage[]> {
  const finalUsername = configUsername ? configUsername.trim().toLowerCase() : "";
  
  if (!finalUsername) {
    throw new Error("Cannot fetch messages because your username is empty.");
  }

  const usernameRegex = /^[a-z0-9_-]{3,20}$/;
  if (!usernameRegex.test(finalUsername)) {
    throw new Error("Invalid username format in configuration settings.");
  }

  const { idToken } = await getStableAuthToken(apiKey);

  const cleanDbUrl = dbUrl.endsWith('/') ? dbUrl.slice(0, -1) : dbUrl;
  const url = `${cleanDbUrl}/lm-chat.json?auth=${idToken}&orderBy="ts"&limitToLast=${limit}`;

  const response = await fetch(url);
  const data = await response.json() as Record<string, ChatMessage> | null;
  if (!data) return [];

  const allMessages = Object.values(data);
  return allMessages.filter(msg => 
    !msg.isPrivate || 
    msg.to === finalUsername || 
    msg.from === finalUsername
  );
}
