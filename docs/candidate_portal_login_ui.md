# Cursor Super Prompt --- HireQ Login Page Redesign

You are a **senior frontend engineer and product designer** working on a
production SaaS product.

Your task is to **refactor and redesign my existing HireQ login page**
so that it visually matches the **layout, spacing, and minimal aesthetic
of the Sarvam AI login page**, while preserving my existing
authentication functionality.

This is a **UI redesign**, not a functional rewrite.

Your goal is to make the page feel **modern, clean, minimal, and
high-end like an AI startup landing/login page**.

------------------------------------------------------------------------

## Primary Design Reference

Use the **Sarvam AI login page** as the visual reference for:

-   layout proportions\
-   whitespace usage\
-   typography scale\
-   element spacing\
-   input styling\
-   button design\
-   card radius\
-   alignment

The UI should feel **very similar in structure**, but with **HireQ
branding**.

------------------------------------------------------------------------

## Page Structure

Create a **two column authentication layout**.

Left side → Image panel\
Right side → Login form

The page background must be:

`white (#FFFFFF)`

The content should be centered horizontally and vertically with balanced
spacing.

------------------------------------------------------------------------

## Left Panel --- Image Section

The left side should contain a **large image card identical in layout
style to Sarvam AI**.

Requirements:

-   Image container should have **rounded corners (16--20px radius)**\
-   Maintain **outer spacing around the card** like Sarvam\
-   The card should not touch the page edges\
-   The image should fill the container with **object-fit: cover**

The image will be placed in:

    /assets/login-image.png

Image dimensions:

    1450 × 1800

Implementation rules:

-   Preserve aspect ratio\
-   Responsive scaling\
-   Use a clean container component

Example component:

    <LoginImagePanel />

If the image is missing, display a placeholder.

------------------------------------------------------------------------

## Right Panel --- Login Section

This side contains the **authentication interface**.

Follow Sarvam style:

-   minimal UI\
-   lots of whitespace\
-   centered layout\
-   clean typography

Top section:

**Title**

    HireQ

**Subtitle**

    Hire Smartly

Typography example scale:

-   Title → 32px / semibold\
-   Subtitle → 16px / regular / muted

------------------------------------------------------------------------

## Login Form

Use the **same fields from my current HireQ page**.

Fields:

-   Email Address\
-   Password

Options:

-   Remember me (checkbox)\
-   Forgot password? (link aligned right)

Primary button:

    Sign In

Footer text:

    Don't have an account? Create

------------------------------------------------------------------------

## Input Design

Inputs must feel **premium and modern**.

Requirements:

-   rounded corners (10--12px)\
-   subtle border\
-   large padding\
-   smooth focus state\
-   clear label text\
-   optional icon support

Design inspiration:

-   Linear
-   Notion
-   Stripe authentication inputs

------------------------------------------------------------------------

## Button Design

Primary button:

    Sign In

Design requirements:

-   full width\
-   rounded corners\
-   medium font weight\
-   subtle hover animation\
-   slight elevation or color transition

------------------------------------------------------------------------

## Spacing System

Follow consistent spacing rhythm similar to modern SaaS design.

Suggested scale:

    8px
    12px
    16px
    24px
    32px
    48px

The form must feel **balanced and breathable**.

------------------------------------------------------------------------

## Responsive Design

On smaller screens:

-   Hide the image panel\
    OR\
-   Stack it above the login form

The login form must remain centered.

------------------------------------------------------------------------

## Code Structure

Refactor code into clean components if needed.

Example structure:

    LoginPage
    LoginImagePanel
    LoginForm
    InputField
    AuthButton

Code should be **modular, readable, and production ready**.

------------------------------------------------------------------------

## Style Implementation

Use modern styling practices.

Preferred order:

1.  Tailwind CSS (if available)\
2.  CSS Modules\
3.  Styled Components

Avoid messy inline styles.

------------------------------------------------------------------------

## UX Improvements

Improve visual quality while keeping functionality identical.

Allowed enhancements:

-   smoother hover states\
-   improved spacing\
-   clearer hierarchy\
-   cleaner inputs\
-   better alignment

Do **not remove existing login logic**.

------------------------------------------------------------------------

## Quality Standard

The final UI should look like something built by:

-   Stripe\
-   Linear\
-   Vercel\
-   OpenAI\
-   Anthropic

Clean, minimal, and modern.

------------------------------------------------------------------------

## Before Implementing

Ask me if you need:

-   my current login page code\
-   my primary brand color\
-   preferred font (Inter / Satoshi / Geist etc.)\
-   exact spacing tokens\
-   Tailwind config

------------------------------------------------------------------------

## Output

Refactor my existing login page so the **visual layout closely matches
Sarvam AI** while keeping **HireQ branding and fields**.
