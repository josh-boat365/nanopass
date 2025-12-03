<div align="center">
  <img src="./src/assets/icons/codesandbox.svg" alt="NanoPass Logo" width="80" height="80" />
  
  # NanoPass - Password Management & Access Control System
  
  [![Vue 3](https://img.shields.io/badge/Vue-3.5.24-4FC08D?style=flat-square&logo=vue.js)](https://vuejs.org/)
  [![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.17-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
</div>

A modern, secure password management and access control application built with Vue 3, Vite, and Tailwind CSS. NanoPass provides comprehensive administration tools for managing user privileges, system access, password policies, and authentication trails.

## 🎯 Features

- **User Management**: Create, edit, and manage application users with role-based access control
- **Privilege Management**: Define and manage user privilege levels (Admin, Editor, Viewer)
- **System Configuration**: Configure systems, categories, and password policies
- **Password Policy Management**: Create and enforce password policies with regex validation and expiration settings
- **Authentication Tracking**: Monitor login activities, session management, and access trails
- **User Settings**: Profile management, app passwords, session management, and access requests
- **Dashboard**: Comprehensive admin dashboard with metrics, charts, and activity monitoring
- **Responsive Design**: Mobile-first responsive layout with collapsible sidebar
- **Smooth Animations**: Polished UI with smooth transitions and animations

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js**: v16.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: v7.0.0 or higher (comes with Node.js)
- **Git**: For cloning the repository ([Download](https://git-scm.com/))

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/josh-boat365/nanopass.git
cd nanopass
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages listed in `package.json`.

### 3. Development Server

Start the development server with hot module replacement:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

### 4. Build for Production

To create an optimized production build:

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

### 5. Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

## 📦 Installed Libraries & Dependencies

### Core Framework
- **vue** (`^3.5.24`): Progressive JavaScript framework for building user interfaces
- **vue-router** (`^4.6.3`): Official router for Vue.js for single-page application routing

### Styling & UI
- **@tailwindcss/vite** (`^4.1.17`): Tailwind CSS v4 integration for Vite
- **tailwindcss** (`^4.1.17`): Utility-first CSS framework
- **lucide-vue-next** (`^0.555.0`): Beautiful, customizable icon library for Vue
- **tw-animate-css** (`^1.4.0`): Animation utilities for Tailwind CSS
- **autoprefixer** (`^10.4.22`): PostCSS plugin to parse CSS and add vendor prefixes
- **postcss** (`^8.5.6`): Tool for transforming CSS with JavaScript

### Build Tools
- **vite** (`^7.2.4`): Next generation frontend build tool
- **@vitejs/plugin-vue** (`^6.0.1`): Official Vite plugin for Vue 3

## 📁 Project Structure

```
nanopass/
├── src/
│   ├── assets/              # Static assets
│   ├── components/          # Reusable Vue components
│   │   ├── AppLogo.vue
│   │   ├── AppSideBar.vue
│   │   ├── NavMain.vue
│   │   ├── NavUser.vue
│   ├── layouts/             # Layout components
│   │   ├── AppLayout.vue
│   │   └── AuthLayout.vue
│   ├── pages/               # Page components
│   │   ├── auth/
│   │   │   ├── Login.vue
│   │   │   └── Register.vue
│   │   ├── dashboard/
│   │   │   ├── Index.vue
│   │   │   ├── AuthTrails.vue
│   │   │   └── Settings.vue
│   │   ├── privileges/
│   │   │   └── Index.vue
│   │   ├── system-setup/
│   │   │   ├── CreateSystemCategory.vue
│   │   │   ├── CreateSystemPasswordPolicyCategory.vue
│   │   │   └── Index.vue
│   │   └── users/
│   │       └── Create.vue
│   ├── router/
│   │   └── routes.js        # Vue Router configuration
│   ├── App.vue              # Root component
│   ├── main.js              # Application entry point
│   └── style.css            # Global styles
├── index.html               # HTML entry point
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
├── package.json             # Project metadata and dependencies
└── README.md                # This file
```

## 🔧 Configuration Files

### vite.config.js
Vite configuration with Vue plugin support for development and production builds.

### tailwind.config.js
Tailwind CSS configuration with:
- Light-only theme (no dark mode)
- Custom spacing and color definitions
- Content scanning for component files

### postcss.config.js
PostCSS configuration with Tailwind CSS and autoprefixer plugins.

## 🎨 Key Pages & Features

### Authentication
- **Login Page**: Secure user login with email and password
- **Register Page**: User registration

### Dashboard
- **Overview**: Key metrics, recent activities, system health status
- **Access Trails**: Authentication logging and activity tracking
- **Settings**: User profile management, app passwords, access requests

### Administration
- **User Management**: CRUD operations for application users
- **Privileges**: Manage user privilege levels
- **System Categories**: Configure system groupings
- **Password Policies**: Define password validation rules with regex patterns and expiration settings
- **System Setup**: Configure systems and assign password policies

## 🛠️ Development

### IDE Recommendations

- **Visual Studio Code** with Vue 3 extension
- **WebStorm** with built-in Vue support
- **Nuxt DevTools** for enhanced debugging

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔒 Security Features

- Light-only application design
- Role-based access control (Admin, Editor, Viewer)
- Session management and access revocation
- Password policy enforcement
- Authentication trail logging
- App password management for integrations

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support, email support@nanopass.com or open an issue in the GitHub repository.

## 🚀 Deployment

### Vercel
```bash
npm i -g vercel
vercel
```

### Netlify
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

### Docker
Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

Build and run:
```bash
docker build -t nanopass .
docker run -p 3000:3000 nanopass
```

## 📚 Additional Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Vue Router Documentation](https://router.vuejs.org/)
- [Lucide Icons](https://lucide.dev/)

## 🎯 Roadmap

- [ ] Backend API integration
- [ ] Database persistence
- [ ] Advanced reporting and analytics
- [ ] Two-factor authentication (2FA)
- [ ] LDAP/Active Directory integration
- [ ] Mobile app
- [ ] Email notifications
- [ ] Audit logging with detailed timestamps

## 👨‍💻 Author

**Josh Boat** - [GitHub](https://github.com/josh-boat365)

## 🙏 Acknowledgments

- Vue.js community
- Tailwind CSS community
- Lucide Icons project
- All contributors and users
