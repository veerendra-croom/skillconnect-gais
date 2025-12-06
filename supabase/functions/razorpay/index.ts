// This file represents the Server-Side logic you must deploy to Supabase Edge Functions.
// Path: supabase/functions/razorpay/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Razorpay from "https://esm.sh/razorpay@2.9.2"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

// Fix: Declare Deno for TypeScript compilation in environments where Deno types are missing
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { action, ...payload } = await req.json()

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: Deno.env.get('RAZORPAY_KEY_ID'),
      key_secret: Deno.env.get('RAZORPAY_KEY_SECRET'),
    })

    // --- ACTION: CREATE ORDER ---
    if (action === 'create_order') {
      const { amount, jobId } = payload
      
      const options = {
        amount: Math.round(amount * 100), // Convert to paise
        currency: "INR",
        receipt: jobId,
        payment_capture: 1
      }

      try {
        const order = await razorpay.orders.create(options)
        return new Response(JSON.stringify(order), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      } catch (err) {
        throw new Error(`Razorpay Error: ${err.message}`)
      }
    }

    // --- ACTION: VERIFY PAYMENT ---
    if (action === 'verify_payment') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, jobId, workerId, amount } = payload

      // Verify Signature using HMAC SHA256
      const body = razorpay_order_id + "|" + razorpay_payment_id
      const secret = Deno.env.get('RAZORPAY_KEY_SECRET') ?? ''
      
      const encoder = new TextEncoder()
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      )
      const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body))
      const signatureHex = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      if (signatureHex === razorpay_signature) {
        // --- SUCCESS: Update DB ---
        
        // 1. Update Job Status
        await supabase
          .from('jobs')
          .update({ status: 'COMPLETED' }) // Or 'COMPLETED_PAID'
          .eq('id', jobId)

        // 2. Create Transaction
        await supabase
          .from('transactions')
          .insert([{
             worker_id: workerId,
             job_id: jobId,
             amount: amount, // In Rupees
             type: 'CREDIT',
             status: 'COMPLETED',
             description: `Payment for Job ${jobId.slice(0,8)} (Ref: ${razorpay_payment_id})`
          }])

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      } else {
        return new Response(JSON.stringify({ error: 'Invalid Signature' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      }
    }

    return new Response(JSON.stringify({ error: 'Invalid Action' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})