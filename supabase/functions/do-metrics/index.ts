// Supabase Edge Function: do-metrics
// Fetch DigitalOcean Droplet metrics securely
// Deploy: supabase functions deploy do-metrics

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DOMetricsResponse {
  cpu: number;
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  bandwidth: {
    inbound: number;
    outbound: number;
  };
  timestamp: string;
  dropletId: string;
  dropletName: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const DO_API_TOKEN = Deno.env.get('DO_API_TOKEN')
    
    if (!DO_API_TOKEN) {
      throw new Error('DO_API_TOKEN not configured')
    }

    // Get droplet ID from request body (POST) or query params (GET)
    let dropletId: string | null = null
    let action: string | null = null

    if (req.method === 'POST') {
      try {
        const body = await req.json()
        dropletId = body.droplet_id
        action = body.action
      } catch {
        // No body or invalid JSON
      }
    } else {
      const url = new URL(req.url)
      dropletId = url.searchParams.get('droplet_id')
      action = url.searchParams.get('action')
    }

    // If no droplet ID and action is list-droplets, return droplet list
    if (action === 'list-droplets' || !dropletId) {
      const dropletsRes = await fetch('https://api.digitalocean.com/v2/droplets', {
        headers: {
          'Authorization': `Bearer ${DO_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!dropletsRes.ok) {
        throw new Error(`Failed to list droplets: ${dropletsRes.status}`)
      }
      
      const dropletsData = await dropletsRes.json()
      
      // If we need to list droplets, return them
      if (action === 'list-droplets') {
        return new Response(JSON.stringify({
          success: true,
          droplets: dropletsData.droplets?.map((d: any) => ({
            id: d.id.toString(),
            name: d.name,
            status: d.status,
            memory: d.memory,
            vcpus: d.vcpus,
            disk: d.disk,
            region: d.region?.slug,
            ip: d.networks?.v4?.find((n: any) => n.type === 'public')?.ip_address
          })) || []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      // Use first droplet if no ID provided
      if (dropletsData.droplets?.length > 0) {
        dropletId = dropletsData.droplets[0].id.toString()
      } else {
        throw new Error('No droplets found in your DigitalOcean account')
      }
    }

    // Fetch metrics for specific droplet
    const now = new Date()
    const start = new Date(now.getTime() - 60 * 60 * 1000) // 1 hour ago
    
    const baseUrl = 'https://api.digitalocean.com/v2/monitoring/metrics/droplet'
    
    // Fetch CPU, Memory, Disk, and Bandwidth in parallel
    const [cpuRes, memoryFreeRes, memoryTotalRes, diskFreeRes, diskTotalRes, bandwidthInRes, bandwidthOutRes] = await Promise.all([
      // CPU
      fetch(`${baseUrl}/cpu?host_id=${dropletId}&start=${start.toISOString()}&end=${now.toISOString()}`, {
        headers: { 'Authorization': `Bearer ${DO_API_TOKEN}` }
      }),
      // Memory Free
      fetch(`${baseUrl}/memory_free?host_id=${dropletId}&start=${start.toISOString()}&end=${now.toISOString()}`, {
        headers: { 'Authorization': `Bearer ${DO_API_TOKEN}` }
      }),
      // Memory Total
      fetch(`${baseUrl}/memory_total?host_id=${dropletId}&start=${start.toISOString()}&end=${now.toISOString()}`, {
        headers: { 'Authorization': `Bearer ${DO_API_TOKEN}` }
      }),
      // Disk Free
      fetch(`${baseUrl}/filesystem_free?host_id=${dropletId}&start=${start.toISOString()}&end=${now.toISOString()}`, {
        headers: { 'Authorization': `Bearer ${DO_API_TOKEN}` }
      }),
      // Disk Total
      fetch(`${baseUrl}/filesystem_size?host_id=${dropletId}&start=${start.toISOString()}&end=${now.toISOString()}`, {
        headers: { 'Authorization': `Bearer ${DO_API_TOKEN}` }
      }),
      // Bandwidth Inbound
      fetch(`${baseUrl}/bandwidth?host_id=${dropletId}&interface=public&direction=inbound&start=${start.toISOString()}&end=${now.toISOString()}`, {
        headers: { 'Authorization': `Bearer ${DO_API_TOKEN}` }
      }),
      // Bandwidth Outbound
      fetch(`${baseUrl}/bandwidth?host_id=${dropletId}&interface=public&direction=outbound&start=${start.toISOString()}&end=${now.toISOString()}`, {
        headers: { 'Authorization': `Bearer ${DO_API_TOKEN}` }
      }),
    ])

    // Parse responses
    const parseMetric = async (res: Response) => {
      if (!res.ok) return null
      const data = await res.json()
      const values = data.data?.result?.[0]?.values || []
      // Get latest value
      const latest = values[values.length - 1]
      return latest ? parseFloat(latest[1]) : null
    }

    const [cpu, memoryFree, memoryTotal, diskFree, diskTotal, bandwidthIn, bandwidthOut] = await Promise.all([
      parseMetric(cpuRes),
      parseMetric(memoryFreeRes),
      parseMetric(memoryTotalRes),
      parseMetric(diskFreeRes),
      parseMetric(diskTotalRes),
      parseMetric(bandwidthInRes),
      parseMetric(bandwidthOutRes),
    ])

    // Get droplet info
    const dropletRes = await fetch(`https://api.digitalocean.com/v2/droplets/${dropletId}`, {
      headers: { 'Authorization': `Bearer ${DO_API_TOKEN}` }
    })
    const dropletData = await dropletRes.json()
    const droplet = dropletData.droplet

    // Calculate percentages
    const memoryUsed = memoryTotal && memoryFree ? memoryTotal - memoryFree : 0
    const memoryPercentage = memoryTotal ? (memoryUsed / memoryTotal) * 100 : 0
    
    const diskUsed = diskTotal && diskFree ? diskTotal - diskFree : 0
    const diskPercentage = diskTotal ? (diskUsed / diskTotal) * 100 : 0

    const metrics: DOMetricsResponse = {
      cpu: cpu ? 100 - cpu : 0, // CPU idle to CPU usage
      memory: {
        total: memoryTotal || 0,
        used: memoryUsed,
        free: memoryFree || 0,
        percentage: memoryPercentage
      },
      disk: {
        total: diskTotal || 0,
        used: diskUsed,
        free: diskFree || 0,
        percentage: diskPercentage
      },
      bandwidth: {
        inbound: bandwidthIn || 0,
        outbound: bandwidthOut || 0
      },
      timestamp: now.toISOString(),
      dropletId: dropletId,
      dropletName: droplet?.name || 'Unknown'
    }

    return new Response(JSON.stringify({
      success: true,
      metrics
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error fetching DO metrics:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
