import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1"

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
})

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("meta-ads-token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.location.href = "/auth/login"
    }
    return Promise.reject(error)
  }
)

export const api = {
  brands: {
    list: () => apiClient.get("/brands").then((res) => res.data),
    create: (data: any) => apiClient.post("/brands", data).then((res) => res.data),
    scrape: (url: string) => apiClient.post("/brands/scrape", { url }).then((res) => res.data),
  },
  creatives: {
    list: (params?: { brandId?: string, status?: string, page?: number, limit?: number }) => 
      apiClient.get('/creatives', { params }).then((res) => res.data),
    get: (id: string) => apiClient.get(`/creatives/${id}`).then((res) => res.data),
    create: (data: { brandId: string, templateId: string, data: any }) => 
      apiClient.post('/creatives', data).then((res) => res.data),
    generateVariations: (id: string, count: number) => 
      apiClient.post(`/creatives/${id}/variations`, { count }).then((res) => res.data),
    analytics: (id: string) => apiClient.get(`/creatives/${id}/analytics`).then((res) => res.data),
    export: (id: string, format?: string) => 
      apiClient.post(`/creatives/${id}/export`, { format }).then((res) => res.data),
    update: (id: string, data: any) => apiClient.put(`/creatives/${id}`, data).then((res) => res.data),
    delete: (id: string) => apiClient.delete(`/creatives/${id}`).then((res) => res.data),
    duplicate: (id: string) => apiClient.post(`/creatives/${id}/duplicate`).then((res) => res.data),
    publish: (id: string, platforms: string[]) => 
      apiClient.post(`/creatives/${id}/publish`, { platforms }).then((res) => res.data)
  },
  templates: {
    list: (category?: string) => apiClient.get('/templates', { params: { category } }).then((res) => res.data),
    get: (id: string) => apiClient.get(`/templates/${id}`).then((res) => res.data),
    search: (query: string) => apiClient.get('/templates/search', { params: { q: query } }).then((res) => res.data),
    preview: (id: string, brandId: string) => 
      apiClient.post(`/templates/${id}/preview`, { brandId }).then((res) => res.data),
    duplicate: (id: string) => apiClient.post(`/templates/${id}/duplicate`).then((res) => res.data),
    create: (data: any) => apiClient.post('/templates', data).then((res) => res.data),
    update: (id: string, data: any) => apiClient.put(`/templates/${id}`, data).then((res) => res.data)
  },
  ai: {
    generateImage: (prompt: string, options?: { style?: string, dimensions?: string }) => 
      apiClient.post('/ai/generate-image', { prompt, ...options }).then((res) => res.data),
    generateCopy: (data: any) => apiClient.post('/ai/generate-copy', data).then((res) => res.data),
    suggestVariations: (creativeId: string) => 
      apiClient.post(`/ai/suggest-variations/${creativeId}`).then((res) => res.data),
    analyzePerformance: (creativeId: string) => 
      apiClient.post(`/ai/analyze-performance/${creativeId}`).then((res) => res.data),
    optimizeCopy: (text: string, objective: string) => 
      apiClient.post('/ai/optimize-copy', { text, objective }).then((res) => res.data)
  },
  jobs: {
    status: (jobId: string) => apiClient.get(`/jobs/${jobId}/status`).then((res) => res.data),
    list: () => apiClient.get('/jobs').then((res) => res.data),
    cancel: (jobId: string) => apiClient.post(`/jobs/${jobId}/cancel`).then((res) => res.data)
  },
  campaigns: {
    list: () => apiClient.get('/campaigns').then((res) => res.data),
    get: (id: string) => apiClient.get(`/campaigns/${id}`).then((res) => res.data),
    create: (data: any) => apiClient.post('/campaigns', data).then((res) => res.data),
    update: (id: string, data: any) => apiClient.put(`/campaigns/${id}`, data).then((res) => res.data),
    addCreative: (campaignId: string, creativeId: string) => 
      apiClient.post(`/campaigns/${campaignId}/creatives`, { creativeId }).then((res) => res.data),
    removeCreative: (campaignId: string, creativeId: string) => 
      apiClient.delete(`/campaigns/${campaignId}/creatives/${creativeId}`).then((res) => res.data),
    stats: (id: string) => apiClient.get(`/campaigns/${id}/stats`).then((res) => res.data)
  },
  library: {
    folders: () => apiClient.get('/library/folders').then((res) => res.data),
    createFolder: (name: string, parentId?: string) => 
      apiClient.post('/library/folders', { name, parentId }).then((res) => res.data),
    moveCreative: (creativeId: string, folderId: string) => 
      apiClient.post('/library/move', { creativeId, folderId }).then((res) => res.data),
    favorites: () => apiClient.get('/library/favorites').then((res) => res.data),
    addFavorite: (creativeId: string) => 
      apiClient.post('/library/favorites', { creativeId }).then((res) => res.data),
    removeFavorite: (creativeId: string) => 
      apiClient.delete(`/library/favorites/${creativeId}`).then((res) => res.data)
  },
  dashboard: {
    stats: (period: string) => apiClient.get("/dashboard/stats", { params: { period } }).then((res) => res.data),
  },
}

export { apiClient }
