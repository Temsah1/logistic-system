# Logistics & Shipment Tracking System

A comprehensive full-stack logistics system similar to Bosta, built with Next.js, Express, and MongoDB.

## Features

### Authentication System
- User registration and login with email/password
- Password hashing with bcrypt
- JWT authentication with secure token management
- Role-based access control (user/admin)
- Protected routes and middleware

### User Features
- Create shipments with detailed origin/destination information
- View all personal shipments in a dashboard
- Track shipment status in real-time
- View detailed shipment information
- Edit shipment notes
- Public shipment tracking without login

### Admin Features
- View all shipments across all users
- Update shipment statuses (Pending -> Picked Up -> In Transit -> Delivered)
- Delete shipments
- View system statistics (total shipments, users, revenue)
- Filter and search shipments
- Manage user-specific shipments

### Shipment Management
- Complete origin and destination addresses
- Recipient information (name, phone, email)
- Package details (weight, dimensions, description)
- Automatic tracking number generation
- Cost calculation based on weight
- Estimated delivery dates
- Status progression tracking

## Tech Stack

- **Frontend**: Next.js 14 + React + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + bcrypt
- **UI Components**: Lucide React icons
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast
- **Date Handling**: date-fns

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)

### One-Click Start
```bash
# For Windows
./start.bat

# For Linux/Mac
chmod +x start.sh
./start.sh
```

### Manual Setup

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

#### Frontend Setup
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local if your backend runs on a different port
npm run dev
```

### Environment Variables

#### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/logistics
JWT_SECRET=your_super_secret_jwt_key_here
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Project Structure

```
logistic-systems/
|-- backend/
|   |-- models/
|   |   |-- User.js
|   |   |-- Shipment.js
|   |-- routes/
|   |   |-- auth.js
|   |   |-- shipments.js
|   |-- middleware/
|   |   |-- auth.js
|   |-- server.js
|   |-- package.json
|   |-- .env.example
|
|-- frontend/
|   |-- app/
|   |   |-- (pages)/
|   |   |   |-- dashboard/
|   |   |   |-- admin/
|   |   |   |-- login/
|   |   |   |-- register/
|   |   |   |-- track/
|   |   |   |-- shipments/
|   |   |-- contexts/
|   |   |-- lib/
|   |-- components/
|   |-- globals.css
|   |-- layout.js
|   |-- package.json
|   |-- tailwind.config.js
|
|-- README.md
|-- start.bat
|-- start.sh
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### Shipments
- `POST /api/shipments` - Create new shipment
- `GET /api/shipments` - Get all shipments (admin) or user shipments
- `GET /api/shipments/:id` - Get shipment details
- `PUT /api/shipments/:id` - Update shipment status/notes
- `DELETE /api/shipments/:id` - Delete shipment (admin only)
- `GET /api/shipments/track/:trackingNumber` - Public tracking endpoint

## Shipment Status Flow

1. **Pending** - Shipment created, awaiting pickup
2. **Picked Up** - Package collected from origin
3. **In Transit** - Package is being transported
4. **Delivered** - Package delivered to recipient

## Default Users

After setup, you can create users through the registration page:
- Regular users can manage their own shipments
- Admin users can access the admin dashboard and manage all shipments

## Features Demonstration

1. **Public Tracking**: Visit `/track` to track shipments without login
2. **User Dashboard**: Register/login to create and manage shipments
3. **Admin Dashboard**: Register as admin or set role to admin in database
4. **Shipment Creation**: Complete form with all shipment details
5. **Real-time Updates**: Admin can update shipment statuses instantly

## Development Notes

- The system uses JWT tokens for authentication
- Passwords are hashed with bcrypt
- All API routes are protected with authentication middleware
- Frontend includes loading states and error handling
- Responsive design works on all devices
- Clean code structure with reusable components

## License

MIT License - feel free to use this for your projects!
