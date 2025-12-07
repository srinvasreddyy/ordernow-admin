// src/api/mockData.js

export const MOCK_DATA = {
  // 1. Dashboard Stats
  '/orders/restaurant/stats': {
    overall: { totalOrders: 1250, totalDelivered: 1200, totalCancelled: 50, totalIncome: 45600.50 },
    comparison: {
      income: { current: 15200, previous: 14000, change: 8.5 },
      orders: { current: 320, previous: 300, change: 6.6 }
    },
    monthlyIncome: [
      { _id: { month: 1, year: 2024 }, totalIncome: 12000 },
      { _id: { month: 2, year: 2024 }, totalIncome: 15000 },
      { _id: { month: 3, year: 2024 }, totalIncome: 18600.50 },
    ]
  },

  // 2. Orders List
  '/orders/restaurant': [
    {
      _id: 'mock_order_1',
      orderNumber: 'ORD-MOCK-001',
      paymentType: 'card',
      paymentStatus: 'paid',
      createdAt: new Date().toISOString(),
      pricing: { totalAmount: 45.50, subtotal: 40, handlingCharge: 2.5, deliveryFee: 3, discountAmount: 0 },
      customerDetails: { name: 'Alice Mock', phoneNumber: '+44 7700 900000' },
      deliveryAddress: { fullAddress: '123 Mock Lane, London' },
      orderedItems: [
        { itemName: 'Chicken Tikka Masala', quantity: 2, itemTotal: 24.00, selectedVariants: [], selectedAddons: [] },
        { itemName: 'Naan Bread', quantity: 2, itemTotal: 6.00, selectedVariants: [], selectedAddons: [] }
      ],
      status: 'placed'
    },
    {
      _id: 'mock_order_2',
      orderNumber: 'ORD-MOCK-002',
      paymentType: 'cash',
      paymentStatus: 'pending',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      pricing: { totalAmount: 18.20, subtotal: 15, handlingCharge: 1.2, deliveryFee: 2, discountAmount: 0 },
      customerDetails: { name: 'Bob Test', phoneNumber: '+44 7700 900123' },
      deliveryAddress: { fullAddress: '456 Test St, Manchester' },
      orderedItems: [
        { itemName: 'Veg Burger', quantity: 1, itemTotal: 15.00, selectedVariants: [], selectedAddons: [] }
      ],
      status: 'out_for_delivery'
    }
  ],

  // 3. Menu Items
  '/menuItems/restaurant': [
    {
      _id: 'mock_item_1',
      itemName: 'Mock Butter Chicken',
      description: 'Rich and creamy curry (Mock Data)',
      basePrice: 12.99,
      itemType: 'non-veg',
      isFood: true,
      isAvailable: true,
      displayImageUrl: null 
    },
    {
      _id: 'mock_item_2',
      itemName: 'Mock Paneer Tikka',
      description: 'Grilled cottage cheese (Mock Data)',
      basePrice: 9.99,
      itemType: 'veg',
      isFood: true,
      isAvailable: false,
      displayImageUrl: null
    }
  ],

  // 4. Delivery Partners
  '/owner/delivery-partners': [
    { 
      _id: 'mock_driver_1', 
      fullName: 'John Doe (Mock)', 
      email: 'john@mock.com',
      phoneNumber: '07700900999',
      deliveryPartnerProfile: { isAvailable: true, vehicleType: 'Bike', rating: 4.8 }
    },
    { 
      _id: 'mock_driver_2', 
      fullName: 'Jane Smith (Mock)', 
      email: 'jane@mock.com',
      phoneNumber: '07700900888',
      deliveryPartnerProfile: { isAvailable: false, vehicleType: 'Car', rating: 4.5 }
    }
  ],

  // 5. Tables
  '/tables': [
    { _id: 't1', tableNumber: 'M1', capacity: 2, area: 'Patio', isActive: true },
    { _id: 't2', tableNumber: 'M2', capacity: 4, area: 'Main Hall', isActive: true },
    { _id: 't3', tableNumber: 'M3', capacity: 6, area: 'Rooftop', isActive: false }
  ],

  // 6. Bookings
  '/bookings/restaurant': [
    {
      _id: 'b1',
      bookingNumber: 'BK-001',
      bookingDate: new Date().toISOString(),
      guests: 4,
      status: 'confirmed',
      tableId: { tableNumber: 'M2' },
      customerId: { fullName: 'Mock Guest', email: 'guest@mock.com' }
    }
  ],

  // 7. Announcements
  '/announcements/owner/all': [
    {
      _id: 'a1',
      title: 'Mock Holiday Sale',
      content: '50% off on all mock items.',
      announcementType: 'text',
      isActive: true,
      reactionCount: 15
    }
  ],
  '/announcements/stats': {
    totalReactions: 120,
    reactionsInLast24h: 12,
    percentageChangeInLast24h: 5.5
  },

  // 8. Settings / Profile
  '/restaurants': {
    restaurantName: 'Mock OrderNow Restaurant',
    ownerFullName: 'Mock Owner',
    phoneNumber: '0123456789',
    isActive: true,
    handlingChargesPercentage: 2.5,
    deliverySettings: { freeDeliveryRadius: 2, chargePerMile: 1.5, maxDeliveryRadius: 10 },
    acceptsDining: true
  }
};