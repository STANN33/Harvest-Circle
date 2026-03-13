# Buyer Registration Fix - Send SMS for existing users

## Plan
**Info:** BuyerRegister calls `/register` (fails if exists). Need `/verify-phone` → SMS → verify.

**Files:** frontend-web/src/pages/BuyerRegister.tsx

**Plan:**
1. Step 1: Validate → POST `/auth/check-phone` or `/register` → if exists, send SMS → Step 2
2. Step 2: Enter code → `/verify-phone` → dashboard

**Followup:** Backend terminal SMS logs after Step 1.

## Steps
- [x] Analyze BuyerRegister.tsx
- [ ] Add phone check + SMS flow
- [ ] Test buyer flow

