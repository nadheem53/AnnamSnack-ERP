import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedDatabase() {
  console.log('🌱 Seeding database with NIT Tiruchirappalli benchmark master data...');

  // 1. Clear existing data
  await prisma.paymentReceipt.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.salesInvoice.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.productionRunItem.deleteMany();
  await prisma.productionRun.deleteMany();
  await prisma.stockLedgerEntry.deleteMany();
  await prisma.purchaseEntry.deleteMany();
  await prisma.bomComponent.deleteMany();
  await prisma.billOfMaterials.deleteMany();
  await prisma.item.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed Users with Bcrypt Hashed Passwords
  const passwordSalt = await bcrypt.genSalt(10);
  const users = [
    {
      email: 'salesman_a@annamfoods.co.in',
      passwordHash: await bcrypt.hash('salesman123', passwordSalt),
      name: 'Salesman A (K. Pandian)',
      role: 'salesman',
    },
    {
      email: 'salesman_b@annamfoods.co.in',
      passwordHash: await bcrypt.hash('salesman123', passwordSalt),
      name: 'Salesman B (M. Selvam)',
      role: 'salesman',
    },
    {
      email: 'admin@annamfoods.co.in',
      passwordHash: await bcrypt.hash('admin123', passwordSalt),
      name: 'Factory Admin (S. Meenakshi)',
      role: 'admin',
    },
    {
      email: 'production@annamfoods.co.in',
      passwordHash: await bcrypt.hash('prod123', passwordSalt),
      name: 'Production Floor Supervisor (R. Ramalingam)',
      role: 'production',
    },
    {
      email: 'auditor@annamfoods.co.in',
      passwordHash: await bcrypt.hash('auditor123', passwordSalt),
      name: 'External Auditor (CA. V. Narayanan)',
      role: 'auditor',
    },
    {
      email: 'owner@annamfoods.co.in',
      passwordHash: await bcrypt.hash('owner123', passwordSalt),
      name: 'Managing Director / Owner (K. Sundaram)',
      role: 'owner',
    },
  ];

  for (const u of users) {
    await prisma.user.create({ data: u });
  }

  // 3. Seed Items
  const items = [
    {
      id: 'item-flour',
      code: 'RM-FLOUR-01',
      name: 'Rice & Gram Flour Mix',
      nameTamil: 'அரிசி மற்றும் உளுந்து மாவு',
      category: 'raw_material',
      uom: 'kg',
      hsnCode: '1102',
      gstRate: 5.0,
      standardCost: 42.0,
      reorderLevel: 50.0,
    },
    {
      id: 'item-oil',
      code: 'RM-OIL-01',
      name: 'Refined Cooking Oil',
      nameTamil: 'சமையல் எண்ணெய்',
      category: 'raw_material',
      uom: 'litre',
      hsnCode: '1512',
      gstRate: 5.0,
      standardCost: 140.0,
      reorderLevel: 25.0,
    },
    {
      id: 'item-spice',
      code: 'RM-SPICE-01',
      name: 'Salt and Spice Mix',
      nameTamil: 'மசாலா மற்றும் உப்பு கலவை',
      category: 'raw_material',
      uom: 'kg',
      hsnCode: '2103',
      gstRate: 5.0,
      standardCost: 200.0,
      reorderLevel: 4.0,
    },
    {
      id: 'item-pouch-200g',
      code: 'PM-POUCH-200G',
      name: '200g Printed Pouch (Murukku)',
      nameTamil: '200கி பாக்கெட் உறை',
      category: 'packaging',
      uom: 'piece',
      hsnCode: '3923',
      gstRate: 18.0,
      standardCost: 2.5,
      reorderLevel: 200.0,
    },
    {
      id: 'item-carton-20',
      code: 'PM-CARTON-20',
      name: 'Corrugated Carton Box (Holds 20 pkts)',
      nameTamil: 'அட்டைப் பெட்டி (20 பாக்கெட்டுகள்)',
      category: 'packaging',
      uom: 'piece',
      hsnCode: '4819',
      gstRate: 12.0,
      standardCost: 15.0,
      reorderLevel: 15.0,
    },
    {
      id: 'item-murukku-200g',
      code: 'FG-MURUKKU-200G',
      name: 'Murukku 200 g Packet',
      nameTamil: 'கை முறுக்கு 200 கிராம்',
      category: 'finished_goods',
      uom: 'packet',
      hsnCode: '1905',
      gstRate: 5.0,
      standardCost: 30.9,
      sellingPrice: 50.0,
      reorderLevel: 50.0,
    },
  ];

  for (const it of items) {
    await prisma.item.create({ data: it });
  }

  // 4. Seed Customers
  const customers = [
    {
      id: 'cust-retailer-a',
      code: 'CUST-TN-001',
      name: 'Retailer A (Senthil Murugan Stores)',
      type: 'retailer',
      contactPerson: 'Senthil Nathan',
      phone: '+91 98421 55670',
      city: 'Tiruchirappalli',
      state: 'Tamil Nadu',
      stateCode: '33',
      gstin: '33AAAFM1122D1ZK',
      creditLimit: 50000.0,
      creditDays: 15,
      outstandingBalance: 0.0,
    },
    {
      id: 'cust-distributor-b',
      code: 'CUST-KA-002',
      name: 'Distributor B (Karnataka Snack Distributors)',
      type: 'distributor',
      contactPerson: 'Manjunath Hegde',
      phone: '+91 94802 33411',
      city: 'Bengaluru',
      state: 'Karnataka',
      stateCode: '29',
      gstin: '29AABCK3344F1Z8',
      creditLimit: 150000.0,
      creditDays: 30,
      outstandingBalance: 0.0,
    },
    {
      id: 'cust-retailer-c',
      code: 'CUST-TN-003',
      name: 'Retailer C (Madurai Meenakshi Sweets)',
      type: 'retailer',
      contactPerson: 'K. Rajagopal',
      phone: '+91 97890 12345',
      city: 'Madurai',
      state: 'Tamil Nadu',
      stateCode: '33',
      gstin: '33AADCR5678B1ZH',
      creditLimit: 25000.0,
      creditDays: 7,
      outstandingBalance: 0.0,
    },
  ];

  for (const c of customers) {
    await prisma.customer.create({ data: c });
  }

  // 5. Seed Vendors
  const vendors = [
    {
      id: 'vendor-agro-mills',
      code: 'VEND-001',
      name: 'Sri Meenakshi Agro Traders',
      city: 'Madurai',
      state: 'Tamil Nadu',
      stateCode: '33',
      gstin: '33AAAPM9876C1Z3',
      phone: '+91 98420 11990',
    },
    {
      id: 'vendor-pack-sys',
      code: 'VEND-002',
      name: 'Cauvery Flexible Packaging',
      city: 'Trichy',
      state: 'Tamil Nadu',
      stateCode: '33',
      gstin: '33AAAFC2233M1ZG',
      phone: '+91 94432 44550',
    },
  ];

  for (const v of vendors) {
    await prisma.vendor.create({ data: v });
  }

  // 6. Seed BOM
  const bom = await prisma.billOfMaterials.create({
    data: {
      id: 'bom-murukku-200g',
      finishedGoodsId: 'item-murukku-200g',
      finishedGoodsName: 'Murukku 200 g Packet',
      batchSizeExpected: 200.0,
      batchUom: 'packet',
      description: 'Standard Recipe: 1 Batch = 200 Packets of 200g Murukku',
      components: {
        create: [
          {
            itemId: 'item-flour',
            itemName: 'Flour',
            quantityPerBatch: 40.0,
            uom: 'kg',
            standardRate: 42.0,
          },
          {
            itemId: 'item-oil',
            itemName: 'Cooking oil',
            quantityPerBatch: 10.0,
            uom: 'litre',
            standardRate: 140.0,
          },
          {
            itemId: 'item-spice',
            itemName: 'Salt and spice mix',
            quantityPerBatch: 1.2,
            uom: 'kg',
            standardRate: 200.0,
          },
          {
            itemId: 'item-pouch-200g',
            itemName: '200 g pouch',
            quantityPerBatch: 200.0,
            uom: 'piece',
            standardRate: 2.5,
            isPackaging: true,
          },
          {
            itemId: 'item-carton-20',
            itemName: 'Carton (holds 20 packets)',
            quantityPerBatch: 10.0,
            uom: 'piece',
            standardRate: 15.0,
            isPackaging: true,
          },
        ],
      },
    },
  });

  // 7. Seed Opening Stock Ledger Entries (Section 5 baseline)
  const openingLedger = [
    {
      id: 'open-flour',
      timestamp: BigInt(Date.now() - 86400000 * 2),
      dateStr: '2026-11-01',
      itemId: 'item-flour',
      itemName: 'Flour',
      category: 'raw_material',
      uom: 'kg',
      movementType: 'OPENING',
      quantityChange: 100.0,
      balanceAfter: 100.0,
      unitRate: 42.0,
      totalValue: 4200.0,
      sourceDocType: 'INITIAL_STOCK',
      sourceDocId: 'OPEN-001',
      notes: 'Opening stock per audit baseline',
    },
    {
      id: 'open-oil',
      timestamp: BigInt(Date.now() - 86400000 * 2),
      dateStr: '2026-11-01',
      itemId: 'item-oil',
      itemName: 'Cooking oil',
      category: 'raw_material',
      uom: 'litre',
      movementType: 'OPENING',
      quantityChange: 30.0,
      balanceAfter: 30.0,
      unitRate: 140.0,
      totalValue: 4200.0,
      sourceDocType: 'INITIAL_STOCK',
      sourceDocId: 'OPEN-002',
      notes: 'Opening stock per audit baseline',
    },
    {
      id: 'open-spice',
      timestamp: BigInt(Date.now() - 86400000 * 2),
      dateStr: '2026-11-01',
      itemId: 'item-spice',
      itemName: 'Salt and spice mix',
      category: 'raw_material',
      uom: 'kg',
      movementType: 'OPENING',
      quantityChange: 5.0,
      balanceAfter: 5.0,
      unitRate: 200.0,
      totalValue: 1000.0,
      sourceDocType: 'INITIAL_STOCK',
      sourceDocId: 'OPEN-003',
      notes: 'Opening stock per audit baseline',
    },
    {
      id: 'open-pouch',
      timestamp: BigInt(Date.now() - 86400000 * 2),
      dateStr: '2026-11-01',
      itemId: 'item-pouch-200g',
      itemName: '200 g pouch',
      category: 'packaging',
      uom: 'piece',
      movementType: 'OPENING',
      quantityChange: 500.0,
      balanceAfter: 500.0,
      unitRate: 2.5,
      totalValue: 1250.0,
      sourceDocType: 'INITIAL_STOCK',
      sourceDocId: 'OPEN-004',
      notes: 'Opening stock per audit baseline',
    },
    {
      id: 'open-carton',
      timestamp: BigInt(Date.now() - 86400000 * 2),
      dateStr: '2026-11-01',
      itemId: 'item-carton-20',
      itemName: 'Carton (holds 20 packets)',
      category: 'packaging',
      uom: 'piece',
      movementType: 'OPENING',
      quantityChange: 30.0,
      balanceAfter: 30.0,
      unitRate: 15.0,
      totalValue: 450.0,
      sourceDocType: 'INITIAL_STOCK',
      sourceDocId: 'OPEN-005',
      notes: 'Opening stock per audit baseline',
    },
    {
      id: 'open-murukku',
      timestamp: BigInt(Date.now() - 86400000 * 2),
      dateStr: '2026-11-01',
      itemId: 'item-murukku-200g',
      itemName: 'Murukku 200 g Packet',
      category: 'finished_goods',
      uom: 'packet',
      movementType: 'OPENING',
      quantityChange: 50.0,
      balanceAfter: 50.0,
      unitRate: 30.9,
      totalValue: 1545.0,
      sourceDocType: 'INITIAL_STOCK',
      sourceDocId: 'OPEN-006',
      notes: 'Opening stock per audit baseline',
    },
  ];

  for (const l of openingLedger) {
    await prisma.stockLedgerEntry.create({ data: l });
  }

  console.log('✅ Master data & Opening inventory seeded successfully into real database!');
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

