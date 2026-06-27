# Canals Orders API

Backend service for an e-commerce order management platform. Handles order creation with automatic warehouse selection based on stock availability and proximity to the shipping address.

---

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express
- **ORM:** Prisma 7
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
git clone https://github.com/arielcBR/Canals-backend-assessment.git
cd canals_api
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
npx tsx prisma/seed.ts
```

The seed populates customers, products, warehouses and inventory. IDs are printed to the console — copy them to use in your requests.

### 7. Start the server

```bash
npm run dev
```

API will be available at `http://localhost:3000`.

---

## API

### POST /api/orders

Creates a new order. Automatically selects the nearest warehouse that has sufficient stock for all requested items, then processes payment.

**Request body:**

```json
// Request body — exemplo real
{
  "customerId": "uuid-from-seed",
  "shippingAddress": {
    "street": "Honduras Street",
    "number": "300",
    "complement": "208",
    "city": "São Leopoldo",
    "state": "RS",
    "country": "Brazil",
    "zipCode": "93010-000"
  },
  "payment": {
    "cardNumber": "1234567890123456",
    "holderName": "Alice Johnson",
    "expiryDate": "12/27",
    "cvv": "123"
  },
  "items": [
    { "productId": "uuid-from-seed", "quantity": 1 },
    { "productId": "uuid-from-seed", "quantity": 1 }
  ]
}
```

**Success response — 201 Created:**

```json
{
	"message": "Order created succesfully!",
	"data": {
		"orderId": "uuid",
		"status": "PAID",
		"createdAt": "2026-06-27T04:09:27.777Z",
		"warehouse": {
			"name": "São Paulo Warehouse"
		},
		"shipping": {
			"street": "Honduras Street",
			"number": "300",
			"complement": "208",
			"city": "São Leopoldo",
			"state": "RS",
			"country": "Brazil",
			"zipCode": "93010-000"
		},
		"items": [
  {
    "productId": "uuid-from-seed",
    "quantity": 1,
    "unitPrice": 28.5,
    "subtotal": 28.5
  },
  {
    "productId": "uuid-from-seed",
    "quantity": 1,
    "unitPrice": 189.9,
    "subtotal": 189.9
  }
],
		"totalAmount": 218.4
	}
}
```

**Error responses:**

| Status | Code | Reason |
|--------|------|--------|
| 400 | `VALIDATION_ERROR` | Invalid or missing fields in request body |
| 404 | `CUSTOMER_NOT_FOUND` | The provided customerId does not exist |
| 404 | `PRODUCT_NOT_FOUND` | One or more productIds do not exist |
| 402 | `PAYMENT_DECLINED` | Payment mock declined the transaction |
| 422 | `EMPTY_ORDER` | items array is empty |
| 422 | `WAREHOUSE_NOT_FOUND` | No warehouse has sufficient stock for all items |
| 500 | `INTERNAL_SERVER_ERROR` | Unexpected server error |

All errors follow the same shape:

```json
{
  "error": {
    "code": "WAREHOUSE_NOT_FOUND",
    "message": "No warehouse has sufficient stock for all items"
  }
}
```

---

## Seed Test Scenarios

The seed is designed to validate warehouse selection logic. Reference point: **São Leopoldo, RS, Brazil**.

| Warehouse | Distance | Stock |
|-----------|----------|-------|
| Porto Alegre | ~25km | No `Distribution Panel`, no `Step-down Transformer` |
| Caxias do Sul | ~120km | No `Distribution Panel`, no `Step-down Transformer` |
| São Paulo | ~1100km | No `Step-down Transformer` |
| Chicago | ~10500km | Full stock |

**Scenario examples:**

- Order `Electrical Cable` qty 1 → **Porto Alegre** (nearest with stock)
- Order `Electrical Cable` qty 150 → **Caxias do Sul** (Porto Alegre has only 100)
- Order `Distribution Panel` qty 1 → **São Paulo** (Porto Alegre and Caxias lack it)
- Order `Step-down Transformer` qty 1 → **Chicago** (only warehouse with it)
- Order any product qty 99999 → `422 WAREHOUSE_NOT_FOUND`

**To trigger payment declined:** use `cardNumber: "0000000000000000"`.

---

## Design Decisions

**Inline shipping address**
Stored directly on the order rather than as a foreign key. Delivery addresses frequently differ from a customer's registered address, so embedding avoids an unnecessary join and models real-world behavior more accurately.

**Haversine formula for warehouse selection**
Proximity is calculated using the Haversine formula, which computes great-circle distance between two geographic points. Inputs are converted from degrees to radians before calculation. Accurate enough for logistics at this scale with no external dependency.

**Geocoding mock**
Address-to-coordinates conversion is mocked with a fixed city-to-coordinates map behind an `IGeocodingService` interface. In production, replacing it with Google Maps or Mapbox requires only a new class implementing that interface — the service layer does not change.

**Payment mock**
Mocked behind `IPaymentService`. Card `0000000000000000` always returns declined. All card fields (`cardNumber`, `holderName`, `expiryDate`, `cvv`) are forwarded to the mock exactly as they would be to a real gateway.

**Decimal precision for financial values**
All monetary calculations use `decimal.js` internally to avoid IEEE 754 floating-point errors. Values are converted to `number` only at the response boundary.

**Database transaction scope**
Order creation, item insertion, and inventory decrement all run inside a single `prisma.$transaction()`. If any step fails, the entire operation rolls back with no partial state persisted.

---

## Trade-offs & Considerations

**No inventory locking**
Inventory is decremented within the transaction but without a pessimistic lock (`SELECT FOR UPDATE`). Under concurrent load, two simultaneous requests could both pass the stock check and both decrement, potentially driving inventory negative. The schema supports adding locking or optimistic concurrency control with minimal changes. Concurrency was explicitly out of scope per the assessment requirements.

**No authentication**
Intentionally omitted per the assessment spec. In production, all routes would be protected and `customerId` would be derived from the authenticated session rather than supplied by the client.