declare module "react-to-print" {
  export function useReactToPrint(options: {
    content: () => HTMLElement | null
    documentTitle?: string
    onBeforeGetContent?: () => void
    onAfterPrint?: () => void
  }): () => void
}
