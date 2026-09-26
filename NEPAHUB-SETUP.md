# NepaHub setup

## Front end
Use `nepahub.html` as the website entry file. It works as a static demo and can be hosted on GitHub Pages.

The original uploaded page had a one-page course catalog and an owner-only course editor; the NepaHub version expands that into student accounts, checkout, payment proof, dashboard and owner UI.

## Demo owner login
- Email: `owner@nepahub.com`
- Password: `ChangeMe@2026`

Change these values in the HTML immediately for the demo. Do not use this client-side password protection as production security.

## Real payments + automatic verification
A phone number alone is not enough to create a secure automatic payment flow. You need the actual merchant/wallet/payment-provider account and its API or payment link/QR.

For production:
1. Deploy `nepahub-server-example.js` on a Node host.
2. Set `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` as environment variables.
3. Replace the in-memory Maps with a real database.
4. Add your payment provider's create-payment endpoint and webhook/transaction-verification API.
5. Point the front end's API calls to your backend URL.
6. Store uploaded payment proof outside the process filesystem (object storage is recommended).

The current UI shows the payment destination `9763734429`, exactly as requested, but it deliberately does not claim that a phone number can perform automatic verification without the provider's API/webhook.
