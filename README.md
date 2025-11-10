# WhataGoodDealTX

A vintage-themed website for WhataGoodDealTX, specializing in antiques, vintage items, and collectibles from the 1950s era.

## Project Structure

This is a Turborepo monorepo containing:

- `apps/web` - Next.js 14 website with App Router

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

This will start all apps in development mode.

### Build

```bash
npm run build
```

### Production

```bash
npm run start
```

## Apps

### Web (`apps/web`)

The main WhataGoodDealTX website featuring:
- Vintage postcard-themed design
- Product categories showcase
- Contact form modal
- Responsive layout
- 1950s aesthetic with retro fonts and colors
- Resend email integration

## Deployment

This project is configured for deployment on Railway.

## Tech Stack

- **Turborepo** - Monorepo build system
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Resend** - Email service
- **CSS** - Custom styling with vintage aesthetic

## Environment Variables

Copy `.env.example` to `.env.local` in the web app:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Required variables:

### Email (Resend)
- `RESEND_API_KEY` - Your Resend API key
- `RESEND_TO_EMAIL` - Email address to receive contact form submissions
- `RESEND_FROM_EMAIL` - Email address to send from (must be verified domain)

### Instagram Integration
- `INSTAGRAM_ACCESS_TOKEN` - Your Instagram Graph API access token
- `INSTAGRAM_USER_ID` - Your Instagram user ID

#### Getting Instagram Credentials

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create an app and add Instagram Basic Display product
3. Set up Instagram Business Account
4. Generate a long-lived access token
5. Get your Instagram User ID from the Graph API Explorer
6. Tag posts with `#featured` to display them on the site

The site will automatically:
- Pull the last 9 Instagram posts tagged with `#featured`
- Cache results for 15 minutes to avoid rate limits
- Fall back to default categories if Instagram is not configured
- Display posts as clickable cards linking to Instagram
