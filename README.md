# Clone the repo
git clone https://github.com/Kevin88866/CampusFlow.git
cd CampusFlow
# Backend
createdb campusflow_poc
psql campusflow_poc < backend/schema.sql
cp .env.example .env
# Edit .env and Backend_url in the screens
# Run
npm install
node server.js
npx react-native run android
