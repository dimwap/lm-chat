import { createConfigSchematics } from "@lmstudio/sdk";

export const configSchematics = createConfigSchematics()
  .field(
// any text field
    "place-holder",
    "string",
    {
      displayName: "Just text / ---",
      subtitle: "--- / Not yet / --- \n These keys might become invalid \n Use your own",
      nonConfigurable: true
    },
    "Not yet"
  )
// a Nickname for the chat
  .field(
    "defaultUsername",
    "string",
    {
      displayName: "Nickname (Username)",
      subtitle: "name for chat / from / to / username",
      placeholder: "enter your alias (for Example, Alex)"
    },
    ""  //User_" + Math.floor(Math.random() * 1000) // random,  User_497
  )
  // Public Web API Key of Firebase
  .field(
    "firebaseApiKey",
    "string",
    {
      displayName: "Firebase API Key:",
      subtitle: "Public key Firebase (anonymous id auth)",
      placeholder: "insert a key AIzaSy..."
    },
    "AIzaSyBsK7vU5WlGgoiPx7Scb_myXqowTxoTsFQ" // <-- YOUR KEY     -- this is my key -- I can revoke this key at any time.
  )
  // URL of yours Realtime Database
  .field(
    "firebaseDbUrl",
    "string",
    {
      displayName: "Firebase Database URL:",
      subtitle: "URL of RTDB (endpoint)",
      placeholder: "https://...-rtdb.firebaseio.com"
    },
    "https://gitchat-2b675-default-rtdb.firebaseio.com" // <-- YOUR RTDB LINK
  )
  .build();

//const API_KEY = "AIzaSyBsK7vU5WlGgoiPx7Scb_myXqowTxoTsFQ";
//const DB_URL = "https://gitchat-2b675-default-rtdb.firebaseio.com"
