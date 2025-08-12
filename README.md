# Clone the repo
git clone https://github.com/<your-username>/CampusFlow.git
cd CampusFlow
# Backend
createdb campusflow_poc
psql campusflow_poc < backend/schema.sql
cp .env.example .env
docker run --name campusflow-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=campusflow -p 5432:5432 -d postgres:16
# Edit .env and Backend_url in the screens
# Run
npm install
node server.js
npx react-native run android
# release APK
cd android
./gradlew assembleRelease
adb install -r app/build/outputs/apk/release/app-release.apk
