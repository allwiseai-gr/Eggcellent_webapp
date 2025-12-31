import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Normalize delivery date from various formats
function normalizeDeliveryDate(rawDate) {
  if (!rawDate) return null;
  
  try {
    // Handle ISO format, timestamps, or date strings
    const date = new Date(rawDate);
    if (isNaN(date.getTime())) return null;
    
    // Return YYYY-MM-DD format
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

// Normalize delivery window from English, Greek, Greeklish
function normalizeDeliveryWindow(raw) {
  if (!raw) return null;
  
  const normalized = raw.toLowerCase().trim();
  
  // Morning variations
  if (/^(morning|πρωι|prwi|proi)/.test(normalized)) return 'morning';
  
  // Noon variations
  if (/^(noon|μεσημερι|mesimeri|meshmeri)/.test(normalized)) return 'noon';
  
  // Evening variations
  if (/^(evening|απογευμα|apogevma|apoyevma|βραδυ|vrady|vradi)/.test(normalized)) return 'evening';
  
  return null;
}

// Normalize payment method
function normalizePaymentMethod(raw) {
  if (!raw) return 'unknown';
  
  const normalized = raw.toLowerCase().trim();
  
  if (/cash|μετρητα|metrhta/.test(normalized)) return 'cash';
  if (/card|καρτα|karta/.test(normalized)) return 'card';
  if (/transfer|εμβασμα|embasma/.test(normalized)) return 'transfer';
  
  return 'unknown';
}

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

  try {
    // Validate intake secret
    const intakeSecret = req.headers.get('x-intake-secret');
    const expectedSecret = Deno.env.get('INTAKE_SECRET');
    
    if (!expectedSecret || intakeSecret !== expectedSecret) {
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

    // Parse request body
    const payload = await req.json();
    
    // Extract customer data
    const customerData = {
      name: payload.customer_name || payload.name,
      phone: payload.customer_phone || payload.phone,
      messenger_id: payload.messenger_id,
      viber_id: payload.viber_id,
      whatsapp_id: payload.whatsapp_id,
      telegram_id: payload.telegram_id,
      address: payload.customer_address,
      zone: payload.customer_zone,
    };

    // Find or create customer
    let customer = null;
    
    // Try to find by messenger IDs first
    if (customerData.messenger_id) {
      const results = await base44.asServiceRole.entities.Customer.filter({ messenger_id: customerData.messenger_id });
      customer = results[0];
    }
    if (!customer && customerData.viber_id) {
      const results = await base44.asServiceRole.entities.Customer.filter({ viber_id: customerData.viber_id });
      customer = results[0];
    }
    if (!customer && customerData.whatsapp_id) {
      const results = await base44.asServiceRole.entities.Customer.filter({ whatsapp_id: customerData.whatsapp_id });
      customer = results[0];
    }
    if (!customer && customerData.telegram_id) {
      const results = await base44.asServiceRole.entities.Customer.filter({ telegram_id: customerData.telegram_id });
      customer = results[0];
    }
    
    // Try to find by phone
    if (!customer && customerData.phone) {
      const results = await base44.asServiceRole.entities.Customer.filter({ phone: customerData.phone });
      customer = results[0];
    }

    // Create new customer if not found
    if (!customer && customerData.name) {
      customer = await base44.asServiceRole.entities.Customer.create({
        name: customerData.name,
        phone: customerData.phone,
        messenger_id: customerData.messenger_id,
        viber_id: customerData.viber_id,
        whatsapp_id: customerData.whatsapp_id,
        telegram_id: customerData.telegram_id,
        address: customerData.address,
        zone: customerData.zone,
      });
    }

    if (!customer) {
      return Response.json(
        { error: 'Bad Request', message: 'Customer name is required for new customers' },
        { 
          status: 400,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    // Normalize order data
    const deliveryDate = normalizeDeliveryDate(payload.delivery_date);
    const deliveryWindow = normalizeDeliveryWindow(payload.delivery_window);
    const paymentMethod = normalizePaymentMethod(payload.payment_method);

    // Validate and prepare order items
    const items = payload.items || [];
    const validatedItems = [];
    
    if (items.length > 0) {
      // Get all products to validate SKUs
      const allProducts = await base44.asServiceRole.entities.Product.list();
      const productMap = {};
      allProducts.forEach(p => {
        productMap[p.sku] = p;
      });

      for (const item of items) {
        const product = productMap[item.sku];
        if (!product) {
          return Response.json(
            { 
              error: 'Bad Request', 
              message: `Product with SKU "${item.sku}" not found`,
              available_skus: Object.keys(productMap)
            },
            { 
              status: 400,
              headers: { 'Access-Control-Allow-Origin': '*' }
            }
          );
        }

        validatedItems.push({
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku,
          quantity: item.quantity || 1,
          unit_price: product.price || 0,
          total_price: (product.price || 0) * (item.quantity || 1),
        });
      }
    }

    // Create order
    const order = await base44.asServiceRole.entities.Order.create({
      customer_id: customer.id,
      customer_name: customer.name,
      delivery_date: deliveryDate,
      delivery_window: deliveryWindow,
      payment_method: paymentMethod,
      source: payload.source || 'manual',
      status: 'new',
      address: payload.address || customer.address,
      notes: payload.notes,
      external_thread_id: payload.external_thread_id,
      total_amount: validatedItems.reduce((sum, item) => sum + item.total_price, 0),
    });

    // Create order items
    for (const item of validatedItems) {
      await base44.asServiceRole.entities.OrderItem.create({
        order_id: order.id,
        ...item,
      });
    }

    // Return success response
    return Response.json({
      success: true,
      order_id: order.id,
      customer: {
        id: customer.id,
        name: customer.name,
        was_created: !payload.customer_id,
      },
      order_summary: {
        delivery_date: deliveryDate,
        delivery_window: deliveryWindow,
        payment_method: paymentMethod,
        items_count: validatedItems.length,
        total_amount: order.total_amount,
      },
      normalization_info: {
        delivery_date_normalized: deliveryDate !== payload.delivery_date,
        delivery_window_normalized: deliveryWindow !== payload.delivery_window,
        payment_method_normalized: paymentMethod !== payload.payment_method,
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