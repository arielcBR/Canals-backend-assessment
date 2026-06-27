import { AppError } from "../errors/AppError";
import { OrderStatus } from '../../generated/prisma/client'
import type { IGeocodingService } from "../interfaces/geocoding.service.interface";
import type { CreateOrderDTO } from "../dtos/order/create-order.dto";
import type { OrderItemDTO } from "../dtos/order/create-order.dto";
import type { OrderItemEnrichedDTO } from "../dtos/order/order-item-enriched.dto";
import type { OrderResponseDTO, OrderShippingResponseDTO } from "../dtos/order/order-response.dto";
import Decimal from "decimal.js";

// lib
import { prisma } from "../lib/prisma";

// mocks
import { geocodingMock } from "../mocks/geocoding.mock";
import { paymentMock } from "../mocks/payment.mock";

// repositories
import { WarehouseRepository } from "../repositories/warehouse.repository";
import { OrderRepository } from "../repositories/order.repository";

// utils
import { calculateDistance } from "../utils/haversine";

export class OrderService {
  private warehouseRepository: WarehouseRepository;
  private orderRepository: OrderRepository;
  private geocodingService: IGeocodingService;

  constructor(
    warehouseRepository = new WarehouseRepository(),
    orderRepository     = new OrderRepository(),
    geocodingService: IGeocodingService = geocodingMock, 
  ) {
    this.warehouseRepository = warehouseRepository;
    this.orderRepository     = orderRepository;
    this.geocodingService    = geocodingService;
  }

  async create(data: CreateOrderDTO): Promise<OrderResponseDTO> {
    const customer      = await this.validateCustomer(data.customerId);
    const enrichedItems = await this.enrichItemsWithPrices(data.items);
    const warehouse     = await this.selectNearestWarehouse(data.items, data.shippingAddress);
    const totalAmount   = this.calculateTotal(enrichedItems);
    const payment       = await this.processPayment(data.payment.cardNumber, totalAmount, customer.id);
    const order         = await this.orderRepository.create({
      customerId:           customer.id,
      warehouseId:          warehouse.id,
      shippingStreet:       data.shippingAddress.street,
      shippingNumber:       data.shippingAddress.number,
      shippingComplement:   data.shippingAddress.complement ?? null,
      shippingCity:         data.shippingAddress.city,
      shippingState:        data.shippingAddress.state,
      shippingCountry:      data.shippingAddress.country,
      shippingZipCode:      data.shippingAddress.zipCode,
      items:                enrichedItems,
      totalAmount,
      paymentTransactionId: payment.transactionId,
      status:               OrderStatus.PAID,
    });

    return this.buildResponse(order, warehouse, data.shippingAddress, enrichedItems, totalAmount);
  }

  private async validateCustomer(customerId: string) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });

    if (!customer)
      throw new AppError("Customer not found", 404, "CUSTOMER_NOT_FOUND");

    return customer;
  }

  private async enrichItemsWithPrices(items: OrderItemDTO[]): Promise<OrderItemEnrichedDTO[]> {
    if (items.length === 0)
      throw new AppError("Order must contain at least one item", 422, "EMPTY_ORDER");

    const productIds = items.map(item => item.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (dbProducts.length !== items.length) {
      const foundIds   = new Set(dbProducts.map(p => p.id));
      const missingIds = productIds.filter(id => !foundIds.has(id));

      throw new AppError(
        `The following products were not found: ${missingIds.join(", ")}`,
        404,
        "PRODUCT_NOT_FOUND"
      );
    }

    return items.map(item => {
      const product = dbProducts.find(p => p.id === item.productId)!;
      return {
        productId: item.productId,
        quantity:  item.quantity,
        unitPrice: product.price,
      };
    });
  }

  private async selectNearestWarehouse(
    items: OrderItemDTO[],
    address: CreateOrderDTO["shippingAddress"]
  ) {
    const shippingLocation = await this.geocodingService.geocode(
      `${address.street}, ${address.city}, ${address.state}, ${address.country}`
    );

    const candidates = await this.warehouseRepository.findWarehousesWithStock(items);

    if (candidates.length === 0)
      throw new AppError("No warehouse has sufficient stock for all items", 422, "WAREHOUSE_NOT_FOUND");

    return candidates.reduce((best, current) => {
      const bestDistance    = calculateDistance(shippingLocation.lat, shippingLocation.lng, best.latitude,    best.longitude);
      const currentDistance = calculateDistance(shippingLocation.lat, shippingLocation.lng, current.latitude, current.longitude);

      return currentDistance < bestDistance ? current : best;
    });
  }

  private calculateTotal(items: OrderItemEnrichedDTO[]): Decimal {
    return items.reduce((total, item) => {
      return total.plus(new Decimal(item.quantity).times(item.unitPrice));
    }, new Decimal(0));
  }

  private async processPayment(cardNumber: string, amount: Decimal, customerId: string) {
    const payment = await paymentMock.charge({
      cardNumber,
      amount:      amount.toNumber(),
      description: `Order for customer ${customerId}`,
    });

    if (payment.status === "declined")
      throw new AppError("Payment was declined", 402, "PAYMENT_DECLINED");

    return payment;
  }

  private buildResponse(
    order:         { id: string; status: OrderStatus; createdAt: Date },
    warehouse:     { name: string },
    address:       CreateOrderDTO["shippingAddress"],
    enrichedItems: OrderItemEnrichedDTO[],
    totalAmount:   Decimal,
  ): OrderResponseDTO {
    const shipping: OrderShippingResponseDTO = {
      street:     address.street,
      number:     address.number,
      complement: address.complement,
      city:       address.city,
      state:      address.state,
      country:    address.country,
      zipCode:    address.zipCode,
    };

    return {
      orderId:     order.id,
      status:      order.status,
      createdAt:   order.createdAt,
      warehouse:   { name: warehouse.name },
      shipping,
      items: enrichedItems.map(item => ({
        productId: item.productId,
        quantity:  item.quantity,
        unitPrice: item.unitPrice.toNumber(),
        subtotal:  new Decimal(item.quantity).times(item.unitPrice).toNumber(),
      })),
      totalAmount: totalAmount.toNumber(),
    };
  }
}