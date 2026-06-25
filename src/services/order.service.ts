import { AppError } from "../errors/AppError";
import { OrderStatus } from '../../generated/prisma/client'
import type { CreateOrderDTO } from "../dtos/order/create-order.dto";

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
  private warehouseRepository = new WarehouseRepository();
  private orderRepository = new OrderRepository();

  async create(data: CreateOrderDTO) {
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId }
    });

    if (!customer) {
      throw new AppError("Customer not found", 404, "CUSTOMER_NOT_FOUND");
    }

    // 2. LIDANDO COM OS PREÇOS E PRODUTOS (Segurança)
    // Extrai os IDs enviados pelo frontend e busca os preços reais no banco
    const productIds = data.items.map(item => item.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });

    if (dbProducts.length !== data.items.length) {
      throw new AppError("One or more products were not found in our catalog", 404, "PRODUCT_NOT_FOUND");
    }

    // Mescla a quantidade do DTO com o preço real do Banco de Dados
    const enrichedItems = data.items.map(item => {
      const product = dbProducts.find(p => p.id === item.productId)!;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: Number(product.price) // Preço seguro vindo do banco
      };
    });

    // 3. Geocoding do endereço
    const shippingLocation = await geocodingMock.geocode(
      `${data.shippingAddress.street}, ${data.shippingAddress.city}, ${data.shippingAddress.state}, ${data.shippingAddress.country}`
    );

    // 4. Buscar warehouses com estoque suficiente
    const candidateWarehouses = await this.warehouseRepository.findWarehousesWithStock(data.items);

    if (candidateWarehouses.length === 0) {
      throw new AppError(
        "No warehouse has sufficient stock for all items",
        422,
        "WAREHOUSE_NOT_FOUND"
      );
    }

    // 5. Escolher warehouse mais próximo (Haversine)
    const selectedWarehouse = candidateWarehouses.reduce((best, current) => {
      const bestDistance = calculateDistance(
        shippingLocation.lat,
        shippingLocation.lng,
        best.latitude,
        best.longitude
      );

      const currentDistance = calculateDistance(
        shippingLocation.lat,
        shippingLocation.lng,
        current.latitude,
        current.longitude
      );

      return currentDistance < bestDistance ? current : best;
    });

    // 6. Calcular total do pedido (usando os itens enriquecidos com preço do banco)
    const totalAmount = enrichedItems.reduce((total, item) => {
      return total + (item.quantity * item.unitPrice);
    }, 0);

    // 7. Processar pagamento
    const payment = await paymentMock.charge({
      cardNumber: data.payment.cardNumber,
      amount: totalAmount,
      description: `Order for customer ${customer.id}`, // Usando o ID real do banco
    });

    if (payment.status === "declined") {
      throw new AppError(
        "Payment was declined",
        402,
        "PAYMENT_DECLINED"
      );
    }

    // 8. Persistir pedido
    const order = await this.orderRepository.create({
      customerId: customer.id, // ID real que veio do Upsert
      warehouseId: selectedWarehouse.id,

      shippingStreet: data.shippingAddress.street,
      shippingNumber: data.shippingAddress.number,
      shippingComplement: data.shippingAddress.complement ?? null,
      shippingCity: data.shippingAddress.city,
      shippingState: data.shippingAddress.state,
      shippingCountry: data.shippingAddress.country,
      shippingZipCode: data.shippingAddress.zipCode,

      items: enrichedItems, // Passando os itens COM o unitPrice seguro
      totalAmount,
      paymentTransactionId: payment.transactionId,
      status: OrderStatus.PAID,
    });

    // 9. Response DTO limpo
    return {
      orderId: order.id,
      status: order.status,
      warehouse: {
        id: selectedWarehouse.id,
        name: selectedWarehouse.name,
      },
      items: enrichedItems, // Retorna os itens detalhados com o preço validado
      totalAmount,
      paymentTransactionId: payment.transactionId,
    };
  }
}