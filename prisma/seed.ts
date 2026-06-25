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
  const [cable, breaker, conduit, panel, meter] = await Promise.all([
    prisma.product.create({ data: { name: 'Electrical Cable 10m',    price: 45.99  } }),
    prisma.product.create({ data: { name: 'Circuit Breaker 20A',     price: 28.50  } }),
    prisma.product.create({ data: { name: 'PVC Conduit 3m',          price: 12.00  } }),
    prisma.product.create({ data: { name: 'Distribution Panel 12ch', price: 189.90 } }),
    prisma.product.create({ data: { name: 'Digital Energy Meter',    price: 75.00  } }),
  ])

  // ─── Warehouses ─────────────────────────────────────────────────────────────
  //
  // Cenário de teste: shipping address em São Leopoldo, RS
  //   (lat: -29.7597, lng: -51.1491)
  //
  // Distâncias aproximadas ao endereço de entrega:
  //   Porto Alegre ~25 km  ← mais próximo, mas SEM estoque de 'panel' → descartado
  //   São Paulo    ~1100 km ← estoque completo → selecionado como fallback
  //   Chicago      ~10500 km ← estoque completo, controle de distância extrema
  //
  const [portoAlegre, saoPaulo, chicago] = await Promise.all([
    prisma.warehouse.create({ data: { name: 'Porto Alegre Warehouse', latitude: -30.0346, longitude: -51.2177 } }),
    prisma.warehouse.create({ data: { name: 'São Paulo Warehouse',    latitude: -23.5505, longitude: -46.6333 } }),
    prisma.warehouse.create({ data: { name: 'Chicago Warehouse',      latitude:  41.8781, longitude: -87.6298 } }),
  ])

  // ─── Inventory ──────────────────────────────────────────────────────────────
  //
  // Porto Alegre: mais próximo de São Leopoldo, mas SEM 'panel'
  //   → deve ser descartado na seleção de warehouse
  //
  // São Paulo: segundo mais próximo, estoque completo
  //   → deve ser selecionado
  //
  // Chicago: estoque completo, distância absurda
  //   → só seria escolhido se os dois acima falhassem
  //
  await prisma.warehouseInventory.createMany({
    data: [
      // Porto Alegre — falta Distribution Panel (intencional)
      { warehouseId: portoAlegre.id, productId: cable.id,   quantity: 100 },
      { warehouseId: portoAlegre.id, productId: breaker.id, quantity: 50  },
      { warehouseId: portoAlegre.id, productId: conduit.id, quantity: 200 },
      { warehouseId: portoAlegre.id, productId: meter.id,   quantity: 30  },
      // panel ausente intencionalmente

      // São Paulo — estoque completo
      { warehouseId: saoPaulo.id, productId: cable.id,   quantity: 80  },
      { warehouseId: saoPaulo.id, productId: breaker.id, quantity: 40  },
      { warehouseId: saoPaulo.id, productId: conduit.id, quantity: 150 },
      { warehouseId: saoPaulo.id, productId: panel.id,   quantity: 20  },
      { warehouseId: saoPaulo.id, productId: meter.id,   quantity: 25  },

      // Chicago — estoque completo
      { warehouseId: chicago.id, productId: cable.id,   quantity: 200 },
      { warehouseId: chicago.id, productId: breaker.id, quantity: 100 },
      { warehouseId: chicago.id, productId: conduit.id, quantity: 300 },
      { warehouseId: chicago.id, productId: panel.id,   quantity: 50  },
      { warehouseId: chicago.id, productId: meter.id,   quantity: 60  },
    ]
  })

  // ─── Customers ──────────────────────────────────────────────────────────────
  const [alice, bob] = await Promise.all([
    prisma.customer.create({ data: { name: 'Alice Johnson', email: 'alice@example.com' } }),
    prisma.customer.create({ data: { name: 'Bob Martinez',  email: 'bob@example.com'   } }),
  ])

  // ─── Summary ────────────────────────────────────────────────────────────────
  console.log('✅ Seed complete!\n')
  console.log('── Customers (use one of these IDs as customerId) ──')
  console.log(`   Alice : ${alice.id}`)
  console.log(`   Bob   : ${bob.id}`)
  console.log('\n── Products (use these IDs in items[]) ─────────────')
  console.log(`   Electrical Cable     : ${cable.id}`)
  console.log(`   Circuit Breaker      : ${breaker.id}`)
  console.log(`   PVC Conduit          : ${conduit.id}`)
  console.log(`   Distribution Panel   : ${panel.id}`)
  console.log(`   Digital Energy Meter : ${meter.id}`)
  console.log('\n── Warehouses ──────────────────────────────────────')
  console.log(`   Porto Alegre (no panel stock) : ${portoAlegre.id}`)
  console.log(`   São Paulo    (full stock)      : ${saoPaulo.id}`)
  console.log(`   Chicago      (full stock)      : ${chicago.id}`)
  console.log('\n── Expected test result ────────────────────────────')
  console.log('   Shipping to: São Leopoldo, RS (-29.7597, -51.1491)')
  console.log('   Porto Alegre is closest (~25km) but missing Distribution Panel')
  console.log('   → Expected selected warehouse: São Paulo\n')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())