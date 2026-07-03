# Lock It In

![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)
![Firebase Hosting](https://img.shields.io/badge/Firebase%20Hosting-Live%20Deploy-F57C00?logo=firebase&logoColor=white)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Open%20App-0F9D58?logo=google-chrome&logoColor=white)](https://lock-it-in-fr.web.app)

Lock It In is a fast study app for creating, importing, and reviewing flashcard sets with multiple learning modes, streak tracking, and a polished single-page experience.

## Live Demo

Open the deployed app here: https://lock-it-in-fr.web.app

## Features

- Create and edit custom study sets
- Import sets from existing content
- Study with flashcards, learn mode, test mode, and match mode
- Track streaks and progress across sessions
- Built with React, Vite, and Firebase Hosting

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

## Deployment

Firebase Hosting is configured to deploy the Vite build output from `dist/` and run the build automatically before each deploy.

```bash
firebase deploy --only hosting
```