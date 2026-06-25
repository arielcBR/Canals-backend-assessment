# Canals Orders API

Backend service for an e-commerce order management platform. Handles order creation with automatic warehouse selection based on stock availability and proximity to the shipping address.

---

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Validation:** Zod
- **Infra:** Docker Compose

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Docker](https://www.docker.com/) + Docker Compose

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/canals-orders-api.git
cd canals-orders-api
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

The default `.env` works out of the box with the provided Docker Compose setup. No changes needed to run locally.

### 3. Start the database

```bash
docker compose up -d
```

### 4. Install dependencies

```bash
npm install
```

### 5. Run migrations

```bash
npx prisma migrate dev
```

### 6. Seed the database

```bash
npm run seed
```

The seed output will print the IDs you need for testing:
### 7. Start the server

```bash
npm run dev
```

API will be available at `http://localhost:3000`.

---

## API

### POST /orders

Creates a new order. Automatically selects the nearest warehouse that has sufficient stock for all requested items, then processes payment.

**Request body:**

```json
{
  "customerId": "uuid-from-seed",
  "shippingAddress": {
    "street": "Rua Independência",
    "number": "100",
    "complement": "Apto 12",
    "city": "São Leopoldo",
    "state": "RS",
    "country": "Brazil",
    "zipCode": "93010-000"
  },
  "payment": {
    "cardNumber": "1234567890123456"
  },
  "items": [
    { "productId": "uuid-from-seed", "quantity": 2 },
    { "productId": "uuid-from-seed", "quantity": 1 }
  ]
}
```

**Success response — 201 Created:**

```json
{
  "orderId": "uuid",
  "status": "PAID",
  "warehouse": {
    "id": "uuid",
    "name": "São Paulo Warehouse"
  },
  "totalAmount": "120.48",
  "transactionId": "mock-txn-xxxxxxxx",
  "items": [
    {
      "productId": "uuid",
      "productName": "Electrical Cable 10m",
      "quantity": 2,
      "unitPrice": "45.99"
    }
  ]
}
```

**Error responses:**

| Status | Code | Reason |
|--------|------|--------|
| 400 | `VALIDATION_ERROR` | Invalid or missing fields in request body |
| 404 | `CUSTOMER_NOT_FOUND` | The provided customerId does not exist |
| 404 | `PRODUCT_NOT_FOUND` | One or more productIds do not exist |
| 402 | `PAYMENT_DECLINED` | Payment mock declined the transaction |
| 422 | `WAREHOUSE_NOT_FOUND` | No warehouse has sufficient stock for all items |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

All errors follow the same shape:

```json
{
  "error": {
    "code": "WAREHOUSE_NOT_FOUND",
    "message": "No warehouse has sufficient stock for all requested items."
  }
}
```

---

## Seed Test Scenario

The seed is designed to validate warehouse selection logic:

- **Shipping address:** São Leopoldo, RS, Brazil (-29.7597, -51.1491)
- **Porto Alegre Warehouse** (~25km away) — closest, but missing *Distribution Panel* stock → discarded
- **São Paulo Warehouse** (~1100km away) — full stock → selected
- **Chicago Warehouse** (~10500km away) — full stock, control for extreme distance

To trigger the fallback scenario, include `Distribution Panel` in your order items.
To trigger `WAREHOUSE_NOT_FOUND`, request a quantity higher than any warehouse carries.

---

## Design Decisions

**Inline shipping address**
The shipping address is stored directly on the order rather than as a foreign key to a separate table. Delivery addresses frequently differ from a customer's registered address, so embedding it avoids an unnecessary join and models the real-world behavior more accurately.

**Haversine formula for distance**
Warehouse proximity is calculated using the Haversine formula, which computes great-circle distance between two points on a spherical surface. Inputs are converted from degrees to radians before calculation. This is accurate enough for logistics at the scale of this service and requires no external dependency.

**Geocoding mock**
Address-to-coordinates conversion is mocked with a fixed city-to-coordinates map. In production, this would be replaced by a call to a geocoding API (e.g. Google Maps Geocoding) with no changes to the service interface — the mock and the real implementation share the same `IGeocodingService` contract.

**Payment mock**
The payment service is mocked behind an `IPaymentService` interface. Card number `0000000000000000` always returns declined, enabling sad-path testing without a real payment provider.

**Database transaction scope**
Order creation, order item insertion, and inventory decrement all run inside a single `prisma.$transaction()`. This guarantees atomicity: if any step fails, the entire operation is rolled back and no partial state is persisted.

---

## Trade-offs & Considerations

**No inventory locking**
Inventory is decremented within the order transaction, but without a pessimistic lock (`SELECT FOR UPDATE`). Under concurrent load, two simultaneous requests could both pass the stock check and then both decrement, potentially driving inventory negative. The `WarehouseInventory` table is structured to support adding either pessimistic locking or optimistic concurrency control (row versioning) with minimal changes. Concurrency handling was explicitly out of scope per the assessment requirements.

**No authentication**
Auth middleware was intentionally omitted per the assessment spec. In production, all routes would be protected and `customerId` would be derived from the authenticated session rather than supplied by the client.

**Mock services are not injectable**
The geocoding and payment mocks are imported directly rather than injected via a DI container. For a production system, dependency injection would make it easier to swap implementations and test in isolation. For the scope of this assessment, direct imports keep the code simpler without meaningful tradeoff.