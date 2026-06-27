import { prisma } from '../src/lib/prisma'

async function main() {
  const existing = await prisma.customer.findFirst();
  
  if (existing) {
    console.log('⏭️  Database already seeded, skipping.')
    return
  }

  console.log('🌱 Seeding database...')

  // ─── Cleanup ────────────────────────────────────────────────────────────────
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.warehouseInventory.deleteMany()
  await prisma.warehouse.deleteMany()
  await prisma.product.deleteMany()
  await prisma.customer.deleteMany()

  // ─── Products ───────────────────────────────────────────────────────────────
  const [cable, breaker, conduit, panel, meter, switch_, transformer] = await Promise.all([
    prisma.product.create({ data: { name: 'Electrical Cable 10m',    price: 45.99  } }),
    prisma.product.create({ data: { name: 'Circuit Breaker 20A',     price: 28.50  } }),
    prisma.product.create({ data: { name: 'PVC Conduit 3m',          price: 12.00  } }),
    prisma.product.create({ data: { name: 'Distribution Panel 12ch', price: 189.90 } }),
    prisma.product.create({ data: { name: 'Digital Energy Meter',    price: 75.00  } }),
    prisma.product.create({ data: { name: 'Industrial Switch 40A',   price: 55.00  } }),
    prisma.product.create({ data: { name: 'Step-down Transformer',   price: 320.00 } }),
  ])
  console.log('✅ Products created')

  // ─── Warehouses ─────────────────────────────────────────────────────────────
  const [portoAlegre, caxias, saoPaulo, chicago] = await Promise.all([
    prisma.warehouse.create({ data: { name: 'Porto Alegre Warehouse',  latitude: -30.0346, longitude: -51.2177 } }),
    prisma.warehouse.create({ data: { name: 'Caxias do Sul Warehouse', latitude: -29.1681, longitude: -51.1794 } }),
    prisma.warehouse.create({ data: { name: 'São Paulo Warehouse',     latitude: -23.5505, longitude: -46.6333 } }),
    prisma.warehouse.create({ data: { name: 'Chicago Warehouse',       latitude:  41.8781, longitude: -87.6298 } }),
  ])
  console.log('✅ Warehouses created')

  // ─── Inventory ──────────────────────────────────────────────────────────────
  await prisma.warehouseInventory.createMany({
    data: [
      // Porto Alegre — missing panel and transformer intentionally
      { warehouseId: portoAlegre.id, productId: cable.id,    quantity: 100 },
      { warehouseId: portoAlegre.id, productId: breaker.id,  quantity: 50  },
      { warehouseId: portoAlegre.id, productId: conduit.id,  quantity: 200 },
      { warehouseId: portoAlegre.id, productId: meter.id,    quantity: 30  },
      { warehouseId: portoAlegre.id, productId: switch_.id,  quantity: 15  },

      // Caxias do Sul — missing panel and transformer intentionally
      { warehouseId: caxias.id, productId: cable.id,    quantity: 200 },
      { warehouseId: caxias.id, productId: breaker.id,  quantity: 60  },
      { warehouseId: caxias.id, productId: conduit.id,  quantity: 180 },
      { warehouseId: caxias.id, productId: meter.id,    quantity: 20  },
      { warehouseId: caxias.id, productId: switch_.id,  quantity: 10  },

      // São Paulo — missing transformer intentionally
      { warehouseId: saoPaulo.id, productId: cable.id,    quantity: 80  },
      { warehouseId: saoPaulo.id, productId: breaker.id,  quantity: 40  },
      { warehouseId: saoPaulo.id, productId: conduit.id,  quantity: 150 },
      { warehouseId: saoPaulo.id, productId: panel.id,    quantity: 20  },
      { warehouseId: saoPaulo.id, productId: meter.id,    quantity: 25  },
      { warehouseId: saoPaulo.id, productId: switch_.id,  quantity: 8   },

      // Chicago — full stock including transformer
      { warehouseId: chicago.id, productId: cable.id,        quantity: 200 },
      { warehouseId: chicago.id, productId: breaker.id,      quantity: 100 },
      { warehouseId: chicago.id, productId: conduit.id,      quantity: 300 },
      { warehouseId: chicago.id, productId: panel.id,        quantity: 50  },
      { warehouseId: chicago.id, productId: meter.id,        quantity: 60  },
      { warehouseId: chicago.id, productId: switch_.id,      quantity: 40  },
      { warehouseId: chicago.id, productId: transformer.id,  quantity: 10  },
    ]
  })
  console.log('✅ Inventory created')

  // ─── Customers ──────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.customer.create({ data: { name: 'Alice Johnson', email: 'alice@example.com' } }),
    prisma.customer.create({ data: { name: 'Bob Martinez',  email: 'bob@example.com'   } }),
    prisma.customer.create({ data: { name: 'Carol Silva',   email: 'carol@example.com' } }),
  ])
  console.log('✅ Customers created')

  console.log('\n🌱 Seed complete!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())