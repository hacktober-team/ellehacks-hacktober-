# ellehacks-hacktober-

Free Together helps friend groups find a time when everyone is free. Each person adds their weekly schedule in their own colour, and the page shows the hours nobody is busy.

## Run it

Open `index.html` in a browser (or use the VS Code Live Server extension). Without Firebase settings, schedules are saved on that device only.

## Share calendars with friends (Firebase)

1. In the [Firebase console](https://console.firebase.google.com), open your project and go to **Build → Firestore Database → Create database**.
2. Open the **Rules** tab, paste the rules below, and publish.
3. Make sure `firebase-config.js` holds your project's web settings (it already does for this repo).
4. Host the files, for example with **GitHub Pages** (Settings → Pages → deploy from the `main` branch). Send friends the site address.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /groups/{id} { allow read, write: if true; }
    match /members/{id} { allow read, write: if true; }
  }
}
```

These rules let anyone with the site address read and change the calendars, so only use them for schedules you are happy for friends to see.

### How friends join

Open the group, choose **Invite friends with a code or QR**, and send the code, link or QR code. Friends open the site, choose **Join with code**, and add their schedule. The code takes people to the right group. It does not hide groups from each other.

### Notes

- Invite links and QR codes use `SITE_URL` in `firebase-config.js` when you create them from a local preview. A link that starts with `localhost` or `127.0.0.1` only works on your own computer.
- The photo import and "Ask Claude" buttons only appear in the version published inside Claude.
- Firebase web settings are public by design. If GitHub or Google warns about the API key, restrict the key to your site's address in the Google Cloud console.
