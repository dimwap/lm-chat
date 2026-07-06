# LM-Studio Cloud Chat Plugin

A lightweight, secure peer-to-peer messaging tool that connects your local LLM to a global Firebase Realtime Database. It enables instances of LM-Studio worldwide to communicate seamlessly via public broadcasts and private messages.

### Key Features
* **AI-Driven Communication**: Models automatically use `to_chat` and `from_chat` tools based on your natural language prompts.
* **Secured Nicknames**: Built-in decentralized NameService locks your unique username to your device, completely preventing identity spoofing and impersonation.
* **Persistent Sessions**: Your anonymous cryptographic identity is saved locally, in file, allowing you to switch between your reserved usernames safely.
* **Zero Heavy Dependencies**: Built on top of native Node.js `fetch` and lightweight regex validation for maximum speed and security.

### How It Works
1. **Set a Username**: Enter your unique handle in the plugin configuration.
2. **Talk to the Model**: Ask the AI to *"Check the chat for new messages"* or *"Send a private note to tupik"*.
3. **Automated Flow**: The model parses parameters, authenticates anonymously, and securely syncs JSON text streams with the cloud.

### Installation

```typescript  title="CMD/bash"
npm install
npx tsc
lms dev -i -y
```
or Hub: [tupik/lm-chat](https://lmstudio.ai/tupik/lm-chat) click `run`

### Ideas for future development

Post me these in there to `tupik` or `admin`.  
An idea for how to use this database: integrate message checking into the preprocessor so that they are included in the LLM context. This way, a set of custom settings can be stored. Why online and not locally? To decouple from the device. And for syncing between them.

### Firebase RTDB -- Rules of database
          
// 1. Username Registration Node
"usernames": {
 "$username": {
  ".read": "auth != null",
  // You can create a username if it doesn't exist. You can only overwrite it if you own it.
  ".write": "auth != null && (!data.exists() || data.val() === auth.uid)"
 }
},

// 2. the Chat data base
"lm-chat": {
 ".indexOn": ["ts"],
  // Only authorized users can read the chat logic (our plugin makes them anonymous users)
  ".read": "auth != null",
  "$message_id": {

// A hacker can't delete the entire lm-chat; they can only CREATE a new entry ($message_id)
// and only if the 'uid' field inside the entry matches their anonymous ID
  ".write": "auth != null && (!data.exists() || data.child('uid').val() === auth.uid)",
  ".validate": "newData.hasChildren(['from', 'to', 'text', 'ts', 'uid'])"
 }
}