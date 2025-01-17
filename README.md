# Pantry Genie

Pantry Genie is an AI-powered kitchen assistant that helps you manage your pantry inventory and discover recipes based on what you have on hand. Using advanced AI technology and computer vision, it makes cooking and pantry management easier than ever!

## Features
- **Smart Pantry Management:** Easily add, update, and track your pantry items
- **AI-Powered Recipe Suggestions:** Get personalized recipe recommendations using Gemini 1.5 Flash API
- **Computer Vision Integration:** Detect pantry items using your device's camera with TensorFlow's COCO SSD model
- **Real-time Updates:** Dynamic inventory management system
- **User-Friendly Interface:** Clean, modern UI built with Material-UI

## Getting Started
### Prerequisites
- Node.js (Latest LTS version recommended)
- npm or yarn package manager
- A modern web browser
- Camera access for item detection feature

## Installation
1. Clone the repository:
```bash
git clone https://github.com/stevennple/pantry-genie.git
cd pantry-genie
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
Create a .env file in the root directory and add your API keys:
```code
GOOGLE_AI_API_KEY=your_gemini_api_key
FIREBASE_API_KEY=your_firebase_key
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open http://localhost:3000 in your browser

## Tech Stack
- **Frontend Framework:** Next.js 14, React 18
- **UI Components:** Material-UI (MUI)
- **AI/ML:**
Google's Generative AI (Gemini 1.5)
TensorFlow.js
COCO SSD Model
- **Backend Services:** Firebase
- **Authentication:** Firebase Auth
- **Database:** Firebase Realtime Database
- Styling:** CSS, Emotion

## Dependencies
Key dependencies include:
- google/generative-ai: ^0.16.0
- @tensorflow-models/coco-ssd: ^2.2.3
- @mui/material: ^5.16.6
- firebase: ^10.12.5
- react-webcam: ^7.2.0
  
## Usage
1. Adding Items:
- Use your device's camera to scan items
- Manually input items into your pantry

2. Getting Recipe Suggestions:
- View AI-generated recipe suggestions based on your pantry items
- Filter recipes by dietary preferences and cuisine types

3. Managing Inventory:
- Track item quantities
- Set expiration date reminders
- Remove consumed items
