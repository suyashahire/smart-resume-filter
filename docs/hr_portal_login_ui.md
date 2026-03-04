
# Cursor Super Prompt — HireQ HR Portal Login Page Redesign

You are a **senior frontend engineer and product designer** working on a production SaaS product.

Your task is to **redesign the HireQ HR Portal login page** so that it visually follows the **minimal layout and spacing philosophy of the Sarvam AI login page**, while preserving the **existing HR portal UI components shown in the current design**.

This is a **visual redesign and layout refactor**, not a change to the authentication logic.

The goal is to make the interface feel like a **modern AI SaaS platform login experience** — clean, professional, minimal, and visually balanced.

---

# Primary Design Inspiration

Use the **Sarvam AI login page** as the design inspiration for:

- layout structure
- spacing rhythm
- typography hierarchy
- minimal UI philosophy
- centered authentication layout
- card-style image section

However, **preserve the HR portal elements already present in the HireQ HR login design**.

---

# Page Layout

Use a **two-column split layout**.

Left Side → Image Panel  
Right Side → HR Login Panel

Overall page background:

`#FFFFFF (white)`

---

# Left Panel — Image Card

Image location:

/assets/hr-login-image.png

Image dimensions:

1600 × 1800 px

Requirements:

- rounded corners (16–20px radius)
- maintain outer spacing around image card
- do not allow card to touch screen edges
- image should use object-fit: cover
- responsive scaling

Component suggestion:

LoginImagePanel

---

# Right Panel — HR Portal Login

Keep the same UI elements but redesign them to look cleaner and more modern.

Layout should be vertically centered.

---

# Status Badge

Display server connection indicator.

Example:

Server Connected •

Design:

- pill badge
- green indicator
- subtle border

---

# Heading Section

Title:

Welcome Back

Subtitle:

Sign in to continue to HireQ

Typography scale suggestion:

Title → 32px semibold  
Subtitle → 16px muted

---

# Authentication Card

Wrap login form inside a card.

Card style:

- rounded corners
- subtle border
- balanced padding

---

# Login Fields

Fields:

Email Address  
Password

Additional elements:

Remember me checkbox  
Forgot password link

Password field must support show/hide toggle.

---

# Primary Button

Button text:

Sign In

Design:

- full width
- rounded corners
- gradient background
- hover animation

---

# Divider

Below login button:

---- or ----

Centered minimal divider.

---

# Account Creation

Display:

Don't have an account? Create one

Make **Create one** a link.

---

# Candidate Portal Navigation

Display secondary navigation:

Looking for a job? Go to Candidate Portal →

Place it below the login card.

---

# Footer Legal Text

By continuing, you agree to our Terms of Service and Privacy Policy

Both links clickable.

---

# Input Design

Inputs should be modern:

- rounded corners (10–12px)
- subtle border
- comfortable padding
- focus highlight
- optional icons

Design inspiration:

Stripe  
Linear  
Vercel

---

# Spacing System

Spacing scale:

8px  
12px  
16px  
24px  
32px  
48px

---

# Responsive Design

Tablet/mobile behavior:

Option 1:
Hide image panel

Option 2:
Stack image panel above form

Login form must remain centered.

---

# Component Structure

Suggested components:

HRLoginPage  
LoginImagePanel  
HRLoginForm  
InputField  
AuthButton  
StatusBadge

Code must remain modular.

---

# Styling

Preferred:

1. Tailwind CSS
2. CSS Modules
3. Styled Components

Avoid inline styles.

---

# UX Improvements

Allowed improvements:

- hover states
- spacing
- typography clarity
- alignment

Do not modify authentication logic.

---

# Quality Standard

Final UI quality should match:

Stripe  
Linear  
Vercel  
OpenAI

Clean, minimal, professional.

---

# Before Implementation

Ask if you need:

- HR login page code
- brand color
- font preference (Inter / Geist / Satoshi)
- Tailwind config
- breakpoints

---

# Final Goal

Create a **modern HR portal login experience for HireQ** inspired by Sarvam's clean layout while preserving existing HR portal functionality.
