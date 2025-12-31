import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  // Enable CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-intake-secret',
      },
    });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return Response.json(
      { error: 'Method Not Allowed', message: 'Only POST requests are allowed' },
      { 
        status: 405,
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    );
  }

  try {
    // Validate intake secret
    const intakeSecret = req.headers.get('x-intake-secret');
    const expectedSecret = Deno.env.get('INTAKE_SECRET');
    
    if (!expectedSecret || intakeSecret !== expectedSecret) {
      console.warn('Unauthorized intake attempt');
      return Response.json(
        { error: 'Unauthorized', message: 'Invalid or missing intake secret' },
        { 
          status: 401,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    // Initialize Base44 client with service role
    const base44 = createClientFromRequest(req);

    // SKU to name mapping
    const skuToName = {
      'EGGS_30': 'Αυγά 30άδα',
      'EGGS_6': 'Αυγά 6άδα',
    };

    // Parse request body
    const payload = await req.json();
    
    // Validate required fields
    if (!payload.customer?.full_name) {
      return Response.json(
        { error: 'Bad Request', message: 'customer.full_name is required' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }
    
    if (!payload.customer?.phone) {
      return Response.json(
        { error: 'Bad Request', message: 'customer.phone is required' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }
    
    if (!payload.customer?.address) {
      return Response.json(
        { error: 'Bad Request', message: 'customer.address is required' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }
    
    if (!payload.delivery?.date) {
      return Response.json(
        { error: 'Bad Request', message: 'delivery.date is required' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Validate delivery date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(payload.delivery.date)) {
      return Response.json(
        { error: 'Invalid delivery.date. Use YYYY-MM-DD.' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Validate that it's a real date
    const deliveryDate = new Date(payload.delivery.date + 'T00:00:00Z');
    if (isNaN(deliveryDate.getTime())) {
      return Response.json(
        { error: 'Invalid delivery.date. Use YYYY-MM-DD.' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Check that date is not in the past (Europe/Athens timezone)
    const nowInAthens = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Athens' }));
    const todayInAthens = new Date(nowInAthens.getFullYear(), nowInAthens.getMonth(), nowInAthens.getDate());
    const deliveryDateParts = payload.delivery.date.split('-');
    const deliveryDateInAthens = new Date(
      parseInt(deliveryDateParts[0]),
      parseInt(deliveryDateParts[1]) - 1,
      parseInt(deliveryDateParts[2])
    );
    
    if (deliveryDateInAthens < todayInAthens) {
      return Response.json(
        { error: 'Invalid delivery.date. Use YYYY-MM-DD.' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }
    
    if (!payload.delivery?.window) {
      return Response.json(
        { error: 'Bad Request', message: 'delivery.window is required' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }
    
    if (!['morning', 'noon', 'evening'].includes(payload.delivery.window)) {
      return Response.json(
        { error: 'Bad Request', message: 'delivery.window must be "morning", "noon", or "evening"' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }
    
    if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
      return Response.json(
        { error: 'Bad Request', message: 'items array is required and must not be empty' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Validate items
    for (const item of payload.items) {
      if (!item.sku) {
        return Response.json(
          { error: 'Bad Request', message: 'Each item must have a sku' },
          { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
        );
      }
      if (!item.qty || item.qty < 1) {
        return Response.json(
          { error: 'Bad Request', message: 'Each item must have a qty >= 1' },
          { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
        );
      }
    }

    // Normalize address from multiple possible sources
    const address = payload.customer?.address || payload.delivery?.address || payload.address || null;

    // Create order
    const order = await base44.asServiceRole.entities.Order.create({
      source: payload.source || 'telegram',
      customer_name: payload.customer.full_name,
      customer_phone: payload.customer.phone,
      customer_address: address,
      customer_zone: payload.customer.zone || null,
      delivery_date: payload.delivery.date,
      delivery_window: payload.delivery.window,
      delivery_notes: payload.delivery.notes || null,
      external_thread_id: payload.external_thread_id || null,
      status: 'pending',
    });

    // Create order items
    const createdItems = [];
    for (const item of payload.items) {
      const orderItem = await base44.asServiceRole.entities.OrderItem.create({
        order_id: order.id,
        sku: item.sku,
        product_name: skuToName[item.sku] || item.sku,
        quantity: item.qty,
      });
      createdItems.push(orderItem);
    }

    console.log(`Order created: ${order.id} for ${payload.customer.full_name}`);

    // Return success response
    return Response.json({
      success: true,
      order_id: order.id,
      message: 'Order created successfully',
      order: {
        id: order.id,
        customer_name: order.customer_name,
        delivery_date: order.delivery_date,
        delivery_window: order.delivery_window,
        items_count: createdItems.length,
        status: order.status,
      },
    }, {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error('Order intake error:', error);
    
    return Response.json({
      error: 'Internal Server Error',
      message: error.message,
      details: error.stack,
    }, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
});