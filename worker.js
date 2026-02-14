export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    // --- 2. ENDPOINT DE RASTREO (Optimizado para Agregación) ---
    if (url.pathname === "/api/track" && request.method === "POST") {
      try {
        const userAgent = request.headers.get("User-Agent") || "";
        if (/bot|crawler|spider/i.test(userAgent)) {
          return new Response(JSON.stringify({ status: "ignored" }), { headers: corsHeaders });
        }

        const data = await request.json();
        const isUnique = data.isUnique ? 1 : 0;
        const country = request.cf.country || "XX";
        const city = request.cf.city || "Unknown";
        let path = data.path || "/index.html";
        const device = data.device || "desktop";
        const referrer = (data.referrer || "direct").toLowerCase();
        const type = data.type || "pageview";
        const duration = data.duration || 0;

        // 1. Extraer Sistema Operativo para guardarlo ya procesado
        let os = "Otros";
        if (userAgent.includes("Android")) os = "Android";
        else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";
        else if (userAgent.includes("Windows")) os = "Windows";
        else if (userAgent.includes("Mac OS")) os = "macOS";

        // 2. Obtener Fecha y Hora de Venezuela
        const ahora = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Caracas"}));
        const date = ahora.toISOString().split('T')[0];
        const hour = ahora.getHours().toString().padStart(2, '0');

        // 3. UPSERT MEJORADO: Ahora suma tiempo
        await env.DB.prepare(`
        INSERT INTO analytics_agg (date, hour, path, country, city, device, os, referrer, type, count, uniques, total_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        ON CONFLICT(date, hour, path, country, city, device, os, referrer, type) 
        DO UPDATE SET 
          count = count + 1,
          uniques = uniques + ?,
          total_time = total_time + ? -- 🟢 Sumamos los segundos nuevos a los que ya habían
      `).bind(date, hour, path, country, city, device, os, referrer, type, isUnique, duration, isUnique, duration)
      .run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
      }
    }

    // --- 3. ENDPOINT DE ESTADÍSTICAS (Lectura Ultra Rápida) ---
    if (url.pathname === "/api/stats") {
      try {
        const period = url.searchParams.get("period") || "week";
        
        // Definir rango de fechas
        let dateCondition = "date >= date('now', '-7 days')";
        let prevDateCondition = "date >= date('now', '-14 days') AND date < date('now', '-7 days')";

        if (period === "day") {
          dateCondition = "date = date('now', '-4 hours')";
          prevDateCondition = "date = date('now', '-4 hours', '-1 day')";
        } else if (period === "month") {
          dateCondition = "date >= date('now', '-30 days')";
          prevDateCondition = "date >= date('now', '-60 days') AND date < date('now', '-30 days')";
        }

        // --- CONSULTAS USANDO SUM(count) ---

        // A. Totales
        const total = await env.DB.prepare(`SELECT SUM(count) as count, SUM(uniques) as uniques FROM analytics_agg WHERE ${dateCondition} AND type = 'pageview'`).first();
        const prevTotal = await env.DB.prepare(`SELECT SUM(count) as count FROM analytics_agg WHERE ${prevDateCondition} AND type = 'pageview'`).first();

        // B. Países
        const countries = await env.DB.prepare(`SELECT country, SUM(count) as count FROM analytics_agg WHERE ${dateCondition} AND type = 'pageview' GROUP BY country ORDER BY count DESC LIMIT 10`).all();

        // C. Ciudades
        const topCities = await env.DB.prepare(`SELECT city, country, SUM(count) as count FROM analytics_agg WHERE ${dateCondition} AND city != 'Unknown' AND type = 'pageview' GROUP BY city ORDER BY count DESC LIMIT 10`).all();

        // D. Dispositivos
        const devices = await env.DB.prepare(`SELECT device as device_type, SUM(count) as count FROM analytics_agg WHERE ${dateCondition} AND type = 'pageview' GROUP BY device`).all();

        // E. Enlaces (Clicks)
        const topLinks = await env.DB.prepare(`SELECT path, SUM(count) as count FROM analytics_agg WHERE ${dateCondition} AND type = 'click' GROUP BY path ORDER BY count DESC`).all();

        // F. Historial para el Gráfico
        let historySQL = `SELECT date, SUM(count) as count FROM analytics_agg WHERE ${dateCondition} AND type = 'pageview' GROUP BY date ORDER BY date ASC`;

        // 2. Si el periodo es "day", cambiamos la consulta para que devuelva HORAS en lugar de una sola FECHA
        if (period === "day") {
            historySQL = `SELECT (hour || ':00') as date, SUM(count) as count FROM analytics_agg WHERE ${dateCondition} AND type = 'pageview' GROUP BY hour ORDER BY hour ASC`;
        }

        // 3. Ejecutamos la consulta elegida
        const history = await env.DB.prepare(historySQL).all();

        // G. Horas Punta
        const peakHours = await env.DB.prepare(`SELECT hour, SUM(count) as count FROM analytics_agg WHERE ${dateCondition} AND type = 'pageview' GROUP BY hour ORDER BY hour ASC`).all();

        // H. Sistemas Operativos
        const osStats = await env.DB.prepare(`SELECT os, SUM(count) as count FROM analytics_agg WHERE ${dateCondition} AND type = 'pageview' GROUP BY os ORDER BY count DESC`).all();

        // I. Referrers (Fuentes)
        const referrers = await env.DB.prepare(`
          SELECT 
            CASE 
              WHEN referrer LIKE '%instagram%' THEN 'Instagram'
              WHEN referrer LIKE '%facebook%' OR referrer LIKE '%fb.com%' THEN 'Facebook'
              WHEN referrer LIKE '%google%' THEN 'Google'
              WHEN referrer = 'direct' THEN 'Directo / Link'
              ELSE 'Otros'
            END as source,
            SUM(count) as count
          FROM analytics_agg
          WHERE ${dateCondition} AND type = 'pageview'
          GROUP BY source
          ORDER BY count DESC
        `).all();

        // 🟢 NUEVO: Cálculo de Tiempo Promedio
        // Buscamos solo los eventos 'session_end' que traen el tiempo real
        const sessionData = await env.DB.prepare(`
            SELECT SUM(total_time) as total_seconds, SUM(count) as total_sessions 
            FROM analytics_agg 
            WHERE ${dateCondition} AND type = 'session_end'
        `).first();

        let avgTime = 0;
        if (sessionData && sessionData.total_sessions > 0) {
            // Dividimos el tiempo total entre las sesiones cerradas para sacar el promedio
            avgTime = sessionData.total_seconds / sessionData.total_sessions;
        }

        // Cálculo de Crecimiento
        let growth = 0;
        const cur = total.count || 0;
        const prev = prevTotal.count || 0;
        if (prev > 0) growth = ((cur - prev) / prev) * 100;
        else if (cur > 0) growth = 100;

        return new Response(JSON.stringify({
          total_views: total.count || 0,
          unique_visitors: total.uniques || 0,
          views_growth: growth,
          countries: countries.results,
          top_cities: topCities.results,
          devices: devices.results,
          top_links: topLinks.results,
          history: history.results,
          peak_hours: peakHours.results,
          operating_systems: osStats.results,
          referrers: referrers.results,
          avg_session_time: avgTime // 🟢 Enviamos el promedio real calculado
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
      }
    }

    return new Response("Linkea Analytics Pro v2.0 Activo", { headers: corsHeaders });
  }
};