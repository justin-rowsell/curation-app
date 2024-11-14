
import { ESRI_CLIENT_ID, ESRI_CLIENT_SECRET } from '$env/static/private';
import { json } from '@sveltejs/kit';

export async function GET() {
    const headers = {
        'Content-Type': 'application/json'
    };
    const searchParams = new URLSearchParams({
        client_id: ESRI_CLIENT_ID, // move this to secret
        client_secret: ESRI_CLIENT_SECRET,
        grant_type: "client_credentials"
    });
    const request = 'https://www.arcgis.com/sharing/rest/oauth2/token?' + searchParams;
    const response = await fetch(request, {
        method: 'POST',
        headers
    });
    
    const jsonRes = await response.json();
    return json(jsonRes);
}