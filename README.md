# AppointmentsApp

A comprehensive appointment booking system designed for service-based businesses and their customers. The app provides separate mobile applications for both business owners and customers, enabling seamless appointment management and booking experiences.

## Overview

AppointmentsApp is a dual-platform mobile solution built with React Native that connects service providers with customers through an intuitive appointment booking system. The platform ensures efficient scheduling, real-time availability management, and comprehensive business administration tools.

## Architecture

The system consists of three main components:

- **UserSide**: Customer-facing mobile app for booking appointments
- **BusinessSide**: Business owner mobile app for managing appointments and operations
- **AppointmentsAppServer**: Backend API server handling all data and business logic

## UserSide Features

### 🔍 **Business Discovery**
- **Location-based Search**: Find businesses near your current location
- **Category Browsing**: Browse businesses by service categories (Home, Pet Care, Spa, etc.)
- **Recently Viewed**: Quick access to previously browsed businesses
- **Favorites System**: Save preferred businesses for easy booking
<img width="250" height="520" alt="Simulator Screenshot - iPhone 16 Pro - 2025-09-13 at 20 14 45" src="https://github.com/user-attachments/assets/1c07a531-7fdb-4c2f-a860-36088ebfa208" />
<img width="250" height="520" alt="image" src="https://github.com/user-attachments/assets/425f114c-944b-445c-83e9-ffc8a8f2da10" />
<img width="250" height="520" alt="image" src="https://github.com/user-attachments/assets/f1638b02-f41c-4970-ab8c-a82956734b8d" />

### 📅 **Appointment Booking**
- **Real-time Availability**: View live available time slots for any date
- **Service Selection**: Choose from available services with duration and pricing
- **Conflict Prevention**: Advanced race condition protection prevents double bookings
- **Smart Time Refresh**: Automatically updates available times if conflicts occur
- **Booking Confirmation**: Instant confirmation with appointment details
<img width="250" height="520" alt="Simulator Screenshot - iPhone 16 Pro - 2025-09-13 at 20 16 10" src="https://github.com/user-attachments/assets/5a2a0135-e622-4f67-986a-97af6267d103" />
<img width="250" height="520" alt="Simulator Screenshot - iPhone 16 Pro - 2025-09-13 at 20 16 37" src="https://github.com/user-attachments/assets/7b30bb11-c093-4fb5-a592-306166b7bb39" />
<img width="250" height="520" alt="Simulator Screenshot - iPhone 16 Pro - 2025-09-13 at 20 16 47" src="https://github.com/user-attachments/assets/eea86b3f-9dde-4afd-a9c2-3cc4721ad7b1" />
<img width="250" height="520" alt="Simulator Screenshot - iPhone 16 Pro - 2025-09-13 at 20 16 53" src="https://github.com/user-attachments/assets/9ecd1409-c963-41e6-880a-e7fdf426c8f7" />

### 👤 **Profile & Account Management**
- **Phone-based Authentication**: Secure OTP verification system
- **Profile Management**: Update personal information and preferences
- **Appointment History**: View all past, current, and upcoming appointments
- **Appointment Actions**: Cancel, reschedule, or modify existing bookings
<img width="250" height="520" alt="Simulator Screenshot - iPhone 16 Pro - 2025-09-13 at 20 17 53" src="https://github.com/user-attachments/assets/1e0a41f9-a006-4f44-9da3-80b55a6f3c57" />
<img width="250" height="520" alt="Simulator Screenshot - iPhone 16 Pro - 2025-09-13 at 20 18 12" src="https://github.com/user-attachments/assets/15be8e5b-ada1-4677-a3e1-2e2148ebad73" />
<img width="250" height="520" alt="Simulator Screenshot - iPhone 16 Pro - 2025-09-13 at 20 18 30" src="https://github.com/user-attachments/assets/a647cd40-2b45-40cc-9ff4-5023c609adb1" />
<img width="250" height="520" alt="Simulator Screenshot - iPhone 16 Pro - 2025-09-13 at 20 18 38" src="https://github.com/user-attachments/assets/8017ed81-c575-4b0c-94b4-ef73cc61c02e" />

### 🎨 **User Experience**
- **Dark/Light Mode**: Toggle between themes for comfortable viewing
- **Intuitive Navigation**: Smooth tab and stack navigation with proper animations
- **City Selection**: Choose and filter businesses by city

## BusinessSide Features

### 📊 **Dashboard**
- **Business Overview**: Key metrics and performance indicators
- **Today's Schedule**: Quick view of today's appointments
<img width="250" height="520" alt="Simulator Screenshot - iPhone 16 Pro Max - 2025-09-14 at 00 07 06" src="https://github.com/user-attachments/assets/1f2de34d-0dbe-4b05-a75b-d4934e087fbe" />


### 📋 **Appointment Management**
- **Comprehensive Calendar**: Month, week, and day views of all appointments
- **Status Management**: Update appointments as completed, cancelled, or rescheduled
- **Customer Information**: Access customer details and contact information
- **Search & Filter**: Find specific appointments by date, customer, or service
<img width="250" height="520" alt="Simulator Screenshot - iPhone 16 Pro Max - 2025-09-13 at 21 26 25" src="https://github.com/user-attachments/assets/caba47c7-f004-432d-a571-2a9b7a243d23" />
<img width="250" height="520" alt="Simulator Screenshot - iPhone 16 Pro Max - 2025-09-13 at 21 26 36" src="https://github.com/user-attachments/assets/4f7d2a67-86e3-4c2d-bdb8-d20c13aa1905" />

### 🛠️ **Service Management**
- **Service Creation**: Add new services with pricing, duration, and descriptions
- **Service Editing**: Update service details, pricing, and availability
<img width="250" height="520" alt="Simulator Screenshot - iPhone 16 Pro Max - 2025-09-13 at 21 27 17" src="https://github.com/user-attachments/assets/8e97196f-2b23-4973-b385-4a3de64ab140" />
<img width="250" height="520" alt="Simulator Screenshot - iPhone 16 Pro Max - 2025-09-13 at 21 27 25" src="https://github.com/user-attachments/assets/351e59ec-ac25-4493-a5f7-41bdbd4b9246" />

### ⏰ **Schedule Management**
- **Working Hours**: Set daily operating hours for each day of the week
- **Break Management**: Configure lunch breaks and short breaks
- **Temporary Closures**: Set holiday closures and temporary shutdowns
- **Schedule Templates**: Reuse common scheduling patterns
<img width="250" height="520" alt="Simulator Screenshot - iPhone 16 Pro Max - 2025-09-13 at 21 28 00" src="https://github.com/user-attachments/assets/cffc4ba3-10df-4ab3-9eb3-410b8446ab80" />
<img width="250" height="520" alt="Simulator Screenshot - iPhone 16 Pro Max - 2025-09-13 at 21 28 37" src="https://github.com/user-attachments/assets/9dd0ad5d-d04d-40dd-a669-9755ee9b2e56" />


### 🏢 **Business Profile**
- **Business Information**: Manage name, description, contact details
- **Location Settings**: Set business address and service area
- **Gallery Management**: Upload and organize business photos
- **Operating Information**: Set business hours, services, and policies

<img width="250" height="520" alt="Simulator Screenshot - iPhone 16 Pro Max - 2025-09-13 at 21 31 05" src="https://github.com/user-attachments/assets/d8ae585c-7df9-4b65-9ffa-1103ca9c44a0" />
<img width="250" height="520" alt="Simulator Screenshot - iPhone 16 Pro Max - 2025-09-13 at 21 31 21" src="https://github.com/user-attachments/assets/a47e1a6e-2c57-49bd-a92f-bc77035e553f" />

## Backend Server Features

### 🔐 **Security & Authentication**
- **Race Condition Protection**: Prevents concurrent booking conflicts
- **Business Authorization**: Ensures businesses can only modify their own data
- **Phone-based Auth**: Secure OTP verification system
- **Data Validation**: Comprehensive input validation and sanitization

### 📊 **Data Management**
- **MongoDB Database**: Scalable NoSQL database for all app data
- **Optimistic Locking**: Prevents data conflicts in concurrent operations
- **Automated Backups**: Regular data backup and recovery systems
- **Performance Optimization**: Efficient queries and caching strategies

### 🌐 **API Architecture**
- **RESTful APIs**: Clean, organized endpoint structure
- **Real-time Updates**: Live data synchronization between apps
- **Error Handling**: Comprehensive error responses and logging
- **Rate Limiting**: Protection against API abuse

### 📱 **Multi-tenant Support**
- **Business Isolation**: Each business manages only their own data
- **Scalable Architecture**: Supports unlimited businesses and customers
- **Resource Management**: Efficient handling of concurrent users

## Key Workflows

### Customer Booking Flow
1. **Discover** → Search or browse for businesses by location/category
2. **Explore** → View business details, services, and reviews
3. **Select** → Choose desired service and preferred time slot
4. **Book** → Confirm appointment with instant verification
5. **Manage** → View, modify, or cancel bookings as needed

### Business Management Flow
1. **Setup** → Configure business profile, services, and operating hours
2. **Monitor** → View dashboard with today's appointments and key metrics
3. **Serve** → Update appointment statuses as customers are served
4. **Analyze** → Review performance metrics and customer patterns
5. **Optimize** → Adjust services, pricing, and schedules based on data

## Technical Highlights

- **Concurrent User Support**: Handles multiple users booking simultaneously
- **Real-time Synchronization**: Live updates across all connected devices
- **Offline Capability**: Core features work without internet connection
- **Cross-platform**: Single codebase runs on both iOS and Android
- **Responsive Design**: Adapts to different screen sizes and orientations
- **Performance Optimized**: Fast loading times and smooth animations

## Business Benefits

### For Service Providers
- Reduce no-shows with automated confirmations
- Optimize schedule with real-time availability management
- Increase customer retention through seamless booking experience
- Gain insights with comprehensive analytics and reporting
- Streamline operations with automated appointment management

### For Customers  
- Book appointments 24/7 without phone calls
- Discover new businesses and services in their area
- Manage all appointments in one convenient app
- Receive instant confirmations and updates
- Access booking history and favorite businesses

AppointmentsApp transforms traditional appointment booking from a manual, phone-based process into a modern, digital experience that benefits both businesses and customers through automation, real-time updates, and intelligent scheduling.
