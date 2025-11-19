import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

interface CreativeFormat {
  html?: string
  css?: string
  previewUrl?: string
}

interface CreativeState {
  currentCreative: {
    brand: any
    template: any
    content: any
    images: Array<{ url: string; id: string }>
    colors: { primary?: string; secondary?: string }
    formats: {
      landscape: CreativeFormat | null
      square: CreativeFormat | null
      story: CreativeFormat | null
    }
  }
  isGenerating: boolean
  generationProgress: number
  jobId?: string
  setBrand: (brand: any) => void
  setTemplate: (template: any) => void
  setContent: (content: any) => void
  addImage: (image: { url: string; id: string }) => void
  removeImage: (id: string) => void
  setColors: (colors: { primary?: string; secondary?: string }) => void
  updateFormat: (format: "landscape" | "square" | "story", data: CreativeFormat) => void
  reset: () => void
  setGenerating: (status: boolean) => void
  setProgress: (progress: number) => void
  setJobId: (jobId?: string) => void
}

const initialState: CreativeState["currentCreative"] = {
  brand: null,
  template: null,
  content: {},
  images: [],
  colors: {},
  formats: {
    landscape: null,
    square: null,
    story: null,
  },
}

export const useCreativeStore = create<CreativeState>()(
  devtools(
    persist(
      (set) => ({
        currentCreative: initialState,
        isGenerating: false,
        generationProgress: 0,
        setBrand: (brand) =>
          set((state) => ({
            currentCreative: { ...state.currentCreative, brand },
          })),
        setTemplate: (template) =>
          set((state) => ({
            currentCreative: { ...state.currentCreative, template },
          })),
        setContent: (content) =>
          set((state) => ({
            currentCreative: { ...state.currentCreative, content },
          })),
        addImage: (image) =>
          set((state) => ({
            currentCreative: {
              ...state.currentCreative,
              images: [...state.currentCreative.images, image],
            },
          })),
        removeImage: (id) =>
          set((state) => ({
            currentCreative: {
              ...state.currentCreative,
              images: state.currentCreative.images.filter((img) => img.id !== id),
            },
          })),
        setColors: (colors) =>
          set((state) => ({
            currentCreative: { ...state.currentCreative, colors },
          })),
        updateFormat: (format, data) =>
          set((state) => ({
            currentCreative: {
              ...state.currentCreative,
              formats: { ...state.currentCreative.formats, [format]: data },
            },
          })),
        reset: () =>
          set({
            currentCreative: initialState,
            isGenerating: false,
            generationProgress: 0,
            jobId: undefined,
          }),
        setGenerating: (status) => set({ isGenerating: status }),
        setProgress: (progress) => set({ generationProgress: progress }),
        setJobId: (jobId) => set({ jobId }),
      }),
      {
        name: "meta-ads-creative-store",
      }
    )
  )
)
