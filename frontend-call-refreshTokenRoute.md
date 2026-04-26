export async function fetchWithAuth(url, options = {}) {
    // 1. Make the initial request
    let response = await fetch(url, options);

    // 2. Check if the access token expired (401 Unauthorized)
    if (response.status === 401) {
        console.log("Access token expired. Attempting to refresh...");

        try {
            // 3. Call your refresh endpoint
            // (Make sure the spelling here matches your backend exactly!)
            const refreshResponse = await fetch('/api/v1/users/refreshAccessToken', {
                method: 'POST', // or GET, depending on your backend setup
                headers: {
                    'Content-Type': 'application/json'
                },
                // If you are using httpOnly cookies, you MUST include this:
                // credentials: 'include' 
            });

            // 4. If the refresh token is ALSO expired, the server should return a 401/403 here
            if (!refreshResponse.ok) {
                throw new Error("Refresh token expired or invalid");
            }

            // --- OPTIONAL STEP ---
            // If your backend returns the new token in a JSON body (instead of cookies),
            // you need to extract it and update the headers for the retry.
            // const data = await refreshResponse.json();
            // localStorage.setItem('accessToken', data.token);
            // options.headers = { ...options.headers, 'Authorization': `Bearer ${data.token}` };
            // ---------------------

            // 5. The refresh succeeded! Retry the original request.
            console.log("Token refreshed. Retrying original request...");
            response = await fetch(url, options);

        } catch (error) {
            // 6. The refresh failed. The user MUST log in again.
            console.error("Refresh failed. Redirecting to login.", error);
            
            // Clear any stored tokens
            localStorage.removeItem('accessToken'); 
            
            // Force redirect to the login page
            window.location.href = '/login';
            
            // Throw the error so the calling function knows it failed
            return Promise.reject(error);
        }
    }

    // Return the successful response
    return response;
}