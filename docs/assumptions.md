# Assumptions and Design Decisions

This document describes the assumptions and architectural decisions made during the implementation of the order management API.

## Overview

The goal of this project is to implement a minimal order management API capable of:

* Creating customer orders
* Selecting a warehouse that can fulfill all requested products
* Choosing the closest warehouse to the shipping address when multiple warehouses are eligible
* Processing a payment through an external payment provider (mocked)
* Persisting the resulting order

Several implementation details were not explicitly defined in the challenge statement. The following assumptions were made to keep the solution simple and aligned with the proposed requirements.

---

## Payment Information Handling

The challenge requires calling an external payment API that expects:

* Credit card number
* Amount
* Description

Because the order creation flow is responsible for triggering the payment process, the `POST /orders` endpoint accepts payment information in the request payload.

Example:

```json
{
  "payment": {
    "cardNumber": "1234567890123456",
    "holderName": "Alice Johnson",
    "expiryDate": "12/27",
    "cvv": "123"
  }
}
```

### Security Decision

Payment information is **never persisted** in the database.

Card data is used exclusively to call the mocked payment provider and is discarded immediately after the payment request completes.

The order stores only payment-related metadata such as:

* Payment transaction identifier
* Payment status
* Payment amount

This approach follows the challenge requirements while avoiding storage of sensitive card information.

---

## Payment Provider Simplification

The challenge explicitly states that payment processing is simplified for demonstration purposes.

In a real-world implementation:

* Raw card information would not be handled directly by the application.
* A PCI-compliant payment gateway would be used.
* Tokenization would replace direct card transmission.
* Additional payment validation and fraud prevention mechanisms would be required.

These concerns were intentionally omitted to keep the implementation focused on the business rules described in the challenge.

---

## Warehouse Selection

An order must be fulfilled by a single warehouse.

The warehouse selection algorithm follows these rules:

1. Find all warehouses that contain sufficient stock for every requested product.
2. If no warehouse can fulfill the order, return an error.
3. If multiple warehouses are eligible, select the warehouse geographically closest to the shipping address.

---

## Geocoding Service

The challenge allows geocoding to be mocked.

Therefore, address-to-coordinate conversion is implemented through a mocked geocoding service instead of integrating with an external provider.

Responsibilities:

* Receive an address
* Return latitude and longitude coordinates

This abstraction makes it easy to replace the mock with a real geocoding provider in the future.

---

## Payment Service

The payment provider is implemented as a mocked external dependency.

Responsibilities:

* Receive card number
* Receive card holder name
* Receive card expiry date
* Receive CVV
* Receive amount
* Receive payment description
* Return a transaction result

---

## Inventory Validation

Inventory availability is validated before payment processing.

An order can only proceed when a warehouse is able to fulfill all requested items.

If inventory validation fails, no payment request is executed.

---

## Order Creation Flow

The order creation process follows the sequence below:

1. Validate customer existence.
2. Validate requested products.
3. Geocode shipping address.
4. Find eligible warehouses.
5. Select the nearest warehouse.
6. Calculate order total.
7. Process payment.
8. Persist order.
9. Return created order.

---

## Data Persistence

The following information is persisted:

* Customer reference
* Shipping address
* Selected warehouse
* Order items
* Total amount
* Payment transaction identifier
* Order status

The following information is not persisted:

* Card number
* CVV
* Card expiration date
* Card holder name

---

## Scope Limitations

To keep the implementation focused on the challenge requirements, the following concerns were intentionally excluded:

* Authentication and authorization
* Rate limiting
* Order cancellation flow
* Refund processing
* Stock reservation and concurrency control
* Payment retries
* Event-driven architecture
* Background processing
* Distributed transactions
* Audit logging
* Notification system

These features would likely be introduced in a production-grade e-commerce platform but are outside the scope of this exercise.
