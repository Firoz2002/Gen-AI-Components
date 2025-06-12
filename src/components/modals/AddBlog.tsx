
"use client";

{/*
  🔷 Generative AI Blog Modal — by Firoz Kamdar 🔷

  This modal enables users to create or edit blogs using generative AI,
  including both content and image generation capabilities.

  🚀 Steps to Use:

  1️⃣ Install dependencies:
     - Using npm:
       npm install @tinymce/tinymce-react sonner lucide-react @radix-ui/react-dialog @radix-ui/react-label @radix-ui/react-separator @radix-ui/react-slot @radix-ui/react-tabs

     - Using yarn:
       yarn add @tinymce/tinymce-react sonner lucide-react @radix-ui/react-dialog @radix-ui/react-label @radix-ui/react-separator @radix-ui/react-slot @radix-ui/react-tabs

  2️⃣ Integrate the component:
     - To **create** a blog:
       <BlogModal onOpenChange={setOpen} open={open} onSubmit={saveBlog} />

     - To **edit** a blog:
       <BlogModal onOpenChange={setOpen} open={open} onSubmit={updateBlog} initialData={blog} isEditing />

  3️⃣ Configure environment variables in your `.env` file:
     NEXT_PUBLIC_TINYMCE_API_KEY=
     NEXT_PUBLIC_TOGETHERAI_API_KEY=

  ✅ Done!
*/}


import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Editor } from "@tinymce/tinymce-react"
import { toast } from "sonner"
import { Bot, Upload, X, Sparkles } from "lucide-react"
import type { Editor as TinyMCEEditor } from "tinymce"

interface Blog {
  title: string
  slug: string
  content: string
  banner: string
  tags: string
}

interface ApiResponse {
  image?: string
  content?: string
  tags?: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Blog) => Promise<void>
  initialData?: Blog | null
  isEditing?: boolean
}

interface TextEditorProps {
  value: string
  editorRef: React.RefObject<TinyMCEEditor | null>
}

export default function BlogModal({ open, onOpenChange, onSubmit, initialData = null, isEditing = false }: Props) {
  const blogContentRef = useRef<TinyMCEEditor | null>(null)
  const [formData, setFormData] = useState<Blog>({
    title: "",
    slug: "",
    banner: "",
    content: "<p>Write your blog content here...</p>",
    tags: "",
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imagePrompt, setImagePrompt] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState<boolean>(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        slug: initialData.slug,
        content: initialData.content,
        tags: initialData.tags,
        banner: initialData.banner,
      })
      if (initialData.banner) {
        setImagePreview(initialData.banner)
      }
    } else {
      setFormData({
        title: "",
        slug: "",
        banner: "",
        content: "<p>Write your blog content here...</p>",
        tags: "",
      })
      setImagePreview(null)
    }
  }, [initialData])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === "title") {
      const slug = value
        .toLowerCase()
        .replace(/[^\w\s]/gi, "")
        .replace(/\s+/g, "-")

      setFormData((prev) => ({
        ...prev,
        [name]: value,
        slug: slug,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)

      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result
        if (typeof result === 'string') {
          setFormData((prev: Blog) => ({
            ...prev,
            banner: result,
          }))
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGenerateImage = async () => {
    if (imagePrompt === "") {
      toast.error("Please enter a prompt")
      return
    }
    setIsGeneratingImage(true)
    try {
      const response = await fetch("https://ai-generator-chi.vercel.app/api/ai-agent/image-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_TOGETHERAI_API_KEY}`,
        },
        body: JSON.stringify({ prompt: imagePrompt }),
      })

      const data: ApiResponse = await response.json()

      if (response.ok && data.image) {
        setImagePreview(data.image)
        setFormData((prev) => ({
          ...prev,
          banner: data.image!,
        }))
      } else {
        console.error("Failed to generate response")
        toast.error("Failed to generate response. Please try again.")
      }
    } catch (error) {
      console.error("Error generating response:", error)
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      toast.error(errorMessage)
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const handleGenerateContent = async () => {
    if (formData.title === "") {
      toast.error("Please enter a title")
      return
    }
    setIsGeneratingContent(true)
    try {
      const response = await fetch("https://ai-generator-chi.vercel.app/api/ai-agent/content-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_TOGETHERAI_API_KEY}`,
        },
        body: JSON.stringify({ prompt: formData.title }),
      })

      const data: ApiResponse = await response.json()

      if (response.ok && data.content) {
        if (blogContentRef.current) {
          blogContentRef.current.setContent(data.content)
        }
        setFormData((prev) => ({
          ...prev,
          content: data.content!,
          tags: data.tags || prev.tags,
        }))
      } else {
        console.error("Failed to generate response")
        toast.error("Failed to generate response. Please try again.")
      }
    } catch (error) {
      console.error("Error generating response:", error)
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      toast.error(errorMessage)
    } finally {
      setIsGeneratingContent(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleSubmit = async () => {
    if (!blogContentRef.current) {
      toast.error("Editor not ready. Please try again.")
      return
    }

    setIsSubmitting(true)
    try {
      const updatedFormData = {
        ...formData,
        content: blogContentRef.current.getContent(),
      }
      
      await onSubmit(updatedFormData)
      onOpenChange(false)
      setFormData({
        title: "",
        slug: "",
        banner: "",
        content: "<p>Write your blog content here...</p>",
        tags: "",
      })
      setImagePreview(null)
    } catch (error) {
      console.error("Error submitting form:", error)
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col h-full">
          <DialogHeader className="border-b">
            <DialogTitle className="text-2xl font-semibold">
              {isEditing ? "Edit Blog Post" : "Create New Blog Post"}
            </DialogTitle>
            <p className="text-muted-foreground mt-2">
              {isEditing ? "Update your blog content and settings" : "Share your thoughts with the world"}
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-6 space-y-6">
            {/* Banner Image Section */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Banner Image</Label>

              {imagePreview ? (
                <div className="relative group">
                  <div className="aspect-[2/1] rounded-lg overflow-hidden border bg-muted">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setImagePreview(null)
                      setFormData((prev) => ({ ...prev, banner: "" }))
                    }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                  >
                    <X className="h-4 w-4 rounded-full" />
                  </Button>
                </div>
              ) : (
                <div
                  onClick={triggerFileInput}
                  className="aspect-[2/1] rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 bg-muted/50"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload banner image</p>
                  <p className="text-xs text-muted-foreground">Recommended: 1200x630px</p>
                </div>
              )}

              {/* AI Image Generation */}
              <div className="flex gap-2">
                <Input
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Describe the image you want to generate..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={isGeneratingImage || isGeneratingContent || !imagePrompt.trim()}
                  onClick={handleGenerateImage}
                  className="shrink-0"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isGeneratingImage ? "Generating..." : "Generate"}
                </Button>
              </div>

              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            </div>

            {/* Title Section */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter your blog title..."
                className="text-lg"
              />
            </div>

            {/* Content Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Content <span className="text-destructive">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isGeneratingContent || isGeneratingImage || !formData.title.trim()}
                  onClick={handleGenerateContent}
                >
                  <Bot className="h-4 w-4 mr-2" />
                  {isGeneratingContent ? "Generating..." : "Generate Content"}
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <TextEditor value={formData.content} editorRef={blogContentRef} />
              </div>
            </div>

            {/* Tags Section */}
            <div className="space-y-2">
              <Label htmlFor="tags" className="text-sm font-medium">
                Tags ( separated by commas )
              </Label>
              <Input
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="design, tutorial, tips, etc."
              />
              <p className="text-xs text-muted-foreground">Add relevant tags to help readers discover your content</p>
            </div>
          </div>

          <DialogFooter className="pt-6 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.title || !formData.content || isSubmitting}>
              {isSubmitting ? "Publishing..." : isEditing ? "Update Post" : "Publish Post"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TextEditor({ value, editorRef }: TextEditorProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) return null

  return (
    <Editor
      apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
      onInit={(_evt: any, editor: any) => (editorRef.current = editor)}
      initialValue={value}
      init={{
        height: 400,
        menubar: false,
        plugins: [
          "advlist",
          "autolink",
          "lists",
          "link",
          "image",
          "charmap",
          "preview",
          "anchor",
          "searchreplace",
          "visualblocks",
          "code",
          "fullscreen",
          "insertdatetime",
          "media",
          "table",
          "code",
          "help",
          "wordcount",
        ],
        toolbar:
          "undo redo | blocks | " +
          "bold italic forecolor | alignleft aligncenter " +
          "alignright alignjustify | bullist numlist outdent indent | " +
          "link image media | " +
          "removeformat | help",
        content_style: "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
        file_picker_types: "image media",
        file_picker_callback: (callback: (url: string, meta?: { alt?: string }) => void, value: string, meta: Record<string, any>) => {
          const input = document.createElement("input")
          input.type = "file"
          input.accept = "image/*"
          input.onchange = () => {
            const file = input.files?.[0]
            if (!file) return
            
            const reader = new FileReader()
            reader.onload = (e) => {
              const result = e.target?.result
              if (typeof result === 'string') {
                callback(result, { alt: file.name })
              }
            }
            reader.readAsDataURL(file)
          }
          input.click()
        },
      }}
    />
  )
}
