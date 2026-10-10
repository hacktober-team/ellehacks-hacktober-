# SyncUp 📅

**Find a time. Make a plan. Hang out together.**
Do your friends have busy schedules? Does it seem impossible to plan a hangout? SyncUp is the solution for that! 
SyncUp is a collaborative scheduling website designed to help students and friend groups find the perfect time to hang out. With busy class schedules, assignments, extracurriculars, and other commitments, coordinating plans with friends can be difficult. SyncUp brings everyone's schedules together in one place, making it easy to see who's available, identify overlapping free time, and plan meetups.

##  Features

- **Collaborative Calendars:** Create shared calendars where multiple users can add their schedules and view everyone else's availability.
- **Friend Groups:** Create separate calendars for different friend groups, keeping each group's schedules organized.
- **Colour-Coded Schedules:** Each person has their own colour, making it easy to distinguish individual schedules and identify overlaps.
- **Availability Visualization:** See when everyone is busy, when individual schedules overlap, and when the group is free.
- **AI Schedule Import:** Upload a photo of your schedule and let AI automatically identify scheduled times and add them to your calendar under your assigned colour.
- **AI Hangout Recommendations:** Use everyone's availability to recommend ideal times for group hangouts.
- **Easy Group Sharing:** Invite friends to join a group using a shareable link, a QR code, or an access code.

##  Our Goal

SyncUp aims to make organizing social plans simpler, especially for students juggling busy schedules. Instead of repeatedly messaging friends to ask when they're free, everyone can view a shared calendar and find a time that works for the whole group.

Whether you're planning a study session, a weekend outing, or a casual hangout, SyncUp helps bring people together.

##  Technologies

- **HTML** — Website structure
- **CSS** — Styling and user interface
- **JavaScript** — Interactive features and scheduling logic
- **Firebase** — Backend services supporting shared calendars and collaboration
- **AI-powered features** — Intended for schedule photo recognition and hangout time recommendations

##  Getting Started

Follow these steps to run SyncUp locally.

### Prerequisites

- [Visual Studio Code](https://code.visualstudio.com/)
- The **Live Preview** extension for VS Code
- Access to the SyncUp GitHub repository

### Installation

1. **Download the repository.** Open the SyncUp GitHub repository and download the project files, or clone the repository to your computer.

2. **Open the project in VS Code.** Extract the downloaded ZIP file if necessary, then open the project folder in Visual Studio Code.

3. **Install Live Preview.** In VS Code, open the Extensions panel, search for **Live Preview**, and install the extension.

4. **Launch the website.** Locate the main HTML file in the project, right-click it, and select **Show Preview**.

5. **Start using SyncUp!** Once the website is displayed, you can explore the interface and create a group with your friends.

> **Note:** SyncUp uses Firebase for shared functionality. Make sure the project's Firebase configuration is set up correctly if required. AI features may also require additional configuration depending on their implementation.

##  How to Use SyncUp

1. **Create a group:** Start a new calendar for your friend group.
2. **Invite your friends:** Share the group using a QR code, an access code, or a link.
3. **Add your schedule:** Enter your classes, commitments, and other scheduled activities.
4. **View everyone's availability:** Use the colour-coded calendar to see when people are busy and when their schedules overlap.
5. **Find the perfect time:** Check recommended hangout times to discover when everyone is available.
6. **Plan your hangout:** Pick a time that works for the group and make it happen!

## Why SyncUp?

Coordinating schedules shouldn't be harder than making the plans themselves. SyncUp combines shared calendars, visual scheduling, and AI-assisted recommendations to reduce the back-and-forth of group planning.

**Less scheduling. More hanging out.**

##  Contributing

Contributions, suggestions, and feedback are welcome! Feel free to explore the repository, suggest improvements, or help make group scheduling even easier.

##  License

A license has not yet been specified for this project.


- Invite links and QR codes use `SITE_URL` in `firebase-config.js` when you create them from a local preview. A link that starts with `localhost` or `127.0.0.1` only works on your own computer.
- The photo import and "Ask Claude" buttons only appear in the version published inside Claude.
- Firebase web settings are public by design. If GitHub or Google warns about the API key, restrict the key to your site's address in the Google Cloud console.
