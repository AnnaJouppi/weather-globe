export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const location = url.searchParams.get('q');
  
  if (!location) {
    return new Response('Location query parameter "q" is required.', { 
      status: 400 
    });
  }
  
  const apiKey = env.WEATHER_API_KEY;
  const weatherUrl = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(location)}`;
  
  try {
    const response = await fetch(weatherUrl);
    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response('Error fetching weather data.', { 
      status: 500 
    });
  }
}