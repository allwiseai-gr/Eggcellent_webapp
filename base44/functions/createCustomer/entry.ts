import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-intake-secret',
      },
    });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  // Verify secret
  const secret = req.headers.get('x-intake-secret');
  if (!secret || secret !== Deno.env.get('INTAKE_SECRET')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const base44 = createClientFromRequest(req);
  const body = await req.json();

  // Validate required fields
  if (!body.full_name && !body.name) {
    return Response.json({ error: 'full_name is required' }, { status: 400 });
  }

  const customerData = {
    name: body.full_name || body.name,
    phone: body.phone || null,
    address: body.address || null,
    afm: body.afm || null,
    zone: body.zone || null,
    notes: body.notes || null,
    messenger_id: body.messenger_id || null,
    viber_id: body.viber_id || null,
    whatsapp_id: body.whatsapp_id || null,
    telegram_id: body.telegram_id || null,
  };

  // Remove null values
  Object.keys(customerData).forEach(k => customerData[k] === null && delete customerData[k]);

  const customer = await base44.asServiceRole.entities.Customer.create(customerData);

  return Response.json({
    success: true,
    customer_id: customer.id,
    customer: {
      id: customer.id,
      full_name: customer.name,
      phone: customer.phone,
      address: customer.address,
      afm: customer.afm,
      zone: customer.zone,
      created_at: customer.created_date,
    }
  }, { status: 201 });
});