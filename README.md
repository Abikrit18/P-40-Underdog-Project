# P-40-Underdog-Project<br>
Principle of Software Engineering Project<br>

**Implementation and Deployment Plan for P-40-Underdog-Project**<br>

Based on the codebase structure, I'll provide a comprehensive implementation and<br>
deployment plan that would allow others to successfully set up this dog shelter<br>
walking application in their own environment.<br><br>

# **1. System Architecture Overview**<br>
The P-40-Underdog-Project is a full-stack application with:<br>
- Backend: Node.js/Express.js REST API<br>
- Frontend: React with Vite as the build tool<br>
- Database: MongoDB<br>
- Storage: Cloudinary for image management<br>
- Notifications: Standard notifications and Web Push Notifications<br>
<br><br>
# **2. Prerequisites**<br>
Before beginning deployment, ensure you have:<br>
- Node.js (v16.x or newer)<br>
- npm or yarn<br>
- MongoDB Atlas account (or local MongoDB installation)<br>
- Cloudinary account for image storage<br>
- Git (for cloning the repository)<br>
- Basic understanding of JavaScript, React, and Express.js<br>
<br><br>
# **3. Installation and Setup**<br>
**Backend Setup**<br>
**1. Clone the repository**<br>
- git clone <repository-url><br>
- cd P-40-Underdog-Project<br>

**2. Install backend dependencies**<br>
- cd backend<br>
- npm install<br>

**3. Set up environment variables Create a  .env  file in the backend directory with the following variables:<br>**
**MongoDB Connection**<br>
- uri=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database<br>
**JWT Secret**<br>
- JWT_SECRET=your_jwt_secret_key<br>
**Cloudinary Configuration**<br>
- CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name<br>
- CLOUDINARY_API_KEY=your_cloudinary_api_key<br>
- CLOUDINARY_API_SECRET=your_cloudinary_api_secret<br>
**Web Push Notifications** (VAPID keys)<br>
- PUBLIC_VAPID_KEY=your_public_vapid_key<br>
- PRIVATE_VAPID_KEY=your_private_vapid_key<br>
**Email Service** (if applicable)<br>
- EMAIL_SERVICE=gmail<br>
- EMAIL_USER=your_email@gmail.com<br>
- EMAIL_PASSWORD=your_email_app_password<br><br>

**4. Generate VAPID keys for Web Push**
  <br>
- npx web-push generate-vapid-keys<br>
- Add these keys to your  .env  file.<br><br>

**Frontend Setup**<br>

**1. Install frontend dependencies**<br>
- cd ../frontend<br>
- npm install<br>

**2. Configure frontend environment Create a  .env  file in the frontend directory:<br>**
- VITE_API_URL=http://localhost:3000<br>
- VITE_PUBLIC_VAPID_KEY=your_public_vapid_key<br>
<br><br>
# **4. Database Initialization**<br>
**1. Set up MongoDB**<br>
- Create a MongoDB Atlas cluster or use a local MongoDB instance<br>
- Create a database named "underdogProject" (or your preferred name)<br>
- Update the MongoDB connection string in the backend  .env  file<br><br>

**2. Run initial database migrations (if needed)**
  <br>
- cd ../backend<br>
- node scripts/migrateWalksToUserWalks.js<br>
<br><br>
# **5. Running the Application Locally**<br>
**1. Start the backend server**<br>
- cd backend<br>
- npm start<br>
- The server should start on http://localhost:3000<br>

**2. Start the frontend development server**<br>
- cd frontend<br>
- npm run dev<br>
- The development server should start on http://localhost:5173<br>

**3. Access the application**<br>
- Open your browser and go to http://localhost:5173<br>
<br><br>
# **6. Production Deployment**<br>
**Backend Deployment**<br>
**1. Choose a hosting provider**<br>
- Render<br>
- Railway<br>
- Heroku<br>
- AWS<br>
- Digital Ocean<br>

**2. Deploy the backend**<br>
- Set up all the required environment variables on your hosting platform<br>
- Deploy the backend code to your chosen platform<br>
- Ensure MongoDB connection is properly configured<br>
- Set up CORS to allow requests from your frontend domain<br>

**Frontend Deployment**<br>
**1. Build the frontend**<br>
- cd frontend<br>
- npm run build<br>
- This will create optimized production files in the  dist  directory<br>

**2. Deploy to a static hosting service**<br>
- Vercel (recommended, since a vercel.json is already included)<br>
- Netlify<br>
- GitHub Pages<br>
- AWS S3 + CloudFront<br>

**3. Configure environment variables on your hosting platform with the production backend URL:**
<br>
- VITE_API_URL=https://your-backend-domain.com<br>
- VITE_PUBLIC_VAPID_KEY=your_public_vapid_key<br>
<br><br>
# **7. Post-Deployment Steps**<br>
**1. Set up the first administrator account**<br>
- Register a user through the application<br>
- Connect to your MongoDB database and manually update the user's role to<br>
- "admin":<br>
- db.users.updateOne({email: "admin@example.com"}, {$set: {role: "admin"}})<br>
- db.users.updateOne({email: "admin@example.com"}, {$set: {role: "admin"}<br>

**2. Configure shelter operating hours**<br>
- Login with the admin account<br>
- Navigate to the shelter management interface<br>
- Set up the appropriate operating hours for the shelter<br>

**3. Add initial dog profiles**<br>
- Use the dog management interface to create profiles for dogs<br>
- Upload photos for each dog<br>
- Add relevant details like breed, age, and walking requirements<br>
<br><br>
# **8. Testing the Deployment**<br>
The repository contains several test files that can be used to validate the<br>
deployment:<br>

**1. Run backend tests**<br>
- cd backend<br>
- npm test<br>

**2. Test key functionality manually:**
<br>
- User registration and login<br>
- Dog browsing<br>
- Walk scheduling<br>
- Walk cancellation<br>
- Walk completion<br>
- Notifications<br>
<br><br>
# **9. Monitoring and Maintenance**<br>
**1. Set up monitoring**<br>
- Use a service like Sentry.io for error tracking<br>
- Set up MongoDB Atlas monitoring for database performance<br>
- Configure logging for the backend server<br>

**2. Backup strategy**<br>
- Set up regular MongoDB backups<br>
- Ensure Cloudinary media is properly backed up<br>

**3. Regular updates**<br>
- Keep npm packages updated<br>
- Apply security patches as needed<br>

# **10. Troubleshooting Common Issues**<br>
**1. MongoDB Connection Issues**<br>
- Verify network access in MongoDB Atlas settings<br>
- Check IP whitelist configuration<br>

**2. Image Upload Problems**<br>
- Verify Cloudinary configuration<br>
- Check upload directory permissions<br>

**3. Push Notification Failures**<br>
- Verify VAPID keys are properly configured<br>
- Ensure the service worker is registered correctly<br>

**4. Walk Booking Issues**<br>
- Review the test files related to booking for troubleshooting hints:<br>
- test-available-slots-fix.js<br>
- test-booking-count-fix.js<br>
- test-walk-slot-booking.js<br>
