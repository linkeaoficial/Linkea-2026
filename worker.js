export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // --- 1. CONFIGURACIÓN CORS (Permite que tu web hable con el worker) ---
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // --- 2. ENDPOINT DE RASTREO (/api/track) ---
    // Aquí llegan los datos desde tu script.js
    if (url.pathname === "/api/track" && request.method === "POST") {
      try {
        const userAgent = request.headers.get("User-Agent") || "";
        // Filtro anti-bots básico
        const isBot = /bot|crawler|spider|crawling|facebookexternalhit|whatsapp/i.test(userAgent);
        
        if (isBot) {
          return new Response(JSON.stringify({ status: "ignored_bot" }), { 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          });
        }

        const data = await request.json();
        
        // Datos geográficos de Cloudflare
        const country = request.cf.country || "XX";
        const city = request.cf.city || "Unknown"; 
        
        // Normalización de la ruta principal
        let path = data.path || "/";
        if (path === "/") path = "/index.html"; 
        
        const device = data.device || "desktop";
        const referrer = (data.referrer || "direct").toLowerCase();
        
        // IMPORTANTE: Capturamos si es 'pageview' (visita) o 'click' (evento)
        const type = data.type || "pageview"; 

        // Insertar en la Base de Datos (D1)
        // Asegúrate que tu binding en wrangler.toml se llame "DB"
        await env.DB.prepare(
       `INSERT INTO analytics (path, country, city, device_type, referrer, user_agent, type, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
        ).bind(path, country, city, device, referrer, userAgent, type)
        .run();

        return new Response(JSON.stringify({ success: true }), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
      }
    }

    // --- 3. ENDPOINT DE ESTADÍSTICAS (/api/stats) ---
    // Aquí el Dashboard lee los datos
    if (url.pathname === "/api/stats") {
      try {
        const period = url.searchParams.get("period") || "week";
        
        // Configuración de Tiempo (Hora Venezuela -4)
        let timeCondition = "timestamp >= datetime('now', '-7 days')";
        let dateFormat = "%Y-%m-%d";

        if (period === "day") {
          timeCondition = "date(timestamp, '-4 hours') = date('now', '-4 hours')";
          dateFormat = "%H:00";
        } else if (period === "month") {
          timeCondition = "timestamp >= datetime('now', '-30 days')";
        } else if (period === "year") {
          timeCondition = "timestamp >= datetime('now', '-1 year')";
          dateFormat = "%Y-%m";
        }

        // --- CONSULTAS SQL OPTIMIZADAS ---

        // A. Top Países (Solo Vistas)
        const countries = await env.DB.prepare(`
          SELECT country, count(*) as count 
          FROM analytics 
          WHERE ${timeCondition} AND type = 'pageview'
          GROUP BY country 
          ORDER BY count DESC 
          LIMIT 50
        `).all();

        // B. Top Ciudades (Solo Vistas)
        const topCities = await env.DB.prepare(`
          SELECT city, country, count(*) as count 
          FROM analytics 
          WHERE ${timeCondition} AND city IS NOT NULL AND city != 'Unknown' AND type = 'pageview'
          GROUP BY city 
          ORDER BY count DESC 
          LIMIT 50
        `).all();

        // C. Dispositivos (Solo Vistas)
        const devices = await env.DB.prepare(`
          SELECT device_type, count(*) as count 
          FROM analytics 
          WHERE ${timeCondition} AND type = 'pageview'
          GROUP BY device_type
        `).all();

        // D. Top Enlaces (EVENTOS CLAVE: Formulario, Chatbot, Redes)
        // Aquí filtramos SOLO los 'click' para que aparezcan en "Enlaces Populares"
        const topLinks = await env.DB.prepare(`
          SELECT path, count(*) as count 
          FROM analytics 
          WHERE ${timeCondition} AND type = 'click'
          GROUP BY path 
          ORDER BY count DESC
        `).all();

        // E. Historial de Tráfico (Gráfico de Línea - Solo Vistas)
        const history = await env.DB.prepare(`
          SELECT strftime('${dateFormat}', timestamp, '-4 hours') as date, count(*) as count
          FROM analytics
          WHERE ${timeCondition} AND type = 'pageview'
          GROUP BY date
          ORDER BY timestamp ASC
        `).all();

        // F. KPIs Principales (Vistas Totales y Únicas)
        const total = await env.DB.prepare(`SELECT count(*) as count FROM analytics WHERE ${timeCondition} AND type = 'pageview'`).first();
        const uniques = await env.DB.prepare(`SELECT count(DISTINCT user_agent) as count FROM analytics WHERE ${timeCondition} AND type = 'pageview'`).first();

        // G. Cálculo de Crecimiento (Comparativa con periodo anterior)
        let prevTimeCondition = "timestamp >= datetime('now', '-14 days') AND timestamp < datetime('now', '-7 days')";
        
        if (period === "day") {
            prevTimeCondition = "timestamp >= datetime('now', '-4 hours', 'start of day', '-1 day', '+4 hours') AND timestamp < datetime('now', '-4 hours', 'start of day', '+4 hours')";
        }
        else if (period === "month") prevTimeCondition = "timestamp >= datetime('now', '-60 days') AND timestamp < datetime('now', '-30 days')";
        else if (period === "year") prevTimeCondition = "timestamp >= datetime('now', '-2 years') AND timestamp < datetime('now', '-1 year')";

        const prevTotal = await env.DB.prepare(`SELECT count(*) as count FROM analytics WHERE ${prevTimeCondition} AND type = 'pageview'`).first();
        
        let growth = 0;
        if (prevTotal.count > 0) {
            growth = ((total.count - prevTotal.count) / prevTotal.count) * 100;
        } else if (total.count > 0) {
            growth = 100;
        }

        // H. Fuentes de Tráfico (Referrers)
        const referrers = await env.DB.prepare(`
          SELECT
            CASE
              WHEN referrer LIKE '%instagram%' THEN 'Instagram'
              WHEN referrer LIKE '%facebook%' OR referrer LIKE '%fb.com%' THEN 'Facebook'
              WHEN referrer LIKE '%t.co%' OR referrer LIKE '%twitter%' OR referrer LIKE '%x.com%' THEN 'X / Twitter'
              WHEN referrer LIKE '%google%' THEN 'Google'
              WHEN referrer LIKE '%tiktok%' THEN 'TikTok'
              WHEN referrer LIKE '%youtube%' THEN 'YouTube'
              WHEN referrer LIKE '%linkedin%' THEN 'LinkedIn'
              WHEN referrer IS NULL OR referrer = '' OR referrer = 'direct' THEN 'Directo / Link'
              ELSE 'Otros'
            END as source,
            count(*) as count
          FROM analytics
          WHERE ${timeCondition} AND type = 'pageview'
          GROUP BY source
          ORDER BY count DESC
          LIMIT 50
        `).all();

        // I. Horas Punta (Hora Venezuela)
        const peakHours = await env.DB.prepare(`
          SELECT strftime('%H', timestamp, '-4 hours') as hour, count(*) as count 
          FROM analytics 
          WHERE ${timeCondition} AND type = 'pageview'
          GROUP BY hour 
          ORDER BY hour ASC
        `).all();

        // J. Sistemas Operativos
        const osStats = await env.DB.prepare(`
          SELECT 
            CASE 
              WHEN user_agent LIKE '%Android%' THEN 'Android'
              WHEN user_agent LIKE '%iPhone%' OR user_agent LIKE '%iPad%' THEN 'iOS'
              WHEN user_agent LIKE '%Windows%' THEN 'Windows'
              WHEN user_agent LIKE '%Macintosh%' OR user_agent LIKE '%Mac OS%' THEN 'macOS'
              WHEN user_agent LIKE '%Linux%' AND user_agent NOT LIKE '%Android%' THEN 'Linux'
              ELSE 'Otros'
            END as os,
            count(*) as count 
          FROM analytics 
          WHERE ${timeCondition} AND type = 'pageview'
          GROUP BY os 
          ORDER BY count DESC
        `).all();

        // K. Tiempo de Sesión
        const sessionStats = await env.DB.prepare(`
          SELECT AVG(duration) as avg_duration FROM (
            SELECT (strftime('%s', MAX(timestamp)) - strftime('%s', MIN(timestamp))) as duration
            FROM analytics
            WHERE ${timeCondition} 
            GROUP BY user_agent, country, date(timestamp, '-4 hours')
            HAVING count(*) > 1
          ) WHERE duration < 1800
        `).first();

        // Respuesta Final JSON
        const responseData = {
          total_views: total.count,
          unique_visitors: uniques.count,
          views_growth: growth,
          countries: countries.results,
          devices: devices.results,
          top_links: topLinks.results, // Esto llenará tu tabla de "Enlaces Populares"
          history: history.results,
          referrers: referrers.results,
          peak_hours: peakHours.results,
          operating_systems: osStats.results,
          top_cities: topCities.results,
          avg_session_time: sessionStats ? sessionStats.avg_duration : 0 
        };

        return new Response(JSON.stringify(responseData), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
      }
    }

    return new Response("Worker de Analítica Linkea v1.0 Activo", { headers: corsHeaders });
  }
};