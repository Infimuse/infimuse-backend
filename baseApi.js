let fetch;

(async () => {
  const module = await import("node-fetch");
  fetch = module.default;
})();

class BaseApi {
  constructor(url) {
    this.baseUrl = url;
  }

  async fetch(url, body, args, requestInit) {
    try {
      // Ensure fetch is loaded before using it
      if (!fetch) {
        throw new Error("Fetch not loaded yet");
      }

      const urlObj = new URL(url, this.baseUrl);

      if (args) {
        urlObj.search = new URLSearchParams(args).toString();
      }

      const requestOptions = { ...requestInit, body };
      const response = await fetch(urlObj.toString(), requestOptions);

      if (!response.ok) {
        const errorMessage = await response.text();
        console.error(`Error: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      if (response.status === 204) {
        return;
      }

      return response.json();
    } catch (error) {
      console.error("Fetch error:", error);
      throw new Error(error);
    }
  }

  async get(url, args, requestInit) {
    return this.fetch(url, undefined, args, { ...requestInit, method: "GET" });
  }

  async post(url, body, args, requestInit) {
    const bodyString = body ? JSON.stringify(body) : undefined;
    return this.fetch(url, bodyString, args, {
      ...requestInit,
      method: "POST",
    });
  }
}

module.exports = BaseApi;
