/**
 * Database Seed Script
 * Populates MongoDB with sample data for all modules
 * Run: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const RawMaterial = require('../models/RawMaterial');
const Manufacturing = require('../models/Manufacturing');
const QualityControl = require('../models/QualityControl');
const Inventory = require('../models/Inventory');
const Order = require('../models/Order');
const Dispatch = require('../models/Dispatch');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB for seeding');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      RawMaterial.deleteMany({}),
      Manufacturing.deleteMany({}),
      QualityControl.deleteMany({}),
      Inventory.deleteMany({}),
      Order.deleteMany({}),
      Dispatch.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing data');

    // --- 1. Seed Users ---
    const users = await User.create([
      { name: 'Admin User', email: 'admin@mobiflow.com', password: 'admin123', role: 'admin' },
      { name: 'John Employee', email: 'john@mobiflow.com', password: 'employee123', role: 'employee' },
      { name: 'Sarah Employee', email: 'sarah@mobiflow.com', password: 'employee123', role: 'employee' },
      { name: 'TechMart Distributor', email: 'techmart@dist.com', password: 'dist123', role: 'distributor' },
      { name: 'ElectroParts Distributor', email: 'electro@dist.com', password: 'dist123', role: 'distributor' }
    ]);
    console.log('👥 Users seeded:', users.length);

    // --- 2. Seed Raw Materials ---
    const materials = await RawMaterial.create([
      {
        material_name: 'Capacitor 100µF',
        material_type: 'Electronic Component',
        supplier_name: 'DigiParts Inc.',
        quantity: 5000,
        cost: 0.15,
        reorder_threshold: 500,
        storage_location: 'Warehouse A - Shelf 1'
      },
      {
        material_name: 'Resistor 10kΩ',
        material_type: 'Electronic Component',
        supplier_name: 'DigiParts Inc.',
        quantity: 8000,
        cost: 0.05,
        reorder_threshold: 1000,
        storage_location: 'Warehouse A - Shelf 1'
      },
      {
        material_name: 'PCB Board FR4',
        material_type: 'Board',
        supplier_name: 'CircuitBoard Co.',
        quantity: 300,
        cost: 2.50,
        reorder_threshold: 100,
        storage_location: 'Warehouse A - Shelf 3'
      },
      {
        material_name: 'LED 5mm White',
        material_type: 'Electronic Component',
        supplier_name: 'LightTech Supply',
        quantity: 3000,
        cost: 0.10,
        reorder_threshold: 500,
        storage_location: 'Warehouse B - Shelf 1'
      },
      {
        material_name: 'IC Chip ATmega328',
        material_type: 'Integrated Circuit',
        supplier_name: 'ChipWorld Ltd.',
        quantity: 40,
        cost: 3.75,
        reorder_threshold: 50,
        storage_location: 'Warehouse B - Shelf 2'
      },
      {
        material_name: 'Solder Wire 60/40',
        material_type: 'Consumable',
        supplier_name: 'WeldPro Industries',
        quantity: 150,
        cost: 8.00,
        reorder_threshold: 30,
        storage_location: 'Warehouse A - Shelf 5'
      },
      {
        material_name: 'Plastic Enclosure ABS',
        material_type: 'Packaging',
        supplier_name: 'MoldTech Plastics',
        quantity: 500,
        cost: 1.20,
        reorder_threshold: 100,
        storage_location: 'Warehouse C - Shelf 1'
      }
    ]);
    console.log('🧱 Raw Materials seeded:', materials.length);

    // --- 3. Seed Manufacturing Batches ---
    const batches = await Manufacturing.create([
      {
        batch_id: 'BATCH-00001',
        product_name: 'MobiFlow Sensor Module v1',
        quantity: 200,
        stage: 'Completed',
        status: 'Completed',
        defective_count: 5,
        materials_used: [
          { material: materials[0]._id, quantity_used: 200 },
          { material: materials[1]._id, quantity_used: 200 },
          { material: materials[2]._id, quantity_used: 50 }
        ]
      },
      {
        batch_id: 'BATCH-00002',
        product_name: 'MobiFlow LED Controller',
        quantity: 150,
        stage: 'Testing',
        status: 'In Progress',
        defective_count: 2,
        materials_used: [
          { material: materials[3]._id, quantity_used: 300 },
          { material: materials[4]._id, quantity_used: 30 }
        ]
      },
      {
        batch_id: 'BATCH-00003',
        product_name: 'MobiFlow Power Regulator',
        quantity: 100,
        stage: 'Assembly',
        status: 'In Progress',
        defective_count: 0,
        materials_used: [
          { material: materials[0]._id, quantity_used: 100 },
          { material: materials[1]._id, quantity_used: 100 },
          { material: materials[2]._id, quantity_used: 25 }
        ]
      }
    ]);
    console.log('🏭 Manufacturing Batches seeded:', batches.length);

    // --- 4. Seed Quality Control ---
    const qcRecords = await QualityControl.create([
      {
        batch_id: batches[0]._id,
        inspection_result: 'Pass',
        defects: [],
        remarks: 'All units passed testing. Excellent quality.',
        inspected_by: users[1]._id
      },
      {
        batch_id: batches[0]._id,
        inspection_result: 'Fail',
        defects: ['Soldering defect', 'Component alignment issue'],
        remarks: '5 units failed initial inspection. Reworked and re-tested.',
        inspected_by: users[2]._id
      },
      {
        batch_id: batches[1]._id,
        inspection_result: 'Pass',
        defects: [],
        remarks: 'Partial inspection - 100 units tested, all passed.',
        inspected_by: users[1]._id
      }
    ]);
    console.log('✅ Quality Control records seeded:', qcRecords.length);

    // --- 5. Seed Inventory ---
    const inventoryItems = await Inventory.create([
      {
        item_name: 'MobiFlow Sensor Module v1',
        quantity: 195,
        location: 'Warehouse A - Zone 1',
        lot_number: 'BATCH-00001',
        status: 'In Stock',
        linked_batch: batches[0]._id
      },
      {
        item_name: 'MobiFlow LED Controller',
        quantity: 15,
        location: 'Warehouse A - Zone 2',
        lot_number: 'BATCH-00002',
        status: 'Low',
        linked_batch: batches[1]._id
      },
      {
        item_name: 'MobiFlow Starter Kit',
        quantity: 50,
        location: 'Warehouse B - Zone 1',
        lot_number: 'LOT-SK-001',
        status: 'In Stock'
      },
      {
        item_name: 'MobiFlow Debug Probe',
        quantity: 0,
        location: 'Warehouse B - Zone 2',
        lot_number: 'LOT-DP-001',
        status: 'Out of Stock'
      }
    ]);
    console.log('📦 Inventory items seeded:', inventoryItems.length);

    // --- 6. Seed Orders ---
    const orders = await Order.create([
      {
        distributor_id: users[3]._id,
        product_id: inventoryItems[0]._id,
        quantity: 50,
        status: 'Delivered',
        order_date: new Date('2024-09-15')
      },
      {
        distributor_id: users[3]._id,
        product_id: inventoryItems[0]._id,
        quantity: 30,
        status: 'Dispatched',
        order_date: new Date('2024-10-01')
      },
      {
        distributor_id: users[4]._id,
        product_id: inventoryItems[2]._id,
        quantity: 20,
        status: 'Approved',
        order_date: new Date('2024-10-10')
      },
      {
        distributor_id: users[4]._id,
        product_id: inventoryItems[0]._id,
        quantity: 10,
        status: 'Pending',
        order_date: new Date('2024-10-15')
      }
    ]);
    console.log('🛒 Orders seeded:', orders.length);

    // --- 7. Seed Dispatch ---
    const dispatches = await Dispatch.create([
      {
        order_id: orders[0]._id,
        dispatch_date: new Date('2024-09-16'),
        delivery_status: 'Delivered',
        tracking_id: 'TRK-2024-001',
        carrier: 'FastShip Logistics'
      },
      {
        order_id: orders[1]._id,
        dispatch_date: new Date('2024-10-02'),
        delivery_status: 'In Transit',
        tracking_id: 'TRK-2024-002',
        carrier: 'SpeedEx Courier'
      }
    ]);
    console.log('🚚 Dispatch records seeded:', dispatches.length);

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Admin:       admin@mobiflow.com / admin123');
    console.log('   Employee:    john@mobiflow.com / employee123');
    console.log('   Distributor: techmart@dist.com / dist123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedDB();
