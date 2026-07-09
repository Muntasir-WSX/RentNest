# RentNest API Documentation

Base URL: http://localhost:5000

## Auth

### POST /api/auth/register
Create a new TENANT or LANDLORD account.

Request body:
```json
{
  "name": "Muntasir",
  "email": "muntasir@gmail.com",
  "password": "123456",
  "phone": "01700000000",
  "role": "TENANT"
}
```

Success response (201):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "name": "muntasir",
      "email": "muntasir@gmail.com",
      "phone": "01700000000",
      "role": "TENANT",
      "isBanned": false,
      "createdAt": "2026-07-09T00:00:00.000Z",
      "updatedAt": "2026-07-09T00:00:00.000Z"
    },
    "accessToken": "jwt-access-token"
  }
}
```

### POST /api/auth/login


every login refresh token delivered with http stattus.

Request body:
```json
{
  "email": "muntasir@gmail.com",
  "password": "123456"
}
```

### POST /api/auth/refresh
 every time refresh cookie generated

### POST /api/auth/logout
same refresh cookie token

### GET /api/auth/me
get all auth passed user,berared will be the access token gave in postman.

Headers:
Authorization: Bearer <accessToken>

---

## Payments (Stripe)

All payment routes under auth.

### POST /api/payments/create

for renting,need to creates paymnets (Via) fo approved rental req by the landlord.

Headers:
Authorization: Bearer <accessToken>

Request body:
```json
{
  "rentalRequestId": "uuid",
  "provider": "STRIPE"
}
```

Success response (201):
```json
{
  "success": true,
  "message": "Payment intent created successfully",
  "data": {
    "payment": {
      "id": "uuid",
      "amount": "5000.00",
      "provider": "STRIPE",
      "status": "PENDING",
      "transactionId": "pi_...",
      "rentalRequestId": "uuid",
      "createdAt": "2026-07-09T00:00:00.000Z"
    },
    "clientSecret": "pi_secrete is genereted via prisma"
  }
}
```

### POST /api/payments/confirm


when the stripe payment get confirmed,it will give a tran id. If seuccess happens,paymnet status will be completed &rental status become active

Headers:
Authorization: Bearer <accessToken>

Request body:
```json
{
  "transactionId": "pi_..."
}
```

### GET /api/payments
Get payment history. Tenant sees own payments. Admin sees all payments.

Headers:
Authorization: Bearer <accessToken>

### GET /api/payments/:id
Get single payment details by id.

Headers:
Authorization: Bearer <accessToken>

---

## Error Response Format

All errors follow this structure:
```json
{
  "success": false,
  "message": "Validation failed",
  "errorDetails": {
    "field": "error message"
  }
}
```

---

## Admin Credentials

Email: admin@rentnest.com
Password: admin123

Extra demo credentials for Postman testing:

Landlord Email: landlord@rentnest.com
Landlord Password: landlord123

Tenant Email: tenant@rentnest.com
Tenant Password: tenant123

Generate admin user:
npm run seed





## Suggested Postman Flow

1. Register tenant
2. Login tenant and copy accessToken
3. Call /api/auth/me
4. Create payment (/api/payments/create) for an approved rental request
5. Confirm payment (/api/payments/confirm)
6. Check payment list (/api/payments)

---

## Additional Core Routes

Public:
- GET /api/categories
- GET /api/properties
- GET /api/properties/:id

Landlord:
- POST /api/landlord/properties
- PUT /api/landlord/properties/:id
- DELETE /api/landlord/properties/:id
- GET /api/landlord/requests
- PATCH /api/landlord/requests/:id

Tenant:
- POST /api/rentals
- GET /api/rentals
- GET /api/rentals/:id
- POST /api/reviews

Admin:
- GET /api/admin/users
- PATCH /api/admin/users/:id
- GET /api/admin/properties
- GET /api/admin/rentals
